import { type FC } from 'react';
import { THEMES } from '../game/shapes';
import type { ThemeName } from '../game/shapes';

interface ThemeSelectorProps {
  currentTheme: ThemeName;
  onSelectTheme: (theme: ThemeName) => void;
}

export const ThemeSelector: FC<ThemeSelectorProps> = ({ currentTheme, onSelectTheme }) => {
  const themesList: { id: ThemeName; label: string; desc: string }[] = [
    { id: 'default', label: 'Neon Default', desc: 'The classic vibrant IceStack experience.' },
    { id: 'green', label: 'Emerald Forest', desc: 'Lush and natural shades of green.' },
    { id: 'monochrome', label: 'Monochrome', desc: 'Sleek, professional grayscale styling.' },
    { id: 'blackholesun', label: 'Black Hole Sun', desc: 'Warm, intense hues of gold and fire.' },
    { id: 'velvetrose', label: 'Velvet Rose', desc: 'Deep, rich tones of red and maroon.' },
    { id: 'premiumblue', label: 'Premium Blue', desc: 'Cool, crisp shades of ocean blue.' },
  ];

  return (
    <div className="glass-panel" style={{ width: '600px', maxWidth: '100%', padding: '32px' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '24px', letterSpacing: '1px' }}>Select Theme</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {themesList.map((theme) => {
          const isSelected = currentTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '20px',
                background: isSelected ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--panel-border)'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              <h3 style={{ fontSize: '1.4rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)', marginBottom: '8px' }}>
                {theme.label}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
                {theme.desc}
              </p>
              
              {/* Theme Palette Preview */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {THEMES[theme.id].slice(0, 4).map((color, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '4px', 
                      backgroundColor: color,
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)' 
                    }} 
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
