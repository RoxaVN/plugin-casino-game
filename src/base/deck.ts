import { shuffle } from 'lodash-es';

export class Deck<C> {
  private cards: Array<C>;

  constructor(cardClass: { new (id: number): C }, quantity = 52) {
    this.cards = [];
    for (let i = 0; i < quantity; i += 1) {
      this.cards.push(new cardClass(i));
    }
  }

  shuffle() {
    this.cards = shuffle(this.cards);
  }

  draw() {
    return this.cards.pop();
  }

  getCards() {
    return [...this.cards];
  }
}
