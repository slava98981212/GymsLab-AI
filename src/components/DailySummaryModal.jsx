import React, { useState } from 'react';
import { Sparkles, Award, CheckCircle, AlertTriangle, ArrowRight, X, Video } from 'lucide-react';
import { generateDaily23Summary } from '../services/openai';

export default function DailySummaryModal({ dailyLog, profile, historicalMemory, apiKey, onSaveSummary, onClose }) {
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(dailyLog?.aiDailySummary || null);

  const handleGenerate = async () => {
    if (!apiKey) {
      alert('Please set your OpenAI API Key in Settings to generate the Daily 23:00 AI Summary.');
      return;
    }

    setLoading(true);

    try {
      // Gather keyframes from videos uploaded today
      const allFrames = [];
      if (dailyLog.videos && dailyLog.videos.length > 0) {
        dailyLog.videos.forEach((vid) => {
          if (vid.keyframes) {
            allFrames.push(...vid.keyframes);
          }
        });
      }

      // Gather food photos logged today
      const weekendPhotos = (dailyLog.foodPhotos || []).map((p) => p?.url).filter(Boolean);

      const res = await generateDaily23Summary(dailyLog, { ...historicalMemory, profile }, allFrames, weekendPhotos, [], apiKey);
      setSummaryData(res);
      onSaveSummary(res);
    } catch (err) {
      alert('Error generating 23:00 AI summary: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (g) => {
    switch (g) {
      case 'A+': case 'A': return 'var(--accent-emerald)';
      case 'B': return 'var(--primary-cyan)';
      case 'C': return 'var(--accent-amber)';
      default: return 'var(--accent-rose)';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={24} color="var(--primary-cyan)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Daily 23:00 AI Summary</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          AI Coach evaluates your morning weight, macro intake, 3-stage workout execution, and video form to generate an overall daily grade and comparative analysis against your baseline memory.
        </p>

        {!summaryData ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(2, 6, 23, 0.6)', borderRadius: '20px', border: '1px solid var(--border-card)' }}>
            <Sparkles size={36} color="var(--primary-cyan)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Ready for End-of-Day Review</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {dailyLog.videos?.length || 0} form videos and {dailyLog.meals?.length || 0} meals logged today.
            </p>

            <button onClick={handleGenerate} className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'GPT-4o Analyzing Day & Form Videos...' : 'Generate 23:00 AI Executive Summary'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Grade Card */}
            <div style={{
              background: 'rgba(2, 6, 23, 0.8)',
              border: `1px solid ${getGradeColor(summaryData.grade)}`,
              borderRadius: '20px',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '0.25rem' }}>DAILY PERFORMANCE</span>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '0.2rem 0' }}>{summaryData.headline}</h3>
                <span style={{ fontSize: '0.8rem', color: summaryData.goalAchieved ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                  {summaryData.goalAchieved ? '✓ Daily Goal Achieved' : '⚠️ Daily Goal Partially Met'}
                </span>
              </div>

              <div style={{
                fontSize: '2.5rem',
                fontWeight: 900,
                fontFamily: 'var(--font-heading)',
                color: getGradeColor(summaryData.grade),
                background: 'rgba(255, 255, 255, 0.05)',
                width: '70px',
                height: '70px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-card)'
              }}>
                {summaryData.grade}
              </div>
            </div>

            {/* Form Analysis Card */}
            {summaryData.formAnalysis && (
              <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '16px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-cyan)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  <Video size={16} /> Form Video Analysis
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
                  {summaryData.formAnalysis}
                </p>
              </div>
            )}

            {/* Comparative Memory Insight */}
            {summaryData.comparativeMemoryInsight && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  <Award size={16} /> Comparative Progress vs Past Memory
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
                  {summaryData.comparativeMemoryInsight}
                </p>
              </div>
            )}

            {/* Nutrition & Workout Feedback */}
            <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <strong>Nutrition:</strong> {summaryData.nutritionFeedback}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Workout:</strong> {summaryData.workoutFeedback}
              </div>
            </div>

            {/* Tomorrow Recommendation */}
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '16px', padding: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: 700, marginBottom: '0.25rem' }}>
                🎯 Strategy for Tomorrow:
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{summaryData.tomorrowRecommendation}</p>
            </div>

            <button onClick={handleGenerate} className="btn-secondary" style={{ width: '100%' }}>
              Re-run AI Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
