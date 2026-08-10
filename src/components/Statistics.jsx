import React, { useState, useEffect } from 'react';
import { TrendingUp, Scale, Dumbbell, Award, RefreshCw, Plane, Activity, Zap } from 'lucide-react';
import { getAllDailyLogs, getAll1RMTests, getAllWeeklyLogs } from '../services/db';
import { PRESET_EXERCISES } from '../utils/constants';

// Clean, Responsive SVG White Line Chart Component
function WhiteLineChart({
  data = [],
  xKey = 'date',
  yKey = 'weight',
  label = 'Progress',
  unit = 'kg',
  targetValue = null,
  height = 200,
  lineColor = '#ffffff',
  gradientOpacity = 0.25,
  showGrid = true
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
        No chart data recorded yet. Log entries to populate line graph!
      </div>
    );
  }

  // Duplicate single data point to make a visible flat line
  const plotData = data.length === 1
    ? [{ ...data[0], [xKey]: 'Start' }, { ...data[0], [xKey]: data[0][xKey] }]
    : data;

  const viewBoxWidth = 600;
  const viewBoxHeight = height;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const innerWidth = viewBoxWidth - paddingLeft - paddingRight;
  const innerHeight = viewBoxHeight - paddingTop - paddingBottom;

  const yValues = plotData.map((d) => Number(d[yKey]) || 0);
  if (targetValue !== null && typeof targetValue !== 'undefined' && !Number.isNaN(Number(targetValue))) {
    yValues.push(Number(targetValue));
  }

  let minY = Math.min(...yValues);
  let maxY = Math.max(...yValues);

  if (minY === maxY) {
    minY = minY - 5;
    maxY = maxY + 5;
  } else {
    const margin = (maxY - minY) * 0.15 || 2;
    minY = Math.floor(minY - margin);
    maxY = Math.ceil(maxY + margin);
  }

  const rangeY = maxY - minY || 1;

  const points = plotData.map((d, idx) => {
    const x = paddingLeft + (idx / (plotData.length - 1 || 1)) * innerWidth;
    const val = Number(d[yKey]) || 0;
    const y = paddingTop + innerHeight - ((val - minY) / rangeY) * innerHeight;
    return { x, y, val, date: d[xKey], isVacation: d.isVacation, raw: d };
  });

  // SVG Line path
  const linePath = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '');

  // SVG Area path underneath
  const firstPt = points[0];
  const lastPt = points[points.length - 1];
  const bottomY = paddingTop + innerHeight;
  const areaPath = `${linePath} L ${lastPt.x.toFixed(1)},${bottomY} L ${firstPt.x.toFixed(1)},${bottomY} Z`;

  // Target Y coordinate if targetValue present
  let targetY = null;
  if (targetValue !== null && typeof targetValue !== 'undefined' && !Number.isNaN(Number(targetValue))) {
    targetY = paddingTop + innerHeight - ((Number(targetValue) - minY) / rangeY) * innerHeight;
  }

  // Horizontal Grid Ticks
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount }).map((_, i) => {
    const val = minY + (i / (yTickCount - 1)) * rangeY;
    const y = paddingTop + innerHeight - ((val - minY) / rangeY) * innerHeight;
    return { val: Math.round(val * 10) / 10, y };
  });

  const gradId = `whiteGrad-${label.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={gradientOpacity} />
            <stop offset="75%" stopColor={lineColor} stopOpacity={gradientOpacity * 0.2} />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </linearGradient>

          <filter id="whiteGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid Lines & Labels */}
        {showGrid && yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={tick.y}
              x2={viewBoxWidth - paddingRight}
              y2={tick.y}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <text
              x={paddingLeft - 8}
              y={tick.y + 4}
              fill="rgba(255, 255, 255, 0.45)"
              fontSize="10"
              fontWeight="600"
              textAnchor="end"
            >
              {tick.val}
            </text>
          </g>
        ))}

        {/* Target Reference Line */}
        {targetY !== null && targetY >= paddingTop && targetY <= bottomY && (
          <g>
            <line
              x1={paddingLeft}
              y1={targetY}
              x2={viewBoxWidth - paddingRight}
              y2={targetY}
              stroke="var(--accent-emerald)"
              strokeDasharray="5 3"
              strokeWidth="1.5"
            />
            <text
              x={viewBoxWidth - paddingRight}
              y={targetY - 5}
              fill="var(--accent-emerald)"
              fontSize="10"
              fontWeight="800"
              textAnchor="end"
            >
              Target ({targetValue} {unit})
            </text>
          </g>
        )}

        {/* Gradient Fill under line */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Main White Line Path */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#whiteGlowFilter)"
        />

        {/* Interactive Data Points & Labels */}
        {points.map((pt, idx) => {
          const isHovered = hoveredIndex === idx;
          const displayDate = String(pt.date || '').slice(5);

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Vertical Guide Line on Hover */}
              {isHovered && (
                <line
                  x1={pt.x}
                  y1={paddingTop}
                  x2={pt.x}
                  y2={bottomY}
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
              )}

              {/* Data Point Dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 7 : 4.5}
                fill={lineColor}
                stroke="#090d16"
                strokeWidth="2.5"
                style={{ transition: 'all 0.15s ease' }}
              />

              {/* Top Value Badge */}
              <rect
                x={pt.x - 22}
                y={pt.y - 23}
                width="44"
                height="16"
                rx="4"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
              />
              <text
                x={pt.x}
                y={pt.y - 12}
                fill="#ffffff"
                fontSize="9"
                fontWeight="800"
                textAnchor="middle"
              >
                {pt.val} {unit}
              </text>

              {/* Bottom X-axis Date Label */}
              <text
                x={pt.x}
                y={viewBoxHeight - 12}
                fill={isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.55)'}
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
              >
                {displayDate}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

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
    setRm1Tests(tests.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    setWeeklyLogs(wLogs);
  };

  // 1. Weight Trend Line Data
  const weightData = dailyLogs
    .filter((d) => d.weight && !Number.isNaN(Number(d.weight)))
    .map((d) => ({ date: d.date, weight: Number(d.weight), isVacation: d.travelMode }));

  // 2. Vacation / Travel Days
  const vacationLogs = dailyLogs.filter((d) => d.travelMode);

  // 3. Exercise Progressive Overload Line Data
  const selectedExObj = PRESET_EXERCISES.find((e) => e.id === selectedExId) || PRESET_EXERCISES[0];
  const exHistory = [];
  dailyLogs.forEach((d) => {
    if (d.exercises) {
      const match = d.exercises.find(
        (e) => e.exerciseId === selectedExId || e.name?.toLowerCase().includes(selectedExObj.name.toLowerCase())
      );
      if (match && match.sets && match.sets.length > 0) {
        const maxWeight = Math.max(...match.sets.map((s) => Number(s.weight) || 0));
        if (maxWeight > 0) {
          const maxSetReps = match.sets.find((s) => Number(s.weight) === maxWeight)?.reps || 0;
          exHistory.push({ date: d.date, weight: maxWeight, reps: maxSetReps, isVacation: d.travelMode });
        }
      }
    }
  });

  // 4. Daily Workout Volume Line Data (kg)
  const volumeData = dailyLogs
    .map((d) => {
      let totalVol = 0;
      if (d.exercises && Array.isArray(d.exercises)) {
        d.exercises.forEach((ex) => {
          if (ex.sets && Array.isArray(ex.sets)) {
            ex.sets.forEach((s) => {
              if (s.completed || s.weight) {
                totalVol += (Number(s.weight) || 0) * (Number(s.reps) || 0);
              }
            });
          }
        });
      }
      return { date: d.date, volume: totalVol };
    })
    .filter((d) => d.volume > 0);

  // 5. 1RM Benchmark Strength Line Data
  const rmBenchData = rm1Tests.map((t) => ({ date: new Date(t.timestamp).toLocaleDateString(), weight: t.bench }));
  const rmPullupData = rm1Tests.map((t) => ({ date: new Date(t.timestamp).toLocaleDateString(), weight: t.pullups }));
  const rmSquatData = rm1Tests.map((t) => ({ date: new Date(t.timestamp).toLocaleDateString(), weight: t.squat }));
  const rmDeadliftData = rm1Tests.map((t) => ({ date: new Date(t.timestamp).toLocaleDateString(), weight: t.deadlift }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
      {/* Header Stat Overview */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <span className="badge badge-cyan"><TrendingUp size={12} /> GRAPHICAL ANALYTICS</span>
            <h2 style={{ fontSize: '1.2rem', marginTop: '0.25rem' }}>GymsLab Progress Dashboard</h2>
          </div>
          <button onClick={loadStatsData} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Refresh Graphs">
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
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Logged Days</div>
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

      {/* VACATION RECOVERY CARD */}
      {vacationLogs.length > 0 && (
        <div className="glass-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Plane size={18} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--accent-amber)' }}>Vacation & Travel Days Recorded</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {vacationLogs.map((v, vIdx) => (
              <span key={vIdx} className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                ✈️ {v.date}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* GRAPH 1: Morning Body Weight Trend Line Graph */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale size={18} color="#ffffff" />
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Morning Body Weight Evolution</h3>
          </div>
          <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>WHITE LINE GRAPH</span>
        </div>

        <WhiteLineChart
          data={weightData}
          xKey="date"
          yKey="weight"
          label="Morning Body Weight"
          unit="kg"
          targetValue={profile?.targetWeight || 78}
          height={210}
          lineColor="#ffffff"
          gradientOpacity={0.3}
        />
      </div>

      {/* GRAPH 2: Specific Exercise Progressive Overload Line Graph */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Dumbbell size={18} color="#ffffff" />
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Exercise Progression Curve</h3>
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

        <WhiteLineChart
          data={exHistory}
          xKey="date"
          yKey="weight"
          label={selectedExObj.name}
          unit="kg"
          height={210}
          lineColor="#ffffff"
          gradientOpacity={0.25}
        />
      </div>

      {/* GRAPH 3: Total Daily Workout Volume Line Graph (kg) */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={18} color="#ffffff" />
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Daily Total Volume Moved</h3>
          </div>
          <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>VOLUME (KG)</span>
        </div>

        <WhiteLineChart
          data={volumeData}
          xKey="date"
          yKey="volume"
          label="Total Workout Volume"
          unit="kg"
          height={210}
          lineColor="#ffffff"
          gradientOpacity={0.25}
        />
      </div>

      {/* GRAPH 4: 15-Day 1RM Strength Benchmark Line Graph */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <Award size={18} color="#ffffff" />
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>15-Day 1-Rep Max (1RM) Benchmarks</h3>
        </div>

        {rmBenchData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No 1RM strength tests logged yet. Tap <strong>15-Day 1RM Test</strong> on the top menu!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-cyan)', marginBottom: '0.25rem' }}>
                • Bench Press 1RM Trend
              </div>
              <WhiteLineChart data={rmBenchData} xKey="date" yKey="weight" label="Bench Press 1RM" unit="kg" height={160} lineColor="#ffffff" />
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>
                • Weighted Pull-ups 1RM Trend
              </div>
              <WhiteLineChart data={rmPullupData} xKey="date" yKey="weight" label="Pullups 1RM" unit="kg" height={160} lineColor="#ffffff" />
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.25rem' }}>
                • Barbell Squat 1RM Trend
              </div>
              <WhiteLineChart data={rmSquatData} xKey="date" yKey="weight" label="Squat 1RM" unit="kg" height={160} lineColor="#ffffff" />
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '0.25rem' }}>
                • Deadlift 1RM Trend
              </div>
              <WhiteLineChart data={rmDeadliftData} xKey="date" yKey="weight" label="Deadlift 1RM" unit="kg" height={160} lineColor="#ffffff" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
