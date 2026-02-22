import { Grid } from './Grid';
import { PanelType, PANEL_SYMBOLS } from '../types/game';

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
                let showFace = false;

                if (panel.status === 'matched' || panel.status === 'match_waiting') {
                    showFace = true;
                    // 消滅アニメーションの設定（MATCHEDの時だけフェード）
                    if (panel.status === 'matched') {
                        alpha = panel.matchTimer / 500;
                        scale = 1.0 + (1.0 - (panel.matchTimer / 500)) * 0.2;
                    }
                }

                this.drawPanel(posX + panelW / 2, posY + panelH / 2, panelW * scale, panelH * scale, panel.type, alpha, showFace);
            }
        }

        // 選択枠（カッコ）の描画
        this.drawSelection(this.grid.cursorX * panelW, this.grid.cursorY * panelH - riseOffset, panelW * 2, panelH);

        // 次にせり上がってくる行の予兆（一番下）
        this.drawUpcomingRow(panelW, panelH, riseOffset);

        // コンボポップアップの描画
        this.drawPopups(panelW, panelH, riseOffset);

        // 警告ライン（一番上）
        this.drawDangerLine(panelH);

        // ゲームオーバー表示
        if (this.grid.isGameOver) {
            this.drawGameOver();
        }
    }

    private drawPopups(panelW: number, panelH: number, riseOffset: number) {
        const ctx = this.ctx;
        this.grid.popups.forEach(p => {
            const px = p.x * panelW + panelW / 2; // パネルの中央
            const py = p.y * panelH - riseOffset - (1.0 - p.timer / 1000) * 50; // 上に昇る

            ctx.save();
            ctx.globalAlpha = p.timer / 1000;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#ff0080';
            ctx.lineWidth = 4;
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText(p.text, px, py);
            ctx.fillText(p.text, px, py);
            ctx.restore();
        });
    }

    private drawPanel(cx: number, cy: number, w: number, h: number, type: PanelType, alpha: number, showFace: boolean) {
        const ctx = this.ctx;
        const padding = 2;

        ctx.globalAlpha = Math.max(0, alpha);

        // パネルの外枠
        ctx.fillStyle = this.colors[type];
        ctx.beginPath();
        const r = 8;
        ctx.roundRect(cx - w / 2 + padding, cy - h / 2 + padding, w - padding * 2, h - padding * 2, r);
        ctx.fill();

        // シンボルまたは顔を描画
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (showFace) {
            // 消滅時の顔 (x x) みたいなの
            ctx.font = `bold ${w * 0.5}px Arial`;
            ctx.fillText('× ×', cx, cy - h * 0.05);
            ctx.font = `bold ${w * 0.3}px Arial`;
            ctx.fillText('︶', cx, cy + h * 0.2);
        } else {
            // 通常時の記号
            const symbol = PANEL_SYMBOLS[type];
            if (symbol) {
                ctx.font = `bold ${w * 0.5}px Arial`;
                ctx.fillText(symbol, cx, cy);
            }
        }

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
            this.drawPanel(x * panelW + panelW / 2, y + panelH / 2, panelW, panelH, type, 0.5, false);
        }
    }

    private drawDangerLine(panelH: number) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(0, panelH);
        ctx.lineTo(this.canvas.width, panelH);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    private drawGameOver() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);

        ctx.font = '24px Arial';
        ctx.fillText('タップしてリロード', this.canvas.width / 2, this.canvas.height / 2 + 60);

        // リロード用のクリックイベントを追加（一度だけ）
        this.canvas.onclick = () => window.location.reload();
    }
}
