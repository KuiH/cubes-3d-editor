import { useCubeStore } from '../store/cubeStore';
import { CubeMesh } from './CubeMesh';
import { useMemo } from 'react';

/** 场景内容：所有正方体 + 灯光 */
export function Scene() {
  const cubes = useCubeStore((s) => s.cubes);
  const cubeList = useMemo(() => Array.from(cubes.values()), [cubes]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={0.9} />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />

      {cubeList.map((cube) => (
        <CubeMesh key={cube.id} data={cube} />
      ))}
    </>
  );
}
