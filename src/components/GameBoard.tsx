import { type FC, useRef, useEffect, useState, useCallback } from 'react';
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
  cellSize: number;
  canvasSize: number;
  clearing: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'shard' | 'pulse' | 'ghost';
  angle?: number;
}

export const GameBoard: FC<GameBoardProps> = ({ grid, draggedBlock, isGameOver, onRestart, mousePos, theme, freezeMode, gridSize, cellSize, canvasSize, clearing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [, forceUpdate] = useState({});
  const GAP = 2;

  const calculateGridPosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !draggedBlock) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const blockRows = draggedBlock.block.grid.length;
    const blockCols = draggedBlock.block.grid[0].length;
    const col = Math.floor((x - ((blockCols * cellSize) / 2)) / (cellSize + GAP));
    const row = Math.floor((y - ((blockRows * cellSize) / 2)) / (cellSize + GAP));

    return { row, col };
  }, [draggedBlock, cellSize, GAP]);

  // Particle System State
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>(null);

  const createParticles = useCallback((row: number, col: number, type: 'shard' | 'pulse' | 'ghost', color: string) => {
    const startX = GAP + col * (cellSize + GAP) + cellSize / 2;
    const startY = GAP + row * (cellSize + GAP) + cellSize / 2;

    if (type === 'shard') {
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particlesRef.current.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 0.5 + Math.random() * 0.5,
          color,
          size: 2 + Math.random() * 4,
          type: 'shard'
        });
      }
    } else if (type === 'pulse') {
      particlesRef.current.push({
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        life: 1,
        maxLife: 1,
        color,
        size: cellSize * 0.5,
        type: 'pulse'
      });
    } else if (type === 'ghost') {
      particlesRef.current.push({
        x: startX,
        y: startY,
        vx: 0,
        vy: -1.5,
        life: 1,
        maxLife: 1.2,
        color,
        size: cellSize,
        type: 'ghost'
      });
    }
  }, [cellSize, GAP]);

  // Handle line clears and trigger particles
  useEffect(() => {
    if (clearing) {
      const { filledRows, filledCols } = getFilledLines(grid, gridSize);
      const types: ('shard' | 'pulse' | 'ghost')[] = ['shard', 'pulse', 'ghost'];
      const selectedType = types[Math.floor(Math.random() * types.length)];

      filledRows.forEach(r => {
        for (let c = 0; c < gridSize; c++) {
          const cell = grid[r][c];
          const color = cell.frozen ? '#00FFFF' : (cell.colorIndex !== undefined ? THEMES[theme][cell.colorIndex] : '#fff');
          createParticles(r, c, selectedType, color);
        }
      });
      filledCols.forEach(c => {
        for (let r = 0; r < gridSize; r++) {
          if (filledRows.has(r)) continue; // Don't repeat for intersections
          const cell = grid[r][c];
          const color = cell.frozen ? '#00FFFF' : (cell.colorIndex !== undefined ? THEMES[theme][cell.colorIndex] : '#fff');
          createParticles(r, c, selectedType, color);
        }
      });
    }
  }, [clearing, grid, gridSize, theme, createParticles]);

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
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Clear board
    ctx.clearRect(0, 0, canvasSize, canvasSize);

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
        const x = GAP + c * (cellSize + GAP);
        const y = GAP + r * (cellSize + GAP);

        const cell = grid[r][c];

        if (cell.filled) {
          ctx.fillStyle = cell.frozen ? '#00FFFF' : (cell.colorIndex !== undefined ? THEMES[theme][cell.colorIndex] : '#fff');
          drawRoundedRect(x, y, cellSize, cellSize, 6);
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
          drawRoundedRect(x, y, cellSize, cellSize, 6);
          ctx.fill();
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Draw line-clear highlight when NOT in freeze mode
    if (!freezeMode && clearing) {
      const { filledRows, filledCols } = getFilledLines(grid, gridSize);
      if (filledRows.size > 0 || filledCols.size > 0) {
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            if (filledRows.has(r) || filledCols.has(c)) {
              const x = GAP + c * (cellSize + GAP);
              const y = GAP + r * (cellSize + GAP);
              // Bright glowing overlay during clearing
              ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
              drawRoundedRect(x, y, cellSize, cellSize, 6);
              ctx.fill();
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

      let previewFilledRows = new Set<number>();
      let previewFilledCols = new Set<number>();
      if (isValid && !freezeMode) {
        const tempGrid = grid.map(row => [...row]);
        for (let r = 0; r < blockRows; r++) {
          for (let c = 0; c < blockCols; c++) {
            if (shape[r][c]) {
              tempGrid[hoverRow + r][hoverCol + c] = { ...tempGrid[hoverRow + r][hoverCol + c], filled: true };
            }
          }
        }
        const result = getFilledLines(tempGrid, gridSize);
        previewFilledRows = result.filledRows;
        previewFilledCols = result.filledCols;

        if (previewFilledRows.size > 0 || previewFilledCols.size > 0) {
          for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
              if (previewFilledRows.has(r) || previewFilledCols.has(c)) {
                const hx = GAP + c * (cellSize + GAP);
                const hy = GAP + r * (cellSize + GAP);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                drawRoundedRect(hx, hy, cellSize, cellSize, 6);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            }
          }
        }
      }

      for (let r = 0; r < blockRows; r++) {
        for (let c = 0; c < blockCols; c++) {
          if (shape[r][c]) {
            const gridR = hoverRow + r;
            const gridC = hoverCol + c;
            const x = GAP + gridC * (cellSize + GAP);
            const y = GAP + gridR * (cellSize + GAP);

            if (gridR >= 0 && gridR < gridSize && gridC >= 0 && gridC < gridSize) {
              const drawColor = THEMES[theme][draggedBlock.block.colorIndex];
              ctx.fillStyle = isValid ? `${drawColor}88` : 'rgba(255, 0, 0, 0.5)';
              drawRoundedRect(x, y, cellSize, cellSize, 6);
              ctx.fill();
              ctx.strokeStyle = isValid ? drawColor : '#ff0000';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        }
      }
    }

    // Particle Rendering (runs on every render)
    if (particlesRef.current.length > 0) {
       particlesRef.current = particlesRef.current.filter(p => p.life > 0);
       particlesRef.current.forEach(p => {
         p.x += p.vx;
         p.y += p.vy;
         p.life -= 0.02;

         const opacity = Math.max(0, p.life / p.maxLife);
         ctx.save();
         ctx.globalAlpha = opacity;

         if (p.type === 'shard') {
           ctx.fillStyle = p.color;
           ctx.beginPath();
           ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
           ctx.fill();
         } else if (p.type === 'pulse') {
           ctx.strokeStyle = p.color;
           ctx.lineWidth = 3;
           ctx.beginPath();
           ctx.arc(p.x, p.y, p.size * (2 - p.life), 0, Math.PI * 2);
           ctx.stroke();
         } else if (p.type === 'ghost') {
           ctx.fillStyle = p.color;
           drawRoundedRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, 6);
           ctx.fill();
         }
         ctx.restore();
       });
    }

    // Use requestAnimationFrame to drive particle physics when particles exist
    if (particlesRef.current.length > 0) {
      requestRef.current = requestAnimationFrame(() => {
         forceUpdate({});
      });
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

  }, [grid, draggedBlock, hoverRow, hoverCol, cellSize, GAP, canvasSize, theme, freezeMode, gridSize, clearing, createParticles]);

  return (
    <div className="board-container glass-panel" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
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
