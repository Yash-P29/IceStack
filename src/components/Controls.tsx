import { type FC } from 'react';

interface ControlsProps {
  freezeMode: boolean;
  onToggleFreeze: () => void;
  onUnfreeze: () => void;
}

export const Controls: FC<ControlsProps> = ({ freezeMode, onToggleFreeze, onUnfreeze }) => {
  return (
    <div className="glass-panel main-column">
      <div className="controls-panel">
        <label className="toggle-row">
          <span className="toggle-label">
            ❄️ Freeze Mode
          </span>
          <div className="switch" id="freeze-mode-toggle">
            <input type="checkbox" checked={freezeMode} onChange={onToggleFreeze} />
            <span className="slider"></span>
          </div>
        </label>

        <button 
          id="unfreeze-btn"
          className="unfreeze-btn" 
          onClick={onUnfreeze}
          disabled={!freezeMode}
        >
          Unfreeze & Combo
        </button>
      </div>
    </div>
  );
};
