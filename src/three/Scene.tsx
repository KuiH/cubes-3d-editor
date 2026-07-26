import { useCubeStore } from '../store/cubeStore';
import { CubeMesh } from './CubeMesh';
import { useMemo } from 'react';

/** 场景内容：所有正方体 + 灯光 */
export function Scene() {
  const cubes = useCubeStore((s) => s.cubes);
  const cubeList = useMemo(() => Array.from(cubes.values()), [cubes]);

  return (
    <>
      {/* 均匀光照：高环境光 + 6方向等强方向光，所有面亮度一致 */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[1, 0, 0]} intensity={0.3} />
      <directionalLight position={[-1, 0, 0]} intensity={0.3} />
      <directionalLight position={[0, 1, 0]} intensity={0.3} />
      <directionalLight position={[0, -1, 0]} intensity={0.3} />
      <directionalLight position={[0, 0, 1]} intensity={0.3} />
      <directionalLight position={[0, 0, -1]} intensity={0.3} />

      {cubeList.map((cube) => (
        <CubeMesh key={cube.id} data={cube} />
      ))}
    </>
  );
}
