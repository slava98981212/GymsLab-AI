import React, { useState, useEffect } from 'react';
import { Dumbbell, Flame, Timer, CheckSquare, Square, Plus, Play, Pause, RotateCcw, HeartPulse, Sparkles, Calendar, Zap, Layers, History, FlameKindling, Check, Trash2, Edit2, X, Award, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { WEEKLY_WORKOUT_SPLIT, MON_WED_FRI_ROUTINE, PRESET_EXERCISES } from '../utils/constants';
import {
  triggerGlobalRestTimer,
  getGlobalRestState,
  pauseGlobalRestTimer,
  resumeGlobalRestTimer,
  clearGlobalRestTimer,
  dismissRestExpiredAlert,
  startGlobalWorkoutClock,
  stopGlobalWorkoutClock,
  getGlobalWorkoutDurationSecs
} from '../services/timerEngine';

export default function WorkoutSession({ dailyLog, allDailyLogs, onUpdateLog, onSelectDate }) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[new Date().getDay()];

  // Calculate day name corresponding to dailyLog.date
  const getDayNameFromDateStr = (dateStr) => {
    if (!dateStr) return dayNames[new Date().getDay()];
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dayNames[dateObj.getDay()];
  };

  const [selectedDay, setSelectedDay] = useState(() => getDayNameFromDateStr(dailyLog?.date));
  const [activeStage, setActiveStage] = useState('main');

  // Keep selectedDay in sync with dailyLog.date changes from Header Date Navigator
  useEffect(() => {
    if (dailyLog?.date) {
      const computedDayName = getDayNameFromDateStr(dailyLog.date);
      if (computedDayName) {
        setSelectedDay(computedDayName);
      }
    }
  }, [dailyLog?.date]);

  const handleSelectDayTab = (targetDayName) => {
    setSelectedDay(targetDayName);
    if (dailyLog?.date && typeof onSelectDate === 'function') {
      const [y, m, d] = dailyLog.date.split('-').map(Number);
      const currentDateObj = new Date(y, m - 1, d);
      const currentDayIdx = currentDateObj.getDay();
      const targetDayIdx = dayNames.indexOf(targetDayName);
      if (targetDayIdx >= 0) {
        const diffDays = targetDayIdx - currentDayIdx;
        const targetDateObj = new Date(currentDateObj);
        targetDateObj.setDate(targetDateObj.getDate() + diffDays);
        const targetDateStr = targetDateObj.toISOString().slice(0, 10);
        if (targetDateStr !== dailyLog.date) {
          onSelectDate(targetDateStr);
        }
      }
    }
  };

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
  const [editingWorkoutObj, setEditingWorkoutObj] = useState(null);
  const [deletingWorkoutId, setDeletingWorkoutId] = useState(null);

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
  const [activeRunnerExercise, setActiveRunnerExercise] = useState(null);

  // Global Singleton Rest Timer State
  const [restState, setRestState] = useState(() => getGlobalRestState());

  // Saved Past Workouts for Today (Strictly isolated to dailyLog.date)
  const savedWorkouts = (dailyLog?.savedWorkouts || []).filter(
    (w) => Boolean(w) && (!w.date || w.date === dailyLog.date)
  );

  // Single-Source-of-Truth Timer Effect
  useEffect(() => {
    const updateTick = () => {
      // 1. Sync global rest timer state
      const nextRest = getGlobalRestState();
      setRestState(nextRest);

      // 2. Sync overall workout duration
      if (workoutActive) {
        const elapsed = getGlobalWorkoutDurationSecs(dailyLog?.workoutStartMs, workoutElapsedSecs, true);
        setWorkoutElapsedSecs(elapsed);
        if (elapsed % 5 === 0 && !activeRunnerExercise) {
          onUpdateLog({ workoutDurationSecs: elapsed, workoutActive: true, workoutStartMs: dailyLog?.workoutStartMs });
        }
      }
    };

    updateTick();
    const interval = setInterval(updateTick, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [workoutActive, dailyLog?.workoutStartMs, workoutElapsedSecs, activeRunnerExercise]);

  const handleStartWorkout = () => {
    setWorkoutActive(true);
    const existingSecs = workoutElapsedSecs > 0 ? workoutElapsedSecs : 0;
    const startMs = startGlobalWorkoutClock(null, existingSecs);
    setWorkoutElapsedSecs(existingSecs);
    onUpdateLog({ workoutActive: true, workoutDurationSecs: existingSecs, workoutStartMs: startMs });
  };

  const handlePauseWorkout = () => {
    setWorkoutActive(false);
    stopGlobalWorkoutClock();
    onUpdateLog({ workoutActive: false, workoutDurationSecs: workoutElapsedSecs, workoutStartMs: null });
  };

  const handleResumeWorkout = () => {
    setWorkoutActive(true);
    const startMs = startGlobalWorkoutClock(null, workoutElapsedSecs);
    onUpdateLog({ workoutActive: true, workoutDurationSecs: workoutElapsedSecs, workoutStartMs: startMs });
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
      workoutName: `Workout #${savedWorkouts.length + 1}`,
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
      exercises: [],
      savedWorkouts: updatedSavedWorkouts,
      workoutSummary: newCompletedWorkout
    });

    setWorkoutElapsedSecs(0);
  };

  const handleDeleteSavedWorkout = (workoutIdOrIdx) => {
    setDeletingWorkoutId(workoutIdOrIdx);
  };

  const confirmDeleteSavedWorkout = () => {
    if (deletingWorkoutId === null) return;
    const updated = savedWorkouts.filter((w, i) => (w.workoutId ? w.workoutId !== deletingWorkoutId : i !== deletingWorkoutId));
    onUpdateLog({ savedWorkouts: updated });
    setDeletingWorkoutId(null);
    setEditingWorkoutObj(null);
  };

  const startRestTimer = (secs) => {
    if (!secs || secs <= 0) return;
    triggerGlobalRestTimer(secs);
    setRestState(getGlobalRestState());
  };

  const handleTogglePauseRestTimer = () => {
    if (restState.active) {
      pauseGlobalRestTimer();
    } else if (restState.seconds > 0) {
      resumeGlobalRestTimer();
    }
    setRestState(getGlobalRestState());
  };

  const handleResetRestTimer = () => {
    clearGlobalRestTimer();
    setRestState(getGlobalRestState());
  };

  const handleDismissRestExpired = () => {
    dismissRestExpiredAlert();
    setRestState(getGlobalRestState());
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
    const warmupList = currentDayProgram?.warmup || [];
    const allDone = warmupList.length > 0 && warmupList.every((w) => next[w.id]);
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
    const cooldownList = currentDayProgram?.cooldown || [];
    const allDone = cooldownList.length > 0 && cooldownList.every((c) => next[c.id]);
    onUpdateLog({ cooldownChecks: next, cooldownCompleted: allDone });
  };

  const handleAddProgramExercise = (progEx) => {
    if (!workoutActive) setWorkoutActive(true);
    const existing = exercises.find((e) => e.exerciseId === progEx.id || e.name === progEx.name);
    let updatedExercises = [...exercises];

    if (!existing) {
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

      const newEx = {
        exerciseId: progEx.id,
        name: progEx.name,
        isSuperset: progEx.isSuperset || false,
        subExercises: progEx.subExercises || [],
        restSec: progEx.restSec || 120,
        note: progEx.note || '',
        startedAt: Date.now(),
        sets: initialSets
      };

      updatedExercises.push(newEx);
      onUpdateLog({ exercises: updatedExercises, workoutActive: true });
      setActiveRunnerExercise(newEx);
    } else {
      setActiveRunnerExercise(existing);
    }
  };

  const handleAddCustomPreset = () => {
    if (!workoutActive) setWorkoutActive(true);
    const exObj = PRESET_EXERCISES.find((e) => e.id === selectedPresetId);
    if (!exObj) return;

    let updatedExercises = [...exercises];
    const existing = exercises.find((e) => e.exerciseId === selectedPresetId);

    if (existing) {
      setActiveRunnerExercise(existing);
    } else {
      const newEx = {
        exerciseId: exObj.id,
        name: exObj.name,
        restSec: 120,
        startedAt: Date.now(),
        sets: [
          { setNum: 1, weight: 60, reps: 10, completed: false },
          { setNum: 2, weight: 60, reps: 10, completed: false },
          { setNum: 3, weight: 60, reps: 10, completed: false },
          { setNum: 4, weight: 60, reps: 10, completed: false }
        ]
      };

      updatedExercises.push(newEx);
      onUpdateLog({ exercises: updatedExercises, workoutActive: true });
      setActiveRunnerExercise(newEx);
    }
  };

  const handleSaveSetsFromRunner = (updatedSets, elapsedSecs, startedAt) => {
    try {
      const runnerObj = activeRunnerExercise;
      if (!runnerObj) return;

      const safeExercises = Array.isArray(exercises) ? exercises : [];
      const updatedExercises = safeExercises.map((e) => ({
        ...e,
        sets: Array.isArray(e.sets) ? e.sets.map((s) => ({ ...s })) : []
      }));

      const targetIdx = updatedExercises.findIndex(
        (e) => e.exerciseId === runnerObj.exerciseId || e.name === runnerObj.name
      );

      if (targetIdx >= 0) {
        updatedExercises[targetIdx].sets = updatedSets;
        updatedExercises[targetIdx].durationSecs = elapsedSecs || 0;
        updatedExercises[targetIdx].startedAt = startedAt || Date.now();
        updatedExercises[targetIdx].completed = true;
      } else {
        updatedExercises.push({
          ...runnerObj,
          sets: updatedSets,
          durationSecs: elapsedSecs || 0,
          startedAt: startedAt || Date.now(),
          completed: true
        });
      }

      onUpdateLog({ exercises: updatedExercises });
      setActiveRunnerExercise(null);
    } catch (err) {
      console.error('Error in handleSaveSetsFromRunner:', err);
      setActiveRunnerExercise(null);
    }
  };

  const handleUpdateSet = (exIdx, setIdx, field, val) => {
    try {
      const safeExercises = Array.isArray(exercises) ? exercises : [];
      const updatedExercises = safeExercises.map((e) => ({
        ...e,
        sets: Array.isArray(e.sets) ? e.sets.map((s) => ({ ...s })) : []
      }));

      if (updatedExercises[exIdx] && updatedExercises[exIdx].sets && updatedExercises[exIdx].sets[setIdx]) {
        updatedExercises[exIdx].sets[setIdx][field] = val;

        if (field === 'completed' && val === true) {
          const restDuration = updatedExercises[exIdx].restSec || 120;
          startRestTimer(restDuration);
        }

        onUpdateLog({ exercises: updatedExercises });
      }
    } catch (err) {
      console.error('Error in handleUpdateSet:', err);
    }
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
                onClick={() => handleSelectDayTab(d)}
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
      {!workoutActive && workoutElapsedSecs === 0 ? (
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

          {/* Saved / Active Completed Workout Session Objects List for Today */}
          <div style={{ background: 'rgba(2, 6, 23, 0.7)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-cyan)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🏋️ TODAY'S WORKOUT OBJECTS ({savedWorkouts.length + (workoutActive || workoutElapsedSecs > 0 ? 1 : 0)}):</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tap to Edit or Review</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Active Session Object */}
              {(workoutActive || workoutElapsedSecs > 0) && (
                <div style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid var(--primary-cyan)', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-cyan)' }}>
                      🏋️ Workout #{savedWorkouts.length + 1} (Active 🟢)
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ⏱️ {formatHMS(workoutElapsedSecs)} | {exercises.length} exercises logged
                    </div>
                  </div>
                  <span className="badge badge-cyan">IN PROGRESS</span>
                </div>
              )}

              {/* Saved Workout Objects List */}
              {Array.isArray(savedWorkouts) && savedWorkouts.filter(Boolean).map((w, idx) => {
                if (!w || typeof w !== 'object') return null;
                const workoutTitle = w.workoutName || `Workout #${idx + 1}`;
                const timestampStr = w.timestamp || '';
                const durationSecs = typeof w.durationSecs === 'number' ? w.durationSecs : 0;
                const totalVol = typeof w.totalVolume === 'number' ? w.totalVolume : 0;
                const exCount = Array.isArray(w.exercises) ? w.exercises.length : 0;
                const wId = w.workoutId || idx;

                return (
                  <div key={wId} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        🏋️ {workoutTitle} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({timestampStr})</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        ⏱️ {formatHMS(durationSecs)} | 🏋️ {totalVol}kg | {exCount} exercises
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        onClick={() => setEditingWorkoutObj(w)}
                        className="btn-primary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Edit / Review <Edit2 size={12} />
                      </button>

                      <button
                        onClick={() => handleDeleteSavedWorkout(wId)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Delete Workout Session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {savedWorkouts.length === 0 && !workoutActive && workoutElapsedSecs === 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.4rem' }}>
                  No workout objects recorded yet today. Click <strong>Start Workout Session</strong> below!
                </div>
              )}
            </div>
          </div>

          {/* LARGE PROMINENT START WORKOUT BUTTON */}
          <button
            onClick={handleStartWorkout}
            className="btn-emerald"
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', boxShadow: '0 6px 20px var(--accent-emerald-glow)' }}
          >
            🚀 START {savedWorkouts.length > 0 ? `WORKOUT #${savedWorkouts.length + 1}` : 'WORKOUT SESSION'} <ArrowRight size={20} />
          </button>
        </div>
      ) : (
        /* WORKOUT STATE SCREEN 2: ACTIVE WORKOUT MODE (ONLY SHOWN AFTER CLICKING START WORKOUT) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Workout Timer Bar */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(15, 23, 42, 0.95))', borderColor: workoutActive ? 'var(--primary-cyan)' : 'var(--accent-amber)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span className={`badge ${workoutActive ? 'badge-cyan' : 'badge-amber'}`}>
                  <Timer size={12} className={workoutActive ? 'spin' : ''} /> {workoutActive ? 'WORKOUT IN PROGRESS' : 'TIMER PAUSED ⏸️'}
                </span>
                <h2 style={{ fontSize: '1.3rem', marginTop: '0.25rem' }}>{currentDayProgram.dayName}</h2>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL DURATION</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: workoutActive ? 'var(--primary-cyan)' : 'var(--accent-amber)' }}>
                  {formatHMS(workoutElapsedSecs)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {workoutActive ? (
                <button onClick={handlePauseWorkout} className="btn-secondary" style={{ flex: 1 }}>
                  <Pause size={16} /> Pause Timer
                </button>
              ) : (
                <button onClick={handleResumeWorkout} className="btn-emerald" style={{ flex: 1 }}>
                  <Play size={16} /> Resume Timer
                </button>
              )}

              {/* FINISH WORKOUT BUTTON */}
              <button
                onClick={handleFinishWorkout}
                className="btn-primary"
                style={{ flex: 2, background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}
              >
                🏁 FINISH WORKOUT <Check size={16} />
              </button>
            </div>
          </div>

          {/* Rest Timer Banner: Active Countdown OR Red Expired Alert with OK Button */}
          {(restState.active || restState.seconds > 0 || restState.expired) && (
            <div style={{
              background: restState.expired
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.98), rgba(185, 28, 28, 0.98))'
                : 'linear-gradient(135deg, rgba(6, 182, 212, 0.95), rgba(59, 130, 246, 0.95))',
              padding: '0.85rem 1.25rem',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
              boxShadow: restState.expired ? '0 0 25px rgba(239, 68, 68, 0.6)' : '0 8px 25px var(--primary-cyan-glow)',
              position: 'sticky',
              top: '70px',
              zIndex: 840
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Timer size={24} className={restState.expired ? '' : 'spin'} />
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9, fontWeight: 700 }}>
                    {restState.expired ? '⏰ REST FINISHED! GET TO WORK' : 'Rest Countdown'}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
                    {restState.expired ? '00:00' : `${Math.floor(restState.seconds / 60)}:${String(restState.seconds % 60).padStart(2, '0')}`}
                  </div>
                </div>
              </div>

              {restState.expired ? (
                <button
                  onClick={handleDismissRestExpired}
                  style={{
                    background: '#ffffff',
                    border: 'none',
                    color: '#dc2626',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  OK
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleTogglePauseRestTimer}
                    style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '10px', cursor: 'pointer' }}
                  >
                    {restState.active ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={handleResetRestTimer}
                    style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '10px', cursor: 'pointer' }}
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}
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
                {(currentDayProgram?.warmup || []).map((item) => {
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
                      const ex = exercises.find((e) => e.exerciseId === progEx.id);
                      const isLoaded = !!ex;
                      const isDone = ex?.completed || false;
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
                            className={isDone ? 'btn-emerald' : isLoaded ? 'btn-primary' : 'btn-secondary'}
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                          >
                            {isDone ? 'DONE ✓' : isLoaded ? 'Open Focus' : 'Start'} {isDone ? <CheckCircle2 size={12} /> : <Play size={12} />}
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
              {!Array.isArray(exercises) || exercises.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  Tap <strong>Start</strong> on any exercise preset above to begin logging sets & weight!
                </div>
              ) : (
                exercises.filter(Boolean).map((ex, exIdx) => {
                  if (!ex || typeof ex !== 'object') return null;
                  const pastRecord = getPreviousLogForExercise(ex.exerciseId, ex.name);
                  const setsList = Array.isArray(ex.sets) ? ex.sets : [];

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
                            onClick={() => setActiveRunnerExercise(ex)}
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
                        {setsList.map((set, setIdx) => {
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
                {(currentDayProgram?.cooldown || []).map((item) => {
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
      {activeRunnerExercise && (
        <ExerciseRunnerModal
          key={activeRunnerExercise.exerciseId || activeRunnerExercise.name}
          exercise={activeRunnerExercise}
          pastRecord={getPreviousLogForExercise(activeRunnerExercise.exerciseId, activeRunnerExercise.name)}
          onSaveExerciseSets={handleSaveSetsFromRunner}
          onStartRestTimer={startRestTimer}
          onClose={() => setActiveRunnerExercise(null)}
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

      {/* DOUBLE-CHECK DELETE EXERCISE CONFIRMATION MODAL */}
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

      {/* WORKOUT OBJECT REVIEW & EDITOR MODAL */}
      {editingWorkoutObj && (
        <div className="modal-overlay" onClick={() => setEditingWorkoutObj(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-cyan">{editingWorkoutObj.dayName} • {editingWorkoutObj.timestamp}</span>
                <h2 style={{ fontSize: '1.3rem', margin: '0.2rem 0' }}>{editingWorkoutObj.workoutName || 'Workout Object Details'}</h2>
              </div>
              <button onClick={() => setEditingWorkoutObj(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>⏱️ Duration</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-cyan)' }}>{formatHMS(editingWorkoutObj.durationSecs)}</div>
              </div>
              <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🏋️ Total Volume</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-emerald)' }}>{editingWorkoutObj.totalVolume} kg</div>
              </div>
              <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🔢 Sets / Reps</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-amber)' }}>{editingWorkoutObj.totalSets}s / {editingWorkoutObj.totalReps}r</div>
              </div>
            </div>

            {/* Exercises & Sets Review List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '350px', overflowY: 'auto', marginBottom: '1.25rem' }}>
              {editingWorkoutObj.exercises && editingWorkoutObj.exercises.length > 0 ? (
                editingWorkoutObj.exercises.map((ex, exIdx) => (
                  <div key={exIdx} style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      • {ex.name}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {ex.sets?.map((s, sIdx) => (
                        <div key={sIdx} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '0.35rem 0.6rem', borderRadius: '8px' }}>
                          <span>Set {s.setNum}: {s.weight} kg × {s.reps} reps</span>
                          <span style={{ color: s.completed ? 'var(--accent-emerald)' : 'var(--text-dim)', fontWeight: 700 }}>{s.completed ? 'DONE ✓' : 'LOGGED'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dim)', padding: '1rem' }}>No exercises recorded in this session.</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => handleDeleteSavedWorkout(editingWorkoutObj.workoutId)}
                style={{ flex: 1, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.75rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Delete Session
              </button>
              <button onClick={() => setEditingWorkoutObj(null)} className="btn-emerald" style={{ flex: 2 }}>
                Done Reviewing <Check size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOUBLE-CHECK DELETE WORKOUT SESSION MODAL */}
      {deletingWorkoutId !== null && (
        <div className="modal-overlay" onClick={() => setDeletingWorkoutId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <AlertTriangle size={36} color="var(--accent-rose)" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Delete Workout Session?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Are you sure you want to delete this recorded workout session object? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDeletingWorkoutId(null)} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={confirmDeleteSavedWorkout}
                style={{ flex: 1, background: 'var(--accent-rose)', border: 'none', color: '#fff', padding: '0.85rem', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Yes, Delete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
