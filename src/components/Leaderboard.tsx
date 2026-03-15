import React from 'react';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  playerName: string;
  onPlayerNameChange: (name: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, playerName, onPlayerNameChange }) => {
  const getRankStyle = (rank: number) => {
    switch(rank) {
      case 1: return { 
        color: '#FFD700', 
        textShadow: '0 0 12px rgba(255, 215, 0, 0.6)',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), transparent)',
      };
      case 2: return { 
        color: '#C0C0C0', 
        textShadow: '0 0 12px rgba(192, 192, 192, 0.6)',
        background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.08), transparent)',
      };
      case 3: return { 
        color: '#CD7F32', 
        textShadow: '0 0 12px rgba(205, 127, 50, 0.6)',
        background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.08), transparent)',
      };
      default: return { color: 'var(--text-primary)', textShadow: 'none', background: 'transparent' };
    }
  };

  const getMedal = (rank: number) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  return (
    <div className="glass-panel" style={{ width: '650px', maxWidth: '100%', padding: '32px' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '8px', letterSpacing: '2px' }}>
        🏆 Global Leaderboard
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
        Top 10 IceStack players worldwide
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {entries.map((player, idx) => {
          const rankStyle = getRankStyle(player.rank);
          return (
            <div 
              key={idx}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '14px 20px',
                background: rankStyle.background,
                borderBottom: idx !== entries.length - 1 ? '1px solid var(--panel-border)' : 'none',
                borderRadius: player.rank <= 3 ? '10px' : '0',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, width: '36px', color: rankStyle.color, textShadow: rankStyle.textShadow }}>
                  {getMedal(player.rank) || `#${player.rank}`}
                </span>
                <span style={{ 
                  fontSize: '1.15rem', 
                  fontWeight: player.rank <= 3 ? 700 : 400, 
                  color: player.rank <= 3 ? 'var(--text-primary)' : 'var(--text-secondary)',
                  letterSpacing: player.rank <= 3 ? '0.5px' : '0',
                }}>
                  {player.name}
                </span>
              </div>
              <div style={{ 
                fontSize: '1.3rem', 
                fontWeight: 800, 
                color: rankStyle.color, 
                textShadow: rankStyle.textShadow,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {player.score.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Username Input Section */}
      <div style={{ 
        marginTop: '32px', 
        padding: '24px', 
        background: 'rgba(255, 255, 255, 0.03)', 
        borderRadius: '12px',
        border: '1px solid var(--panel-border)',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '16px' }}>
          🎯 If you get an amazing score, get featured in the Top 10!
        </p>
        <input
          type="text"
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          placeholder="Enter your name..."
          maxLength={20}
          style={{
            width: '100%',
            maxWidth: '320px',
            padding: '12px 20px',
            fontSize: '1.1rem',
            fontFamily: 'inherit',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '2px solid var(--panel-border)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-cyan)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--panel-border)'}
        />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
          Your name will appear on the leaderboard when you beat a top score!
        </p>
      </div>
    </div>
  );
};
