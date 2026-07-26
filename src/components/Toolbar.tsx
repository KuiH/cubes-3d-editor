import { useCubeStore } from '../store/cubeStore';
import { useColorStore } from '../store/colorStore';
import { ColorPicker } from './ColorPicker';
import type { PresetType } from '../types';

export function Toolbar() {
  const generatePreset = useCubeStore((s) => s.generatePreset);
  const clearAll = useCubeStore((s) => s.clearAll);
  const paintMode = useColorStore((s) => s.paintMode);
  const togglePaintMode = useColorStore((s) => s.togglePaintMode);

  const presets: PresetType[] = ['1x1x1', '2x2x2', '3x3x3', '4x4x4', '5x5x5'];

  return (
    <div className="toolbar">
      <span className="toolbar-title">3D Cube Editor</span>
      <span className="toolbar-hint">点击放置 | 双击删除</span>
      <div className="toolbar-buttons">
        {presets.map((p) => (
          <button key={p} onClick={() => generatePreset(p)}>
            {p}
          </button>
        ))}
        <button className="btn-clear" onClick={clearAll}>
          Clear
        </button>
      </div>
      <button
        className={`btn-paint-mode ${paintMode ? 'active' : ''}`}
        onClick={togglePaintMode}
      >
        {paintMode ? '🎨 涂色中' : '🧱 放置'}
      </button>
      <ColorPicker />
    </div>
  );
}
