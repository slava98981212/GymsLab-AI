import React from 'react';
import { Dumbbell, Settings, Plane, Sparkles } from 'lucide-react';

export default function Header({ onOpenSettings, travelMode, onToggleTravelMode, onOpen1RMTest, is1RMDue }) {
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'calc(0.85rem + env(safe-area-inset-top, 24px)) 1.25rem 0.85rem 1.25rem',
      background: 'rgba(9, 13, 22, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-card)',
      position: 'sticky',
      top: 0,
      zIndex: 850
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px var(--primary-cyan-glow)'
        }}>
          <Dumbbell size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              GymsLab AI
            </h1>
            {travelMode && (
              <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                <Plane size={10} /> VACATION
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{todayStr}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {is1RMDue && (
          <button
            onClick={onOpen1RMTest}
            className="badge badge-cyan"
            style={{ padding: '0.45rem 0.75rem', cursor: 'pointer', border: 'none' }}
          >
            <Sparkles size={12} /> 15-Day 1RM Test
          </button>
        )}

        <button
          onClick={onToggleTravelMode}
          title="Toggle Travel / Vacation Mode"
          style={{
            background: travelMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: travelMode ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-card)',
            color: travelMode ? 'var(--accent-amber)' : 'var(--text-main)',
            borderRadius: '12px',
            padding: '0.65rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '42px',
            minHeight: '42px'
          }}
        >
          <Plane size={20} />
        </button>

        <button
          onClick={onOpenSettings}
          title="Open Settings"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-card)',
            color: 'var(--text-main)',
            borderRadius: '12px',
            padding: '0.65rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '42px',
            minHeight: '42px'
          }}
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}
