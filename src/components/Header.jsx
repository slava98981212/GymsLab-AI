import React from 'react';
import { Dumbbell, Settings, Plane, Sparkles, ChevronLeft, ChevronRight, Calendar, Scale } from 'lucide-react';

export default function Header({
  selectedDate,
  onSelectDate,
  onOpenSettings,
  travelMode,
  onToggleTravelMode,
  onOpen1RMTest,
  is1RMDue,
  onOpenMorningWeight,
  currentWeight
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    if (isToday) return;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(d.toISOString().slice(0, 10));
  };

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      padding: 'calc(0.75rem + env(safe-area-inset-top, 24px)) 1.25rem 0.65rem 1.25rem',
      background: 'rgba(9, 13, 22, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-card)',
      position: 'sticky',
      top: 0,
      zIndex: 850
    }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px var(--primary-cyan-glow)'
          }}>
            <Dumbbell size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                GymsLab AI
              </h1>
              {travelMode && (
                <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                  <Plane size={10} /> VACATION
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={onOpenMorningWeight}
            title="Log Morning Fast Weight"
            style={{
              background: currentWeight ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.2)',
              border: currentWeight ? '1px solid var(--primary-cyan)' : '1px solid var(--accent-amber)',
              color: currentWeight ? 'var(--primary-cyan)' : 'var(--accent-amber)',
              borderRadius: '12px',
              padding: '0.45rem 0.65rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            <Scale size={14} />
            <span>{currentWeight ? `${currentWeight} kg` : 'Log Weight'}</span>
          </button>

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
              padding: '0.55rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            <Plane size={18} />
          </button>

          <button
            onClick={onOpenSettings}
            title="Open Settings"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-main)',
              borderRadius: '12px',
              padding: '0.55rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Date Navigator Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(2, 6, 23, 0.5)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
        <button
          onClick={handlePrevDay}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem 0.4rem', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={18} />
        </button>

        <label style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: isToday ? 'var(--primary-cyan)' : 'var(--accent-amber)' }}>
          <Calendar size={14} />
          <span>{isToday ? `Today (${formattedDate})` : formattedDate}</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, cursor: 'pointer' }}
          />
        </label>

        <button
          onClick={handleNextDay}
          disabled={isToday}
          style={{ background: 'none', border: 'none', color: isToday ? 'var(--text-dim)' : 'var(--text-muted)', cursor: isToday ? 'default' : 'pointer', padding: '0.2rem 0.4rem', display: 'flex', alignItems: 'center' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </header>
  );
}
