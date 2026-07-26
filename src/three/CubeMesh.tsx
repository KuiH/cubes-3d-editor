import { useRef } from 'react';
import * as THREE from 'three';
import { useCubeStore } from '../store/cubeStore';
import type { CubeData } from '../types';

// 预创建 BoxGeometry 和 EdgesGeometry 复用（所有正方体大小一致）
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const edgeGeo = new THREE.EdgesGeometry(boxGeo);

/** 单个正方体 3D 渲染 */
export function CubeMesh({ data }: { data: CubeData }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const selectedCubeId = useCubeStore((s) => s.selectedCubeId);
  const isSelected = selectedCubeId === data.id;

  return (
    <group position={data.position}>
      {/* 实心方块 — userData 必须放在 mesh 上，射线命中点在这里 */}
      <mesh
        ref={meshRef}
        geometry={boxGeo}
        userData={{ cubeId: data.id, type: 'cube' }}
      >
        <meshStandardMaterial color={data.color ?? '#f5f5f5'} />
      </mesh>

      {/* 边框线（区分相邻方块的边界） */}
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial
          color={isSelected ? '#ffd700' : '#333333'}
          transparent={false}
        />
      </lineSegments>
    </group>
  );
}
