import { create } from 'zustand';

interface ColorStore {
  currentColor: string | null;  // null = 无选中颜色（默认白色）
  setColor: (color: string | null) => void;
}

export const useColorStore = create<ColorStore>((set) => ({
  currentColor: null,
  setColor: (color) => set({ currentColor: color }),
}));
