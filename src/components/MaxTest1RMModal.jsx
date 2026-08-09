import React, { useState, useEffect } from 'react';
import { Award, Sparkles, Check, History, TrendingUp, X } from 'lucide-react';
import { MAX_1RM_TEST_EXERCISES } from '../utils/constants';
import { save1RMTest, getAll1RMTests } from '../services/db';
import { generate1RMSummary } from '../services/openai';

export default function MaxTest1RMModal({ apiKey, onClose }) {
  const [testData, setTestData] = useState({
    bench: 100,
    pullups: 20,
    squat: 140,
    deadlift: 160
  });

  const [history, setHistory] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const past = await getAll1RMTests();
    setHistory(past);
  };

  const handleChange = (id, val) => {
    setTestData((prev) => ({ ...prev, [id]: parseFloat(val) || 0 }));
  };

  const handleSaveAndAnalyze = async () => {
    const entry = await save1RMTest(testData);
    setHistory((prev) => [entry, ...prev]);

    if (apiKey) {
      setLoadingAI(true);
      try {
        const res = await generate1RMSummary(testData, history, apiKey);
        setAiReport(res);
      } catch (err) {
        alert('AI 1RM Analysis error: ' + err.message);
      } finally {
        setLoadingAI(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Award size={24} color="var(--primary-cyan)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>15-Day 1-Rep Max Challenge</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Test your true peak 1-Rep Max strength on the core 4 compound lifts every 15 days to track raw power gains over time.
        </p>

        {/* Inputs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
          {MAX_1RM_TEST_EXERCISES.map((ex) => (
            <div
              key={ex.id}
              style={{
                background: 'rgba(2, 6, 23, 0.6)',
                border: '1px solid var(--border-card)',
                borderRadius: '16px',
                padding: '0.85rem'
              }}
            >
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-cyan)', display: 'block', marginBottom: '0.2rem' }}>
                {ex.name}
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                {ex.description}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="number"
                  value={testData[ex.id]}
                  onChange={(e) => handleChange(ex.id, e.target.value)}
                  className="input-field"
                  style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSaveAndAnalyze} className="btn-primary" style={{ width: '100%' }} disabled={loadingAI}>
          {loadingAI ? 'Analyzing 1RM Strength...' : 'Save & Generate AI 1RM Analysis'} <Sparkles size={16} />
        </button>

        {/* AI Analysis Result */}
        {aiReport && (
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '16px', padding: '1rem', marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="badge badge-cyan">STRENGTH GRADE: {aiReport.strengthScore}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Power Ratio: {aiReport.powerRatio}</span>
            </div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-cyan)', marginBottom: '0.35rem' }}>{aiReport.headline}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.45', marginBottom: '0.5rem' }}>{aiReport.analysis}</p>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '10px' }}>
              💡 <strong>Coach Advice:</strong> {aiReport.trainingAdvice}
            </div>
          </div>
        )}

        {/* History Log */}
        {history.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <History size={16} /> Past 1RM Benchmark History
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {history.map((h, idx) => (
                <div key={idx} style={{ background: 'rgba(2, 6, 23, 0.4)', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(h.timestamp).toLocaleDateString()}</span>
                  <span style={{ color: 'var(--primary-cyan)', fontWeight: 700 }}>
                    Bench: {h.bench}k | Pullups: +{h.pullups}k | Squat: {h.squat}k | DL: {h.deadlift}k
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
