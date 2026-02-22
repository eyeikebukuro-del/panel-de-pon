/**
 * パネルの種類を定義します。
 */
export enum PanelType {
  EMPTY = 0,
  RED = 1,
  BLUE = 2,
  GREEN = 3,
  YELLOW = 4,
  PURPLE = 5,
  CYAN = 6,
}

/**
 * パネルの状態を定義します。
 */
export enum PanelStatus {
  IDLE = 'idle',
  SWAPPING = 'swapping',
  MATCHED = 'matched',
  FALLING = 'falling',
  WAITING_FOR_FALL = 'waiting_for_fall',
}

/**
 * 個別のパネルのインターフェースです。
 */
export interface Panel {
  type: PanelType;
  status: PanelStatus;
  offsetY: number; // せり上がりや落下中のオフセット（ピクセル）
  offsetX: number; // スワップ中のオフセット（ピクセル）
  matchTimer: number; // 消滅アニメーション用のタイマー
}

/**
 * ゲームの設定定数です。
 */
export const GAME_CONFIG = {
  GRID_WIDTH: 6,
  GRID_HEIGHT: 12,
  PANEL_SIZE: 60, // 基本サイズ（レスポンシブで調整）
  SWAP_SPEED: 0.2, // スワップ速度
  FALL_SPEED: 0.5, // 落下速度
  RISE_SPEED: 0.005, // せり上がり速度（1フレームあたりのグリッド単位）
  MATCH_TIME: 1000, // 消滅までの時間（ms）
};
