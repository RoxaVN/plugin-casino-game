export class Card {
  suit: 'spade' | 'club' | 'heart' | 'diamond';
  value:
    | 'A'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | 'J'
    | 'Q'
    | 'K';
  name: string;

  constructor(public readonly id: number) {
    this.suit = Card.values[Math.floor(id / 13)] as any;
    this.value = Card.values[id % 13] as any;
    this.name = this.genName();
  }

  protected genName() {
    let icon;
    switch (this.suit) {
      case 'club':
        icon = '♣';
        break;
      case 'spade':
        icon = '♠';
        break;
      case 'heart':
        icon = '♥';
        break;
      case 'diamond':
        icon = '♦';
    }
    return this.value + icon;
  }

  toString() {
    return this.name;
  }

  static suits = ['heart', 'club', 'diamond', 'spade'];
  static values = [
    'A',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
  ];
}
