import { BaseService, inject } from '@roxavn/core/server';
import { CreateCurrencyAccountService } from '@roxavn/module-currency/server';
import {
  CreateUserApiService,
  GetUsersApiService,
} from '@roxavn/module-user/server';

import { serverModule } from '../server/index.js';

@serverModule.injectable()
export class CreateBankerAccountsHook extends BaseService {
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
