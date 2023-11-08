import { Card } from '../card.js';

export class BaseResolver {
  static groupByValue(cards: Card[]) {
    const map: Record<string, Card[]> = {};
    cards.map((card) => {
      if (!(card.value in map)) {
        map[card.value] = [];
      }
      map[card.value].push(card);
    });
    return map;
  }
}
