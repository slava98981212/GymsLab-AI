import React, { useState, useEffect } from 'react';
import { TrendingUp, Scale, Dumbbell, Award, Calendar, Activity, Zap, RefreshCw, Plane } from 'lucide-react';
import { getAllDailyLogs, getAll1RMTests, getAllWeeklyLogs } from '../services/db';
import { PRESET_EXERCISES } from '../utils/constants';

export default function Statistics({ profile }) {
  const [dailyLogs, setDailyLogs] = useState([]);
  const [rm1Tests, setRm1Tests] = useState([]);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [selectedExId, setSelectedExId] = useState(PRESET_EXERCISES[0].id);

  useEffect(() => {
    loadStatsData();
  }, []);

  const loadStatsData = async () => {
    const dLogs = await getAllDailyLogs();
    const tests = await getAll1RMTests();
    const wLogs = await getAllWeeklyLogs();

    setDailyLogs(dLogs.sort((a, b) => new Date(a.date) - new Date(b.date)));
    setRm1Tests(tests);
    setWeeklyLogs(wLogs);
  };

  // Weight Trend Data
  const weightData = dailyLogs.filter((d) => d.weight).map((d) => ({ date: d.date, weight: d.weight, isVacation: d.travelMode }));

  // Vacation / Travel Days History
  const vacationLogs = dailyLogs.filter((d) => d.travelMode);

  // Exercise Specific History Data
  const selectedExObj = PRESET_EXERCISES.find((e) => e.id === selectedExId) || PRESET_EXERCISES[0];
  const exHistory = [];
  dailyLogs.forEach((d) => {
    if (d.exercises) {
      const match = d.exercises.find((e) => e.exerciseId === selectedExId || e.name?.toLowerCase().includes(selectedExObj.name.toLowerCase()));
      if (match && match.sets && match.sets.length > 0) {
        const maxSetWeight = Math.max(...match.sets.map((s) => Number(s.weight) || 0));
        const maxSetReps = match.sets.find((s) => Number(s.weight) === maxSetWeight)?.reps || 0;
        exHistory.push({ date: d.date, weight: maxSetWeight, reps: maxSetReps, isVacation: d.travelMode });
      }
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
      {/* Header Stat Overview */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <span className="badge badge-cyan"><TrendingUp size={12} /> ANALYTICS & INSIGHTS</span>
            <h2 style={{ fontSize: '1.2rem', marginTop: '0.25rem' }}>GymsLab Progress Dashboard</h2>
          </div>
          <button onClick={loadStatsData} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <RefreshCw size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '0.75rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Waist Size</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-cyan)', marginTop: '0.2rem' }}>
              {profile?.waist || 85} <span style={{ fontSize: '0.65rem' }}>cm</span>
            </div>
          </div>

          <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '0.75rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Target Weight</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
              {profile?.targetWeight || 78} <span style={{ fontSize: '0.65rem' }}>kg</span>
            </div>
          </div>

          <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '0.75rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Active Days</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
              {dailyLogs.length} <span style={{ fontSize: '0.65rem' }}>days</span>
            </div>
          </div>

          <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '0.75rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Vacation Days</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '0.2rem' }}>
              {vacationLogs.length} <span style={{ fontSize: '0.65rem' }}>days</span>
            </div>
          </div>
        </div>
      </div>

      {/* VACATION / TRAVEL RECOVERY LOG CARD */}
      {vacationLogs.length > 0 && (
        <div className="glass-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Plane size={18} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--accent-amber)' }}>Vacation & Travel Recovery Log</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            The app remembered {vacationLogs.length} planned vacation days. Streaks and stats acknowledge these dates as travel recovery!
          </p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {vacationLogs.map((v, vIdx) => (
              <span key={vIdx} className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                ✈️ {v.date}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CHART 1: Body Weight Evolution */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <Scale size={18} color="var(--primary-cyan)" />
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Morning Body Weight Trend</h3>
        </div>

        {weightData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No weight entries logged yet. Log your morning weight on the dashboard!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {weightData.slice(-7).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2, 6, 23, 0.5)', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</span>
                  {item.isVacation && <span className="badge badge-amber" style={{ fontSize: '0.6rem' }}>✈️ Vacation</span>}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-cyan)' }}>
                  {item.weight} kg
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHART 2: Specific Exercise Progressive Overload Tracker */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Dumbbell size={18} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Exercise Progression</h3>
          </div>

          <select
            value={selectedExId}
            onChange={(e) => setSelectedExId(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
          >
            {PRESET_EXERCISES.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        {exHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No sets logged for <strong>{selectedExObj.name}</strong> yet. Complete sets in your workout tracker!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {exHistory.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2, 6, 23, 0.5)', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</span>
                  {item.isVacation && <span className="badge badge-amber" style={{ fontSize: '0.6rem' }}>✈️ Vacation</span>}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  {item.weight} kg × {item.reps} reps
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHART 3: 15-Day 1RM Strength Leaderboard */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <Award size={18} color="var(--accent-amber)" />
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>15-Day 1-Rep Max (1RM) Benchmarks</h3>
        </div>

        {rm1Tests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No 1RM strength tests logged yet. Tap <strong>15-Day 1RM Test</strong> on the top menu!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {rm1Tests.map((t, idx) => (
              <div key={idx} style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '0.85rem', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Test Date: {new Date(t.timestamp).toLocaleDateString()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.5rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Bench</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary-cyan)' }}>{t.bench}k</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.5rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Pullups</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>+{t.pullups}k</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.5rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Squat</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{t.squat}k</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.5rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Deadlift</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{t.deadlift}k</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
