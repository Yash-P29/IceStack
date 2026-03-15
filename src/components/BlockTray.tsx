import { type FC, type MouseEvent, type TouchEvent } from 'react';
import type { BlockShape } from '../game/types';
import { THEMES } from '../game/shapes';
import type { ThemeName } from '../game/shapes';

interface BlockTrayProps {
  availableBlocks: (BlockShape | null)[];
  onDragStart: (block: BlockShape, index: number, clientX: number, clientY: number) => void;
  theme: ThemeName;
}

export const BlockTray: FC<BlockTrayProps> = ({ availableBlocks, onDragStart, theme }) => {
  const handleMouseDown = (block: BlockShape, index: number, e: MouseEvent) => {
    e.preventDefault();
    onDragStart(block, index, e.clientX, e.clientY);
  };

  const handleTouchStart = (block: BlockShape, index: number, e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    onDragStart(block, index, touch.clientX, touch.clientY);
  };

  return (
    <div className="glass-panel">
      <div className="block-tray">
        {availableBlocks.map((block, index) => (
          <div key={index} className="tray-slot">
            {block && (
              <div 
                className="shape-render"
                onMouseDown={(e) => handleMouseDown(block, index, e)}
                onTouchStart={(e) => handleTouchStart(block, index, e)}
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
