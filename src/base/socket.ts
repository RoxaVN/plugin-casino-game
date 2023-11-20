import { Empty, FullApiResponse } from '@roxavn/core';

export interface ClientToServerCasinoEvents {
  bet: (
    request: {
      amount: number;
      currencyId: string;
      type: string;
      roomId: string;
    },
    ack: (resp: FullApiResponse<Empty>) => void
  ) => void;
}

export interface ServerToClientCasinoEvents {
  winAmounts: (request: {
    [currencyId: string]: { [userId: string]: number };
  }) => void;
}
