import { NotFoundException } from '@roxavn/core';
import { BaseService, inject } from '@roxavn/core/server';
import {
  CreateCurrencyAccountService,
  CreateTransactionService,
} from '@roxavn/module-currency/server';
import {
  CreateUserApiService,
  GetUsersApiService,
} from '@roxavn/module-user/server';

import { serverModule } from '../module.js';
import { constants } from '../../base/index.js';

@serverModule.injectable()
export class CreateBankerAccountsService extends BaseService {
  constructor(
    @inject(CreateUserApiService)
    public createUserApiService: CreateUserApiService,
    @inject(GetUsersApiService)
    public getUsersApiService: GetUsersApiService,
    @inject(CreateCurrencyAccountService)
    public createCurrencyAccountService: CreateCurrencyAccountService
  ) {
    super();
  }

  async handle(request: { username: string; currencyIds: string[] }) {
    const { items } = await this.getUsersApiService.handle({
      username: request.username,
    });
    if (!items.length) {
      const user = await this.createUserApiService.handle({
        username: request.username,
      });
      await Promise.all(
        request.currencyIds.map((CurrencyId) =>
          this.createCurrencyAccountService.handle({
            userId: user.id,
            currencyId: CurrencyId,
            minBalance: null,
          })
        )
      );
    }
  }
}

@serverModule.injectable()
export class CreateBankerTransactionService extends BaseService {
  bankerId?: string;

  constructor(
    @inject(CreateTransactionService)
    protected createTransactionService: CreateTransactionService,
    @inject(GetUsersApiService)
    public getUsersApiService: GetUsersApiService
  ) {
    super();
  }

  async handle(request: {
    currencyId: string;
    type: string;
    originalTransactionId?: string;
    metadata?: Record<string, any>;
    account: {
      userId: string;
      amount: number | bigint;
      type?: string;
    };
  }) {
    if (!this.bankerId) {
      const { items } = await this.getUsersApiService.handle({
        username: constants.CASINO_BANKER,
      });
      if (items.length) {
        this.bankerId = items[0].id;
      } else {
        throw new NotFoundException();
      }
    }
    return this.createTransactionService.handle({
      currencyId: request.currencyId,
      type: request.type,
      originalTransactionId: request.originalTransactionId,
      metadata: request.metadata,
      accounts: [
        request.account,
        {
          userId: this.bankerId,
          amount: -request.account.amount,
        },
      ],
    });
  }
}
