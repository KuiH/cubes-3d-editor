import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useColorStore } from '../store/colorStore';

// 预设色板
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

  return (
    <div className="color-picker">
      {/* 触发器：当前颜色指示器 */}
      <button
        className="color-trigger"
        onClick={() => setOpen(!open)}
        title="选择颜色"
      >
        <span
          className="color-swatch"
          style={{ background: currentColor ?? '#f5f5f5' }}
        />
        <span className="color-label">
          {currentColor ?? '默认'}
        </span>
      </button>

      {/* 弹出面板 */}
      {open && (
        <div className="color-panel">
          {/* 预设色板 */}
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

          {/* 自定义取色器 */}
          <div className="color-custom">
            <HexColorPicker
              color={currentColor ?? '#f5f5f5'}
              onChange={setColor}
            />
          </div>

          {/* 清除颜色（回到默认白色） */}
          <button
            className="color-clear-btn"
            onClick={() => setColor(null)}
          >
            重置为默认白色
          </button>
        </div>
      )}
    </div>
  );
}
