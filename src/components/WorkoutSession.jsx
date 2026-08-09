import React, { useState, useEffect } from 'react';
import { Dumbbell, Flame, Timer, CheckSquare, Square, Plus, Play, Pause, RotateCcw, HeartPulse, Sparkles, Calendar, Zap, Layers, History, FlameKindling, Check, Trash2, Edit2, X, Award, AlertTriangle, ArrowRight } from 'lucide-react';
import { WEEKLY_WORKOUT_SPLIT, MON_WED_FRI_ROUTINE, PRESET_EXERCISES } from '../utils/constants';
import ExerciseRunnerModal from './ExerciseRunnerModal';

export default function WorkoutSession({ dailyLog, allDailyLogs, onUpdateLog }) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[new Date().getDay()];

  const [selectedDay, setSelectedDay] = useState(todayDayName);
  const [activeStage, setActiveStage] = useState('main');

  const currentDayProgram = WEEKLY_WORKOUT_SPLIT[selectedDay] || WEEKLY_WORKOUT_SPLIT.Saturday;
  const isMonWedFri = ['Monday', 'Wednesday', 'Friday'].includes(selectedDay);

  // Overall Workout Active State & Timer
  const [workoutActive, setWorkoutActive] = useState(dailyLog?.workoutActive || false);
  const [workoutElapsedSecs, setWorkoutElapsedSecs] = useState(dailyLog?.workoutDurationSecs || 0);

  // Workout Summary Modal State
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  // Delete Confirmation Modal State
  const [deletingExIdx, setDeletingExIdx] = useState(null);

  // Special Checkboxes State
  const calisthenicsCompleted = dailyLog?.calisthenicsCompleted || false;
  const saunaCompleted = dailyLog?.saunaCompleted || false;

  // Warmup & Cooldown state
  const warmupCompleted = dailyLog?.warmupCompleted || false;
  const [warmupChecks, setWarmupChecks] = useState(dailyLog?.warmupChecks || {});
  const [mwfChecks, setMwfChecks] = useState(dailyLog?.mwfChecks || {});
  const cooldownCompleted = dailyLog?.cooldownCompleted || false;
  const [cooldownChecks, setCooldownChecks] = useState(dailyLog?.cooldownChecks || {});

  // Main Exercises & Sets state for active workout
  const exercises = dailyLog?.exercises || [];
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_EXERCISES[0].id);

  // Exercise Runner Modal Focus Mode State
  const [activeRunnerExIdx, setActiveRunnerExIdx] = useState(null);

  // Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Saved Past Workouts for Today
  const savedWorkouts = dailyLog?.savedWorkouts || [];

  // Overall Workout Duration Clock Effect
  useEffect(() => {
    let interval = null;
    if (workoutActive) {
      interval = setInterval(() => {
        setWorkoutElapsedSecs((prev) => {
          const next = prev + 1;
          if (next % 5 === 0) {
            onUpdateLog({ workoutDurationSecs: next, workoutActive: true });
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutActive]);

  // Rest Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
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

  const handleStartWorkout = () => {
    setWorkoutActive(true);
    setWorkoutElapsedSecs(0);
    onUpdateLog({ workoutActive: true, workoutDurationSecs: 0, exercises: [] });
  };

  const handlePauseWorkout = () => {
    setWorkoutActive(false);
    onUpdateLog({ workoutActive: false, workoutDurationSecs: workoutElapsedSecs });
  };

  const handleFinishWorkout = () => {
    setWorkoutActive(false);

    // Calculate Workout Summary Statistics
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    exercises.forEach((ex) => {
      if (ex.sets) {
        ex.sets.forEach((s) => {
          if (s.completed || s.weight > 0) {
            totalSets += 1;
            totalReps += Number(s.reps) || 0;
            totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
          }
        });
      }
    });

    const newCompletedWorkout = {
      workoutId: `workout_${Date.now()}`,
      dayName: currentDayProgram.dayName,
      date: dailyLog.date,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationSecs: workoutElapsedSecs,
      totalVolume,
      totalSets,
      totalReps,
      exerciseCount: exercises.length,
      exercises
    };

    const updatedSavedWorkouts = [...savedWorkouts, newCompletedWorkout];
    setSummaryData(newCompletedWorkout);
    setShowSummaryModal(true);

    onUpdateLog({
      workoutActive: false,
      workoutDurationSecs: 0,
      savedWorkouts: updatedSavedWorkouts,
      workoutSummary: newCompletedWorkout
    });
  };

  const startRestTimer = (secs) => {
    if (!secs) return;
    setTimerSeconds(secs);
    setTimerActive(true);
  };

  const getPreviousLogForExercise = (exerciseId, exerciseName) => {
    if (!allDailyLogs || allDailyLogs.length === 0) return null;
    for (let i = allDailyLogs.length - 1; i >= 0; i--) {
      const pastLog = allDailyLogs[i];
      if (pastLog.date === dailyLog.date) continue;

      // Check savedWorkouts array first
      if (pastLog.savedWorkouts && pastLog.savedWorkouts.length > 0) {
        for (let w = pastLog.savedWorkouts.length - 1; w >= 0; w--) {
          const exMatch = pastLog.savedWorkouts[w].exercises?.find((e) => e.exerciseId === exerciseId || (exerciseName && e.name?.toLowerCase().includes(exerciseName.toLowerCase())));
          if (exMatch && exMatch.sets && exMatch.sets.length > 0) {
            const set = exMatch.sets.find((s) => s.completed) || exMatch.sets[0];
            return `${set.weight} kg × ${set.reps} reps (${exMatch.sets.length} sets)`;
          }
        }
      }

      // Check exercises directly
      if (pastLog.exercises) {
        const match = pastLog.exercises.find((e) => e.exerciseId === exerciseId || (exerciseName && e.name?.toLowerCase().includes(exerciseName.toLowerCase())));
        if (match && match.sets && match.sets.length > 0) {
          const completedSet = match.sets.find((s) => s.completed) || match.sets[0];
          if (completedSet && completedSet.weight) {
            return `${completedSet.weight} kg × ${completedSet.reps} reps`;
          }
        }
      }
    }
    return null;
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
    if (!workoutActive) setWorkoutActive(true);
    const existingIdx = exercises.findIndex((e) => e.exerciseId === progEx.id);
    let updatedExercises = [...exercises];

    const targetSetsCount = progEx.targetSets || 4;
    const initialSets = [];

    const pastRecord = getPreviousLogForExercise(progEx.id, progEx.name);
    let defaultWeight = 60;
    if (pastRecord) {
      const matchW = pastRecord.match(/(\d+)\s*kg/);
      if (matchW) defaultWeight = parseFloat(matchW[1]);
    }

    for (let i = 1; i <= targetSetsCount; i++) {
      initialSets.push({ setNum: i, weight: defaultWeight, reps: progEx.targetReps || 10, completed: false });
    }

    if (existingIdx < 0) {
      updatedExercises.push({
        exerciseId: progEx.id,
        name: progEx.name,
        isSuperset: progEx.isSuperset || false,
        subExercises: progEx.subExercises || [],
        restSec: progEx.restSec || 120,
        note: progEx.note || '',
        startedAt: Date.now(),
        sets: initialSets
      });
      onUpdateLog({ exercises: updatedExercises, workoutActive: true });
      setActiveRunnerExIdx(updatedExercises.length - 1);
    } else {
      setActiveRunnerExIdx(existingIdx);
    }
  };

  const handleAddCustomPreset = () => {
    if (!workoutActive) setWorkoutActive(true);
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
      onUpdateLog({ exercises: updatedExercises, workoutActive: true });
      setActiveRunnerExIdx(existingIdx);
    } else {
      updatedExercises.push({
        exerciseId: exObj.id,
        name: exObj.name,
        restSec: 120,
        startedAt: Date.now(),
        sets: [newSet]
      });
      onUpdateLog({ exercises: updatedExercises, workoutActive: true });
      setActiveRunnerExIdx(updatedExercises.length - 1);
    }
  };

  const handleSaveSetsFromRunner = (updatedSets, elapsedSecs, startedAt) => {
    if (activeRunnerExIdx === null) return;
    const updatedExercises = JSON.parse(JSON.stringify(exercises));
    updatedExercises[activeRunnerExIdx].sets = updatedSets;
    updatedExercises[activeRunnerExIdx].durationSecs = elapsedSecs;
    updatedExercises[activeRunnerExIdx].startedAt = startedAt;
    updatedExercises[activeRunnerExIdx].completed = true;
    onUpdateLog({ exercises: updatedExercises });
  };

  const handleUpdateSet = (exIdx, setIdx, field, val) => {
    const updatedExercises = JSON.parse(JSON.stringify(exercises));
    updatedExercises[exIdx].sets[setIdx][field] = val;

    if (field === 'completed' && val === true) {
      const restDuration = updatedExercises[exIdx].restSec || 120;
      startRestTimer(restDuration);
    }

    onUpdateLog({ exercises: updatedExercises });
  };

  const confirmDeleteExercise = () => {
    if (deletingExIdx === null) return;
    const updated = exercises.filter((_, idx) => idx !== deletingExIdx);
    onUpdateLog({ exercises: updated });
    setDeletingExIdx(null);
  };

  const formatHMS = (totalSecs) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
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

      {/* WORKOUT STATE SCREEN 1: PRE-WORKOUT OVERVIEW (BEFORE START WORKOUT IS CLICKED) */}
      {!workoutActive ? (
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span className="badge badge-cyan">{currentDayProgram.tag}</span>
              <h2 style={{ fontSize: '1.4rem', marginTop: '0.35rem' }}>{currentDayProgram.dayName}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                Tap Start Workout below to initiate session timer & exercise loggers.
              </p>
            </div>
            <Zap color="var(--primary-cyan)" size={28} />
          </div>

          {/* Quick Historical Performance Reminders for Scheduled Exercises */}
          {currentDayProgram.mainExercises && currentDayProgram.mainExercises.length > 0 && (
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-cyan)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <History size={14} /> PAST PERFORMANCE REMINDERS FOR TODAY'S LIFTS:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {currentDayProgram.mainExercises.map((ex) => {
                  const past = getPreviousLogForExercise(ex.id, ex.name);
                  return (
                    <div key={ex.id} style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', background: 'rgba(255, 255, 255, 0.02)', padding: '0.4rem 0.6rem', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 600 }}>• {ex.name}</span>
                      <span style={{ color: past ? 'var(--accent-emerald)' : 'var(--text-dim)', fontWeight: 700 }}>
                        {past ? `Last: ${past}` : 'No previous log'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saved Completed Workouts for Today */}
          {savedWorkouts.length > 0 && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.35rem' }}>
                ✓ Completed Workouts Today ({savedWorkouts.length}):
              </div>
              {savedWorkouts.map((w, idx) => (
                <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                  <span>{w.dayName} ({w.timestamp})</span>
                  <span>⏱️ {formatHMS(w.durationSecs)} | 🏋️ {w.totalVolume}kg</span>
                </div>
              ))}
            </div>
          )}

          {/* LARGE PROMINENT START WORKOUT BUTTON */}
          <button
            onClick={handleStartWorkout}
            className="btn-emerald"
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', boxShadow: '0 6px 20px var(--accent-emerald-glow)' }}
          >
            🚀 START WORKOUT SESSION <ArrowRight size={20} />
          </button>
        </div>
      ) : (
        /* WORKOUT STATE SCREEN 2: ACTIVE WORKOUT MODE (ONLY SHOWN AFTER CLICKING START WORKOUT) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Workout Timer Bar */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(15, 23, 42, 0.95))', borderColor: 'var(--primary-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-cyan"><Timer size={12} className="spin" /> WORKOUT IN PROGRESS</span>
                <h2 style={{ fontSize: '1.3rem', marginTop: '0.25rem' }}>{currentDayProgram.dayName}</h2>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL DURATION</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--primary-cyan)' }}>
                  {formatHMS(workoutElapsedSecs)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handlePauseWorkout} className="btn-secondary" style={{ flex: 1 }}>
                <Pause size={16} /> Pause Timer
              </button>

              {/* FINISH WORKOUT BUTTON - REVEALED ONLY WHEN WORKOUT HAS STARTED */}
              <button
                onClick={handleFinishWorkout}
                className="btn-primary"
                style={{ flex: 2, background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}
              >
                🏁 FINISH WORKOUT <Check size={16} />
              </button>
            </div>
          </div>

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
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>Rest Countdown</div>
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

          {/* Stage Selector Pills (Warmup, Main, Cooldown) */}
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
              {/* Tuesday & Friday Calisthenics Special Checkbox */}
              {['Tuesday', 'Friday'].includes(selectedDay) && (
                <div
                  onClick={() => onUpdateLog({ calisthenicsCompleted: !calisthenicsCompleted })}
                  className="glass-card"
                  style={{
                    cursor: 'pointer',
                    background: calisthenicsCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.1)',
                    borderColor: calisthenicsCompleted ? 'var(--accent-emerald)' : 'var(--primary-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {calisthenicsCompleted ? <CheckSquare color="var(--accent-emerald)" size={24} /> : <Square color="var(--primary-cyan)" size={24} />}
                    <div>
                      <h3 style={{ fontSize: '1rem', margin: 0, color: calisthenicsCompleted ? 'var(--accent-emerald)' : 'var(--text-main)' }}>
                        Calisthenics Skill Session
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Handstand, Rings, Front Lever, L-Sit & High Pulls
                      </span>
                    </div>
                  </div>
                  <span className={`badge ${calisthenicsCompleted ? 'badge-emerald' : 'badge-cyan'}`}>
                    {calisthenicsCompleted ? 'DONE ✓' : 'CHECK'}
                  </span>
                </div>
              )}

              {/* Sunday Sauna Special Checkbox */}
              {selectedDay === 'Sunday' && (
                <div
                  onClick={() => onUpdateLog({ saunaCompleted: !saunaCompleted })}
                  className="glass-card"
                  style={{
                    cursor: 'pointer',
                    background: saunaCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                    borderColor: saunaCompleted ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {saunaCompleted ? <CheckSquare color="var(--accent-emerald)" size={24} /> : <Square color="var(--accent-amber)" size={24} />}
                    <div>
                      <h3 style={{ fontSize: '1rem', margin: 0, color: saunaCompleted ? 'var(--accent-emerald)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FlameKindling size={18} color="var(--accent-amber)" /> Post-Workout Sauna Session
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Heat shock proteins, recovery & muscle relaxation
                      </span>
                    </div>
                  </div>
                  <span className={`badge ${saunaCompleted ? 'badge-emerald' : 'badge-amber'}`}>
                    {saunaCompleted ? 'SAUNA DONE ✓' : 'CHECK SAUNA'}
                  </span>
                </div>
              )}

              {/* Preset Exercises Picker for Current Day */}
              {currentDayProgram.mainExercises && currentDayProgram.mainExercises.length > 0 && (
                <div className="glass-card">
                  <h3 style={{ fontSize: '0.95rem', color: 'var(--primary-cyan)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers size={16} /> Presets for {selectedDay} (Tap to Open Exercise)
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {currentDayProgram.mainExercises.map((progEx) => {
                      const isLoaded = exercises.some((e) => e.exerciseId === progEx.id);
                      const pastRecord = getPreviousLogForExercise(progEx.id, progEx.name);

                      return (
                        <div
                          key={progEx.id}
                          onClick={() => handleAddProgramExercise(progEx)}
                          style={{
                            background: 'rgba(2, 6, 23, 0.6)',
                            border: progEx.isSuperset ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-card)',
                            borderRadius: '12px',
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
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
                            {pastRecord && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                <History size={11} /> Last: <strong>{pastRecord}</strong>
                              </div>
                            )}
                          </div>

                          <button
                            className={ex.completed ? 'btn-emerald' : isLoaded ? 'btn-primary' : 'btn-secondary'}
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                          >
                            {ex.completed ? 'DONE ✓' : isLoaded ? 'Open Focus' : 'Start'} {ex.completed ? <CheckCircle2 size={12} /> : <Play size={12} />}
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
                      <Plus size={16} /> Open Exercise
                    </button>
                  </div>
                </div>
              )}

              {/* Active Logged Exercises List with Edit & Double-Check Delete */}
              {exercises.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  Tap <strong>Start</strong> on any exercise preset above to begin logging sets & weight!
                </div>
              ) : (
                exercises.map((ex, exIdx) => {
                  const pastRecord = getPreviousLogForExercise(ex.exerciseId, ex.name);
                  return (
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
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.note}</div>
                          {pastRecord && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                              <History size={13} /> Last time: <strong>{pastRecord}</strong>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => setActiveRunnerExIdx(exIdx)}
                            className={ex.completed ? 'btn-emerald' : 'btn-primary'}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          >
                            {ex.completed ? 'DONE ✓' : 'Edit / Run'} {ex.completed ? <CheckCircle2 size={12} /> : <Edit2 size={12} />}
                          </button>
                          <button
                            onClick={() => setDeletingExIdx(exIdx)}
                            title="Delete Exercise"
                            style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '0.25rem' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => handleUpdateSet(exIdx, setIdx, 'weight', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                  className="input-field"
                                  style={{ padding: '0.4rem', textAlign: 'center' }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>kg</span>
                              </div>

                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <input
                                  type="number"
                                  value={set.reps}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => handleUpdateSet(exIdx, setIdx, 'reps', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
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
                  );
                })
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
      )}

      {/* FOCUS EXERCISE RUNNER MODAL */}
      {activeRunnerExIdx !== null && exercises[activeRunnerExIdx] && (
        <ExerciseRunnerModal
          exercise={exercises[activeRunnerExIdx]}
          pastRecord={getPreviousLogForExercise(exercises[activeRunnerExIdx].exerciseId, exercises[activeRunnerExIdx].name)}
          onSaveExerciseSets={handleSaveSetsFromRunner}
          onClose={() => setActiveRunnerExIdx(null)}
        />
      )}

      {/* WORKOUT SUMMARY STATS MODAL (AFTER CLICKING FINISH WORKOUT) */}
      {showSummaryModal && summaryData && (
        <div className="modal-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Award size={26} color="var(--accent-emerald)" />
                <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Workout Session Saved & Complete!</h2>
              </div>
              <button onClick={() => setShowSummaryModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Great session! This workout has been saved as a standalone completed session:
            </p>

            {/* Summary Stat Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏱️ Total Duration</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-cyan)', marginTop: '0.2rem' }}>
                  {formatHMS(summaryData.durationSecs)}
                </div>
              </div>

              <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🏋️ Total Volume Moved</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
                  {summaryData.totalVolume} <span style={{ fontSize: '0.75rem' }}>kg</span>
                </div>
              </div>

              <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🔢 Total Sets</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                  {summaryData.totalSets} <span style={{ fontSize: '0.75rem' }}>sets</span>
                </div>
              </div>

              <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🎯 Total Reps</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-purple)', marginTop: '0.2rem' }}>
                  {summaryData.totalReps} <span style={{ fontSize: '0.75rem' }}>reps</span>
                </div>
              </div>
            </div>

            {/* List of Completed Movements */}
            {summaryData.exercises && summaryData.exercises.length > 0 && (
              <div style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-cyan)', marginBottom: '0.5rem' }}>
                  Completed Exercises ({summaryData.exercises.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {summaryData.exercises.map((ex, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>• {ex.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{ex.sets?.length || 0} sets</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setShowSummaryModal(false)} className="btn-emerald" style={{ width: '100%' }}>
              Done & Save Workout Session <Check size={16} />
            </button>
          </div>
        </div>
      )}

      {/* DOUBLE-CHECK DELETE CONFIRMATION MODAL */}
      {deletingExIdx !== null && exercises[deletingExIdx] && (
        <div className="modal-overlay" onClick={() => setDeletingExIdx(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <AlertTriangle size={36} color="var(--accent-rose)" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Delete Exercise?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>"{exercises[deletingExIdx].name}"</strong> and all of its recorded sets?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDeletingExIdx(null)} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={confirmDeleteExercise}
                style={{ flex: 1, background: 'var(--accent-rose)', border: 'none', color: '#fff', padding: '0.85rem', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
