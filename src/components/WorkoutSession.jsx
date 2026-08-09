import React, { useState, useEffect } from 'react';
import { Dumbbell, Flame, Timer, CheckSquare, Square, Plus, Play, Pause, RotateCcw, HeartPulse, Sparkles, Calendar, Zap, Layers } from 'lucide-react';
import { WEEKLY_WORKOUT_SPLIT, MON_WED_FRI_ROUTINE, PRESET_EXERCISES } from '../utils/constants';

export default function WorkoutSession({ dailyLog, onUpdateLog }) {
  // Get current day name (e.g., Saturday, Sunday, Monday...)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[new Date().getDay()];

  const [selectedDay, setSelectedDay] = useState(todayDayName);
  const [activeStage, setActiveStage] = useState('warmup'); // 'warmup' | 'main' | 'cooldown'

  const currentDayProgram = WEEKLY_WORKOUT_SPLIT[selectedDay] || WEEKLY_WORKOUT_SPLIT.Saturday;
  const isMonWedFri = ['Monday', 'Wednesday', 'Friday'].includes(selectedDay);

  // Warmup state
  const warmupCompleted = dailyLog?.warmupCompleted || false;
  const [warmupChecks, setWarmupChecks] = useState(dailyLog?.warmupChecks || {});

  // Mon/Wed/Fri special routine state
  const [mwfChecks, setMwfChecks] = useState(dailyLog?.mwfChecks || {});

  // Cooldown state
  const cooldownCompleted = dailyLog?.cooldownCompleted || false;
  const [cooldownChecks, setCooldownChecks] = useState(dailyLog?.cooldownChecks || {});

  // Main Exercises & Sets state
  const exercises = dailyLog?.exercises || [];
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_EXERCISES[0].id);

  // Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      // Web audio chime alert
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
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

  const startRestTimer = (secs) => {
    if (!secs) return;
    setTimerSeconds(secs);
    setTimerActive(true);
  };

  const handleToggleWarmupCheck = (id, restSec) => {
    const next = { ...warmupChecks, [id]: !warmupChecks[id] };
    setWarmupChecks(next);
    const allDone = currentDayProgram.warmup.every((w) => next[w.id]);
    onUpdateLog({ warmupChecks: next, warmupCompleted: allDone });

    if (!warmupChecks[id] && restSec) {
      startRestTimer(restSec);
    }
  };

  const handleToggleMwfCheck = (id) => {
    const next = { ...mwfChecks, [id]: !mwfChecks[id] };
    setMwfChecks(next);
    onUpdateLog({ mwfChecks: next });
  };

  const handleToggleCooldownCheck = (id) => {
    const next = { ...cooldownChecks, [id]: !cooldownChecks[id] };
    setCooldownChecks(next);
    const allDone = currentDayProgram.cooldown.every((c) => next[c.id]);
    onUpdateLog({ cooldownChecks: next, cooldownCompleted: allDone });
  };

  const handleAddProgramExercise = (progEx) => {
    const existingIdx = exercises.findIndex((e) => e.exerciseId === progEx.id);
    let updatedExercises = [...exercises];

    const targetSetsCount = progEx.targetSets || 4;
    const initialSets = [];
    for (let i = 1; i <= targetSetsCount; i++) {
      initialSets.push({ setNum: i, weight: 60, reps: progEx.targetReps || 10, completed: false });
    }

    if (existingIdx < 0) {
      updatedExercises.push({
        exerciseId: progEx.id,
        name: progEx.name,
        isSuperset: progEx.isSuperset || false,
        subExercises: progEx.subExercises || [],
        restSec: progEx.restSec || 120,
        note: progEx.note || '',
        sets: initialSets
      });
      onUpdateLog({ exercises: updatedExercises });
    }
  };

  const handleAddCustomPreset = () => {
    const exObj = PRESET_EXERCISES.find((e) => e.id === selectedPresetId);
    if (!exObj) return;

    let updatedExercises = [...exercises];
    const existingIdx = exercises.findIndex((e) => e.exerciseId === selectedPresetId);

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
        restSec: 120,
        sets: [newSet]
      });
    }

    onUpdateLog({ exercises: updatedExercises });
  };

  const handleUpdateSet = (exIdx, setIdx, field, val) => {
    const updatedExercises = JSON.parse(JSON.stringify(exercises));
    updatedExercises[exIdx].sets[setIdx][field] = val;

    // Trigger specified rest timer when set is checked complete
    if (field === 'completed' && val === true) {
      const restDuration = updatedExercises[exIdx].restSec || 120;
      startRestTimer(restDuration);
    }

    onUpdateLog({ exercises: updatedExercises });
  };

  const handleDeleteExercise = (exIdx) => {
    const updated = exercises.filter((_, idx) => idx !== exIdx);
    onUpdateLog({ exercises: updated });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
      {/* Rest Timer Active Banner */}
      {timerSeconds > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.95), rgba(59, 130, 246, 0.95))',
          padding: '0.85rem 1.25rem',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff',
          boxShadow: '0 8px 25px var(--primary-cyan-glow)',
          position: 'sticky',
          top: '70px',
          zIndex: 840
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Timer size={22} className="spin" />
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                Rest Countdown
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

      {/* Day Selector Tabs */}
      <div className="glass-card" style={{ padding: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={14} color="var(--primary-cyan)" /> Select Workout Day:
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => {
            const isToday = d === todayDayName;
            const isSelected = d === selectedDay;
            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid var(--primary-cyan)' : '1px solid var(--border-card)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? 'var(--primary-cyan)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {d.slice(0, 3)} {isToday && '⭐'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Day Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(15, 23, 42, 0.8))', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge badge-cyan">{currentDayProgram.tag}</span>
            <h2 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{currentDayProgram.dayName}</h2>
          </div>
          <Zap color="var(--primary-cyan)" size={24} />
        </div>
      </div>

      {/* Special Mon / Wed / Fri Routine Banner */}
      {isMonWedFri && (
        <div className="glass-card" style={{ borderColor: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Sparkles color="var(--accent-amber)" size={20} />
            <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-amber)', margin: 0 }}>
              Mon / Wed / Fri Cardio & Calves / Tibialis Routine
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {MON_WED_FRI_ROUTINE.items.map((item) => {
              const isChecked = mwfChecks[item.id] || false;
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleMwfCheck(item.id)}
                  style={{
                    background: isChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 6, 23, 0.5)',
                    border: isChecked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-card)',
                    borderRadius: '12px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {isChecked ? <CheckSquare color="var(--accent-emerald)" size={18} /> : <Square color="var(--text-dim)" size={18} />}
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isChecked ? 'var(--accent-emerald)' : 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      {item.isSuperset ? (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                          {item.exercises.join(' → ')} ({item.sets} sets, {item.rest} rest)
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Target: {item.reps} {item.sets ? `(${item.sets} sets)` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="badge badge-amber" style={{ fontSize: '0.6rem' }}>{item.category}</span>
                </div>
              );
            })}
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
          <Flame size={16} /> Warmup {warmupCompleted && '✓'}
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
          <Dumbbell size={16} /> Main Workout
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
          <HeartPulse size={16} /> Stretch/Abs {cooldownCompleted && '✓'}
        </button>
      </div>

      {/* STAGE 1: WARMUP */}
      {activeStage === 'warmup' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <span className="badge badge-amber"><Flame size={12} /> STAGE 1: WARMUP</span>
              <h3 style={{ fontSize: '1.15rem', marginTop: '0.25rem' }}>{currentDayProgram.warmupTitle}</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {currentDayProgram.warmup.map((item) => {
              const isChecked = warmupChecks[item.id] || false;
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleWarmupCheck(item.id, item.rest)}
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
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isChecked ? 'var(--accent-emerald)' : 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Target: {item.reps || item.duration} {item.rest ? `(${item.rest}s rest)` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setActiveStage('main')}
            className="btn-primary"
            style={{ width: '100%', marginTop: '1.25rem' }}
          >
            Proceed to Main Workout Exercises <Dumbbell size={16} />
          </button>
        </div>
      )}

      {/* STAGE 2: MAIN EXERCISES & SUPERSETS */}
      {activeStage === 'main' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Preset Exercises Picker for Current Day */}
          <div className="glass-card">
            <h3 style={{ fontSize: '0.95rem', color: 'var(--primary-cyan)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Layers size={16} /> Load Presets for {selectedDay}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {currentDayProgram.mainExercises.map((progEx) => {
                const isLoaded = exercises.some((e) => e.exerciseId === progEx.id);
                return (
                  <div
                    key={progEx.id}
                    style={{
                      background: 'rgba(2, 6, 23, 0.6)',
                      border: progEx.isSuperset ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-card)',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: progEx.isSuperset ? 'var(--accent-amber)' : 'var(--text-main)' }}>
                        {progEx.name}
                      </div>
                      {progEx.isSuperset && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                          {progEx.subExercises?.join(' + ')}
                        </div>
                      )}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {progEx.targetSets} sets | {progEx.note}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddProgramExercise(progEx)}
                      disabled={isLoaded}
                      className={isLoaded ? 'btn-secondary' : 'btn-primary'}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    >
                      {isLoaded ? 'Loaded ✓' : '+ Add Exercise'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Custom Exercise Selector */}
            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-card)' }}>
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="input-field"
                style={{ flex: 1 }}
              >
                {PRESET_EXERCISES.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name} ({ex.muscle})</option>
                ))}
              </select>

              <button onClick={handleAddCustomPreset} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                <Plus size={16} /> Custom Set
              </button>
            </div>
          </div>

          {/* Quick Rest Timer Controller */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(2, 6, 23, 0.4)', padding: '0.65rem 1rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick Rest:</span>
            {[60, 120, 180, 240].map((s) => (
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
                {s < 120 ? `${s}s` : `${s / 60}m`}
              </button>
            ))}
          </div>

          {/* Active Logged Exercises List */}
          {exercises.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
              Tap <strong>+ Add Exercise</strong> on any preset above to begin logging sets & weight!
            </div>
          ) : (
            exercises.map((ex, exIdx) => (
              <div
                key={exIdx}
                className="glass-card"
                style={{ borderColor: ex.isSuperset ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-card)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    {ex.isSuperset && (
                      <span className="badge badge-amber" style={{ marginBottom: '0.2rem' }}>SUPERSET</span>
                    )}
                    <h3 style={{ fontSize: '1.1rem', margin: 0, color: ex.isSuperset ? 'var(--accent-amber)' : 'var(--text-main)' }}>
                      {ex.name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.note}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteExercise(exIdx)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
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

                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', width: '60px', textAlign: 'right' }}>
                          1RM: {oneRepMax}k
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

      {/* STAGE 3: STRETCH & ABS COOLDOWN */}
      {activeStage === 'cooldown' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <span className="badge badge-emerald"><HeartPulse size={12} /> STAGE 3: COOLDOWN & ABS</span>
              <h3 style={{ fontSize: '1.15rem', marginTop: '0.25rem' }}>Abs Finisher & Stretch Routine</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {currentDayProgram.cooldown.map((item) => {
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
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isChecked ? 'var(--accent-emerald)' : 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Target: {item.reps || item.duration} {item.targetSets ? `(${item.targetSets} sets)` : ''}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${item.type === 'abs' ? 'badge-cyan' : 'badge-emerald'}`} style={{ fontSize: '0.65rem' }}>
                    {item.type ? item.type.toUpperCase() : 'STRETCH'}
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
