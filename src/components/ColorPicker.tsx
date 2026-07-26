import { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useColorStore } from '../store/colorStore';

const PRESET_COLORS = [
  '#ffffff', '#f5f5f5', '#cccccc', '#999999', '#666666', '#333333', '#000000',
  '#ff0000', '#ff4444', '#ff8800', '#ffbb33', '#ffff00', '#88cc00', '#00cc44',
  '#00dddd', '#0088ff', '#0044ff', '#8800ff', '#cc00ff', '#ff00aa',
  '#8B4513', '#D2691E', '#CD853F', '#F4A460', '#FFDAB9',
];

export function ColorPicker() {
  const [open, setOpen] = useState(false);
  const currentColor = useColorStore((s) => s.currentColor);
  const setColor = useColorStore((s) => s.setColor);
  const panelRef = useRef<HTMLDivElement>(null);

  // 点击面板外部自动关闭
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // 延迟绑定，避免触发按钮的 click 事件立即关闭
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  return (
    <div className="color-picker" ref={panelRef}>
      <button
        className="color-trigger"
        onClick={() => setOpen(!open)}
      >
        <span
          className="color-swatch"
          style={{ background: currentColor ?? '#f5f5f5' }}
        />
        调色盘
      </button>

      {open && (
        <div className="color-panel">
          <div className="color-presets">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch-btn ${currentColor === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>

          <div className="color-custom">
            <HexColorPicker
              color={currentColor ?? '#f5f5f5'}
              onChange={setColor}
            />
          </div>

          <button
            className="color-clear-btn"
            onClick={() => setColor(null)}
          >
            默认
          </button>
        </div>
      )}
    </div>
  );
}
