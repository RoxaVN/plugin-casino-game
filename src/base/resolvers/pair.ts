import { Card } from '../card.js';
import { BaseResolver } from './base.js';

export class PairResolver extends BaseResolver {
  static resolver(cards: Card[]) {
    const group = this.groupByValue(cards);
    const result: Array<[Card, Card]> = [];

    Object.values(group).map((_cards) => {
      if (cards.length === 2) {
        result.push(_cards as [Card, Card]);
      }
    });

    return result;
  }
}
