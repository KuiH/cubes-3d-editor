# 3D 立方体编辑器 — 技术实现计划（Plan.md）

## 目录

1. [技术栈清单](#1-技术栈清单)
2. [项目目录结构](#2-项目目录结构)
3. [核心数据模型](#3-核心数据模型)
4. [视图管理模块设计](#4-视图管理模块设计)
5. [各模块功能说明与交互流程](#5-各模块功能说明与交互流程)
6. [开发顺序 / 里程碑](#6-开发顺序--里程碑)
7. [风险点与应对方案](#7-风险点与应对方案)

---

## 1. 技术栈清单

| 类别 | 技术选型 | 版本 | 选型理由 |
|------|---------|------|---------|
| 前端框架 | React + TypeScript | React 18.3+, TS 5.5+ | React 的组件模型天然适配"每个视图是一个独立卡片"的需求；R3F（react-three-fiber）是 React 生态下最成熟的三维渲染桥接层，提供声明式场景图、自动资源清理、多 Canvas 支持。TypeScript 保障复杂数据模型（立方体坐标/面颜色/交互事件）的类型安全。 |
| 3D 渲染 | Three.js + react-three-fiber (@react-three/fiber) | Three.js r170+, @react-three/fiber 8.x | Three.js 生态最广、文档最丰富、社区案例最多。R3F 的 `<Canvas>` 组件天然支持同一页面多个独立渲染器，恰好满足"多正交视图 + 一个主透视视图"的需求。Babylon.js 功能强大但 React 集成（react-babylonjs）不官方、更新慢，不适合本项目。 |
| 辅助 3D 工具 | @react-three/drei | 9.x | R3F 官方辅助库，提供 OrbitControls、OrthographicCamera、Html、Box 等开箱即用的组件，减少样板代码。 |
| 状态管理 | Zustand | 5.x | 轻量（<1KB），无 Provider 包裹，天然支持外部订阅（subscribe），可在 R3F 的 `useFrame` 中直接读取最新状态而不触发 React 重渲染——这对 60fps 渲染同步至关重要。 |
| 构建工具 | Vite | 6.x | 启动快、HMR 即时、对 TypeScript 和 React 开箱支持，是当前 React 生态的标准构建工具。 |
| UI 组件 | Radix UI / 原生 CSS | — | 颜色选择器、复选框组、卡片容器使用 Radix 原语 + 手写 CSS；保持 UI 层轻量，不引入重量级组件库。 |
| 颜色选择器 | react-colorful | 5.x | 轻量（<5KB）、支持 hex/hsl、Tree-shakable，嵌入预设色板+自定义取色。 |
| 包管理 | npm | 10.9.4 | 与项目现有环境一致。 |
| 运行环境 | Node.js | v22.22.0 | 与项目现有环境一致。 |

---

## 2. 项目目录结构

```
Cubes/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Plan.md                          # 本文件
├── src/
│   ├── main.tsx                     # 入口，挂载 React 根节点
│   ├── App.tsx                      # 顶层布局：主视图 + 正交视图面板 + UI 控制栏
│   ├── App.css                      # 全局样式 / 视图网格布局
│   │
│   ├── store/                       # Zustand 状态管理
│   │   ├── cubeStore.ts             # 核心数据：所有正方体数据（坐标 + 颜色）
│   │   └── viewStore.ts             # 视图管理：哪些正交视图可见、当前选中的正方体
│   │
│   ├── types/                       # TypeScript 类型定义
│   │   └── index.ts                 # CubeData, ViewDirection 等
│   │
│   ├── components/                  # React UI 组件
│   │   ├── MainView.tsx             # 3D 透视主视图（始终存在，OrbitControls）
│   │   ├── OrthoView.tsx            # 正交视图组件（接收 direction 参数，可复用）
│   │   ├── ViewGrid.tsx             # 正交视图网格布局容器（动态增删视图卡片）
│   │   ├── ViewPanel.tsx            # 正交视图控制面板（复选框组：勾选=显示/取消=关闭）
│   │   ├── ColorPicker.tsx          # 颜色选择器面板（预设色板 + react-colorful 取色器）
│   │   ├── CubePresetButtons.tsx    # 预设结构按钮：3×3×3 / 4×4×4 / 5×5×5
│   │   └── Toolbar.tsx              # 顶部工具栏（整合预设按钮 + 颜色选择器）
│   │
│   ├── three/                       # Three.js / R3F 相关逻辑
│   │   ├── CubeMesh.tsx             # 单个正方体的 3D 渲染（BoxGeometry + 统一颜色材质）
│   │   ├── GridHelper.tsx           # 世界网格辅助线
│   │   ├── Scene.tsx                # 共享 3D 场景内容（所有 CubeMesh + 网格）
│   │   ├── OrthoCameraController.tsx # 正交相机固定视角（自动适配包围盒，不可平移/缩放/旋转）
│   │   ├── RaycastHandler.tsx       # 射线检测逻辑（点击添加/选中正方体/删除）
│   │   └── constants.ts             # 相机默认位置、缩放范围、颜色常量等
│   │
│   └── utils/                       # 纯函数工具
│       ├── cubeOperations.ts        # 正方体增删改查、邻接判断
│       └── raycastUtils.ts          # 射线检测辅助：命中点 → 正方体坐标映射
```

---

## 3. 核心数据模型

### 3.1 TypeScript 类型定义

```typescript
// src/types/index.ts

/** 6 个正交视图方向 */
export type ViewDirection = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

/** 单个正方体的完整数据（每个正方体 6 个面颜色统一） */
export interface CubeData {
  id: string;                         // 唯一标识，使用 `${x},${y},${z}`
  position: [number, number, number]; // 整数坐标 [x, y, z]，单位长度 1，中心对齐
  color: string | null;               // hex 字符串如 "#ff0000"，null = 未上色（默认白色）
}

/** 交互模式 */
export type InteractionMode = 'add' | 'paint' | 'delete';

/** 预设结构类型 */
export type PresetType = '3x3x3' | '4x4x4' | '5x5x5';
```

### 3.2 JSON 数据示例

```json
{
  "cubes": [
    {
      "id": "0,0,0",
      "position": [0, 0, 0],
      "color": "#ff0000"
    },
    {
      "id": "1,0,0",
      "position": [1, 0, 0],
      "color": null
    }
  ]
}
```

### 3.3 坐标约定

- **坐标原点**：世界原点 `(0, 0, 0)`。
- **单位长度**：1 个单位 = 1 个正方体边长。
- **中心点**：正方体位置坐标为其几何中心，例如 `position: [0, 0, 0]` 表示该正方体占据 `x∈[-0.5, 0.5], y∈[-0.5, 0.5], z∈[-0.5, 0.5]` 的空间。

### 3.4 Zustand Store 设计

```typescript
// src/store/cubeStore.ts (伪代码结构)
import { create } from 'zustand';
import { CubeData, PresetType } from '../types';

interface CubeStore {
  // 状态
  cubes: Map<string, CubeData>;          // key = cubeId
  selectedCubeId: string | null;         // 当前选中的正方体 ID（高亮显示）
  interactionMode: InteractionMode;      // 当前交互模式

  // 操作
  addCube: (x: number, y: number, z: number) => void;
  removeCube: (cubeId: string) => void;
  setCubeColor: (cubeId: string, color: string | null) => void;
  selectCube: (cubeId: string | null) => void;
  generatePreset: (type: PresetType) => void;
  clearAll: () => void;
}

// src/store/viewStore.ts
interface ViewStore {
  visibleViews: Set<ViewDirection>;  // 当前可见的正交视图（默认: front, top, right）
  toggleView: (dir: ViewDirection) => void;
}

// src/store/colorStore.ts
interface ColorStore {
  currentColor: string | null;  // null = 默认白色
  setColor: (color: string | null) => void;
}
```

---

## 4. 视图管理模块设计

### 4.1 整体布局

```
┌─────────────────────────────────────────────────────────┐
│  Toolbar: [3×3×3] [4×4×4] [5×5×5] │ 🎨 颜色选择器     │
├──────────────────────────┬──────────────────────────────┤
│                          │  [Top View]      [Front View]│
│      3D Perspective      │  (正交俯视图)     (正交正视图) │
│      (主视图, 不可关闭)    │                              │
│                          │  [Right View]    [Back View] │
│    支持旋转/缩放/平移      │   ...更多视图卡片...          │
│                          │                              │
├──────────────────────────┴──────────────────────────────┤
│  ☑ Front  ☑ Top  ☑ Right  ☐ Back  ☐ Left  ☐ Bottom  │
└─────────────────────────────────────────────────────────┘
```

- **左侧**：3D 透视主视图，始终存在。
- **右侧**：正交视图卡片网格，动态增删。
- **底部**：视图控制面板，6 个复选框。

### 4.2 视图组件结构

```
<App>
  <Toolbar />                          # 顶部工具栏
  <div className="main-layout">
    <MainView />                       # 3D 透视图 (1 个 R3F Canvas)
    <div className="ortho-grid">
      {visibleViews.map(dir => (
        <ViewCard key={dir} title={dir}>
          <OrthoView direction={dir} /> # 正交视图 (每个 1 个 R3F Canvas)
        </ViewCard>
      ))}
    </div>
  </div>
  <ViewPanel />                        # 底部复选框控制面板
</App>
```

### 4.3 关键技术：多 Canvas 共享数据

每个视图（包括主视图 + N 个正交视图）都拥有自己独立的 `<Canvas>`（即独立的 `WebGLRenderer`），但它们都通过 `useStore` 读取同一个 Zustand cubeStore：

```typescript
// 每个 Canvas 内部都渲染相同的场景内容
// src/three/Scene.tsx
function Scene() {
  const cubes = useCubeStore(state => state.cubes);
  // Map → Array 用于渲染
  const cubeList = Array.from(cubes.values());

  return (
    <group>
      <GridHelper />                          {/* 世界网格线 */}
      {cubeList.map(cube => (
        <CubeMesh key={cube.id} data={cube} />
      ))}
    </group>
  );
}
```

**数据同步方式**：Zustand 的 `useStore` 在 R3F 的 Canvas 内部同样工作（R3F 的 reconciler 与 React DOM 不同，但 Zustand 是基于 vanilla JS 的订阅机制，不受 reconciler 限制），因此任一 Canvas 中对场景的修改都会自动、即时同步到所有 Canvas。

### 4.4 正交视图——固定视角（不可平移/缩放/旋转）

每个正交视图是**完全静态**的：相机位置固定、缩放固定、不可旋转、不可平移。6 个视图以正方体的"前"面（-Z 方向）为基准定义：

| 视图方向 | 含义 | 相机位置 | LookAt |
|---------|------|---------|--------|
| Front | 看向 -Z（正面） | (0, 0, +dist) | (0, 0, 0) |
| Back | 看向 +Z（背面） | (0, 0, -dist) | (0, 0, 0) |
| Right | 看向 +X（右面） | (-dist, 0, 0) | (0, 0, 0) |
| Left | 看向 -X（左面） | (+dist, 0, 0) | (0, 0, 0) |
| Top | 看向 +Y（顶面） | (0, -dist, 0) | (0, 0, 0) |
| Bottom | 看向 -Y（底面） | (0, +dist, 0) | (0, 0, 0) |

- `dist`：足够大的固定距离（如 20 个单位），确保场景中所有正方体都在视锥体内。
- 正交视锥体大小（`frustumSize`）根据当前场景中正方体的包围盒自动计算，保证所有正方体完整可见且居中。
- **用户不可平移、缩放、旋转正交视图**——这些视图仅用于从 6 个标准方向观察上色结果。
- 正交视图中的**点击交互仍然有效**（用于添加/选中/删除正方体），但不会改变相机状态。

```typescript
// src/three/OrthoCameraController.tsx (伪代码)
function OrthoCameraController({ direction }: { direction: ViewDirection }) {
  const { camera } = useThree();
  const cubes = useCubeStore(s => s.cubes);

  // 根据 direction 设置相机固定位置和朝向（仅执行一次）
  useEffect(() => {
    const { pos, up } = getCameraConfig(direction);
    camera.position.copy(pos);
    camera.lookAt(0, 0, 0);
    camera.up.copy(up);
  }, [direction]);

  // 根据场景包围盒自动调整 frustumSize，确保所有正方体可见
  const frustumSize = useMemo(() => {
    const bbox = computeBoundingBox(Array.from(cubes.values()));
    return Math.max(bbox.maxSize * 1.2, 5); // 最小 5 个单位，留 20% 边距
  }, [cubes]);

  useEffect(() => {
    camera.left = -frustumSize;
    camera.right = frustumSize;
    camera.top = frustumSize;
    camera.bottom = -frustumSize;
    camera.updateProjectionMatrix();
  }, [frustumSize]);

  return null; // 无交互，纯相机控制
}
```

---

## 5. 各模块功能说明与交互流程

### 5.1 模块总览

```
┌──────────────────────────────────────────────────────────────────┐
│                        cubeStore (Zustand)                        │
│  核心数据：Map<cubeId, CubeData> │ selectedCubeId │ interactionMode │
└──────┬───────────────┬───────────────┬───────────────────────────┘
       │ subscribe     │ subscribe     │ subscribe
       ▼               ▼               ▼
┌──────────────┐ ┌────────────┐ ┌──────────────┐
│  MainView    │ │ OrthoView  │ │ OrthoView... │  (每个独立 R3F Canvas)
│  (Persp Cam) │ │ (Ortho Cam)│ │ (Ortho Cam)  │
│  CubeMesh[]  │ │ CubeMesh[] │ │ CubeMesh[]   │
│  Raycast     │ │ Raycast    │ │ Raycast      │
└──────┬───────┘ └─────┬──────┘ └──────┬───────┘
       │               │              │
       │  onClick      │  onClick     │  onClick
       └───────────────┴──────────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │   InteractionLogic  │
            │   - 空白 → add      │
            │   - cube → select   │
            │   - 双击 → delete   │
            └─────────────────────┘
```

### 5.2 核心模块

#### 5.2.1 `CubeMesh` — 单个正方体的 3D 渲染

每个正方体使用 `BoxGeometry` + 单一 `MeshStandardMaterial`。未上色时显示白色，已上色时显示对应颜色。

```typescript
// src/three/CubeMesh.tsx (伪代码)
function CubeMesh({ data }: { data: CubeData }) {
  const [x, y, z] = data.position;
  const selectedCubeId = useCubeStore(s => s.selectedCubeId);
  const isSelected = selectedCubeId === data.id;

  return (
    <mesh
      position={[x, y, z]}
      userData={{ cubeId: data.id, type: 'cube' }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={data.color ?? '#ffffff'}   // 未上色默认白色
        transparent={data.color === null}
        opacity={data.color === null ? 0.6 : 1}
      />
      {/* 选中高亮边框 */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new BoxGeometry(1, 1, 1)]} />
          <lineBasicMaterial color="#ffd700" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
}
```

> **对比原方案（面级上色）**：原方案需要 6 个 Plane 分别渲染、维护 `face → color` 映射、处理面方向歧义。改为整体上色后，直接用 `BoxGeometry`，代码量减少约 60%，且 draw call 降低为 1/6。

#### 5.2.2 `RaycastHandler` — 统一交互逻辑

所有视图（主视图 + 正交视图）的点击交互都经过此模块处理：

```typescript
// src/three/RaycastHandler.tsx (伪代码)
// 放置在每个 Canvas 内部

function RaycastHandler() {
  const { camera, gl, scene } = useThree();
  const { addCube, removeCube, selectCube, setCubeColor } = useCubeStore();
  const currentColor = useColorStore(s => s.currentColor);

  useEffect(() => {
    gl.domElement.addEventListener('mousedown', handleMouseDown);  // 记录起始位置
    gl.domElement.addEventListener('click', handleClick);
    gl.domElement.addEventListener('dblclick', handleDoubleClick);  // 双击删除
    return () => { /* cleanup */ };
  }, []);

  function handleClick(event: MouseEvent) {
    // 拖拽旋转/平移 → 忽略（mousedown 到 mouseup 移动距离 > 3px）
    if (isDrag(event)) return;

    // 命中检测：优先检测正方体
    //   命中正方体面 → 相邻空位放新方块(MC风格)；若相邻已占则选中
    //   未命中正方体 → 检测网格地面，添加新方块
    ...
  }

  function handleDoubleClick(event: MouseEvent) {
    // 双击已放置正方体 → 删除
    const hit = getCubeHit(event);
    if (hit) removeCube(hit.cubeId);
  }
}
```

#### 5.2.3 正交视图中的射线检测——坐标映射

正交投影的射线是平行的（恒定方向），"点击空白 → 推断添加位置"的逻辑需要特殊处理：

```typescript
function snapToGridForOrtho(
  intersectPoint: Vector3,       // 射线与网格平面的交点
  viewDirection: ViewDirection,  // 当前正交视图的方向
  existingCubes: CubeData[]
): [number, number, number] {
  const viewDir = getViewDirectionVector(viewDirection); // 单位向量
  const snapped = new Vector3(
    Math.round(intersectPoint.x),
    Math.round(intersectPoint.y),
    Math.round(intersectPoint.z)
  );
  // 从 snap 位置沿 -viewDir 搜索最近空位
  let pos = snapped.clone();
  while (isOccupied(pos, existingCubes)) {
    pos.addScaledVector(viewDir.clone().multiplyScalar(-1), 1);
  }
  return [pos.x, pos.y, pos.z];
}
```

### 5.3 交互流程图

```
用户左键点击某个视图中的 Canvas
         │
         ▼
  ┌── 标准化鼠标坐标 (NDC)
  │
  ▼
  ┌── Raycaster.setFromCamera(mouse, camera)  (自动处理透视/正交)
  │
  ▼
  ┌── raycaster.intersectObjects(scene)
  │
  ├── 命中 cube? ────────────────────────────┐
  │                                         │
  │    └── selectCube(cubeId)               │
  │         └── 若有当前选中颜色             │
  │              └── setCubeColor(cubeId, color)│
  │                                         │
  ├── 未命中 cube，命中 gridPlane? ──────────┐
  │                                         │
  │    └── snapToGrid(point, normal)        │
  │         └── addCube(x, y, z)            │
  │                                         │
  └─────────────────────────────────────────┘
         │
         ▼
  ┌── cubeStore 状态更新 ──→ 所有订阅视图自动重渲染
```

```
用户双击
         │
         ▼
  ┌── Raycaster.setFromCamera(mouse, camera)
  │
  ▼
  ┌── 命中 cube?
  │    ├── 是 → removeCube(cubeId)
  │    └── 否 → 无操作
```

```
用户选择预设结构 (例如 3×3×3)
         │
         ▼
  ┌── generatePreset('3x3x3')
  │
  ▼
  ┌── 生成 27 个 CubeData:
  │   for x in [-1, 0, 1], y in [-1, 0, 1], z in [-1, 0, 1]
  │     addCube(x, y, z)  (color: null，默认白色)
  │
  ▼
  ┌── 所有视图自动更新 (Zustand 广播)
```

---

## 6. 开发顺序 / 里程碑

### ✅ 里程碑 1：项目骨架 + 基础 3D 渲染（已完成）

**目标**：能在浏览器中看到一个 3D 场景，有网格线，能放置/删除正方体。

| 步骤 | 任务 | 验证标准 | 状态 |
|------|------|---------|------|
| 1.1 | Vite + React + TypeScript 项目初始化，安装依赖 | `npm run dev` 正常启动 | ✅ |
| 1.2 | 搭建 `cubeStore` (Zustand)，实现 `addCube`/`removeCube` | 类型安全、操作正确 | ✅ |
| 1.3 | 实现 `CubeMesh` 组件（BoxGeometry + 实心白色 + 深灰边框） | 渲染正常、邻接方块边界清晰 | ✅ |
| 1.4 | 实现 `MainView`（R3F Canvas + PerspectiveCamera + OrbitControls + Grid） | 能看到网格和正方体、可旋转/缩放/平移 | ✅ |
| 1.5 | 基础点击交互 + MC 风格相邻放置 | 点击方块表面→相邻空位放新方块；点地面→地面放置 | ✅ |
| 1.6 | 双击删除 + 单击/双击区分（150ms 延时） | 双击删除、单击放置互不干扰 | ✅ |
| 1.7 | 正交视图系统（固定视角、自动包围盒、正方形卡片） | 默认 3 视图可动态增删 | ✅ |
| 1.8 | 预设结构（3×3×3, 4×4×4, 5×5×5）+ 偶数尺寸坐标修正 | 一键生成，整数坐标无错位 | ✅ |
| 1.9 | 移动端适配（响应式布局 + 双击替代右键） | 手机端可用 | ✅ |

**实际产出超出原始计划**：MC 风格相邻放置、拖拽/点击区分、单击双击区分、4×4×4 坐标修正、移动端适配均在一次迭代中完成。

### ✅ 里程碑 2：上色 + 颜色选择器（已完成）

**目标**：正方体可整体上色，颜色选择器可用。

| 步骤 | 任务 | 验证标准 | 状态 |
|------|------|---------|------|
| 2.1 | `CubeMesh` 支持 `color` 属性渲染 | 正方体以指定颜色显示 | ✅ |
| 2.2 | `RaycastHandler`：点击正方体 → 选中 → 上色 | 选色后点击正方体变色 | ✅ |
| 2.3 | `ColorPicker` 组件（预设色板 25 色 + react-colorful 取色器） | 选色后点击正方体即可上色 | ✅ |
| 2.4 | 新放置的方块自动使用当前选中颜色 | 选色后放置的方块带颜色 | ✅ |
| 2.5 | 移动端适配（更大色块触摸目标、面板自适应位置） | 手机端可用 | ✅ |

### 里程碑 3：正交视图系统（2-3 天）— 部分完成

> **已完成**：3.1 OrthoView + 固定视角 + 自动包围盒；3.2 viewStore + ViewPanel；3.3 正方形卡片布局 + 响应式

**剩余工作**：

| 步骤 | 任务 | 验证标准 |
|------|------|---------|
| 3.4 | 正交视图中的射线检测优化（`snapToGridForOrtho`） | 点击正交视图也能正确添加正方体 |
| 3.5 | 验证：在任一视图中的编辑操作，其他所有视图实时同步 | 全视图同步无延迟 |

### 里程碑 4：预设结构 + 双击删除（0.5-1 天）— 部分完成

> **已完成**：4.1 generatePreset（含偶数尺寸坐标修正）；4.2 双击删除 + 单击/双击区分

**剩余工作**：

| 步骤 | 任务 | 验证标准 |
|------|------|---------|
| 4.3 | 交互模式切换 UI（添加/删除/上色模式） | 可选功能 |

### 里程碑 5：打磨与优化（1-2 天）

**目标**：性能优化、边界情况处理、用户体验完善。

| 步骤 | 任务 | 验证标准 |
|------|------|---------|
| 5.1 | 多 Canvas 性能优化（React.memo、仅在可视范围内的 CubeMesh 渲染） | 200+ 正方体时保持 30fps |
| 5.2 | 选中高亮效果（金色边框） | visual 验证 |
| 5.3 | CSS 样式微调（视图卡片尺寸自适应、滚动条处理） | 界面美观可用 |
| 5.4 | 边界测试（大量正方体、快速切换视图、连续点击等） | 无 crash、状态一致 |

---

## 7. 风险点与应对方案

### 7.1 多视图同步性能

**风险**：每个 Canvas 独立渲染完整的场景图。如果有 1 个主视图 + 6 个正交视图 = 7 个 WebGL 渲染器同时运行，每个都遍历所有 CubeMesh。5×5×5 = 125 个正方体 = 125 个 BoxGeometry mesh（改为整体上色后 draw call 降低为原来的 1/6），GPU 压力显著减轻但仍需关注。

**应对**：
- **分级策略**：默认 3 个正交视图（front/top/right），用户额外添加。7 个视图同时显示是上限场景。
- **渲染节流**：正交视图（非交互态）可以用较低的渲染频率（`frameloop="demand"`，仅在数据变更时重渲染）。
- **InstancedMesh 优化**：如果正方体数量很大（500+），将同色正方体合并为 InstancedMesh，可进一步降低 draw call。
- **可见性剔除**：超大场景（1000+ 正方体）时，对每个正交视图做视锥体剔除，只渲染视野内的正方体。

### 7.2 正交视图中的射线检测坐标映射

**风险**：正交投影的射线是平行的，不同于透视投影的发散射线。`raycaster.setFromCamera` 可以正确处理，但 "点击空白网格面 → 推断添加位置" 的逻辑比透视视图复杂——需要沿视线方向搜索最接近当前表面的空网格。

**应对**：
- 每个正交视图在场景中放置一个不可见的 `Plane`（与相机方向垂直，位于已有的正方体群的中心深度处）作为 "网格检测平面"。
- 点击时先检测此 Plane 的交点，再沿视线方向 snap 和搜索空位（见 5.2.3 的 `snapToGridForOrtho` 算法）。
- 为每个正交视图的 `snapToGridForOrtho` 编写单元测试，覆盖已知场景。

### 7.3 Canvas 间的 DOM 事件隔离

**风险**：多个 `<Canvas>` 同时存在于页面上，鼠标事件可能冒泡或冲突。例如拖拽旋转主视图时，鼠标移动到正交视图上方后松开。

**应对**：
- 每个 Canvas 的 `gl.domElement` 是独立的 DOM 元素，事件自动隔离。
- OrbitControls 限制在主视图的 Canvas DOM 上（通过 `args={[gl.domElement]}` 绑定）。
- 正交视图中注册的 `click`/`dblclick` 事件使用 `useEffect` 绑定到各自 Canvas 的 DOM 元素，使用 cleanup 函数避免泄漏。

### 7.4 预设结构生成时的性能尖峰

**风险**：生成 5×5×5 = 125 个正方体，对多个 Canvas 瞬间同时渲染可能造成浏览器短暂卡顿。

**应对**：
- 预设生成使用批量更新（`cubeStore.setState` 一次性替换整个 Map，而非 125 次 setState）。
- 考虑在生成大批量正方体时显示 "加载中" 遮罩或使用 `startTransition` 降低优先级。
- 初期 MVP 阶段此风险较低（125 个正方体在现代硬件上不成问题），可在里程碑 5 做性能验证后再决定是否需要虚拟化。

---

## 8. 移动端适配

### 8.1 交互适配

| 桌面端 | 移动端 | 说明 |
|--------|--------|------|
| 左键点击 | 触摸轻点 | 浏览器自动映射 `touchstart` → `click`，无需额外处理 |
| 双击 | 双击 | 浏览器自动映射两次快速触摸 → `dblclick` |
| ~~右键~~ | — | 废弃，统一使用双击删除 |

**关键变更**：删除操作从右键改为双击（`dblclick`），确保桌面端和移动端操作完全一致。

### 8.2 布局适配

- **桌面端**（>768px）：主视图（左）+ 正交视图网格（右）并排显示
- **移动端**（≤768px）：主视图（上 50%）+ 正交视图（下 50%）上下堆叠
- 正交视图卡片尺寸自适应：桌面 `min(280px, calc(50%-2px))` → 手机 `min(140px, calc(50%-2px))`
- 工具栏按钮和复选框字体/间距缩小

### 8.3 触摸拖拽区分

通过 `mousedown` 记录起始位置 + `mouseup` 比较移动距离（阈值 3px）区分"拖拽旋转"与"点击放置"。移动端触摸事件经浏览器映射为 mouse 事件，同一套逻辑自动生效，无需额外 touch 事件处理。

### 8.4 单击与双击冲突

双击时浏览器事件顺序为 `click → click → dblclick`，若不对 click 做特殊处理，会先执行两次放置再执行删除。解决方案：

- `handleClick` 不立即执行，而是通过 `setTimeout` 延迟 250ms
- `handleDoubleClick` 触发时，先 `clearTimeout` 取消待执行的单击动作，再执行删除
- 连续两次单击（间隔 > 250ms）时，第一次单击的延迟任务已执行，第二次正常排队，不会丢失

---

## 附录：关键依赖 `package.json`

```json
{
  "name": "cubes-3d-editor",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.114.0",
    "three": "^0.170.0",
    "zustand": "^5.0.0",
    "react-colorful": "^5.6.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.170.0",
    "typescript": "^5.5.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.0"
  }
}
```

