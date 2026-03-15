import type { BlockShape } from './types';

export type ThemeName = 'default' | 'green' | 'monochrome' | 'blackholesun' | 'velvetrose' | 'premiumblue';

export const THEMES: Record<ThemeName, string[]> = {
  default: ['#FF3366', '#00E5FF', '#FFD700', '#AA00FF', '#FF6600', '#00FF66', '#3366FF'],
  green: ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#052e16'],
  monochrome: ['#f8fafc', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'],
  blackholesun: ['#fde047', '#facc15', '#fbbf24', '#f59e0b', '#ea580c', '#ef4444', '#b91c1c'],
  velvetrose: ['#e11d48', '#be123c', '#9f1239', '#881337', '#7f1d1d', '#991b1b', '#950000'],
  premiumblue: ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#1d4ed8', '#3b82f6', '#60a5fa'],
};

const getRandomColorIndex = () => Math.floor(Math.random() * 7);

// Generate a unique ID for drag/drop mapping
const generateId = () => Math.random().toString(36).substr(2, 9);

// Base shape matrices (true means cell is filled)
const baseShapes: boolean[][][] = [
  // 1x1 dot
  [[true]],
  // 2x2 square
  [
    [true, true],
    [true, true],
  ],
  // 3x3 square
  [
    [true, true, true],
    [true, true, true],
    [true, true, true],
  ],
  // 3x2 box
  [
    [true, true, true],
    [true, true, true],
  ],
  // 2x3 box
  [
    [true, true],
    [true, true],
    [true, true],
  ],
  // 1x2 vertical line
  [[true], [true]],
  // 1x3 vertical line
  [[true], [true], [true]],
  // 1x4 vertical line
  [[true], [true], [true], [true]],
  // 1x5 vertical line
  [[true], [true], [true], [true], [true]],
  // 2x1 horizontal line
  [[true, true]],
  // 3x1 horizontal line
  [[true, true, true]],
  // 4x1 horizontal line
  [[true, true, true, true]],
  // 5x1 horizontal line
  [[true, true, true, true, true]],
  
  // L shape (small) - 4 orientations
  [[true, false], [true, true]],
  [[false, true], [true, true]],
  [[true, true], [true, false]],
  [[true, true], [false, true]],

  // L shape (large) - 4 orientations
  [
    [true, false, false],
    [true, false, false],
    [true, true, true],
  ],
  [
    [false, false, true],
    [false, false, true],
    [true, true, true],
  ],
  [
    [true, true, true],
    [true, false, false],
    [true, false, false],
  ],
  [
    [true, true, true],
    [false, false, true],
    [false, false, true],
  ],

  // T shape - 4 orientations
  [
    [true, true, true],
    [false, true, false],
  ],
  [
    [false, true, false],
    [true, true, true],
  ],
  [
    [true, false],
    [true, true],
    [true, false],
  ],
  [
    [false, true],
    [true, true],
    [false, true],
  ],

  // Z shape - 2 orientations
  [
    [true, true, false],
    [false, true, true],
  ],
  [
    [false, true],
    [true, true],
    [true, false],
  ],

  // S shape - 2 orientations
  [
    [false, true, true],
    [true, true, false],
  ],
  [
    [true, false],
    [true, true],
    [false, true],
  ]
];

export const getRandomBlocks = (count: number = 3): BlockShape[] => {
  const blocks: BlockShape[] = [];
  for (let i = 0; i < count; i++) {
    const randomMatrix = baseShapes[Math.floor(Math.random() * baseShapes.length)];
    blocks.push({
      id: generateId(),
      grid: randomMatrix,
      colorIndex: getRandomColorIndex(),
    });
  }
  return blocks;
};
