import {
  BaseService,
  inject,
  type InferContext,
  databaseUtils,
} from '@roxavn/core/server';
import {
  GetUserCurrencyAccountsService,
  CreateTransactionService,
} from '@roxavn/module-currency/server';
import { GetGameRoomApiService, ServerGame } from '@roxavn/module-game/server';
import { SocketAuthUser } from '@roxavn/module-socket/server';
import { sum } from 'lodash-es';

import { serverModule } from '../module.js';
import { ClientToServerCasinoEvents } from '../../base/socket.js';

@serverModule.injectable()
export class BetGameSocketService extends BaseService {
  constructor(
    @inject(GetGameRoomApiService)
    protected getGameRoomApiService: GetGameRoomApiService
  ) {
    super();
  }

  async handle(
    [request, ack]: Parameters<ClientToServerCasinoEvents['bet']>,
    @SocketAuthUser authUser: InferContext<typeof SocketAuthUser>
  ) {
    const room = await this.getGameRoomApiService.handle({
      gameRoomId: request.roomId,
    });
    if (
      request.amount > 0 &&
      request.type in room.metadata?.betTypes &&
      room.metadata?.currencyIds?.includes(request.currencyId)
    ) {
      const storage = await ServerGame.getGameStorage(request.roomId);
      await storage.presence.jsonSet(
        storage.getKey('bet:' + request.currencyId),
        `$.${authUser.id}.${request.type}`,
        request.amount
      );
      ack({ code: 200 });
    }
  }
}

@serverModule.injectable()
export class TakeMoneyService extends BaseService {
  constructor(
    @inject(GetGameRoomApiService)
    protected getGameRoomApiService: GetGameRoomApiService,
    @inject(GetUserCurrencyAccountsService)
    protected getUserCurrencyAccountsService: GetUserCurrencyAccountsService,
    @inject(CreateTransactionService)
    protected createTransactionService: CreateTransactionService
  ) {
    super();
  }

  async handleCurrency({
    roomId,
    currencyId,
    bankerId,
    game,
  }: {
    roomId: string;
    currencyId: string;
    bankerId: string;
    game: string;
  }) {
    const storage = await ServerGame.getGameStorage(roomId);
    const amounts: Record<string, number> = {};

    const betAmounts = await storage.presence.jsonGet(
      storage.getKey('bet:' + currencyId),
      '$'
    );
    if (!betAmounts) {
      return;
    }
    Object.keys(betAmounts).map((userId) => {
      amounts[userId] = sum(Object.values(betAmounts[userId]));
    });

    // get currency accounts to ensure enough balance
    const accounts = await this.getUserCurrencyAccountsService.handle({
      currencyId,
      accounts: [
        ...Object.keys(amounts).map((userId) => ({ userId })),
        { userId: bankerId },
      ],
    });
    const banker = {
      accountId: '',
      amount: 0,
    };
    const safeAmounts = [banker];
    accounts.items.map((item) => {
      if (item.userId === bankerId) {
        banker.accountId = item.id;
      } else {
        const amount = item.minBalance
          ? Math.min(
              parseInt(item.balance) - parseInt(item.minBalance),
              amounts[item.userId]
            )
          : amounts[item.userId];
        safeAmounts.push({
          amount: -amount,
          accountId: item.id,
        });
        banker.amount += amount;
      }
    });

    // save account ids for payout
    await storage.presence.jsonSet(
      storage.getKey('accounts'),
      `$.${currencyId}`,
      Object.fromEntries(
        accounts.items.map((account) => [account.userId, account.id])
      )
    );

    await databaseUtils.runInTransaction(
      () => {
        return this.createTransactionService.handle({
          type: game,
          currencyId,
          accounts: safeAmounts,
        });
      },
      { propagation: databaseUtils.Propagation.NESTED }
    );
  }

  async handle({ roomId, game }: { roomId: string; game: string }) {
    const room = await this.getGameRoomApiService.handle({
      gameRoomId: roomId,
    });

    for (const currencyId of room.metadata?.currencyIds || []) {
      await this.handleCurrency({
        currencyId,
        roomId,
        game,
        bankerId: room.metadata?.bankerId,
      });
    }
  }
}

@serverModule.injectable()
export class PayoutService extends BaseService {
  constructor(
    @inject(GetGameRoomApiService)
    protected getGameRoomApiService: GetGameRoomApiService,
    @inject(GetUserCurrencyAccountsService)
    protected getUserCurrencyAccountsService: GetUserCurrencyAccountsService,
    @inject(CreateTransactionService)
    protected createTransactionService: CreateTransactionService
  ) {
    super();
  }

  async handleCurrency({
    roomId,
    currencyId,
    bankerId,
    win,
    betTypes,
    game,
  }: {
    roomId: string;
    currencyId: string;
    bankerId: string;
    win: string[];
    betTypes: Record<string, { payout: number }>;
    game: string;
  }) {
    const storage = await ServerGame.getGameStorage(roomId);
    const amounts: Record<string, number> = {};

    const betAmounts = await storage.presence.jsonGet(
      storage.getKey('bet:' + currencyId),
      '$'
    );
    if (!betAmounts) {
      return {};
    }
    Object.keys(betAmounts).map((userId) => {
      Object.keys(betAmounts[userId]).map((betType) => {
        if (win.includes(betType)) {
          if (!amounts[userId]) {
            amounts[userId] = 0;
          }
          amounts[userId] +=
            betAmounts[userId][betType] * betTypes[betType].payout;
        }
      });
    });

    // get save account ids
    const accounts: Record<string, string> = await storage.presence.jsonGet(
      storage.getKey('accounts'),
      `$.${currencyId}`
    );

    await databaseUtils.runInTransaction(
      () => {
        return this.createTransactionService.handle({
          currencyId,
          type: game,
          accounts: [
            ...Object.keys(amounts).map((userId) => ({
              accountId: accounts[userId],
              amount: amounts[userId],
            })),
            {
              accountId: accounts[bankerId],
              amount: -sum(Object.values(amounts)),
            },
          ],
        });
      },
      { propagation: databaseUtils.Propagation.NESTED }
    );

    return amounts;
  }

  async handle({
    roomId,
    win,
    game,
  }: {
    roomId: string;
    win: string[];
    game: string;
  }) {
    const room = await this.getGameRoomApiService.handle({
      gameRoomId: roomId,
    });
    const result: Record<string, Record<string, number>> = {};

    for (const currencyId of room.metadata?.currencyIds || []) {
      const item = await this.handleCurrency({
        win,
        roomId,
        currencyId,
        bankerId: room.metadata?.bankerId,
        betTypes: room.metadata?.betTypes,
        game,
      });
      result[currencyId] = item;
    }

    return result;
  }
}
