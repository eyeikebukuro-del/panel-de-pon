import type { Panel } from '../types/game';
import { PanelType, PanelStatus, GAME_CONFIG } from '../types/game';

/**
 * ゲーム盤面の状態を管理するクラスです。
 */
export class Grid {
    public panels: Panel[][];
    public width: number;
    public height: number;
    public cursorX: number = 2;
    public cursorY: number = 8;
    public riseProgress: number = 0; // 追加
    public upcomingRow: PanelType[] = [];

    constructor(width: number = GAME_CONFIG.GRID_WIDTH, height: number = GAME_CONFIG.GRID_HEIGHT) {
        this.width = width;
        this.height = height;
        this.panels = Array.from({ length: height }, () =>
            Array.from({ length: width }, () => ({
                type: PanelType.EMPTY,
                status: PanelStatus.IDLE,
                offsetY: 0,
                offsetX: 0,
                matchTimer: 0,
            }))
        );
        this.initRandom();
        this.generateUpcomingRow();
    }

    /**
     * 初期盤面をランダムに生成します。
     */
    private initRandom() {
        for (let y = this.height - 6; y < this.height; y++) {
            const row = this.generateSafeRow(y);
            for (let x = 0; x < this.width; x++) {
                this.panels[y][x].type = row[x];
            }
        }
    }

    /**
     * 3つ以上揃わないように安全な行を生成します。
     */
    public generateSafeRow(y: number): PanelType[] {
        const row: PanelType[] = [];
        const types = [
            PanelType.RED,
            PanelType.BLUE,
            PanelType.GREEN,
            PanelType.YELLOW,
            PanelType.PURPLE,
        ];

        for (let x = 0; x < this.width; x++) {
            let validTypes = [...types];

            // 左側とのチェック (x-1, x-2)
            if (x >= 2 && row[x - 1] === row[x - 2]) {
                validTypes = validTypes.filter(t => t !== row[x - 1]);
            } else if (x >= 1) {
                // 3つ揃う可能性を低くするため、左と同じ色も避け気味にする
            }

            // 上下とのチェック
            if (y > 0 && this.panels[y - 1][x].type !== PanelType.EMPTY) {
                // 上のパネルと同色なら避ける
                validTypes = validTypes.filter(t => t !== this.panels[y - 1][x].type);
            }

            const type = validTypes[Math.floor(Math.random() * validTypes.length)];
            row.push(type);
        }
        return row;
    }

    public generateUpcomingRow() {
        this.upcomingRow = this.generateSafeRow(this.height - 1);
    }

    /**
     * 隣り合うパネルを入れ替えます。
     */
    public swap(y: number, x1: number, x2: number) {
        if (x1 < 0 || x1 >= this.width || x2 < 0 || x2 >= this.width) return;

        // 入れ替え中のパネルがある場合はスキップ（簡易実装）
        if (this.panels[y][x1].status !== PanelStatus.IDLE || this.panels[y][x2].status !== PanelStatus.IDLE) {
            return;
        }

        const temp = { ...this.panels[y][x1] };
        this.panels[y][x1] = { ...this.panels[y][x2] };
        this.panels[y][x2] = temp;
    }
}
