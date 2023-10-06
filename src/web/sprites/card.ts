import Phaser from 'phaser';

export class CardSprite extends Phaser.GameObjects.Sprite {
  static BACK_SPRITE_ID = 52;
  static FLIP_SPEED = 200;
  static FLIP_ZOOM = 1.2;

  isUp = false;

  constructor(scene: Phaser.Scene, x = 0, y = 0) {
    super(scene, x, y, 'cards', CardSprite.BACK_SPRITE_ID);
  }

  reset() {
    this.setFrame(CardSprite.BACK_SPRITE_ID);
    this.isUp = false;
  }

  turnUp(cardId: number, onComplete?: () => void) {
    if (this.isUp) return;
    this.scene.tweens.chain({
      targets: this,
      tweens: [
        {
          duration: CardSprite.FLIP_SPEED / 2,
          scaleX: 0,
          scaleY: CardSprite.FLIP_ZOOM,
          onComplete: () => {
            this.setFrame(cardId);
          },
        },
        {
          duration: CardSprite.FLIP_SPEED / 2,
          scaleX: 1,
          scaleY: 1,
          onComplete: () => {
            this.isUp = true;
            if (onComplete) {
              onComplete();
            }
          },
        },
      ],
    });
  }

  turnDown(onComplete?: () => void) {
    if (!this.isUp) return;
    this.isUp = true;
    this.scene.tweens.chain({
      targets: this,
      tweens: [
        {
          duration: CardSprite.FLIP_SPEED / 2,
          scaleX: 0,
          scaleY: CardSprite.FLIP_ZOOM,
          onComplete: () => {
            this.setFrame(CardSprite.BACK_SPRITE_ID);
          },
        },
        {
          duration: CardSprite.FLIP_SPEED / 2,
          scaleX: 1,
          scaleY: 1,
          onComplete: () => {
            this.isUp = false;
            if (onComplete) {
              onComplete();
            }
          },
        },
      ],
    });
  }

  moveToTurnUp(
    x: number,
    y: number,
    angle: number,
    cardId: number,
    onComplete?: () => void
  ) {
    this.scene.tweens.add({
      targets: this,
      duration: 200,
      angle: angle,
    });
    this.moveTo(x, y, 0, () => {
      this.turnUp(cardId, onComplete);
    });
  }

  moveToTurnDown(x: number, y: number, angle: number, onComplete?: () => void) {
    this.scene.tweens.add({
      targets: this,
      duration: 200,
      angle: angle,
    });
    this.moveTo(x, y, 0, () => {
      this.turnDown(onComplete);
    });
  }

  moveTo(x: number, y: number, offset: number, onComplete?: () => void) {
    const tweens = [
      {
        x,
        y,
        duration: 300,
        onComplete,
      },
    ];

    if (offset) {
      tweens[0].duration = 150;
      tweens.unshift({
        x: x - offset,
        y: y - offset,
        duration: 150,
        onComplete: undefined,
      });
    }
    this.scene.tweens.chain({
      targets: this,
      tweens,
    });
  }
}
