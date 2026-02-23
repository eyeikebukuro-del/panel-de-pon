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

    private panelImages: Partial<Record<PanelType, HTMLCanvasElement>> = {};
    private vanishImages: Partial<Record<PanelType, HTMLCanvasElement>> = {};
    private imagesLoaded: boolean = false;

    constructor(canvas: HTMLCanvasElement, grid: Grid) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.grid = grid;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.loadImages();
    }

    private async loadImages() {
        const loadImg = (src: string) => {
            return new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        };

        const removeWhiteBackground = (img: HTMLImageElement): HTMLCanvasElement => {
            const d = document.createElement('canvas');
            const w = d.width = img.width;
            const h = d.height = img.height;
            const c = d.getContext('2d', { willReadFrequently: true })!;
            c.drawImage(img, 0, 0);
            const imgData = c.getImageData(0, 0, w, h);
            const data = imgData.data;

            const visited = new Uint8Array(w * h);
            const queue = new Int32Array(w * h * 2);
            let head = 0, tail = 0;

            const push = (x: number, y: number) => {
                if (x < 0 || y < 0 || x >= w || y >= h) return;
                const idx = y * w + x;
                if (visited[idx]) return;
                visited[idx] = 1;

                const p = idx * 4;
                const r = data[p], g = data[p + 1], b = data[p + 2];
                // 200以上の明るいピクセルは背景とみなして消波
                if (r > 200 && g > 200 && b > 200) {
                    const diff = Math.max(255 - r, 255 - g, 255 - b);
                    data[p + 3] = Math.min(255, Math.max(0, diff * 5)); // エッジを少し柔らかく
                    queue[tail++] = x;
                    queue[tail++] = y;
                }
            };

            // 四隅から開始して背景を塗りつぶし
            push(0, 0); push(w - 1, 0); push(0, h - 1); push(w - 1, h - 1);

            while (head < tail) {
                const x = queue[head++];
                const y = queue[head++];
                push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
            }

            c.putImageData(imgData, 0, 0);
            return d;
        };

        try {
            const baseUrl = import.meta.env.BASE_URL;
            const [
                red, blue, green, yellow, purple, cyan,
                redV, blueV, greenV, yellowV, purpleV, cyanV
            ] = await Promise.all([
                loadImg(baseUrl + 'assets/panels/panel_red_idle.png'),
                loadImg(baseUrl + 'assets/panels/panel_blue_idle.png'),
                loadImg(baseUrl + 'assets/panels/panel_green_idle.png'),
                loadImg(baseUrl + 'assets/panels/panel_yellow_idle.png'),
                loadImg(baseUrl + 'assets/panels/panel_purple_idle.png'),
                loadImg(baseUrl + 'assets/panels/panel_cyan_idle.png'),
                loadImg(baseUrl + 'assets/panels/panel_red_vanish.png'),
                loadImg(baseUrl + 'assets/panels/panel_blue_vanish.png'),
                loadImg(baseUrl + 'assets/panels/panel_green_vanish.png'),
                loadImg(baseUrl + 'assets/panels/panel_yellow_vanish.png'),
                loadImg(baseUrl + 'assets/panels/panel_purple_vanish.png'),
                loadImg(baseUrl + 'assets/panels/panel_cyan_vanish.png')
            ]);

            this.panelImages[PanelType.RED] = removeWhiteBackground(red);
            this.panelImages[PanelType.BLUE] = removeWhiteBackground(blue);
            this.panelImages[PanelType.GREEN] = removeWhiteBackground(green);
            this.panelImages[PanelType.YELLOW] = removeWhiteBackground(yellow);
            this.panelImages[PanelType.PURPLE] = removeWhiteBackground(purple);
            this.panelImages[PanelType.CYAN] = removeWhiteBackground(cyan);

            this.vanishImages[PanelType.RED] = removeWhiteBackground(redV);
            this.vanishImages[PanelType.BLUE] = removeWhiteBackground(blueV);
            this.vanishImages[PanelType.GREEN] = removeWhiteBackground(greenV);
            this.vanishImages[PanelType.YELLOW] = removeWhiteBackground(yellowV);
            this.vanishImages[PanelType.PURPLE] = removeWhiteBackground(purpleV);
            this.vanishImages[PanelType.CYAN] = removeWhiteBackground(cyanV);

            this.imagesLoaded = true;
        } catch (e) {
            console.error('Failed to load panel images', e);
        }
    }

    private resize() {
        const parent = this.canvas.parentElement;
        if (parent) {
            const displayHeight = this.grid.height - 1; // 見えるのは12行分
            const size = Math.min(parent.clientWidth / this.grid.width, parent.clientHeight / displayHeight);
            this.canvas.width = this.grid.width * size;
            this.canvas.height = displayHeight * size;
        }
    }

    public render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const panelW = this.canvas.width / this.grid.width;
        // 表示用のマスの高さ
        const panelH = this.canvas.height / (this.grid.height - 1);
        const riseOffset = this.grid.riseProgress * panelH;

        // y=0 は画面外のゲームオーバー判定用領域なので描画から除外
        for (let y = 1; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const panel = this.grid.panels[y][x];
                if (panel.type === PanelType.EMPTY) continue;

                // スワップ時のoffsetXと、落下時のoffsetY
                const posX = (x + panel.offsetX) * panelW;
                // y=1をキャンバスのy=0として描画する
                const posY = ((y - 1) + panel.offsetY) * panelH - riseOffset;

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
        // カーソルのy座標も1ずらす
        this.drawSelection(this.grid.cursorX * panelW, (this.grid.cursorY - 1) * panelH - riseOffset, panelW * 2, panelH);

        // 次にせり上がってくる行の予兆（一番下）
        this.drawUpcomingRow(panelW, panelH, riseOffset);

        // コンボポップアップの描画
        this.drawPopups(panelW, panelH, riseOffset);

        // 警告ライン（一番上）
        this.drawDangerLine();

        // ゲームオーバー表示
        if (this.grid.isGameOver) {
            this.drawGameOver();
        }
    }

    private drawPopups(panelW: number, panelH: number, riseOffset: number) {
        const ctx = this.ctx;
        this.grid.popups.forEach(p => {
            const px = p.x * panelW + panelW / 2;
            const py = (p.y - 1) * panelH - riseOffset - (1.0 - p.timer / 1000) * 50;

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

        if (this.imagesLoaded && this.panelImages[type]) {
            const img = (showFace && this.vanishImages[type]) ? this.vanishImages[type]! : this.panelImages[type]!;
            const drawW = w - padding * 2;
            const drawH = h - padding * 2;
            const drawX = cx - drawW / 2;
            const drawY = cy - drawH / 2;

            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else {
            // パネルの外枠（フォールバック）
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
        }

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

    private drawDangerLine() {
        const ctx = this.ctx;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        // 破線をキャンバスの一番上（枠の天井）に引く
        const dangerY = 2; // 線が見えるように少しだけ下に
        ctx.moveTo(0, dangerY);
        ctx.lineTo(this.canvas.width, dangerY);
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
