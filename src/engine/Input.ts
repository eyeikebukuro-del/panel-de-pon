import { Grid } from './Grid';

/**
 * 入力（タッチ/マウス）を処理するクラスです。
 */
export class Input {
    private canvas: HTMLCanvasElement;
    private grid: Grid;
    private startX: number = 0;
    private startY: number = 0;
    private isPressed: boolean = false;

    constructor(canvas: HTMLCanvasElement, grid: Grid) {
        this.canvas = canvas;
        this.grid = grid;
        this.initEvents();
    }

    private initEvents() {
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleStart(e.touches[0].clientX, e.touches[0].clientY));
        this.canvas.addEventListener('touchmove', (e) => this.handleMove(e.touches[0].clientX, e.touches[0].clientY));
        this.canvas.addEventListener('touchend', () => this.handleEnd());

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseup', () => this.handleEnd());
    }

    private getGridPos(clientX: number, clientY: number) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        return {
            gridX: Math.floor(x / (rect.width / this.grid.width)),
            gridY: Math.floor((y + (this.grid.riseProgress * (rect.height / this.grid.height))) / (rect.height / this.grid.height)),
        };
    }

    private handleStart(x: number, y: number) {
        this.startX = x;
        this.startY = y;
        this.isPressed = true;

        // カーソル位置の即時更新
        this.updateCursor(x, y);
    }

    private handleMove(x: number, y: number) {
        if (!this.isPressed) return;

        const dx = x - this.startX;
        const threshold = 30; // スワイプのしきい値

        if (Math.abs(dx) > threshold) {
            const pos = this.getGridPos(this.startX, this.startY);
            const targetX = dx > 0 ? pos.gridX + 1 : pos.gridX - 1;

            if (pos.gridY >= 0 && pos.gridY < this.grid.height) {
                this.grid.swap(pos.gridY, pos.gridX, targetX);
            }

            this.isPressed = false; // 一度のスワイプで一回だけ入れ替え
        } else {
            // スワイプ閾値未満ならカーソル位置を更新（追従）
            this.updateCursor(x, y);
        }
    }

    private updateCursor(x: number, y: number) {
        const pos = this.getGridPos(x, y);
        if (pos.gridX >= 0 && pos.gridX < this.grid.width - 1 && pos.gridY >= 0 && pos.gridY < this.grid.height) {
            this.grid.cursorX = pos.gridX;
            this.grid.cursorY = pos.gridY;
        } else if (pos.gridX === this.grid.width - 1) {
            // 一番右をクリックした場合は左にずらす
            this.grid.cursorX = pos.gridX - 1;
            this.grid.cursorY = pos.gridY;
        }
    }

    private handleEnd() {
        this.isPressed = false;
    }
}
