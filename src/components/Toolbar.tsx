import { useCubeStore } from '../store/cubeStore';
import { useColorStore } from '../store/colorStore';
import { ColorPicker } from './ColorPicker';
import type { PresetType } from '../types';

export function Toolbar() {
  const generatePreset = useCubeStore((s) => s.generatePreset);
  const clearAll = useCubeStore((s) => s.clearAll);
  const paintMode = useColorStore((s) => s.paintMode);
  const setPaintMode = useColorStore((s) => s.setPaintMode);

  const presets: PresetType[] = ['1x1x1', '2x2x2', '3x3x3', '4x4x4', '5x5x5'];

  return (
    <div className="toolbar">
      <span className="toolbar-title">3D Cube Editor</span>
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
      <div className="mode-buttons">
        <button
          className={`btn-mode ${!paintMode ? 'active' : ''}`}
          onClick={() => setPaintMode(false)}
        >
          放置
        </button>
        <button
          className={`btn-mode ${paintMode ? 'active' : ''}`}
          onClick={() => setPaintMode(true)}
        >
          涂色
        </button>
      </div>
      <ColorPicker />
    </div>
  );
}
