import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { ViewDirection } from '../types';
import { useCubeStore } from '../store/cubeStore';

/** 各正交视图方向对应的相机初始配置 */
// 相机放在想看到的面的同侧，看向原点：
//   例如要看 +X 面（右面），相机应位于 x>0 侧 → (20,0,0)
const VIEW_CONFIGS: Record<ViewDirection, { pos: THREE.Vector3; up: THREE.Vector3 }> = {
  front:  { pos: new THREE.Vector3(0, 0, 20),  up: new THREE.Vector3(0, 1, 0) },
  back:   { pos: new THREE.Vector3(0, 0, -20), up: new THREE.Vector3(0, 1, 0) },
  right:  { pos: new THREE.Vector3(20, 0, 0),  up: new THREE.Vector3(0, 1, 0) },
  left:   { pos: new THREE.Vector3(-20, 0, 0), up: new THREE.Vector3(0, 1, 0) },
  top:    { pos: new THREE.Vector3(0, 20, 0),  up: new THREE.Vector3(0, 0, -1) },
  bottom: { pos: new THREE.Vector3(0, -20, 0), up: new THREE.Vector3(0, 0, 1) },
};

/** 计算所有正方体的包围盒 */
function computeBoundingBox(cubes: Array<{ position: [number, number, number] }>): THREE.Box3 {
  const bbox = new THREE.Box3();
  if (cubes.length === 0) {
    bbox.setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1));
  } else {
    cubes.forEach(({ position: [x, y, z] }) => {
      bbox.expandByPoint(new THREE.Vector3(x - 0.5, y - 0.5, z - 0.5));
      bbox.expandByPoint(new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
    });
  }
  return bbox;
}

/** 正交视图固定相机控制器 */
export function OrthoCameraController({ direction }: { direction: ViewDirection }) {
  const { camera, size } = useThree();
  const cubes = useCubeStore((s) => s.cubes);

  const config = VIEW_CONFIGS[direction];

  // 设置相机固定位置和朝向（仅 direction 改变时更新）
  useEffect(() => {
    camera.position.copy(config.pos);
    camera.lookAt(0, 0, 0);
    camera.up.copy(config.up);
  }, [camera, config, direction]);

  // 根据包围盒自动调整视锥体大小
  const frustumSize = useMemo(() => {
    const cubeList = Array.from(cubes.values());
    const bbox = computeBoundingBox(cubeList);
    const maxDim = Math.max(
      bbox.max.x - bbox.min.x,
      bbox.max.y - bbox.min.y,
      bbox.max.z - bbox.min.z,
    );
    return Math.max(maxDim * 1.2, 5);
  }, [cubes]);

  // 设置视锥体，根据 Canvas 宽高比修正防止正方体变形
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    const aspect = size.width / size.height;
    if (aspect >= 1) {
      cam.left = -frustumSize * aspect;
      cam.right = frustumSize * aspect;
      cam.top = frustumSize;
      cam.bottom = -frustumSize;
    } else {
      cam.left = -frustumSize;
      cam.right = frustumSize;
      cam.top = frustumSize / aspect;
      cam.bottom = -frustumSize / aspect;
    }
    cam.updateProjectionMatrix();
  }, [camera, frustumSize, size.width, size.height]);

  return null;
}
