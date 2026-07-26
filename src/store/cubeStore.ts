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

const SIZE_MAP: Record<PresetType, number> = {
  '1x1x1': 1,
  '2x2x2': 2,
  '3x3x3': 3,
  '4x4x4': 4,
  '5x5x5': 5,
};

function buildPreset(type: PresetType): Map<string, CubeData> {
  const size = SIZE_MAP[type];
  const start = -Math.floor(size / 2);
  const result = new Map<string, CubeData>();

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const px = start + x;
        const py = start + y;
        const pz = start + z;
        const id = cubeId(px, py, pz);
        result.set(id, { id, position: [px, py, pz], color: null });
      }
    }
  }
  return result;
}

// 默认初始化 3×3×3
const defaultCubes = buildPreset('3x3x3');

export const useCubeStore = create<CubeStore>((set) => ({
  cubes: defaultCubes,
  selectedCubeId: null,

  addCube: (x, y, z, color = null) => {
    const id = cubeId(x, y, z);
    set((state) => {
      if (state.cubes.has(id)) return state;
      const next = new Map(state.cubes);
      next.set(id, { id, position: [x, y, z], color });
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

  generatePreset: (type) => set({ cubes: buildPreset(type) }),

  clearAll: () => set({ cubes: new Map(), selectedCubeId: null }),
}));
