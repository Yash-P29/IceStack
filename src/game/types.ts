export type CellState = {
  filled: boolean;
  frozen: boolean;
  colorIndex?: number; // Maps to theme palette
};

export type Grid = CellState[][];

export type BlockShape = {
  id: string;
  grid: boolean[][]; // 2D array representing the shape footprint
  colorIndex: number;
};

export type GameState = {
  grid: Grid;
  availableBlocks: (BlockShape | null)[];
  score: number;
  combo: number; // Current multiplier for unfreezing
  freezeMode: boolean; // Is freeze mode currently active?
  isGameOver: boolean;
  draggedBlock: {
    block: BlockShape;
    index: number;
  } | null;
};
