import type { Panel } from '../types/game';
import { PanelType, PanelStatus, GAME_CONFIG } from '../types/game';

/**
 * ゲーム盤面の状態を管理するクラスです。
 */
export class Grid {
    public panels: Panel[][];
    public width: number;
    public height: number;
    public riseProgress: number = 0; // 0 to 1

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
    }

    /**
     * 初期盤面をランダムに生成します（マッチングがないように）。
     */
    private initRandom() {
        const types = [
            PanelType.RED,
            PanelType.BLUE,
            PanelType.GREEN,
            PanelType.YELLOW,
            PanelType.PURPLE,
        ];

        // 下半分にパネルを配置
        for (let y = this.height - 5; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let validTypes = [...types];

                // 左隣と同色を避ける
                if (x > 0) {
                    validTypes = validTypes.filter(t => t !== this.panels[y][x - 1].type);
                }
                // 下隣と同色を避ける
                if (y < this.height - 1) {
                    validTypes = validTypes.filter(t => t !== this.panels[y + 1][x].type);
                }

                const type = validTypes[Math.floor(Math.random() * validTypes.length)];
                this.panels[y][x].type = type;
            }
        }
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
