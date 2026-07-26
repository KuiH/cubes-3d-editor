import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';

// 坐标系定义（右手系）：
//   X轴(+) = 正面 (Three's +Z)  — 红色
//   Y轴(+) = 右面 (Three's +X)  — 绿色
//   Z轴(+) = 顶面 (Three's +Y)  — 蓝色
// 验证：X × Y = Z → +Z × +X = +Y ✓

const AXIS_LENGTH = 4;
const AXIS_RADIUS = 0.06;

const AXES: Array<{
  label: string;
  direction: THREE.Vector3;
  color: string;
}> = [
  { label: '主视图 X', direction: new THREE.Vector3(0, 0, 1), color: '#e94560' },
  { label: '右视图 Y', direction: new THREE.Vector3(1, 0, 0), color: '#00cc44' },
  { label: '俯视图 Z', direction: new THREE.Vector3(0, 1, 0), color: '#4488ff' },
];

/** 单个半透明圆柱体轴杆 */
function AxisRod({ direction, color }: { direction: THREE.Vector3; color: string }) {
  const ref = useRef<THREE.Mesh>(null!);

  useEffect(() => {
    if (!ref.current) return;
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    ref.current.quaternion.copy(quaternion);
    ref.current.position.copy(direction.clone().multiplyScalar(AXIS_LENGTH / 2));
  }, [direction]);

  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[AXIS_RADIUS, AXIS_RADIUS, AXIS_LENGTH, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </mesh>
  );
}

/** 轴末端小球 + 文字标签 */
function AxisTip({ position, color, label }: { position: THREE.Vector3; color: string; label: string }) {
  return (
    <group>
      <mesh position={position}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Html position={position.clone().multiplyScalar(1.15)} center style={{ pointerEvents: 'none' }}>
        <span style={{
          color,
          fontSize: '13px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          textShadow: '0 0 6px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      </Html>
    </group>
  );
}

/** 立体坐标轴（仅显示在主视图） */
export function AxisGizmo() {
  return (
    <group>
      {AXES.map(({ label, direction, color }) => (
        <group key={label}>
          <AxisRod direction={direction} color={color} />
          <AxisTip
            position={direction.clone().multiplyScalar(AXIS_LENGTH)}
            color={color}
            label={label}
          />
        </group>
      ))}
    </group>
  );
}
