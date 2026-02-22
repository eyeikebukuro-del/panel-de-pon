import './style.css';
import { Grid } from './engine/Grid';
import { Renderer } from './engine/Renderer';
import { Input } from './engine/Input';
import { GAME_CONFIG, PanelStatus, PanelType } from './types/game';
import { MatchLogic } from './logic/MatchLogic';
import { GravityLogic } from './logic/GravityLogic';

class Game {
  private grid: Grid;
  private renderer: Renderer;
  private lastTime: number = 0;
  private score: number = 0;

  constructor() {
    const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
    this.grid = new Grid();
    this.renderer = new Renderer(canvas, this.grid);
    new Input(canvas, this.grid);

    requestAnimationFrame((time) => this.loop(time));
  }

  private loop(time: number) {
    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    this.update(deltaTime);
    this.renderer.render();

    requestAnimationFrame((time) => this.loop(time));
  }

  private update(deltaTime: number) {
    // 落下処理
    GravityLogic.update(this.grid);

    // マッチング判定
    MatchLogic.checkMatches(this.grid);

    // アニメーションタイマーの更新
    this.updateTimers(deltaTime);

    // せり上がり
    this.grid.riseProgress += GAME_CONFIG.RISE_SPEED;
    if (this.grid.riseProgress >= 1) {
      this.grid.riseProgress = 0;
      this.shiftRowsUp();
    }
  }

  private updateTimers(deltaTime: number) {
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const panel = this.grid.panels[y][x];
        if (panel.status === PanelStatus.MATCHED) {
          panel.matchTimer -= deltaTime;
          if (panel.matchTimer <= 0) {
            panel.type = PanelType.EMPTY;
            panel.status = PanelStatus.IDLE;
            this.score += 10;
            this.updateScoreUI();
          }
        }
      }
    }
  }

  private updateScoreUI() {
    const scoreEl = document.querySelector('#score');
    if (scoreEl) {
      scoreEl.textContent = this.score.toString().padStart(5, '0');
    }
  }

  private shiftRowsUp() {
    // 全ての行を1つ上にずらす
    for (let y = 0; y < this.grid.height - 1; y++) {
      this.grid.panels[y] = this.grid.panels[y + 1];
    }
    // 新しい行を一番下に追加（簡易実装）
    this.grid.panels[this.grid.height - 1] = Array.from({ length: this.grid.width }, () => ({
      type: Math.floor(Math.random() * 5) + 1,
      status: 'idle' as any,
      offsetY: 0,
      offsetX: 0,
      matchTimer: 0,
    }));
  }
}

new Game();
