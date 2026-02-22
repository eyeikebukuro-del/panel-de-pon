import { Grid } from '../engine/Grid';
import { PanelStatus, PanelType } from '../types/game';

/**
 * パネルの落下を処理するロジックです。
 */
export class GravityLogic {
    public static update(grid: Grid) {
        for (let x = 0; x < grid.width; x++) {
            for (let y = grid.height - 2; y >= 0; y--) {
                const panel = grid.panels[y][x];
                const below = grid.panels[y + 1][x];

                if (panel.type !== PanelType.EMPTY && below.type === PanelType.EMPTY) {
                    // 下のパネルが空の場合のみ落下
                    // ただし、もし下のパネルが消滅待ち/消滅中なら落下しない（Panel de Ponの挙動）
                    if (panel.status === PanelStatus.IDLE) {
                        // 落下開始（連鎖のために状態管理が必要になるが、まずはシンプルに）
                        grid.panels[y + 1][x] = { ...panel };
                        grid.panels[y][x] = {
                            type: PanelType.EMPTY,
                            status: PanelStatus.IDLE,
                            offsetY: 0,
                            offsetX: 0,
                            matchTimer: 0,
                        };
                    }
                }

                // パネルが消滅待ち・消滅中の場合、その上のパネルは固定される
                if (below.status === PanelStatus.MATCH_WAITING || below.status === PanelStatus.MATCHED) {
                    // 何もしない（上のパネルを y 軸方向に固定）
                }
            }
        }
    }
}
