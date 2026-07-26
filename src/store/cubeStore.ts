import { create } from 'zustand';
import { CubeData, PresetType } from '../types';

interface CubeStore {
  cubes: Map<string, CubeData>;
  selectedCubeId: string | null;

  addCube: (x: number, y: number, z: number, color?: string | null) => void;
  removeCube: (cubeId: string) => void;
  setCubeColor: (cubeId: string, color: string | null) => void;
  selectCube: (cubeId: string | null) => void;
  generatePreset: (type: PresetType) => void;
  clearAll: () => void;
}

function cubeId(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

export const useCubeStore = create<CubeStore>((set) => ({
  cubes: new Map(),
  selectedCubeId: null,

  addCube: (x, y, z, color = null) => {
    const id = cubeId(x, y, z);
    set((state) => {
      if (state.cubes.has(id)) return state; // 已存在则忽略
      const next = new Map(state.cubes);
      next.set(id, {
        id,
        position: [x, y, z],
        color,
      });
      return { cubes: next };
    });
  },

  removeCube: (cubeId) => {
    set((state) => {
      const next = new Map(state.cubes);
      next.delete(cubeId);
      return {
        cubes: next,
        selectedCubeId: state.selectedCubeId === cubeId ? null : state.selectedCubeId,
      };
    });
  },

  setCubeColor: (cubeId, color) => {
    set((state) => {
      const cube = state.cubes.get(cubeId);
      if (!cube) return state;
      const next = new Map(state.cubes);
      next.set(cubeId, { ...cube, color });
      return { cubes: next };
    });
  },

  selectCube: (cubeId) => set({ selectedCubeId: cubeId }),

  generatePreset: (type) => {
    const sizeMap: Record<PresetType, number> = {
      '3x3x3': 3,
      '4x4x4': 4,
      '5x5x5': 5,
    };
    const size = sizeMap[type];
    // 所有方块必须在整数坐标上：floor(size/2) 确保奇数和偶数尺寸都产生整数坐标
    // size=3 → start=-1 (positions: -1,0,1) ✓
    // size=4 → start=-2 (positions: -2,-1,0,1) ✓
    // size=5 → start=-2 (positions: -2,-1,0,1,2) ✓
    const start = -Math.floor(size / 2);
    const newCubes = new Map<string, CubeData>();

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const px = start + x;
          const py = start + y;
          const pz = start + z;
          const id = cubeId(px, py, pz);
          newCubes.set(id, {
            id,
            position: [px, py, pz],
            color: null,
          });
        }
      }
    }
    set({ cubes: newCubes });
  },

  clearAll: () => set({ cubes: new Map(), selectedCubeId: null }),
}));
