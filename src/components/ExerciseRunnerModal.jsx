import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckSquare, Square, Timer, Check, X, History, Dumbbell, Award, ArrowRight } from 'lucide-react';

export default function ExerciseRunnerModal({ exercise, pastRecord, onSaveExerciseSets, onClose }) {
  const [sets, setSets] = useState(
    exercise.sets && exercise.sets.length > 0
      ? exercise.sets
      : [
          { setNum: 1, weight: 60, reps: 10, completed: false },
          { setNum: 2, weight: 60, reps: 10, completed: false },
          { setNum: 3, weight: 60, reps: 10, completed: false },
          { setNum: 4, weight: 60, reps: 10, completed: false }
        ]
  );

  // Background-Persistent Start Timestamp
  const [startedAt] = useState(exercise.startedAt || Date.now());

  // Real-time elapsed duration calculation based on timestamp (persists even if modal is closed!)
  const [elapsedSecs, setElapsedSecs] = useState(() => Math.floor((Date.now() - startedAt) / 1000));

  // Rest Timer State
  const restDurationSec = exercise.restSec || 120;
  const [restSeconds, setRestSeconds] = useState(0);
  const [restActive, setRestActive] = useState(false);

  // Persistent Real-Time Elapsed Timer Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSecs(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  // Rest Timer Effect
  useEffect(() => {
    let interval = null;
    if (restActive && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => prev - 1);
      }, 1000);
    } else if (restSeconds === 0 && restActive) {
      setRestActive(false);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch (e) {
        console.log('Audio chime error', e);
      }
    }
    return () => clearInterval(interval);
  }, [restActive, restSeconds]);

  const startRestTimer = () => {
    setRestSeconds(restDurationSec);
    setRestActive(true);
  };

  const handleUpdateSet = (idx, field, val) => {
    const updated = [...sets];
    updated[idx][field] = val;
    setSets(updated);

    if (field === 'completed' && val === true) {
      startRestTimer();
    }
  };

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1] || { weight: 60, reps: 10 };
    setSets([
      ...sets,
      { setNum: sets.length + 1, weight: lastSet.weight, reps: lastSet.reps, completed: false }
    ]);
  };

  const handleFinishExercise = () => {
    onSaveExerciseSets(sets, elapsedSecs, startedAt);
    onClose();
  };

  const formatMinSec = (totalSecs) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            {exercise.isSuperset && (
              <span className="badge badge-amber" style={{ marginBottom: '0.2rem' }}>SUPERSET FOCUS</span>
            )}
            <h2 style={{ fontSize: '1.3rem', margin: '0.2rem 0', color: exercise.isSuperset ? 'var(--accent-amber)' : 'var(--text-main)' }}>
              {exercise.name}
            </h2>
            {exercise.note && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exercise.note}</div>
            )}
            {pastRecord && (
              <div style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                <History size={13} /> Last time: <strong>{pastRecord}</strong>
              </div>
            )}
          </div>

          <button onClick={onClose} title="Close view (timer continues in background)" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Elapsed Timer & Rest Timer Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {/* Total Elapsed Time (Persistent Timestamp Based) */}
          <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '0.85rem', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <Timer size={12} color="var(--primary-cyan)" /> Running Timer (Persistent)
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--primary-cyan)', marginTop: '0.25rem' }}>
              {formatMinSec(elapsedSecs)}
            </div>
          </div>

          {/* Rest Timer */}
          <div style={{
            background: restActive ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))' : 'rgba(2, 6, 23, 0.6)',
            border: restActive ? '1px solid var(--primary-cyan)' : '1px solid var(--border-card)',
            padding: '0.85rem',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <Timer size={12} color="var(--accent-amber)" /> Rest Timer ({restDurationSec}s)
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: restActive ? 'var(--accent-amber)' : 'var(--text-muted)', marginTop: '0.25rem' }}>
              {restSeconds > 0 ? formatMinSec(restSeconds) : 'Ready'}
            </div>
          </div>
        </div>

        {/* Set Logger Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
          {sets.map((set, idx) => {
            const oneRepMax = Math.round((Number(set.weight) || 0) * (1 + (Number(set.reps) || 0) / 30));
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: set.completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 6, 23, 0.6)',
                  border: set.completed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-card)',
                  borderRadius: '14px',
                  padding: '0.75rem 1rem'
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', width: '45px' }}>
                  Set {set.setNum}
                </span>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input
                    type="number"
                    value={set.weight}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleUpdateSet(idx, 'weight', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="input-field"
                    style={{ padding: '0.45rem', textAlign: 'center', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>kg</span>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input
                    type="number"
                    value={set.reps}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleUpdateSet(idx, 'reps', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="input-field"
                    style={{ padding: '0.45rem', textAlign: 'center', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>reps</span>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', width: '55px', textAlign: 'right' }}>
                  1RM: {oneRepMax}k
                </div>

                <button
                  onClick={() => handleUpdateSet(idx, 'completed', !set.completed)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                >
                  {set.completed ? <CheckSquare color="var(--accent-emerald)" size={24} /> : <Square color="var(--text-dim)" size={24} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Buttons: + Add Set & Finish Exercise */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleAddSet} className="btn-secondary" style={{ flex: 1 }}>
            + Add Set
          </button>

          <button onClick={handleFinishExercise} className="btn-emerald" style={{ flex: 2 }}>
            Finish Exercise <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
