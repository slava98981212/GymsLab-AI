import React, { useState } from 'react';
import { Calendar, Camera, Sparkles, TrendingDown, HelpCircle, CheckCircle } from 'lucide-react';
import { generateWeeklySummary } from '../services/openai';

export default function WeeklyCheckin({ profile, historicalMemory, apiKey, onOpenGuide }) {
  const [weeklyData, setWeeklyData] = useState({
    weekId: `Week_${new Date().toISOString().slice(0, 10)}`,
    weight: profile?.weight || 80,
    waist: profile?.waist || 85,
    bicepLeft: profile?.bicepLeft || 38,
    bicepRight: profile?.bicepRight || 38.5,
    chest: profile?.chest || 104
  });

  const [photos, setPhotos] = useState({ front: null, side: null, back: null });
  const [loading, setLoading] = useState(false);
  const [aiWeeklyReport, setAiWeeklyReport] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWeeklyData((prev) => ({ ...prev, [name]: parseFloat(value) || value }));
  };

  const handlePhotoUpload = (view, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotos((prev) => ({ ...prev, [view]: evt.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateWeeklyAI = async () => {
    if (!apiKey) {
      alert('Please set your OpenAI API key in Settings.');
      return;
    }

    setLoading(true);
    try {
      const currentLog = { ...weeklyData, photos };
      const res = await generateWeeklySummary(currentLog, { profile, ...historicalMemory }, apiKey);
      setAiWeeklyReport(res);
    } catch (err) {
      alert('Weekly AI Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const waistDelta = (weeklyData.waist - (profile?.waist || weeklyData.waist)).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <span className="badge badge-cyan"><Calendar size={12} /> WEEKLY MILESTONE</span>
            <h2 style={{ fontSize: '1.2rem', marginTop: '0.25rem' }}>Weekly Progress Check-In</h2>
          </div>
          <button onClick={onOpenGuide} className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
            <HelpCircle size={12} /> Measurement Guide
          </button>
        </div>

        {/* Measurement Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Current Weight (kg)</label>
            <input type="number" name="weight" value={weeklyData.weight} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
              Waist Size (cm) {waistDelta !== '0.0' && `(${waistDelta > 0 ? '+' : ''}${waistDelta}cm)`}
            </label>
            <input type="number" name="waist" value={weeklyData.waist} onChange={handleChange} className="input-field" style={{ borderColor: 'rgba(6, 182, 212, 0.4)' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Left Bicep (cm)</label>
            <input type="number" name="bicepLeft" value={weeklyData.bicepLeft} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Right Bicep (cm)</label>
            <input type="number" name="bicepRight" value={weeklyData.bicepRight} onChange={handleChange} className="input-field" />
          </div>
        </div>

        {/* 3 Weekly Body Photos */}
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>New Weekly Body Photos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {['front', 'side', 'back'].map((view) => (
            <label
              key={view}
              style={{
                height: '130px',
                border: '2px dashed var(--border-card)',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                background: photos[view] ? `url(${photos[view]}) center/cover` : 'rgba(2, 6, 23, 0.4)'
              }}
            >
              {!photos[view] && (
                <>
                  <Camera size={22} color="var(--text-dim)" />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'capitalize' }}>
                    {view}
                  </span>
                </>
              )}
              <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(view, e)} style={{ display: 'none' }} />
            </label>
          ))}
        </div>

        <button onClick={handleGenerateWeeklyAI} className="btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'GPT-4o Comparing Weekly Progress...' : 'Generate Weekly AI Transformation Assessment'} <Sparkles size={16} />
        </button>
      </div>

      {/* AI Weekly Report Display */}
      {aiWeeklyReport && (
        <div className="glass-card" style={{ borderColor: 'var(--accent-emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="badge badge-emerald">WEEKLY SCORE: {aiWeeklyReport.overallScore}</span>
          </div>

          <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>{aiWeeklyReport.summaryHeadline}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
            <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '0.75rem', borderRadius: '12px' }}>
              <strong>📏 Waist & Weight Evolution:</strong> {aiWeeklyReport.waistChange}
            </div>

            <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '0.75rem', borderRadius: '12px' }}>
              <strong>💪 Muscle Hypertrophy Insight:</strong> {aiWeeklyReport.muscleGainInsight}
            </div>

            <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '0.75rem', borderRadius: '12px' }}>
              <strong>📸 Body Composition Photos (Oldest vs Last Month vs New):</strong> {aiWeeklyReport.physiquePhotoAnalysis}
            </div>

            {aiWeeklyReport.weeklySummariesReview && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)', padding: '0.75rem', borderRadius: '12px' }}>
                📅 <strong>7-Day Daily AI Summaries Synthesis (Mon-Sun):</strong> {aiWeeklyReport.weeklySummariesReview}
              </div>
            )}

            <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--primary-cyan)', padding: '0.75rem', borderRadius: '12px' }}>
              🚀 <strong>Next Week Macro & Workout Plan:</strong> {aiWeeklyReport.nextWeekAdjustments}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
