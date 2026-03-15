import React from 'react';

export const Rules: React.FC = () => {
  return (
    <div className="glass-panel" style={{ width: '800px', maxWidth: '100%', textAlign: 'left', padding: '40px' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '24px', color: 'var(--accent-cyan)' }}>IceStack Rules</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
        <section>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>1. Basic Gameplay</h3>
          <p>Drag block shapes from the tray onto the 10x10 grid. Your goal is to form complete rows or columns. Every piece placed gives you base points.</p>
        </section>

        <section>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>2. Normal Mode</h3>
          <p>When you complete a row or column in Normal Mode, it clears immediately opening up space on the board. You are rewarded standard clearing points.</p>
        </section>

        <section>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>3. ❄️ Freeze Mode Mechanics</h3>
          <p>Activating Freeze Mode changes the strategy completely! When you complete lines, they don't clear. Instead, they turn to <strong>ICE</strong>.</p>
          <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
            <li>Frozen lines effectively block space on the board.</li>
            <li>You can stack multiple frozen lines.</li>
            <li>Clicking <strong>Unfreeze</strong> will shatter all frozen blocks at once!</li>
          </ul>
        </section>

        <section>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>4. The Massive Combo Modifier</h3>
          <p>Surviving in Freeze mode pays off. The more frozen lines you detonate simultaneously, the higher the multiplier! Detonating 5 lines at once scores exponentially more points than clearing 5 lines individually.</p>
        </section>

        <section>
          <h3 style={{ color: 'var(--accent-pink)', marginBottom: '8px' }}>5. Don't Get Greedy</h3>
          <p>If you have no space left to place any of your 3 assigned blocks, and your grid is blocked by ice, <strong>you lose</strong>! Unfreeze before you get completely trapped or the board fills up.</p>
        </section>
      </div>
    </div>
  );
};
