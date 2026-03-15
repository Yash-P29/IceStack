import type { BlockShape, Grid } from './types';

// Constants
export const GRID_SIZE = 10; // default, but functions accept dynamic size
export const COMBO_MULTIPLIER = 1.5;
export const POINTS_PER_BLOCK = 10;
export const POINTS_PER_LINE = 100;

export const createEmptyGrid = (size: number = GRID_SIZE): Grid => {
  return Array(size).fill(null).map(() => 
    Array(size).fill(null).map(() => ({ filled: false, frozen: false }))
  );
};

export const canPlaceBlock = (grid: Grid, block: BlockShape, startRow: number, startCol: number, gridSize: number = GRID_SIZE): boolean => {
  const shapeStr = block.grid;
  const blockRows = shapeStr.length;
  const blockCols = shapeStr[0].length;

  // Check bounds
  if (startRow < 0 || startRow + blockRows > gridSize || startCol < 0 || startCol + blockCols > gridSize) {
    return false;
  }

  // Check overlapping
  for (let r = 0; r < blockRows; r++) {
    for (let c = 0; c < blockCols; c++) {
      if (shapeStr[r][c] && (grid[startRow + r][startCol + c].filled || grid[startRow + r][startCol + c].frozen)) {
        return false;
      }
    }
  }

  return true;
};

export const checkGameOver = (grid: Grid, availableBlocks: (BlockShape | null)[], gridSize: number = GRID_SIZE): boolean => {
  const activeBlocks = availableBlocks.filter((b): b is BlockShape => b !== null);
  if (activeBlocks.length === 0) return false;

  for (const block of activeBlocks) {
    for (let r = 0; r <= gridSize - block.grid.length; r++) {
      for (let c = 0; c <= gridSize - block.grid[0].length; c++) {
        if (canPlaceBlock(grid, block, r, c, gridSize)) {
          return false;
        }
      }
    }
  }
  
  return true; // No blocks can be placed natively
};

export const evaluateGrid = (grid: Grid, freezeMode: boolean, gridSize: number = GRID_SIZE): { updatedGrid: Grid, linesCleared: number, points: number } => {
  const newGrid = grid.map(row => [...row].map(cell => ({...cell})));
  let points = 0;
  
  const filledRows = [];
  const filledCols = [];

  for (let r = 0; r < gridSize; r++) {
    if (newGrid[r].every(cell => cell.filled || cell.frozen)) {
      filledRows.push(r);
    }
  }

  for (let c = 0; c < gridSize; c++) {
    let colFilled = true;
    for (let r = 0; r < gridSize; r++) {
      if (!newGrid[r][c].filled && !newGrid[r][c].frozen) {
        colFilled = false;
        break;
      }
    }
    if (colFilled) filledCols.push(c);
  }

  const linesCleared = filledRows.length + filledCols.length;

  if (linesCleared > 0) {
    if (freezeMode) {
      // Turn filled lines to frozen instead of clearing them
      filledRows.forEach(r => {
        newGrid[r] = newGrid[r].map(() => ({ filled: true, frozen: true, colorIndex: 0 })); // Icy cyan handled by GameBoard
      });
      filledCols.forEach(c => {
         for (let r = 0; r < gridSize; r++) {
           newGrid[r][c] = { filled: true, frozen: true, colorIndex: 0 };
         }
      });
      // Minimal points in freeze mode, points come from unfreezing
      points += linesCleared * 10;
    } else {
      // Clear lines and add big points right away
      filledRows.forEach(r => {
        newGrid[r] = newGrid[r].map(() => ({ filled: false, frozen: false }));
      });
      filledCols.forEach(c => {
         for (let r = 0; r < gridSize; r++) {
           newGrid[r][c] = { filled: false, frozen: false };
         }
      });
      
      points += linesCleared * POINTS_PER_LINE * (linesCleared > 1 ? COMBO_MULTIPLIER : 1);
    }
  }

  return { updatedGrid: newGrid, linesCleared, points: Math.floor(points) };
};

export const placeBlock = (grid: Grid, block: BlockShape, startRow: number, startCol: number, gridSize: number = GRID_SIZE): { success: boolean, newGrid: Grid } => {
  if (!canPlaceBlock(grid, block, startRow, startCol, gridSize)) return { success: false, newGrid: grid };

  const newGrid = grid.map(row => [...row].map(cell => ({...cell})));
  const blockRows = block.grid.length;
  const blockCols = block.grid[0].length;

  for (let r = 0; r < blockRows; r++) {
    for (let c = 0; c < blockCols; c++) {
      if (block.grid[r][c]) {
        newGrid[startRow + r][startCol + c] = { filled: true, frozen: false, colorIndex: block.colorIndex };
      }
    }
  }

  return { success: true, newGrid };
};

// Returns sets of row and column indices that are completely filled
export const getFilledLines = (grid: Grid, gridSize: number = GRID_SIZE): { filledRows: Set<number>; filledCols: Set<number> } => {
  const filledRows = new Set<number>();
  const filledCols = new Set<number>();

  for (let r = 0; r < gridSize; r++) {
    if (grid[r].every(cell => cell.filled || cell.frozen)) {
      filledRows.add(r);
    }
  }

  for (let c = 0; c < gridSize; c++) {
    let colFilled = true;
    for (let r = 0; r < gridSize; r++) {
      if (!grid[r][c].filled && !grid[r][c].frozen) {
        colFilled = false;
        break;
      }
    }
    if (colFilled) filledCols.add(c);
  }

  return { filledRows, filledCols };
};

export const calculateBlockPoints = (block: BlockShape): number => {
    let count = 0;
    for(const row of block.grid) {
        for(const cell of row) {
            if(cell) count++;
        }
    }
    return count * POINTS_PER_BLOCK;
}

export const executeUnfreeze = (grid: Grid): { newGrid: Grid, totalPoints: number } => {
        let unfreezingCells = 0;
    const newGrid = grid.map(row => [...row].map(cell => {
      if (cell.frozen) {
        unfreezingCells++;
        return { filled: false, frozen: false };
      }
      return { ...cell };
    }));
    
    // Huge multiplier based on total cells cleared simultaneously
    const totalPoints = unfreezingCells * POINTS_PER_BLOCK * Math.max(1, Math.floor(unfreezingCells / 5) * COMBO_MULTIPLIER);
    return { newGrid, totalPoints: Math.floor(totalPoints) };
}
