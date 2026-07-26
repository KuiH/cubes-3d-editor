import * as THREE from 'three';
import { Grid } from '@react-three/drei';
import { useCubeStore } from '../store/cubeStore';
import { CubeMesh } from './CubeMesh';
import { useMemo } from 'react';

/** 不可见网格检测平面——用于捕获"点击空白处"来放置第一个正方体 */
function GridPlane() {
  return (
    <mesh
      name="gridPlane"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      visible={false}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial side={THREE.DoubleSide} />
    </mesh>
  );
}

/** 场景内容：所有正方体 + 网格 */
export function Scene() {
  const cubes = useCubeStore((s) => s.cubes);
  const cubeList = useMemo(() => Array.from(cubes.values()), [cubes]);

  return (
    <>
      {/* 世界坐标网格（y=-0.5 为地面层） */}
      <Grid
        position={[0, -0.5, 0]}
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#888888"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#444444"
        fadeDistance={40}
        infiniteGrid
      />

      {/* 不可见检测平面 */}
      <GridPlane />

      {/* 环境光 + 方向光 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={0.9} />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />

      {/* 所有正方体 */}
      {cubeList.map((cube) => (
        <CubeMesh key={cube.id} data={cube} />
      ))}
    </>
  );
}
