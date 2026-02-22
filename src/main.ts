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
  private isRisingManual: boolean = false;
  private lastTime: number = 0;
  private score: number = 0;

  constructor() {
    const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
    this.grid = new Grid();
    this.renderer = new Renderer(canvas, this.grid);
    new Input(canvas, this.grid);

    this.initUI();
    requestAnimationFrame((time) => this.loop(time));
  }

  private initUI() {
    const riseBtn = document.querySelector('#rise-button');
    if (riseBtn) {
      riseBtn.addEventListener('mousedown', () => this.isRisingManual = true);
      riseBtn.addEventListener('mouseup', () => this.isRisingManual = false);
      riseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.isRisingManual = true;
      });
      riseBtn.addEventListener('touchend', () => this.isRisingManual = false);
    }
  }

  private loop(time: number) {
    if (!this.lastTime) this.lastTime = time;
    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    this.update(deltaTime);
    this.renderer.render();

    requestAnimationFrame((time) => this.loop(time));
  }

  private update(deltaTime: number) {
    GravityLogic.update(this.grid);
    MatchLogic.checkMatches(this.grid);
    this.updateTimers(deltaTime);

    const speed = this.isRisingManual ? GAME_CONFIG.MANUAL_RISE_SPEED : GAME_CONFIG.RISE_SPEED;
    this.grid.riseProgress += speed;

    if (this.grid.riseProgress >= 1) {
      this.grid.riseProgress = 0;
      this.shiftRowsUp();
    }
  }

  private updateTimers(deltaTime: number) {
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const panel = this.grid.panels[y][x];

        if (panel.status === PanelStatus.MATCH_WAITING || panel.status === PanelStatus.MATCHED) {
          panel.matchTimer -= deltaTime;

          // MATCH_WAITING から MATCHED (顔表示) への遷移
          if (panel.status === PanelStatus.MATCH_WAITING && panel.matchTimer <= 500) {
            panel.status = PanelStatus.MATCHED;
          }

          // MATCHED から EMPTY への遷移
          if (panel.status === PanelStatus.MATCHED && panel.matchTimer <= 0) {
            panel.type = PanelType.EMPTY;
            panel.status = PanelStatus.IDLE;
            panel.matchTimer = 0;
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
    for (let y = 0; y < this.grid.height - 1; y++) {
      this.grid.panels[y] = this.grid.panels[y + 1];
    }
    this.grid.panels[this.grid.height - 1] = this.grid.upcomingRow.map(type => ({
      type,
      status: PanelStatus.IDLE,
      offsetY: 0,
      offsetX: 0,
      matchTimer: 0,
    }));
    this.grid.generateUpcomingRow();
    if (this.grid.cursorY > 0) {
      this.grid.cursorY--;
    }
  }
}

new Game();
