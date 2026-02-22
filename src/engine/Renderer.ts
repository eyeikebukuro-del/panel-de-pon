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

        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const panel = this.grid.panels[y][x];
                if (panel.type === PanelType.EMPTY) continue;

                const posX = x * panelW;
                const posY = y * panelH - (this.grid.riseProgress * panelH);

                this.drawPanel(posX, posY, panelW, panelH, panel.type);
            }
        }

        // 次にせり上がってくる行の予兆（一番下）
        this.drawUpcomingRow(panelW, panelH);
    }

    private drawPanel(x: number, y: number, w: number, h: number, type: PanelType) {
        const ctx = this.ctx;
        const padding = 2;

        ctx.fillStyle = this.colors[type];
        ctx.beginPath();
        ctx.roundRect(x + padding, y + padding, w - padding * 2, h - padding * 2, 8);
        ctx.fill();

        // 微かな輝きを追加
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    private drawUpcomingRow(_panelW: number, _panelH: number) {
        // 実際の実装では次の行を保持して描画する
    }
}
