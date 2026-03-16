import React, { useEffect, useState } from 'react';

interface WalkthroughStep {
  selector: string | null;
  message: string;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: WalkthroughStep[] = [
  { selector: null, message: "Welcome to IceStacck, lemme give you a quick walkthrough", position: 'center' },
  { selector: '#nav-play', message: "This is the home screen where you can play the game", position: 'right' },
  { selector: '#grid-size-selector', message: "You can choose your grid", position: 'bottom' },
  { selector: '#block-tray-container', message: "Pick and Place your randomly generated blocks from here", position: 'top' },
  { selector: '#score-panel', message: "You can view your score from here", position: 'bottom' },
  { selector: '#freeze-mode-toggle', message: "Here comes the twist! Use this freeze mode button to freeze your placed blocks", position: 'left' },
  { selector: '#unfreeze-btn', message: "Use this Unfreeze and Combo button to quickly make a combo!", position: 'top' },
  { selector: '#rules-content', message: "Read and Remember these rules to maximize your score!", position: 'center' },
  { selector: '#leaderboard-content', message: "This global leaderboard shows the top scores from players around the world.", position: 'center' },
  { selector: '#username-input-section', message: "Enter your name right away and break the Icey leaderboard scores!", position: 'top' },
  { selector: '#themes-grid', message: "Select the theme that you find suitable and satisfying", position: 'center' },
  { selector: null, message: "Happy Staccking!", position: 'center' },
];

interface WalkthroughProps {
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
  playerName: string;
}

export const WalkthroughBubble: React.FC<WalkthroughProps> = ({ currentStep, onNext, onSkip, playerName }) => {
  const step = STEPS[currentStep];
  const [bubbleStyle, setBubbleStyle] = useState<React.CSSProperties>({ display: 'none' });
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ display: 'none' });

  useEffect(() => {
    if (!step.selector) {
      setBubbleStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
      });
      setHighlightStyle({ display: 'none' });
      return;
    }

    const updatePosition = () => {
      const el = document.querySelector(step.selector!);
      const isMobile = window.innerWidth <= 768;
      const bubbleWidth = Math.min(window.innerWidth - 40, 300);

      if (!el) {
        setBubbleStyle({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${bubbleWidth}px`,
          zIndex: 10001,
        });
        return;
      }

      const rect = el.getBoundingClientRect();
      const padding = 12;

      setHighlightStyle({
        position: 'fixed',
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        borderRadius: '12px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), inset 0 0 0 2px var(--accent-cyan)',
        zIndex: 10000,
        pointerEvents: 'none',
        transition: 'all 0.3s ease',
      });

      let top = rect.top;
      let left = rect.left + rect.width / 2;
      let transform = 'translate(-50%, 0)';

      // Auto-adjust position if too close to edges on mobile
      let effectivePosition = step.position;
      if (isMobile) {
        if (rect.top < 150) effectivePosition = 'bottom';
        else if (rect.bottom > window.innerHeight - 150) effectivePosition = 'top';
      }

      switch (effectivePosition) {
        case 'top':
          top = rect.top - 20;
          transform = 'translate(-50%, -100%)';
          break;
        case 'bottom':
          top = rect.bottom + 20;
          transform = 'translate(-50%, 0)';
          break;
        case 'left':
          if (isMobile) {
             top = rect.top - 20;
             transform = 'translate(-50%, -100%)';
          } else {
             top = rect.top + rect.height / 2;
             left = rect.left - 20;
             transform = 'translate(-100%, -50%)';
          }
          break;
        case 'right':
          if (isMobile) {
             top = rect.bottom + 20;
             transform = 'translate(-50%, 0)';
          } else {
             top = rect.top + rect.height / 2;
             left = rect.right + 20;
             transform = 'translate(0, -50%)';
          }
          break;
        default:
          top = window.innerHeight / 2;
          left = window.innerWidth / 2;
          transform = 'translate(-50%, -50%)';
      }

      // Clamp left/right to screen
      const halfWidth = bubbleWidth / 2;
      if (left - halfWidth < 10) left = halfWidth + 10;
      if (left + halfWidth > window.innerWidth - 10) left = window.innerWidth - halfWidth - 10;

      // Clamp top/bottom
      if (top < 10) top = 10;
      if (top > window.innerHeight - 100) top = window.innerHeight - 200; // Leave room for buttons

      setBubbleStyle({
        position: 'fixed',
        top,
        left,
        width: `${bubbleWidth}px`,
        transform,
        zIndex: 10001,
      });
    };

    // Initial update with a small delay to allow tab transitions to complete
    const timeoutId = setTimeout(updatePosition, 100);
    
    // Also use requestAnimationFrame to catch any layout shifts
    updatePosition();
    const rafId = requestAnimationFrame(updatePosition);

    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStep, step]);

  return (
    <>
      <div style={highlightStyle} />
      {step.selector === null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9999,
        }} />
      )}
      <div className="glass-panel" style={{
        ...bubbleStyle,
        padding: '20px',
        textAlign: 'center',
        border: '2px solid var(--accent-cyan)',
        animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: '0 8px 32px rgba(0, 229, 255, 0.2)',
      }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: '#fff' }}>
          {step.message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            className="unfreeze-btn"
            style={{
              padding: '8px 24px',
              fontSize: '0.9rem',
              opacity: (currentStep === 9 && !playerName.trim()) ? 0.5 : 1,
              cursor: (currentStep === 9 && !playerName.trim()) ? 'not-allowed' : 'pointer'
            }}
            onClick={onNext}
            disabled={currentStep === 9 && !playerName.trim()}
          >
            {currentStep === 9 && !playerName.trim() ? "Enter Name" : (currentStep === STEPS.length - 1 ? "Finish" : "Next")}
          </button>
          <button
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--panel-border)',
              padding: '8px 20px',
              fontSize: '0.9rem'
            }}
            onClick={onSkip}
          >
            Skip
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; scale: 0.8; }
          to { opacity: 1; scale: 1; }
        }
      `}</style>
    </>
  );
};
