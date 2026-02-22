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
    if (!this.lastTime) this.lastTime = time;
    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    this.update(deltaTime);
    this.renderer.render();

    requestAnimationFrame((time) => this.loop(time));
  }

  private update(deltaTime: number) {
    // ヒットストップの処理
    if (this.grid.hitStopTimer > 0) {
      this.grid.hitStopTimer -= deltaTime;
      // ヒットストップ中は描画のみ（更新スキップ）
      return;
    }

    // 落下処理
    GravityLogic.update(this.grid);

    // マッチング判定
    const foundMatch = MatchLogic.checkMatches(this.grid);
    if (foundMatch) {
      this.grid.hitStopTimer = GAME_CONFIG.HIT_STOP_DURATION;
      this.grid.isMatching = true;
    }

    // 消滅中のパネルがあるか再チェック（タイマー更新)
    this.updateTimers(deltaTime);

    // ポップアップの更新
    this.grid.popups = this.grid.popups.filter(p => {
      p.timer -= deltaTime;
      return p.timer > 0;
    });

    // 全ての消滅が完了したか判定
    let stillSomethingHappening = false;
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const panel = this.grid.panels[y][x];
        const s = panel.status;
        if (s === PanelStatus.MATCH_WAITING || s === PanelStatus.MATCHED || s === PanelStatus.FALLING || s === PanelStatus.SWAPPING) {
          stillSomethingHappening = true;
        }

        // 落ち着いたパネルの連鎖フラグをリセット（マッチしていなければ）
        if (s === PanelStatus.IDLE && !stillSomethingHappening) {
          // ここで一斉に消すと不具合が出るので、stillSomethingHappeningが完全にfalseの時だけやる
        }
      }
    }

    this.grid.isMatching = stillSomethingHappening;

    if (!stillSomethingHappening) {
      // 全てが静止したら連鎖数をリセット
      if (this.grid.currentCombo > 0) {
        this.grid.currentCombo = 0;
        // 全パネルの連鎖フラグをリセット
        for (let y = 0; y < this.grid.height; y++) {
          for (let x = 0; x < this.grid.width; x++) {
            this.grid.panels[y][x].isChaining = false;
          }
        }
      }
    }

    // せり上がり（消滅・落下中は停止）
    if (!stillSomethingHappening) {
      const speed = this.grid.isManualRising ? GAME_CONFIG.MANUAL_RISE_SPEED : GAME_CONFIG.RISE_SPEED;
      this.grid.riseProgress += speed;

      if (this.grid.riseProgress >= 1) {
        this.grid.riseProgress = 0;
        this.shiftRowsUp();
      }
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
      isChaining: false,
    }));
    this.grid.generateUpcomingRow();
    if (this.grid.cursorY > 0) {
      this.grid.cursorY--;
    }
  }
}

new Game();
