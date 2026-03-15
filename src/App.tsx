import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameBoard } from './components/GameBoard';
import { BlockTray } from './components/BlockTray';
import { Controls } from './components/Controls';
import { Sidebar } from './components/Sidebar';
import { Rules } from './components/Rules';
import { Leaderboard } from './components/Leaderboard';
import type { LeaderboardEntry } from './components/Leaderboard';
import { ThemeSelector } from './components/ThemeSelector';
import { useGameState } from './game/useGameState';
import { THEMES } from './game/shapes';
import type { ThemeName } from './game/shapes';
import type { BlockShape } from './game/types';
import { launchConfetti } from './game/confetti';

export type TabName = 'play' | 'rules' | 'leaderboard' | 'themes';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Gaurav Patil', score: 26012006 },
  { rank: 2, name: '—', score: 0 },
  { rank: 3, name: '—', score: 0 },
  { rank: 4, name: '—', score: 0 },
  { rank: 5, name: '—', score: 0 },
  { rank: 6, name: '—', score: 0 },
  { rank: 7, name: '—', score: 0 },
  { rank: 8, name: '—', score: 0 },
  { rank: 9, name: '—', score: 0 },
  { rank: 10, name: '—', score: 0 },
];

function App() {
  const [gridSize, setGridSize] = useState(10);
  const gameState = useGameState(gridSize);
  const [mousePos, setMousePos] = useState<{ clientX: number, clientY: number } | null>(null);
  const [currentTab, setCurrentTab] = useState<TabName>('play');
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('icestack_playerName') || '';
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('icestack_leaderboard');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return DEFAULT_LEADERBOARD;
  });
  const prevScoreRef = useRef(0);

  // Persist leaderboard and playerName to localStorage
  useEffect(() => {
    localStorage.setItem('icestack_leaderboard', JSON.stringify(leaderboard));
  }, [leaderboard]);
  useEffect(() => {
    localStorage.setItem('icestack_playerName', playerName);
  }, [playerName]);

  // Check if score qualifies for leaderboard when game ends
  useEffect(() => {
    if (gameState.isGameOver && gameState.score > prevScoreRef.current) {
      const currentScore = gameState.score;
      const name = playerName.trim() || 'Anonymous';
      
      // Check if this score can beat any entry on the leaderboard
      const lowestEntry = leaderboard[leaderboard.length - 1];
      if (currentScore > lowestEntry.score) {
        // Fire confetti!
        launchConfetti(3000);

        // Insert the new entry
        const newBoard = [...leaderboard, { rank: 0, name, score: currentScore }]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10) // Keep only top 10
          .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

        setLeaderboard(newBoard);
      }

      prevScoreRef.current = currentScore;
    }
  }, [gameState.isGameOver, gameState.score, playerName, leaderboard]);

  // Reset prevScoreRef when a new game starts
  useEffect(() => {
    if (!gameState.isGameOver && gameState.score === 0) {
      prevScoreRef.current = 0;
    }
  }, [gameState.isGameOver, gameState.score]);

  // Global Mouse Move for Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameState.draggedBlock) {
        setMousePos({ clientX: e.clientX, clientY: e.clientY });
      }
    };

    if (gameState.draggedBlock) {
       window.addEventListener('mousemove', handleMouseMove);
    } else {
       setMousePos(null);
    }

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [gameState.draggedBlock]);

  // Global Mouse Up for Dropping
  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    if (!gameState.draggedBlock) return;
    
    const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);
    const boardContainer = elementsUnderCursor.find(el => el.classList.contains('board-container'));
    
    if (boardContainer) {
       const rect = boardContainer.getBoundingClientRect();
       const x = e.clientX - rect.left;
       const y = e.clientY - rect.top;

       const CELL_SIZE = 40;
       const GAP = 2;
       
       const blockRows = gameState.draggedBlock.block.grid.length;
       const blockCols = gameState.draggedBlock.block.grid[0].length;
       
       const col = Math.floor((x - ((blockCols * CELL_SIZE)/2)) / (CELL_SIZE + GAP));
       const row = Math.floor((y - ((blockRows * CELL_SIZE)/2)) / (CELL_SIZE + GAP));
       
       gameState.handleDrop(row, col);
    } else {
       gameState.clearDraggedBlock();
    }
  }, [gameState]);

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleGlobalMouseUp]);


  const handleDragStart = (block: BlockShape, index: number, e: React.MouseEvent) => {
    e.preventDefault();
    gameState.setDraggedBlock(block, index);
    setMousePos({ clientX: e.clientX, clientY: e.clientY });
  };

  return (
    <>
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
      <div className="app-container">
        <div className="title-container">
        <h1>IceStack</h1>
        <p>Strategic Block Placement with Freeze Mechanics</p>
      </div>

      {currentTab === 'play' && (
      <div className="game-layout">
        <div className="main-column">
          {/* Grid Size Selector */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '4px' }}>
            <button
              onClick={() => setGridSize(8)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: gridSize === 8 ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                color: gridSize === 8 ? '#000' : 'var(--text-secondary)',
                border: gridSize === 8 ? '2px solid var(--accent-cyan)' : '2px solid var(--panel-border)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              8×8
            </button>
            <button
              onClick={() => setGridSize(10)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: gridSize === 10 ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                color: gridSize === 10 ? '#000' : 'var(--text-secondary)',
                border: gridSize === 10 ? '2px solid var(--accent-cyan)' : '2px solid var(--panel-border)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              10×10
            </button>
          </div>

          <GameBoard  
            grid={gameState.grid}
            draggedBlock={gameState.draggedBlock}
            isGameOver={gameState.isGameOver}
            onRestart={gameState.resetGame}
            mousePos={mousePos}
            theme={currentTheme}
            freezeMode={gameState.freezeMode}
            gridSize={gridSize}
          />
          <BlockTray 
            availableBlocks={gameState.availableBlocks}
            onDragStart={handleDragStart}
            theme={currentTheme}
          />
        </div>

        <div className="side-column">
          <div className="glass-panel score-panel" style={{ padding: '12px 24px' }}>
            <span className="score-label">Score</span>
            <span className="score-value" style={{ fontSize: '2.5rem' }}>{gameState.score.toLocaleString()}</span>
          </div>
           <Controls 
             freezeMode={gameState.freezeMode}
             onToggleFreeze={gameState.toggleFreezeMode}
             onUnfreeze={gameState.unfreeze}
           />
        </div>
      </div>
      )}

      {currentTab === 'rules' && <Rules />}
      {currentTab === 'leaderboard' && (
        <Leaderboard 
          entries={leaderboard} 
          playerName={playerName} 
          onPlayerNameChange={setPlayerName} 
        />
      )}
      {currentTab === 'themes' && <ThemeSelector currentTheme={currentTheme} onSelectTheme={setCurrentTheme} />}

      {/* Floating Dragged Block Visualization */}
      {gameState.draggedBlock && mousePos && (
         <div 
           className="dragged-block-container"
           style={{
             left: mousePos.clientX,
             top: mousePos.clientY
           }}
         >
            {gameState.draggedBlock.block.grid.map((row, rIdx) => (
              <div key={rIdx} className="shape-row">
                {row.map((cell, cIdx) => (
                  <div 
                    key={`${rIdx}-${cIdx}`}
                    className={`shape-cell ${!cell ? 'empty' : ''}`}
                    style={{
                       backgroundColor: cell ? THEMES[currentTheme][gameState.draggedBlock!.block.colorIndex] : 'transparent',
                    }}
                  />
                ))}
              </div>
            ))}
         </div>
      )}
    </div>
    </>
  );
}

export default App;
