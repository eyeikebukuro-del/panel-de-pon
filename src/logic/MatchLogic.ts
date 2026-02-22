import { Grid } from '../engine/Grid';
import { PanelStatus, PanelType } from '../types/game';

/**
 * 3つ以上の並びを判定するロジックです。
 */
export class MatchLogic {
    /**
     * 盤面全体のマッチングをチェックします。
     */
    public static checkMatches(grid: Grid): boolean {
        let hasMatch = false;
        const toMatch: { y: number; x: number }[] = [];

        // 水平方向のチェック
        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width - 2; x++) {
                const type = grid.panels[y][x].type;
                if (type === PanelType.EMPTY) continue;

                if (
                    grid.panels[y][x + 1].type === type &&
                    grid.panels[y][x + 2].type === type &&
                    grid.panels[y][x].status === PanelStatus.IDLE &&
                    grid.panels[y][x + 1].status === PanelStatus.IDLE &&
                    grid.panels[y][x + 2].status === PanelStatus.IDLE
                ) {
                    toMatch.push({ y, x }, { y, x: x + 1 }, { y, x: x + 2 });
                    hasMatch = true;

                    // さらに隣も同じなら追加
                    let nextX = x + 3;
                    while (nextX < grid.width && grid.panels[y][nextX].type === type) {
                        toMatch.push({ y, x: nextX });
                        nextX++;
                    }
                }
            }
        }

        // 垂直方向のチェック
        for (let x = 0; x < grid.width; x++) {
            for (let y = 0; y < grid.height - 2; y++) {
                const type = grid.panels[y][x].type;
                if (type === PanelType.EMPTY) continue;

                if (
                    grid.panels[y + 1][x].type === type &&
                    grid.panels[y + 2][x].type === type &&
                    grid.panels[y][x].status === PanelStatus.IDLE &&
                    grid.panels[y + 1][x].status === PanelStatus.IDLE &&
                    grid.panels[y + 2][x].status === PanelStatus.IDLE
                ) {
                    toMatch.push({ y, x }, { y: y + 1, x }, { y: y + 2, x });
                    hasMatch = true;

                    let nextY = y + 3;
                    while (nextY < grid.height && grid.panels[nextY][x].type === type) {
                        toMatch.push({ y: nextY, x });
                        nextY++;
                    }
                }
            }
        }

        // マッチしたパネルの状態を更新
        let delay = 0;
        const STAGGER_DELAY = 150; // パネルごとの時間差
        const TOTAL_WAIT = 500;    // 消去開始までの待機時間

        toMatch.forEach(pos => {
            const panel = grid.panels[pos.y][pos.x];
            // すでにマッチ判定されているものはスキップ
            if (panel.status === PanelStatus.IDLE) {
                panel.status = PanelStatus.MATCH_WAITING;
                // matchTimer を管理用の汎用タイマーとして使用
                // 最初は待機時間 + 各パネルのディレイ
                panel.matchTimer = TOTAL_WAIT + delay;
                delay += STAGGER_DELAY;
            }
        });

        return hasMatch;
    }
}
