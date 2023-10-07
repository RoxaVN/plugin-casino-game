import Phaser from 'phaser';

export class CardSprite extends Phaser.GameObjects.Sprite {
  static readonly backSpriteId = 52;

  static flipDuration = 200;
  static flipZoom = 1.2;
  static moveDuration = 300;

  private isUp = false;

  constructor(scene: Phaser.Scene, x = 0, y = 0) {
    super(scene, x, y, 'cards', CardSprite.backSpriteId);
  }

  reset() {
    this.setFrame((this.constructor as typeof CardSprite).backSpriteId);
    this.isUp = false;
  }

  turnUp(cardId: number, options?: { onComplete?: () => void }) {
    if (this.isUp) return;
    this.scene.tweens.chain({
      targets: this,
      tweens: [
        {
          duration: (this.constructor as typeof CardSprite).flipDuration / 2,
          scaleX: 0,
          scaleY: (this.constructor as typeof CardSprite).flipZoom,
          onComplete: () => {
            this.setFrame(cardId);
          },
        },
        {
          duration: (this.constructor as typeof CardSprite).flipDuration / 2,
          scaleX: 1,
          scaleY: 1,
          onComplete: () => {
            this.isUp = true;
            if (options?.onComplete) {
              options.onComplete();
            }
          },
        },
      ],
    });
  }

  turnDown(options?: { onComplete?: () => void }) {
    if (!this.isUp) return;
    this.isUp = true;
    this.scene.tweens.chain({
      targets: this,
      tweens: [
        {
          duration: (this.constructor as typeof CardSprite).flipDuration / 2,
          scaleX: 0,
          scaleY: (this.constructor as typeof CardSprite).flipZoom,
          onComplete: () => {
            this.setFrame((this.constructor as typeof CardSprite).backSpriteId);
          },
        },
        {
          duration: (this.constructor as typeof CardSprite).flipDuration / 2,
          scaleX: 1,
          scaleY: 1,
          onComplete: () => {
            this.isUp = false;
            if (options?.onComplete) {
              options.onComplete();
            }
          },
        },
      ],
    });
  }

  moveToUp(
    cardId: number,
    options: {
      x: number;
      y: number;
      angle?: number;
      onComplete?: () => void;
    }
  ) {
    if (options.angle) {
      this.scene.tweens.add({
        targets: this,
        duration: (this.constructor as typeof CardSprite).moveDuration,
        angle: options.angle,
      });
    }
    this.moveTo({
      x: options.x,
      y: options.y,
      onComplete: () => {
        this.turnUp(cardId, { onComplete: options.onComplete });
      },
    });
  }

  moveToDown(options: {
    x: number;
    y: number;
    angle?: number;
    onComplete?: () => void;
  }) {
    this.scene.tweens.add({
      targets: this,
      duration: (this.constructor as typeof CardSprite).moveDuration,
      angle: options.angle,
    });
    this.moveTo({
      x: options.x,
      y: options.y,
      onComplete: () => {
        this.turnDown({ onComplete: options.onComplete });
      },
    });
  }

  moveTo(options: { x: number; y: number; onComplete?: () => void }) {
    this.scene.tweens.chain({
      targets: this,
      tweens: [
        {
          x: options.x,
          y: options.y,
          duration: (this.constructor as typeof CardSprite).moveDuration,
          onComplete: options.onComplete,
        },
      ],
    });
  }
}
