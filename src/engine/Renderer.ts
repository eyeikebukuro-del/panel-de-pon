import { Grid } from './Grid';
import { PanelType } from '../types/game';

/**
 * 画面への描画を担当するクラスです。
 */
export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private grid: Grid;
    private colors: Record<PanelType, string> = {
        [PanelType.EMPTY]: 'transparent',
        [PanelType.RED]: '#ff4b2b',
        [PanelType.BLUE]: '#2b64ff',
        [PanelType.GREEN]: '#2bff4b',
        [PanelType.YELLOW]: '#ffd12b',
        [PanelType.PURPLE]: '#a32bff',
        [PanelType.CYAN]: '#2bfff0',
    };

    constructor(canvas: HTMLCanvasElement, grid: Grid) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.grid = grid;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    private resize() {
        const parent = this.canvas.parentElement;
        if (parent) {
            const size = Math.min(parent.clientWidth / this.grid.width, parent.clientHeight / this.grid.height);
            this.canvas.width = this.grid.width * size;
            this.canvas.height = this.grid.height * size;
        }
    }

    public render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const panelW = this.canvas.width / this.grid.width;
        const panelH = this.canvas.height / this.grid.height;
        const riseOffset = this.grid.riseProgress * panelH;

        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const panel = this.grid.panels[y][x];
                if (panel.type === PanelType.EMPTY) continue;

                const posX = x * panelW;
                const posY = y * panelH - riseOffset;

                // 消滅中のエフェクト
                let alpha = 1.0;
                let scale = 1.0;
                if (panel.status === 'matched') { // PanelStatus.MATCHED
                    alpha = panel.matchTimer / 500; // 徐々に消える
                    scale = 1.0 + (1.0 - (panel.matchTimer / 500)) * 0.2; // 少し膨らむ
                }

                this.drawPanel(posX + panelW / 2, posY + panelH / 2, panelW * scale, panelH * scale, panel.type, alpha);
            }
        }

        // 選択枠（カッコ）の描画
        this.drawSelection(this.grid.cursorX * panelW, this.grid.cursorY * panelH - riseOffset, panelW * 2, panelH);

        // 次にせり上がってくる行の予兆（一番下）
        this.drawUpcomingRow(panelW, panelH, riseOffset);
    }

    private drawPanel(cx: number, cy: number, w: number, h: number, type: PanelType, alpha: number) {
        const ctx = this.ctx;
        const padding = 2;

        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = this.colors[type];
        ctx.beginPath();
        ctx.roundRect(cx - w / 2 + padding, cy - h / 2 + padding, w - padding * 2, h - padding * 2, 8);
        ctx.fill();

        // 輝き
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    private drawSelection(x: number, y: number, w: number, h: number) {
        const ctx = this.ctx;
        const p = 4; // padding
        const len = 15; // 線の長さ

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]); // 破線

        // カッコの描画（左）
        ctx.beginPath();
        ctx.moveTo(x + p + len, y + p);
        ctx.lineTo(x + p, y + p);
        ctx.lineTo(x + p, y + h - p);
        ctx.lineTo(x + p + len, y + h - p);
        ctx.stroke();

        // カッコの描画（右）
        ctx.beginPath();
        ctx.moveTo(x + w - p - len, y + p);
        ctx.lineTo(x + w - p, y + p);
        ctx.lineTo(x + w - p, y + h - p);
        ctx.lineTo(x + w - p - len, y + h - p);
        ctx.stroke();

        ctx.setLineDash([]); // リセット
    }

    private drawUpcomingRow(panelW: number, panelH: number, riseOffset: number) {
        const y = this.canvas.height - riseOffset;

        for (let x = 0; x < this.grid.width; x++) {
            const type = this.grid.upcomingRow[x] || PanelType.RED;
            this.drawPanel(x * panelW + panelW / 2, y + panelH / 2, panelW, panelH, type, 0.5);
        }
    }
}
