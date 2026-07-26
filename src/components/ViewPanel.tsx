import { useViewStore } from '../store/viewStore';
import type { ViewDirection } from '../types';

const ALL_VIEWS: ViewDirection[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];

const VIEW_LABELS: Record<ViewDirection, string> = {
  front: '主视图',
  back: '后视图',
  left: '左视图',
  right: '右视图',
  top: '俯视图',
  bottom: '仰视图',
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
