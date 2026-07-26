import { Canvas } from '@react-three/fiber';
import { Scene } from '../three/Scene';
import { OrthoCameraController } from '../three/OrthoCameraController';
import type { ViewDirection } from '../types';

const DIRECTION_LABELS: Record<ViewDirection, string> = {
  front: '主视图',
  back: '后视图',
  left: '左视图',
  right: '右视图',
  top: '俯视图',
  bottom: '仰视图',
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
