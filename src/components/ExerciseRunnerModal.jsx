import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckSquare, Square, Timer, Check, X, History, Dumbbell, Award, ArrowRight, CheckCircle2, Layers } from 'lucide-react';

export default function ExerciseRunnerModal({ exercise, pastRecord, onSaveExerciseSets, onStartRestTimer, onClose }) {
  const isSuperset = exercise.isSuperset || (exercise.subExercises && exercise.subExercises.length > 0);
  const subA = exercise.subExercises && exercise.subExercises[0] ? exercise.subExercises[0] : 'Movement A';
  const subB = exercise.subExercises && exercise.subExercises[1] ? exercise.subExercises[1] : 'Movement B';

  const defaultSets = isSuperset
    ? [
        { setNum: 1, exAWeight: 60, exAReps: 8, exAChecked: false, exBWeight: 0, exBReps: 10, exBChecked: false },
        { setNum: 2, exAWeight: 60, exAReps: 8, exAChecked: false, exBWeight: 0, exBReps: 10, exBChecked: false },
        { setNum: 3, exAWeight: 60, exAReps: 8, exAChecked: false, exBWeight: 0, exBReps: 10, exBChecked: false },
        { setNum: 4, exAWeight: 60, exAReps: 8, exAChecked: false, exBWeight: 0, exBReps: 10, exBChecked: false }
      ]
    : [
        { setNum: 1, weight: 60, reps: 10, completed: false },
        { setNum: 2, weight: 60, reps: 10, completed: false },
        { setNum: 3, weight: 60, reps: 10, completed: false },
        { setNum: 4, weight: 60, reps: 10, completed: false }
      ];

  const [sets, setSets] = useState(
    exercise.sets && exercise.sets.length > 0 ? exercise.sets : defaultSets
  );

  const isCompleted = exercise.completed || false;
  const [startedAt] = useState(exercise.startedAt || Date.now());

  const [elapsedSecs, setElapsedSecs] = useState(() => {
    if (isCompleted) {
      return exercise.durationSecs || 0;
    }
    return Math.floor((Date.now() - startedAt) / 1000);
  });

  // Rest Timer State & Finished Alert
  const restDurationSec = exercise.restSec || 120;
  const [restSeconds, setRestSeconds] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [restExpired, setRestExpired] = useState(false);
  const [restTargetEndMs, setRestTargetEndMs] = useState(null);

  // Exercise Running Duration Clock (Resilient to app switching)
  useEffect(() => {
    if (isCompleted) return;
    const updateElapsed = () => {
      setElapsedSecs(Math.floor((Date.now() - startedAt) / 1000));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateElapsed();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [startedAt, isCompleted]);

  // Rest Countdown Timer (Resilient to app switching & backgrounding)
  useEffect(() => {
    let interval = null;
    if (restActive && restTargetEndMs) {
      const checkRest = () => {
        const now = Date.now();
        const diffSecs = Math.ceil((restTargetEndMs - now) / 1000);
        if (diffSecs <= 0) {
          setRestSeconds(0);
          setRestActive(false);
          setRestTargetEndMs(null);
          setRestExpired(true);
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
        } else {
          setRestSeconds(diffSecs);
        }
      };

      checkRest();
      interval = setInterval(checkRest, 1000);

      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          checkRest();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }
  }, [restActive, restTargetEndMs]);

  const startRestTimer = () => {
    if (isCompleted) return;
    const targetEnd = Date.now() + restDurationSec * 1000;
    setRestTargetEndMs(targetEnd);
    setRestExpired(false);
    setRestSeconds(restDurationSec);
    setRestActive(true);

    if (typeof onStartRestTimer === 'function') {
      onStartRestTimer(restDurationSec);
    }
  };

  const handleUpdateNormalSet = (idx, field, val) => {
    const updated = [...sets];
    updated[idx][field] = val;
    setSets(updated);

    if (field === 'completed' && val === true && !isCompleted) {
      startRestTimer();
    }
  };

  const handleUpdateSuperset = (idx, field, val) => {
    const updated = [...sets];
    updated[idx][field] = val;
    setSets(updated);

    if ((field === 'exAChecked' || field === 'exBChecked') && val === true && !isCompleted) {
      if (updated[idx].exAChecked && updated[idx].exBChecked) {
        startRestTimer();
      }
    }
  };

  const handleAddSet = () => {
    if (isSuperset) {
      const last = sets[sets.length - 1] || { exAWeight: 60, exAReps: 8, exBWeight: 0, exBReps: 10 };
      setSets([
        ...sets,
        {
          setNum: sets.length + 1,
          exAWeight: last.exAWeight,
          exAReps: last.exAReps,
          exAChecked: false,
          exBWeight: last.exBWeight,
          exBReps: last.exBReps,
          exBChecked: false
        }
      ]);
    } else {
      const lastSet = sets[sets.length - 1] || { weight: 60, reps: 10 };
      setSets([
        ...sets,
        { setNum: sets.length + 1, weight: lastSet.weight, reps: lastSet.reps, completed: false }
      ]);
    }
  };

  const handleFinishExercise = () => {
    try {
      if (typeof onSaveExerciseSets === 'function') {
        onSaveExerciseSets(sets, elapsedSecs, startedAt);
      }
    } catch (e) {
      console.error('Error saving exercise sets:', e);
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const formatMinSec = (totalSecs) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            {isCompleted ? (
              <span className="badge badge-emerald" style={{ marginBottom: '0.2rem' }}>
                <CheckCircle2 size={12} /> COMPLETED EXERCISE (DONE ✓)
              </span>
            ) : isSuperset ? (
              <span className="badge badge-amber" style={{ marginBottom: '0.2rem' }}>
                <Layers size={12} /> ALTERNATING SUPERSET
              </span>
            ) : null}
            <h2 style={{ fontSize: '1.3rem', margin: '0.2rem 0', color: isSuperset ? 'var(--accent-amber)' : 'var(--text-main)' }}>
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

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Elapsed Timer / Frozen Duration & Rest Timer Card */}
        <div style={{ display: 'grid', gridTemplateColumns: isCompleted ? '1fr' : '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: isCompleted ? '1px solid var(--accent-emerald)' : '1px solid var(--border-card)', padding: '0.85rem', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <Timer size={12} color={isCompleted ? 'var(--accent-emerald)' : 'var(--primary-cyan)'} />
              {isCompleted ? 'Completed Duration (Timer Stopped)' : 'Running Timer (Persistent)'}
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: isCompleted ? 'var(--accent-emerald)' : 'var(--primary-cyan)', marginTop: '0.25rem' }}>
              {formatMinSec(elapsedSecs)}
            </div>
          </div>

          {!isCompleted && (
            <div style={{
              background: restExpired
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95))'
                : restActive
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))'
                : 'rgba(2, 6, 23, 0.6)',
              border: restExpired ? '2px solid #ef4444' : restActive ? '1px solid var(--primary-cyan)' : '1px solid var(--border-card)',
              padding: '0.85rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: restExpired ? '0 0 20px rgba(239, 68, 68, 0.5)' : 'none'
            }}>
              <div style={{ fontSize: '0.7rem', color: restExpired ? '#ffffff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontWeight: restExpired ? 700 : 400 }}>
                <Timer size={12} color={restExpired ? '#ffffff' : 'var(--accent-amber)'} />
                {restExpired ? '⏰ REST FINISHED!' : `Rest Timer (${restDurationSec}s)`}
              </div>

              {restExpired ? (
                <button
                  onClick={() => setRestExpired(false)}
                  style={{
                    marginTop: '0.35rem',
                    background: '#ffffff',
                    border: 'none',
                    color: '#dc2626',
                    padding: '0.3rem 1rem',
                    borderRadius: '10px',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  OK
                </button>
              ) : (
                <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: restActive ? 'var(--accent-amber)' : 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {restSeconds > 0 ? formatMinSec(restSeconds) : 'Ready'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SET LOGGING INPUTS: ALTERNATING SUPERSET vs NORMAL SETS */}
        {isSuperset ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
            {sets.map((set, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(2, 6, 23, 0.7)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '16px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-amber)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>SUPERSET PAIR #{set.setNum}</span>
                  {set.exAChecked && set.exBChecked && <span className="badge badge-emerald">ROUND DONE ✓</span>}
                </div>

                {/* Sub Exercise A */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: set.exAChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.85rem', borderRadius: '12px' }}>
                  <div style={{ flex: 2, fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-cyan)' }}>
                    🏋️ {subA}
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <input
                      type="number"
                      value={set.exAWeight ?? set.weight ?? 60}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleUpdateSuperset(idx, 'exAWeight', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="input-field"
                      style={{ padding: '0.35rem', textAlign: 'center', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kg</span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <input
                      type="number"
                      value={set.exAReps ?? set.reps ?? 8}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleUpdateSuperset(idx, 'exAReps', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      className="input-field"
                      style={{ padding: '0.35rem', textAlign: 'center', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>reps</span>
                  </div>

                  <button
                    onClick={() => handleUpdateSuperset(idx, 'exAChecked', !set.exAChecked)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    {set.exAChecked ? <CheckSquare color="var(--accent-emerald)" size={22} /> : <Square color="var(--text-dim)" size={22} />}
                  </button>
                </div>

                {/* Sub Exercise B */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: set.exBChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.85rem', borderRadius: '12px' }}>
                  <div style={{ flex: 2, fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                    🏋️ {subB}
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <input
                      type="number"
                      value={set.exBWeight ?? 0}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleUpdateSuperset(idx, 'exBWeight', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="input-field"
                      style={{ padding: '0.35rem', textAlign: 'center', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kg</span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <input
                      type="number"
                      value={set.exBReps ?? 10}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleUpdateSuperset(idx, 'exBReps', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      className="input-field"
                      style={{ padding: '0.35rem', textAlign: 'center', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>reps</span>
                  </div>

                  <button
                    onClick={() => handleUpdateSuperset(idx, 'exBChecked', !set.exBChecked)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    {set.exBChecked ? <CheckSquare color="var(--accent-emerald)" size={22} /> : <Square color="var(--text-dim)" size={22} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* NORMAL SINGLE EXERCISE LOGGING */
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
                      onChange={(e) => handleUpdateNormalSet(idx, 'weight', e.target.value === '' ? '' : parseFloat(e.target.value))}
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
                      onChange={(e) => handleUpdateNormalSet(idx, 'reps', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      className="input-field"
                      style={{ padding: '0.45rem', textAlign: 'center', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>reps</span>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', width: '55px', textAlign: 'right' }}>
                    1RM: {oneRepMax}k
                  </div>

                  <button
                    onClick={() => handleUpdateNormalSet(idx, 'completed', !set.completed)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    {set.completed ? <CheckSquare color="var(--accent-emerald)" size={24} /> : <Square color="var(--text-dim)" size={24} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleAddSet} className="btn-secondary" style={{ flex: 1 }}>
            + Add Set
          </button>

          <button onClick={handleFinishExercise} className="btn-emerald" style={{ flex: 2 }}>
            {isCompleted ? 'Save Changes' : 'Finish Exercise'} <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
