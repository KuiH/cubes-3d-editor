/** 6 个正交视图方向 */
export type ViewDirection = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

/** 单个正方体数据 */
export interface CubeData {
  id: string;
  position: [number, number, number];
  color: string | null;
}

/** 交互模式 */
export type InteractionMode = 'add' | 'paint' | 'delete';

/** 预设结构类型 */
export type PresetType = '3x3x3' | '4x4x4' | '5x5x5';
