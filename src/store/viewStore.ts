import { create } from 'zustand';
import { ViewDirection } from '../types';

interface ViewStore {
  visibleViews: Set<ViewDirection>;
  toggleView: (dir: ViewDirection) => void;
}

const DEFAULT_VIEWS = new Set<ViewDirection>(['front', 'top', 'right']);

export const useViewStore = create<ViewStore>((set) => ({
  visibleViews: DEFAULT_VIEWS,

  toggleView: (dir) => {
    set((state) => {
      const next = new Set(state.visibleViews);
      if (next.has(dir)) {
        next.delete(dir);
      } else {
        next.add(dir);
      }
      return { visibleViews: next };
    });
  },
}));
