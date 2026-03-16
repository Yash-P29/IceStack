import { useState, useEffect, useCallback, useRef } from 'react';
import { GameBoard } from './components/GameBoard';
import { BlockTray } from './components/BlockTray';
import { Controls } from './components/Controls';
import { Sidebar } from './components/Sidebar';
import { Rules } from './components/Rules';
import { Leaderboard } from './components/Leaderboard';
import type { LeaderboardEntry } from './components/Leaderboard';
import { ThemeSelector } from './components/ThemeSelector';
import { WalkthroughBubble } from './components/WalkthroughBubble';
import { useGameState } from './game/useGameState';
import { THEMES } from './game/shapes';
import type { ThemeName } from './game/shapes';
import type { BlockShape } from './game/types';
import { launchConfetti } from './game/confetti';
import { supabase } from './game/supabaseClient';

export type TabName = 'play' | 'rules' | 'leaderboard' | 'themes' | 'walkthrough';

const LEGACY_RECORD = { name: 'Gaurav Patil', score: 26012001 };


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
      const saved = localStorage.getItem('icestacck_local_leaderboard');
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
            await supabase
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

  const [cellSize, setCellSize] = useState(40);
  const [canvasSize, setCanvasSize] = useState(420);
  const GAP = 2;

  // Dynamic scaling for mobile
  useEffect(() => {
    const updateSize = () => {
      const availableWidth = window.innerWidth - 32; // Horizontal padding
      const maxPossibleSize = Math.min(availableWidth, 500); // Max size on desktop

      const newCellSize = Math.floor((maxPossibleSize - (gridSize + 1) * GAP) / gridSize);
      setCellSize(newCellSize);
      setCanvasSize((newCellSize + GAP) * gridSize + GAP);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [gridSize]);

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
        // Add vertical offset on mobile so block isn't under finger
        const offset = 60;
        setMousePos({ clientX: touch.clientX, clientY: touch.clientY - offset });
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

      const blockRows = gameState.draggedBlock.block.grid.length;
      const blockCols = gameState.draggedBlock.block.grid[0].length;

      // Calculate column and row accurately based on dynamic cellSize
      const col = Math.floor((x - ((blockCols * cellSize) / 2)) / (cellSize + GAP));
      const row = Math.floor((y - ((blockRows * cellSize) / 2)) / (cellSize + GAP));

      gameState.handleDrop(row, col);
    } else {
      gameState.clearDraggedBlock();
    }
  }, [gameState, cellSize, GAP]);

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
      // Use offset-adjusted position for drop check too
      const offset = 60;
      attemptDrop(touch.clientX, touch.clientY - offset);
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

  // ========== WALKTHROUGH LOGIC ==========
  const [walkthroughStep, setWalkthroughStep] = useState<number | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem('icestacck_walkthrough_seen');
    if (!seen) {
      setWalkthroughStep(0);
    }
  }, []);

  const handleNextStep = () => {
    if (walkthroughStep !== null) {
      if (walkthroughStep < 11) {
        setWalkthroughStep(walkthroughStep + 1);
      } else {
        setWalkthroughStep(null);
        localStorage.setItem('icestacck_walkthrough_seen', 'true');
      }
    }
  };

  const handleSkipWalkthrough = () => {
    setWalkthroughStep(null);
    localStorage.setItem('icestacck_walkthrough_seen', 'true');
  };

  const startWalkthrough = useCallback(() => {
    setCurrentTab('play');
    setWalkthroughStep(0);
  }, []);

  // Effect to switch tabs based on walkthrough step
  useEffect(() => {
    if (walkthroughStep === 7) setCurrentTab('rules');
    if (walkthroughStep === 8 || walkthroughStep === 9) setCurrentTab('leaderboard');
    if (walkthroughStep === 10) setCurrentTab('themes');
    if (walkthroughStep === 11) setCurrentTab('play');
  }, [walkthroughStep]);

  // Tab switching override for the "Walkthrough" tab click
  const handleTabSelect = (tab: TabName) => {
    if (tab === 'walkthrough') {
      startWalkthrough();
    } else {
      setCurrentTab(tab);
    }
  };

  return (
    <>
      <Sidebar currentTab={currentTab} onSelectTab={handleTabSelect} />
      <div className="app-container">
        <div className="title-container">
          <h1>IceStacck</h1>
          <p>Strategic Block Placement with Freeze Mechanics</p>
        </div>

        {currentTab === 'play' && (
          <div className="game-layout">
            <div className="main-column">
              {/* Grid Size Selector */}
              <div className="grid-size-selector" id="grid-size-selector">
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
                cellSize={cellSize}
                canvasSize={canvasSize}
              />
              <div id="block-tray-container">
                <BlockTray
                  availableBlocks={gameState.availableBlocks}
                  onDragStart={handleDragStart}
                  theme={currentTheme}
                />
              </div>
            </div>

            <div className="side-column">
              <div className="glass-panel score-panel" id="score-panel" style={{ padding: '12px 24px' }}>
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

        {walkthroughStep !== null && (
          <WalkthroughBubble
            currentStep={walkthroughStep}
            onNext={handleNextStep}
            onSkip={handleSkipWalkthrough}
            playerName={playerName}
          />
        )}

        {/* Floating Dragged Block Visualization */}
        {gameState.draggedBlock && mousePos && (
          <div
            className="dragged-block-container"
            style={{
              transform: `translate3d(${mousePos.clientX}px, ${mousePos.clientY}px, 0) translate(-50%, -50%)`,
              position: 'fixed',
              left: 0,
              top: 0
            }}
          >
            {gameState.draggedBlock.block.grid.map((row, rIdx) => (
              <div key={rIdx} className="shape-row">
                {row.map((cell, cIdx) => (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`shape-cell ${!cell ? 'empty' : ''}`}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
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