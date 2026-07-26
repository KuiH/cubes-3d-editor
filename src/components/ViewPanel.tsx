import { useViewStore } from '../store/viewStore';
import type { ViewDirection } from '../types';

const ALL_VIEWS: ViewDirection[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];

const VIEW_LABELS: Record<ViewDirection, string> = {
  front: '正面',
  back: '背面',
  left: '左面',
  right: '右面',
  top: '顶面',
  bottom: '底面',
};

export function ViewPanel() {
  const visibleViews = useViewStore((s) => s.visibleViews);
  const toggleView = useViewStore((s) => s.toggleView);

  return (
    <div className="view-panel">
      {ALL_VIEWS.map((dir) => (
        <label key={dir} className="view-checkbox">
          <input
            type="checkbox"
            checked={visibleViews.has(dir)}
            onChange={() => toggleView(dir)}
          />
          {VIEW_LABELS[dir]}
        </label>
      ))}
    </div>
  );
}
