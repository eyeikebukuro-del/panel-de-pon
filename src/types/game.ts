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
  MATCHED = 'matched', // 消滅決定
  MATCH_WAITING = 'match_waiting', // 消滅アニメーション待ち
  FALLING = 'falling',
  WAITING_FOR_FALL = 'waiting_for_fall',
}

/**
 * パネルのシンボルを定義します。
 */
export const PANEL_SYMBOLS: Record<number, string> = {
  1: '♡', // RED
  2: '▽', // BLUE (User requested BLUE as ▽, CYAN as △. Assuming PanelType 2 is BLUE)
  3: '〇', // GREEN
  4: '★', // YELLOW
  5: '♢', // PURPLE
  6: '△', // CYAN
};

/**
 * 個別のパネルのインターフェースです。
 */
export interface Panel {
  type: PanelType;
  status: PanelStatus;
  offsetY: number; // せり上がりや落下中のオフセット（ピクセル）
  offsetX: number; // スワップ中のオフセット（ピクセル）
  matchTimer: number; // 消滅アニメーション用のタイマー
  isChaining: boolean; // 連鎖フラグ
}

/**
 * コンボ（連鎖）情報のインターフェースです。
 */
export interface ComboInfo {
  count: number;
  timer: number;
}

/**
 * ゲームの設定定数です。
 */
export const GAME_CONFIG = {
  GRID_WIDTH: 6,
  GRID_HEIGHT: 12,
  PANEL_SIZE: 60,
  SWAP_SPEED: 0.2,
  FALL_SPEED: 0.5,
  RISE_SPEED: 0.001,
  MANUAL_RISE_SPEED: 0.05,
  MATCH_TIME: 800,
  HIT_STOP_DURATION: 300, // ヒットストップの長さ（ms）
  COMBO_GRACE_PERIOD: 1000, // 連鎖継続の猶予時間（ms）
};
