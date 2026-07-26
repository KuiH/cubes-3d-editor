import { Canvas } from '@react-three/fiber';
import { Scene } from '../three/Scene';
import { OrthoCameraController } from '../three/OrthoCameraController';
import type { ViewDirection } from '../types';

const DIRECTION_LABELS: Record<ViewDirection, string> = {
  front: '正面 (Front)',
  back: '背面 (Back)',
  left: '左面 (Left)',
  right: '右面 (Right)',
  top: '顶面 (Top)',
  bottom: '底面 (Bottom)',
};

/** 正交视图 — 只读，不可交互 */
export function OrthoView({ direction }: { direction: ViewDirection }) {
  return (
    <div className="ortho-view-card">
      <div className="ortho-view-title">{DIRECTION_LABELS[direction]}</div>
      <div className="ortho-view-canvas">
        <Canvas
          orthographic
          camera={{
            position: [0, 0, 20],
            near: 0.1,
            far: 100,
            zoom: 1,
          }}
        >
          <Scene />
          <OrthoCameraController direction={direction} />
        </Canvas>
      </div>
    </div>
  );
}
