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
                    if (panel.status === PanelStatus.IDLE) {
                        // 落下開始
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
            }
        }
    }
}
