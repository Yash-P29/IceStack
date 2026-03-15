import React from 'react';
import type { BlockShape } from '../game/types';
import { THEMES } from '../game/shapes';
import type { ThemeName } from '../game/shapes';

interface BlockTrayProps {
  availableBlocks: (BlockShape | null)[];
  onDragStart: (block: BlockShape, index: number, e: React.MouseEvent) => void;
  theme: ThemeName;
}

export const BlockTray: React.FC<BlockTrayProps> = ({ availableBlocks, onDragStart, theme }) => {
  return (
    <div className="glass-panel">
      <div className="block-tray">
        {availableBlocks.map((block, index) => (
          <div key={index} className="tray-slot">
            {block && (
              <div 
                className="shape-render"
                onMouseDown={(e) => onDragStart(block, index, e)}
              >
                {block.grid.map((row, rIdx) => (
                  <div key={rIdx} className="shape-row">
                    {row.map((cell, cIdx) => (
                      <div 
                        key={`${rIdx}-${cIdx}`}
                        className={`shape-cell ${!cell ? 'empty' : ''}`}
                        style={{
                           backgroundColor: cell ? THEMES[theme][block.colorIndex] : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
