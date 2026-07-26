import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';

// 坐标系定义：X+=正面(红), Y+=右面(绿), Z+=顶面(蓝)
const AXIS_LENGTH = 6;
const AXIS_RADIUS = 0.06;
const AXIS_COLORS = {
  x: '#e94560', // 红色 — X轴 = 正面
  y: '#00cc44', // 绿色 — Y轴 = 右面
  z: '#4488ff', // 蓝色 — Z轴 = 顶面
};

/** 单个半透明圆柱体轴杆 */
function AxisRod({ direction, color }: { direction: THREE.Vector3; color: string }) {
  const ref = useRef<THREE.Mesh>(null!);

  useEffect(() => {
    if (!ref.current) return;
    // 圆柱体默认沿 Y 轴，旋转到目标方向
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    ref.current.quaternion.copy(quaternion);
    // 移到半程位置（从原点向外延伸）
    ref.current.position.copy(direction.clone().multiplyScalar(AXIS_LENGTH / 2));
  }, [direction]);

  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[AXIS_RADIUS, AXIS_RADIUS, AXIS_LENGTH, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
}

/** 轴末端小球 */
function AxisTip({ position, color }: { position: THREE.Vector3; color: string }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/** 立体坐标轴（仅显示在主视图） */
export function AxisGizmo() {
  // 使用 drei 的 Html 来渲染标签？不，用 Text sprite 或简单用小球+杆
  // 为了简洁，使用圆柱体 + 末端小球

  const xDir = new THREE.Vector3(1, 0, 0);  // X = 正面
  const yDir = new THREE.Vector3(0, 1, 0);  // Y = 右面
  const zDir = new THREE.Vector3(0, 0, 1);  // Z = 顶面

  return (
    <group>
      {/* X 轴 — 红色 — 正面 */}
      <AxisRod direction={xDir} color={AXIS_COLORS.x} />
      <AxisTip position={xDir.clone().multiplyScalar(AXIS_LENGTH)} color={AXIS_COLORS.x} />

      {/* Y 轴 — 绿色 — 右面 */}
      <AxisRod direction={yDir} color={AXIS_COLORS.y} />
      <AxisTip position={yDir.clone().multiplyScalar(AXIS_LENGTH)} color={AXIS_COLORS.y} />

      {/* Z 轴 — 蓝色 — 顶面 */}
      <AxisRod direction={zDir} color={AXIS_COLORS.z} />
      <AxisTip position={zDir.clone().multiplyScalar(AXIS_LENGTH)} color={AXIS_COLORS.z} />
    </group>
  );
}
