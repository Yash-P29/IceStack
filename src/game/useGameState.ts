import { useState, useCallback, useEffect, useRef } from 'react';
import { 
    createEmptyGrid, 
    checkGameOver, 
    evaluateGrid, 
    placeBlock, 
    calculateBlockPoints, 
    executeUnfreeze,
    GRID_SIZE
} from './engine';
import { getRandomBlocks } from './shapes';
import type { GameState, BlockShape } from './types';

const vibrate = (pattern: number | number[]) => {
  if (typeof window !== 'undefined' && window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
};

export const useGameState = (gridSize: number = GRID_SIZE) => {
  const [gameState, setGameState] = useState<GameState>({
    grid: createEmptyGrid(gridSize),
    availableBlocks: getRandomBlocks(3),
    score: 0,
    combo: 0,
    freezeMode: false,
    isGameOver: false,
    draggedBlock: null
  });

  // Track whether we're in the "highlight" phase (block placed, lines about to clear)
  const [clearing, setClearing] = useState(false);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronously detect grid size mismatch and reset immediately
  if (gameState.grid.length !== gridSize) {
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    setClearing(false);
    setGameState({
      grid: createEmptyGrid(gridSize),
      availableBlocks: getRandomBlocks(3),
      score: 0,
      combo: 0,
      freezeMode: false,
      isGameOver: false,
      draggedBlock: null
    });
  }

  // Evaluate game over on grid or block change (but not during clearing animation)
  useEffect(() => {
    if (!gameState.isGameOver && !clearing) {
      const isOver = checkGameOver(gameState.grid, gameState.availableBlocks, gridSize);
      if (isOver) {
        setGameState(prev => ({ ...prev, isGameOver: true }));
      }
    }
  }, [gameState.grid, gameState.availableBlocks, gameState.isGameOver, gridSize, clearing]);

  const toggleFreezeMode = useCallback(() => {
    setGameState(prev => ({
        ...prev,
        freezeMode: !prev.freezeMode
    }));
    vibrate(5);
  }, []);

  const unfreeze = useCallback(() => {
    setGameState(prev => {
        const { newGrid, totalPoints } = executeUnfreeze(prev.grid);
        return {
            ...prev,
            grid: newGrid,
            score: prev.score + totalPoints,
        };
    });
  }, []);

  const setDraggedBlock = useCallback((block: BlockShape, index: number) => {
    setGameState(prev => ({
      ...prev,
      draggedBlock: { block, index }
    }));
  }, []);

  const clearDraggedBlock = useCallback(() => {
    setGameState(prev => ({
        ...prev,
        draggedBlock: null
    }));
  }, []);

  const handleDrop = useCallback((row: number, col: number) => {
    if (!gameState.draggedBlock || gameState.isGameOver || clearing) return false;

    const { block, index } = gameState.draggedBlock;
    const { success, newGrid } = placeBlock(gameState.grid, block, row, col, gridSize);

    if (success) {
      const shapePoints = calculateBlockPoints(block);

      // Phase 1: Place the block on the grid WITHOUT clearing lines yet
      // This lets GameBoard render the highlight on the filled lines
      let newBlocks: (BlockShape | null)[] = [...gameState.availableBlocks];
      newBlocks[index] = null;
      if (newBlocks.every(b => b === null)) {
        newBlocks = getRandomBlocks(3);
      }

      setGameState(prev => ({
        ...prev,
        grid: newGrid, // Block placed but lines NOT yet cleared
        availableBlocks: newBlocks,
        score: prev.score + shapePoints,
        draggedBlock: null
      }));
      
      vibrate(10); // Subtle tap on placement

      // Phase 2: After a visual delay, evaluate and clear/freeze lines
      if (!gameState.freezeMode) {
        setClearing(true);
        clearTimeoutRef.current = setTimeout(() => {
          setGameState(prev => {
            const { updatedGrid, points } = evaluateGrid(prev.grid, prev.freezeMode, gridSize);
            return {
              ...prev,
              grid: updatedGrid,
              score: prev.score + points,
            };
          });
          if (clearing) vibrate([20, 50, 20]); // Burst on clear
          setClearing(false);
        }, 400); // 400ms highlight flash
      } else {
        // In freeze mode, evaluate immediately (frozen lines stay visible anyway)
        setGameState(prev => {
          const { updatedGrid, points } = evaluateGrid(prev.grid, prev.freezeMode, gridSize);
          return {
            ...prev,
            grid: updatedGrid,
            score: prev.score + points,
          };
        });
      }

      return true;
    }

    setGameState(prev => ({ ...prev, draggedBlock: null }));
    return false;

  }, [gameState, gridSize, clearing]);

  const resetGame = useCallback(() => {
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    setClearing(false);
    setGameState({
        grid: createEmptyGrid(gridSize),
        availableBlocks: getRandomBlocks(3),
        score: 0,
        combo: 0,
        freezeMode: false,
        isGameOver: false,
        draggedBlock: null
    });
  }, [gridSize]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    };
  }, []);

  return {
    ...gameState,
    gridSize,
    clearing,
    toggleFreezeMode,
    unfreeze,
    setDraggedBlock,
    clearDraggedBlock,
    handleDrop,
    resetGame
  };
};
