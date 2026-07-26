import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Scene } from '../three/Scene';
import { AxisGizmo } from '../three/AxisGizmo';
import { RaycastHandler } from '../three/RaycastHandler';

/** 3D 透视主视图（始终存在，支持旋转/缩放/平移） */
export function MainView() {
  return (
    <div className="main-view">
      <Canvas
        camera={{ position: [8, 6, 8], fov: 50, near: 0.1, far: 100 }}
      >
        <Scene />
        <AxisGizmo />
        <RaycastHandler />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
