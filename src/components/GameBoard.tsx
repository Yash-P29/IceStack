import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Grid, BlockShape } from '../game/types';
import { canPlaceBlock, getFilledLines } from '../game/engine';
import { THEMES } from '../game/shapes';
import type { ThemeName } from '../game/shapes';

interface GameBoardProps {
  grid: Grid;
  draggedBlock: { block: BlockShape; index: number } | null;
  isGameOver: boolean;
  onRestart: () => void;
  mousePos: { clientX: number; clientY: number } | null;
  theme: ThemeName;
  freezeMode: boolean;
  gridSize: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ grid, draggedBlock, isGameOver, onRestart, mousePos, theme, freezeMode, gridSize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  const CELL_SIZE = 40;
  const GAP = 2; // Inner gap between cells rendering
  const CANVAS_SIZE = (CELL_SIZE + GAP) * gridSize + GAP;

  const calculateGridPosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !draggedBlock) return null;

    const rect = containerRef.current.getBoundingClientRect();

    // Check if mouse is within canvas bounds
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return null;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const blockRows = draggedBlock.block.grid.length;
    const blockCols = draggedBlock.block.grid[0].length;
    const col = Math.floor((x - ((blockCols * CELL_SIZE) / 2)) / (CELL_SIZE + GAP));
    const row = Math.floor((y - ((blockRows * CELL_SIZE) / 2)) / (CELL_SIZE + GAP));

    return { row, col };
  }, [draggedBlock, CELL_SIZE, GAP]);


  // Update hover state when dragging
  useEffect(() => {
    if (!draggedBlock) {
      setHoverRow(null);
      setHoverCol(null);
      return;
    }
    if (mousePos) {
      const pos = calculateGridPosition(mousePos.clientX, mousePos.clientY);
      if (pos) {
        setHoverRow(pos.row);
        setHoverCol(pos.col);
      } else {
        setHoverRow(null);
        setHoverCol(null);
      }
    }
  }, [draggedBlock, mousePos, calculateGridPosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear board
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // Draw Grid Base
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x = GAP + c * (CELL_SIZE + GAP);
        const y = GAP + r * (CELL_SIZE + GAP);

        const cell = grid[r][c];

        if (cell.filled) {
          ctx.fillStyle = cell.frozen ? '#00FFFF' : (cell.colorIndex !== undefined ? THEMES[theme][cell.colorIndex] : '#fff');
          drawRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 6);
          ctx.fill();

          // Inner shadow / styling
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 2;
          ctx.stroke();

          if (cell.frozen) {
            // Icy overlay drawing
            ctx.fillStyle = 'rgba(0, 255, 255, 0.4)'; // Frost layer
            ctx.fill();
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        } else {
          // Empty cell
          ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
          drawRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 6);
          ctx.fill();
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Draw line-clear highlight when NOT in freeze mode
    if (!freezeMode) {
      const { filledRows, filledCols } = getFilledLines(grid, gridSize);
      if (filledRows.size > 0 || filledCols.size > 0) {
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            if (filledRows.has(r) || filledCols.has(c)) {
              const x = GAP + c * (CELL_SIZE + GAP);
              const y = GAP + r * (CELL_SIZE + GAP);
              // Bright glowing overlay
              ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
              drawRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 6);
              ctx.fill();
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        }
      }
    }

    // Draw Preview Hovering
    if (draggedBlock && hoverRow !== null && hoverCol !== null) {
      const isValid = canPlaceBlock(grid, draggedBlock.block, hoverRow, hoverCol, gridSize);
      const shape = draggedBlock.block.grid;

      const blockRows = shape.length;
      const blockCols = shape[0].length;

      // If valid and NOT freeze mode, simulate placing the block and check which lines would clear
      let previewFilledRows = new Set<number>();
      let previewFilledCols = new Set<number>();
      if (isValid && !freezeMode) {
        // Create a temporary grid copy with the block "placed"
        const tempGrid = grid.map(row => [...row]);
        for (let r = 0; r < blockRows; r++) {
          for (let c = 0; c < blockCols; c++) {
            if (shape[r][c]) {
              tempGrid[hoverRow + r][hoverCol + c] = { ...tempGrid[hoverRow + r][hoverCol + c], filled: true };
            }
          }
        }
        // Check which rows/cols would be completed
        const result = getFilledLines(tempGrid, gridSize);
        previewFilledRows = result.filledRows;
        previewFilledCols = result.filledCols;

        // Draw the line-clear preview highlight on ALL cells in those rows/cols
        if (previewFilledRows.size > 0 || previewFilledCols.size > 0) {
          for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
              if (previewFilledRows.has(r) || previewFilledCols.has(c)) {
                const hx = GAP + c * (CELL_SIZE + GAP);
                const hy = GAP + r * (CELL_SIZE + GAP);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                drawRoundedRect(hx, hy, CELL_SIZE, CELL_SIZE, 6);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            }
          }
        }
      }

      // Draw the block shape preview cells
      for (let r = 0; r < blockRows; r++) {
        for (let c = 0; c < blockCols; c++) {
          if (shape[r][c]) {
            const gridR = hoverRow + r;
            const gridC = hoverCol + c;

            const x = GAP + gridC * (CELL_SIZE + GAP);
            const y = GAP + gridR * (CELL_SIZE + GAP);

            // Only draw if within bounds
            if (gridR >= 0 && gridR < gridSize && gridC >= 0 && gridC < gridSize) {
              const drawColor = THEMES[theme][draggedBlock.block.colorIndex];
              ctx.fillStyle = isValid
                ? `${drawColor}88`
                : 'rgba(255, 0, 0, 0.5)';
              drawRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 6);
              ctx.fill();

              // Stroke
              ctx.strokeStyle = isValid ? drawColor : '#ff0000';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        }
      }
    }

  }, [grid, draggedBlock, hoverRow, hoverCol, CELL_SIZE, GAP, CANVAS_SIZE, theme, freezeMode, gridSize]);

  return (
    <div className="board-container glass-panel" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ display: 'block', pointerEvents: 'none' }} // Let container catch events
      />
      {isGameOver && (
        <div className="game-over-overlay">
          <h2>Game Over</h2>
          <button className="unfreeze-btn" onClick={onRestart}>Play Again</button>
        </div>
      )}
    </div>
  );
};
