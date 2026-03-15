import { useState, useEffect, useCallback, useRef } from 'react';
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
import { supabase } from './game/supabaseClient';

export type TabName = 'play' | 'rules' | 'leaderboard' | 'themes';

const LEGACY_RECORD = { name: 'Gaurav Patil', score: 26012006 };


function App() {
  const [gridSize, setGridSize] = useState(10);
  const gameState = useGameState(gridSize);
  const [mousePos, setMousePos] = useState<{ clientX: number, clientY: number } | null>(null);
  const [currentTab, setCurrentTab] = useState<TabName>('play');
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('icestack_playerName') || '';
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const prevScoreRef = useRef(0);

  // Fetch global leaderboard from Supabase
  const fetchLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    let cloudResults: any[] = [];
    
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('score', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        cloudResults = data || [];
      }
    } catch (err) {
      console.error('Error fetching global leaderboard:', err);
    }

    // Load local fallback from localStorage
    let localResults: any[] = [];
    try {
      const saved = localStorage.getItem('icestack_local_leaderboard');
      if (saved) localResults = JSON.parse(saved);
    } catch { /* ignore */ }

    // Merge: Secret Record + Cloud + Local
    // Sort and take top 10
    const merged = [LEGACY_RECORD, ...cloudResults, ...localResults]
      // filter out duplicates by name+score to be safe
      .filter((entry, index, self) => 
        index === self.findIndex((t) => t.name === entry.name && t.score === entry.score)
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLeaderboard(merged.map((entry, idx) => ({ ...entry, rank: idx + 1 })));
    setIsLoadingLeaderboard(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Persist playerName to localStorage
  useEffect(() => {
    localStorage.setItem('icestack_playerName', playerName);
  }, [playerName]);

  // Check if score qualifies for leaderboard when game ends
  useEffect(() => {
    if (gameState.isGameOver && gameState.score > prevScoreRef.current) {
      const currentScore = gameState.score;
      const name = playerName.trim() || 'Anonymous';
      
      const submitScore = async () => {
        // Decide if it's a top score
        const isTopScore = leaderboard.length < 10 || currentScore > (leaderboard[leaderboard.length - 1]?.score || 0);
        
        if (isTopScore) {
          launchConfetti(3000);
        }

        // 1. Try to save to cloud
        try {
          if (supabase) {
            const { error } = await supabase
              .from('leaderboard')
              .insert([{ name, score: currentScore }]);
          }
        } catch (err) {
          console.error('Error submitting to cloud:', err);
        }

        // 2. Always save locally as fallback/backup
        try {
          const saved = localStorage.getItem('icestack_local_leaderboard');
          const localBoard = saved ? JSON.parse(saved) : [];
          const newLocal = [...localBoard, { name, score: currentScore }]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
          localStorage.setItem('icestack_local_leaderboard', JSON.stringify(newLocal));
        } catch { /* ignore */ }
        
        // 3. Refresh display
        await fetchLeaderboard();
      };

      submitScore();
      prevScoreRef.current = currentScore;
    }
  }, [gameState.isGameOver, gameState.score, playerName, leaderboard, fetchLeaderboard]);

  // Reset prevScoreRef when a new game starts
  useEffect(() => {
    if (!gameState.isGameOver && gameState.score === 0) {
      prevScoreRef.current = 0;
    }
  }, [gameState.isGameOver, gameState.score]);

  // ========== UNIFIED POINTER HANDLING (mouse + touch) ==========

  // Global Mouse Move for Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameState.draggedBlock) {
        setMousePos({ clientX: e.clientX, clientY: e.clientY });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameState.draggedBlock) {
        e.preventDefault(); // Prevent scroll while dragging
        const touch = e.touches[0];
        setMousePos({ clientX: touch.clientX, clientY: touch.clientY });
      }
    };

    if (gameState.draggedBlock) {
       window.addEventListener('mousemove', handleMouseMove);
       window.addEventListener('touchmove', handleTouchMove, { passive: false });
    } else {
       setMousePos(null);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameState.draggedBlock]);

  // Shared drop logic
  const attemptDrop = useCallback((clientX: number, clientY: number) => {
    if (!gameState.draggedBlock) return;
    
    const elementsUnderCursor = document.elementsFromPoint(clientX, clientY);
    const boardContainer = elementsUnderCursor.find(el => el.classList.contains('board-container'));
    
    if (boardContainer) {
       const rect = boardContainer.getBoundingClientRect();
       const x = clientX - rect.left;
       const y = clientY - rect.top;

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

  // Global Mouse Up for Dropping
  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    attemptDrop(e.clientX, e.clientY);
  }, [attemptDrop]);

  // Global Touch End for Dropping
  const handleGlobalTouchEnd = useCallback((e: TouchEvent) => {
    if (!gameState.draggedBlock) return;
    // Use the last known position since touchend has no touches
    const touch = e.changedTouches[0];
    if (touch) {
      attemptDrop(touch.clientX, touch.clientY);
    } else {
      gameState.clearDraggedBlock();
    }
  }, [gameState, attemptDrop]);

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalTouchEnd);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [handleGlobalMouseUp, handleGlobalTouchEnd]);

  // Unified drag start handler (works for both mouse and touch)
  const handleDragStart = useCallback((block: BlockShape, index: number, clientX: number, clientY: number) => {
    gameState.setDraggedBlock(block, index);
    setMousePos({ clientX, clientY });
  }, [gameState]);

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
          <div className="grid-size-selector">
            <button
              onClick={() => setGridSize(8)}
              className={`grid-size-btn ${gridSize === 8 ? 'active' : ''}`}
            >
              8×8
            </button>
            <button
              onClick={() => setGridSize(10)}
              className={`grid-size-btn ${gridSize === 10 ? 'active' : ''}`}
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
            <span className="score-value">{gameState.score.toLocaleString()}</span>
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
          isLoading={isLoadingLeaderboard}
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
