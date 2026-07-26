import { create } from 'zustand';

interface ColorStore {
  currentColor: string | null;  // null = 默认白色
  paintMode: boolean;           // true = 涂色模式（点击已有方块上色），false = 放置模式
  setColor: (color: string | null) => void;
  setPaintMode: (mode: boolean) => void;
}

export const useColorStore = create<ColorStore>((set) => ({
  currentColor: null,
  paintMode: false,
  setColor: (color) => set({ currentColor: color }),
  setPaintMode: (mode) => set({ paintMode: mode }),
}));
