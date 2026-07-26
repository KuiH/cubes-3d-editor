import * as THREE from 'three';
import { useEffect, useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useCubeStore } from '../store/cubeStore';
import { useColorStore } from '../store/colorStore';

/** 归一化鼠标坐标 */
function getNormalizedMouse(event: MouseEvent, domElement: HTMLCanvasElement): THREE.Vector2 {
  const rect = domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
}

/** 根据命中的面法向量，计算相邻正方体位置 */
function getAdjacentPosition(
  hitPoint: THREE.Vector3,
  faceNormal: THREE.Vector3,
): [number, number, number] {
  // 沿法向量方向偏移半个单位（面的中心）+ 再半个单位（邻接方块中心）
  const center = hitPoint
    .clone()
    .addScaledVector(faceNormal, 0.5);
  return [
    Math.round(center.x),
    Math.round(center.y),
    Math.round(center.z),
  ];
}

/** 网格平面上的 snap（适用于未命中任何方块的空白区域点击） */
function snapToGrid(
  point: THREE.Vector3,
  normal?: THREE.Vector3 | null,
): [number, number, number] {
  if (normal) {
    const center = point.clone().addScaledVector(normal, 0.5);
    return [
      Math.round(center.x),
      Math.round(center.y),
      Math.round(center.z),
    ];
  }
  return [
    Math.round(point.x),
    Math.round(point.y),
    Math.round(point.z + 0.5),
  ];
}

const DRAG_THRESHOLD = 3; // 像素，超过此距离视为拖拽而非点击

/** 射线检测交互：
 *  左键点击方块表面 → 在相邻空位放置新方块（MC风格），若相邻位置被占则选中
 *  左键点击空白网格 → 在网格位置添加
 *  双击方块 → 删除（移动端友好，替代右键）
 *  拖拽旋转/平移时不触发放置（通过比较 mousedown/mouseup 位置区分点击与拖拽）
 */
export function RaycastHandler() {
  const { camera, gl, scene } = useThree();
  const cubes = useCubeStore((s) => s.cubes);
  const addCube = useCubeStore((s) => s.addCube);
  const removeCube = useCubeStore((s) => s.removeCube);
  const selectCube = useCubeStore((s) => s.selectCube);
  const setCubeColor = useCubeStore((s) => s.setCubeColor);
  const currentColor = useColorStore((s) => s.currentColor);
  const paintMode = useColorStore((s) => s.paintMode);

  const getIntersections = useCallback(
    (event: MouseEvent) => {
      const mouse = getNormalizedMouse(event, gl.domElement);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      return raycaster.intersectObjects(scene.children, true);
    },
    [camera, gl, scene],
  );

  // -------- 拖拽 vs 点击 区分 --------
  const mouseDown = useRef(new THREE.Vector2());
  const handleMouseDown = useCallback((event: MouseEvent) => {
    mouseDown.current.set(event.clientX, event.clientY);
  }, []);

  const isDrag = useCallback((event: MouseEvent): boolean => {
    const dx = event.clientX - mouseDown.current.x;
    const dy = event.clientY - mouseDown.current.y;
    return Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD;
  }, []);

  // -------- 单击 vs 双击 区分 --------
  // 单击延迟执行；若短时间内触发双击，则取消单击动作
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performClickAction = useCallback(
    (event: MouseEvent) => {
      const intersects = getIntersections(event);

      // 检测是否命中正方体
      const cubeHit = intersects.find(
        (hit) => hit.object.userData.type === 'cube',
      );

      if (cubeHit && cubeHit.face?.normal) {
        const cubeId = cubeHit.object.userData.cubeId as string;

        if (paintMode) {
          // 涂色模式：点击方块直接上色（不上色则不操作）
          selectCube(cubeId);
          if (currentColor) {
            setCubeColor(cubeId, currentColor);
          }
          return;
        }

        // 放置模式：相邻空位放新方块，相邻已占则选中+上色
        const adjPos = getAdjacentPosition(cubeHit.point, cubeHit.face.normal);
        const adjId = `${adjPos[0]},${adjPos[1]},${adjPos[2]}`;

        if (!cubes.has(adjId)) {
          addCube(adjPos[0], adjPos[1], adjPos[2], currentColor);
          return;
        }
        selectCube(cubeId);
        if (currentColor) {
          setCubeColor(cubeId, currentColor);
        }
        return;
      }

      // 未命中正方体 → 检测网格平面（两种模式均支持地面放置）
      const gridHit = intersects.find(
        (hit) => hit.object.name === 'gridPlane',
      );
      if (gridHit) {
        const newPos = snapToGrid(gridHit.point, gridHit.face?.normal);
        const newId = `${newPos[0]},${newPos[1]},${newPos[2]}`;
        if (!cubes.has(newId)) {
          addCube(newPos[0], newPos[1], newPos[2], currentColor);
        }
      }
    },
    [getIntersections, cubes, addCube, selectCube, setCubeColor, currentColor, paintMode],
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (isDrag(event)) return;

      // 清除上一次未执行的 click（防止连续单击堆积）
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
      }

      // 延迟执行：若 200ms 内触发双击，则取消
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        performClickAction(event);
      }, 200);
    },
    [isDrag, performClickAction],
  );

  const handleDoubleClick = useCallback(
    (event: MouseEvent) => {
      // 取消待执行的单击动作
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
      }

      const intersects = getIntersections(event);
      const cubeHit = intersects.find(
        (hit) => hit.object.userData.type === 'cube',
      );
      if (cubeHit) {
        removeCube(cubeHit.object.userData.cubeId as string);
      }
    },
    [getIntersections, removeCube],
  );

  useEffect(() => {
    const dom = gl.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    dom.addEventListener('click', handleClick);
    dom.addEventListener('dblclick', handleDoubleClick);
    // 阻止桌面端右键菜单（避免误操作）
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
    return () => {
      dom.removeEventListener('mousedown', handleMouseDown);
      dom.removeEventListener('click', handleClick);
      dom.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [gl, handleMouseDown, handleClick, handleDoubleClick]);

  return null;
}
