import React, { useState } from 'react';
import { Scale, Check, X, TrendingDown, Target } from 'lucide-react';

export default function MorningWeightModal({ currentWeight, targetWeight, onSaveWeight, onClose }) {
  const [weight, setWeight] = useState(currentWeight || 80);

  const handleSave = () => {
    onSaveWeight(parseFloat(weight));
    onClose();
  };

  const diff = (parseFloat(weight) - (targetWeight || 80)).toFixed(1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale size={24} color="var(--primary-cyan)" />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Morning Weight Log</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Log your fast morning body weight right after waking up for consistent trajectory tracking.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'rgba(2, 6, 23, 0.6)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-heading)',
                fontSize: '3rem',
                fontWeight: 900,
                width: '140px',
                textAlign: 'center',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '1.2rem', color: 'var(--primary-cyan)', fontWeight: 700 }}>kg</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
              <Target size={14} color="var(--primary-cyan)" />
              Target: <strong>{targetWeight || 80} kg</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: diff <= 0 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
              <TrendingDown size={14} />
              Delta: <strong>{diff > 0 ? `+${diff}` : diff} kg</strong>
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
          Save Morning Weight <Check size={16} />
        </button>
      </div>
    </div>
  );
}
