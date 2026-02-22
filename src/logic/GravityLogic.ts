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
                    if (panel.status === PanelStatus.IDLE || panel.status === PanelStatus.FALLING) {
                        panel.status = PanelStatus.FALLING;
                        panel.isChaining = true; // 落下したパネルは連鎖候補

                        grid.panels[y + 1][x] = { ...panel };
                        grid.panels[y][x] = {
                            type: PanelType.EMPTY,
                            status: PanelStatus.IDLE,
                            offsetY: 0,
                            offsetX: 0,
                            matchTimer: 0,
                            isChaining: false,
                        };
                    }
                } else if (panel.status === PanelStatus.FALLING && below.type !== PanelType.EMPTY) {
                    // 着地
                    if (below.status === PanelStatus.IDLE) {
                        panel.status = PanelStatus.IDLE;
                    }
                }

                // パネルが消滅待ち・消滅中の場合、その上のパネルは固定されるが、連鎖フラグを継承させる
                if (below.status === PanelStatus.MATCH_WAITING || below.status === PanelStatus.MATCHED) {
                    if (panel.type !== PanelType.EMPTY) {
                        panel.isChaining = true; // 消滅中のパネルの上にあるパネルも連鎖の一部
                    }
                }
            }
        }
    }
}
