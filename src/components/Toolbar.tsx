import { useState, useRef, useEffect } from 'react';
import { useCubeStore } from '../store/cubeStore';
import { useColorStore } from '../store/colorStore';
import { ColorPicker } from './ColorPicker';
import type { PresetType } from '../types';

const PRESETS: PresetType[] = ['1x1x1', '2x2x2', '3x3x3', '4x4x4', '5x5x5'];

function PresetDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const generatePreset = useCubeStore((s) => s.generatePreset);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  return (
    <div className="preset-dropdown" ref={ref}>
      <button className="preset-trigger" onClick={() => setOpen(!open)}>
        预设图形 ▾
      </button>
      {open && (
        <div className="preset-menu">
          {PRESETS.map((p) => (
            <button
              key={p}
              className="preset-item"
              onClick={() => {
                generatePreset(p);
                setOpen(false);
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Toolbar() {
  const clearAll = useCubeStore((s) => s.clearAll);
  const paintMode = useColorStore((s) => s.paintMode);
  const setPaintMode = useColorStore((s) => s.setPaintMode);

  return (
    <div className="toolbar">
      <span className="toolbar-title">3D Cube Editor</span>
      <PresetDropdown />
      <button className="btn-clear" onClick={clearAll}>
        Clear
      </button>
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
