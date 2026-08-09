import React, { useState, useEffect } from 'react';
import { Dumbbell, Flame, Timer, CheckSquare, Square, Plus, Play, Pause, RotateCcw, Sparkles, HeartPulse, Trophy } from 'lucide-react';
import { CALISTHENICS_WARMUP, STRETCH_AND_ABS_COOLDOWN, PRESET_EXERCISES } from '../utils/constants';

export default function WorkoutSession({ dailyLog, onUpdateLog }) {
  const [activeStage, setActiveStage] = useState('warmup'); // 'warmup' | 'main' | 'cooldown'

  // Warmup state
  const warmupCompleted = dailyLog?.warmupCompleted || false;
  const [warmupChecks, setWarmupChecks] = useState(dailyLog?.warmupChecks || {});

  // Cooldown state
  const cooldownCompleted = dailyLog?.cooldownCompleted || false;
  const [cooldownChecks, setCooldownChecks] = useState(dailyLog?.cooldownChecks || {});

  // Main Exercises state
  const exercises = dailyLog?.exercises || [];
  const [selectedExerciseId, setSelectedExerciseId] = useState(PRESET_EXERCISES[0].id);

  // Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      // Play web audio chime sound
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {
        console.log('Audio chime error', e);
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const handleToggleWarmupCheck = (id) => {
    const next = { ...warmupChecks, [id]: !warmupChecks[id] };
    setWarmupChecks(next);
    const allDone = CALISTHENICS_WARMUP.every((w) => next[w.id]);
    onUpdateLog({ warmupChecks: next, warmupCompleted: allDone });
  };

  const handleToggleCooldownCheck = (id) => {
    const next = { ...cooldownChecks, [id]: !cooldownChecks[id] };
    setCooldownChecks(next);
    const allDone = STRETCH_AND_ABS_COOLDOWN.every((c) => next[c.id]);
    onUpdateLog({ cooldownChecks: next, cooldownCompleted: allDone });
  };

  const handleAddExerciseSet = () => {
    const exObj = PRESET_EXERCISES.find((e) => e.id === selectedExerciseId);
    if (!exObj) return;

    const existingIdx = exercises.findIndex((e) => e.exerciseId === selectedExerciseId);
    let updatedExercises = [...exercises];

    const newSet = {
      setNum: existingIdx >= 0 ? updatedExercises[existingIdx].sets.length + 1 : 1,
      weight: 60,
      reps: 10,
      completed: false
    };

    if (existingIdx >= 0) {
      updatedExercises[existingIdx].sets.push(newSet);
    } else {
      updatedExercises.push({
        exerciseId: exObj.id,
        name: exObj.name,
        muscle: exObj.muscle,
        sets: [newSet]
      });
    }

    onUpdateLog({ exercises: updatedExercises });
  };

  const handleUpdateSet = (exIdx, setIdx, field, val) => {
    const updatedExercises = JSON.parse(JSON.stringify(exercises));
    updatedExercises[exIdx].sets[setIdx][field] = val;

    // Trigger rest timer if set was checked completed
    if (field === 'completed' && val === true) {
      startRestTimer(90);
    }

    onUpdateLog({ exercises: updatedExercises });
  };

  const handleDeleteExercise = (exIdx) => {
    const updated = exercises.filter((_, idx) => idx !== exIdx);
    onUpdateLog({ exercises: updated });
  };

  const startRestTimer = (secs) => {
    setTimerSeconds(secs);
    setTimerActive(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
      {/* Rest Timer Overlay Banner */}
      {timerSeconds > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.95), rgba(59, 130, 246, 0.95))',
          padding: '0.85rem 1.25rem',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff',
          boxShadow: '0 8px 25px var(--primary-cyan-glow)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Timer size={22} className="spin" />
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                Rest Timer Active
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
                {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setTimerActive(!timerActive)}
              style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '10px', cursor: 'pointer' }}
            >
              {timerActive ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={() => { setTimerSeconds(0); setTimerActive(false); }}
              style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '10px', cursor: 'pointer' }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Stage Selector Pills */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setActiveStage('warmup')}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '14px',
            border: activeStage === 'warmup' ? '1px solid var(--accent-amber)' : '1px solid var(--border-card)',
            background: activeStage === 'warmup' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.6)',
            color: activeStage === 'warmup' ? 'var(--accent-amber)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          <Flame size={16} /> 1. Warmup {warmupCompleted && '✓'}
        </button>

        <button
          onClick={() => setActiveStage('main')}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '14px',
            border: activeStage === 'main' ? '1px solid var(--primary-cyan)' : '1px solid var(--border-card)',
            background: activeStage === 'main' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.6)',
            color: activeStage === 'main' ? 'var(--primary-cyan)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          <Dumbbell size={16} /> 2. Gym Sets
        </button>

        <button
          onClick={() => setActiveStage('cooldown')}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '14px',
            border: activeStage === 'cooldown' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-card)',
            background: activeStage === 'cooldown' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
            color: activeStage === 'cooldown' ? 'var(--accent-emerald)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          <HeartPulse size={16} /> 3. Stretch/Abs {cooldownCompleted && '✓'}
        </button>
      </div>

      {/* STAGE 1: Warmup Calisthenics Routine */}
      {activeStage === 'warmup' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <span className="badge badge-amber"><Flame size={12} /> STAGE 1: CALISTHENICS WARMUP</span>
              <h2 style={{ fontSize: '1.2rem', marginTop: '0.25rem' }}>Dynamic Warm-Up Routine</h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {CALISTHENICS_WARMUP.map((item) => {
              const isChecked = warmupChecks[item.id] || false;
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleWarmupCheck(item.id)}
                  style={{
                    background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(2, 6, 23, 0.5)',
                    border: isChecked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-card)',
                    borderRadius: '14px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isChecked ? <CheckSquare color="var(--accent-emerald)" size={20} /> : <Square color="var(--text-dim)" size={20} />}
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isChecked ? 'var(--accent-emerald)' : 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Target: {item.reps} ({item.duration})
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>{item.category}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setActiveStage('main')}
            className="btn-primary"
            style={{ width: '100%', marginTop: '1.25rem' }}
          >
            Proceed to Main Gym Exercises <Dumbbell size={16} />
          </button>
        </div>
      )}

      {/* STAGE 2: Main Gym Exercises & Rest Timer */}
      {activeStage === 'main' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Add Exercise Controller */}
          <div className="glass-card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="input-field"
              style={{ flex: 1 }}
            >
              {PRESET_EXERCISES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.muscle})
                </option>
              ))}
            </select>

            <button onClick={handleAddExerciseSet} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
              <Plus size={16} /> Add Exercise
            </button>
          </div>

          {/* Preset Rest Timers Quick Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(2, 6, 23, 0.4)', padding: '0.65rem 1rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Rest:</span>
            {[60, 90, 120, 180].map((s) => (
              <button
                key={s}
                onClick={() => startRestTimer(s)}
                style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  color: 'var(--primary-cyan)',
                  borderRadius: '8px',
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {s}s
              </button>
            ))}
          </div>

          {/* Exercise Sets List */}
          {exercises.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
              No exercises added to today's session yet. Select an exercise above and tap <strong>Add Exercise</strong>!
            </div>
          ) : (
            exercises.map((ex, exIdx) => (
              <div key={exIdx} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>{ex.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)' }}>Target Muscle: {ex.muscle}</span>
                  </div>
                  <button onClick={() => handleDeleteExercise(exIdx)} style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '0.75rem' }}>
                    Remove
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ex.sets.map((set, setIdx) => {
                    const oneRepMax = Math.round((Number(set.weight) || 0) * (1 + (Number(set.reps) || 0) / 30));
                    return (
                      <div
                        key={setIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          background: set.completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(2, 6, 23, 0.5)',
                          border: set.completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-card)',
                          borderRadius: '12px',
                          padding: '0.6rem 0.85rem'
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', width: '45px' }}>
                          Set {set.setNum}
                        </span>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) => handleUpdateSet(exIdx, setIdx, 'weight', parseFloat(e.target.value))}
                            className="input-field"
                            style={{ padding: '0.4rem', textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>kg</span>
                        </div>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => handleUpdateSet(exIdx, setIdx, 'reps', parseInt(e.target.value, 10))}
                            className="input-field"
                            style={{ padding: '0.4rem', textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>reps</span>
                        </div>

                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', width: '65px', textAlign: 'right' }}>
                          Est 1RM: {oneRepMax}k
                        </div>

                        <button
                          onClick={() => handleUpdateSet(exIdx, setIdx, 'completed', !set.completed)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                        >
                          {set.completed ? <CheckSquare color="var(--accent-emerald)" size={22} /> : <Square color="var(--text-dim)" size={22} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <button onClick={() => setActiveStage('cooldown')} className="btn-emerald" style={{ width: '100%' }}>
            Complete Main Workout & Start Stretch/Abs <HeartPulse size={16} />
          </button>
        </div>
      )}

      {/* STAGE 3: Cooldown Stretch & Abs Routine */}
      {activeStage === 'cooldown' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <span className="badge badge-emerald"><HeartPulse size={12} /> STAGE 3: STRETCH & ABS COOLDOWN</span>
              <h2 style={{ fontSize: '1.2rem', marginTop: '0.25rem' }}>Abs Finisher & Full-Body Stretch</h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {STRETCH_AND_ABS_COOLDOWN.map((item) => {
              const isChecked = cooldownChecks[item.id] || false;
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleCooldownCheck(item.id)}
                  style={{
                    background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(2, 6, 23, 0.5)',
                    border: isChecked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-card)',
                    borderRadius: '14px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isChecked ? <CheckSquare color="var(--accent-emerald)" size={20} /> : <Square color="var(--text-dim)" size={20} />}
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isChecked ? 'var(--accent-emerald)' : 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.reps || item.duration} ({item.target})
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${item.type === 'abs' ? 'badge-cyan' : 'badge-emerald'}`} style={{ fontSize: '0.65rem' }}>
                    {item.type.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
