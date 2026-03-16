import { useState, useCallback, useEffect } from 'react';
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

  // No longer using clearing delays for performance reasons

  // Synchronously detect grid size mismatch and reset immediately
  if (gameState.grid.length !== gridSize) {
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
    if (!gameState.isGameOver) {
      const isOver = checkGameOver(gameState.grid, gameState.availableBlocks, gridSize);
      if (isOver) {
        setGameState(prev => ({ ...prev, isGameOver: true }));
      }
    }
  }, [gameState.grid, gameState.availableBlocks, gameState.isGameOver, gridSize]);

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
    if (!gameState.draggedBlock || gameState.isGameOver) return false;

    const { block, index } = gameState.draggedBlock;
    const { success, newGrid } = placeBlock(gameState.grid, block, row, col, gridSize);

    if (success) {
      const shapePoints = calculateBlockPoints(block);
      
      // Calculate new blocks state
      let newBlocks: (BlockShape | null)[] = [...gameState.availableBlocks];
      newBlocks[index] = null;
      if (newBlocks.every(b => b === null)) {
        newBlocks = getRandomBlocks(3);
      }

      // Instant evaluation and clearing
      setGameState(prev => {
        const { updatedGrid, points } = evaluateGrid(newGrid, prev.freezeMode, gridSize);
        return {
          ...prev,
          grid: updatedGrid,
          availableBlocks: newBlocks,
          score: prev.score + shapePoints + points,
          draggedBlock: null
        };
      });
      
      vibrate(10); 
      return true;
    }

    setGameState(prev => ({ ...prev, draggedBlock: null }));
    return false;

  }, [gameState, gridSize]);

  const resetGame = useCallback(() => {
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

  // Game state hook lifecycle
  useEffect(() => {
    // Component lifecycle logic if needed
  }, []);

  return {
    ...gameState,
    gridSize,
    toggleFreezeMode,
    unfreeze,
    setDraggedBlock,
    clearDraggedBlock,
    handleDrop,
    resetGame
  };
};
