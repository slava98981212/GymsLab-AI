import React from 'react';
import { X, Ruler, Activity, Shield, Zap, Info } from 'lucide-react';
import { MEASUREMENT_GUIDES } from '../utils/constants';

export default function MeasurementGuideModal({ onClose }) {
  const getIcon = (type) => {
    switch (type) {
      case 'Ruler': return <Ruler color="var(--primary-cyan)" size={22} />;
      case 'Activity': return <Activity color="var(--accent-emerald)" size={22} />;
      case 'Shield': return <Shield color="var(--accent-purple)" size={22} />;
      case 'Zap': return <Zap color="var(--accent-amber)" size={22} />;
      default: return <Info color="var(--primary-cyan)" size={22} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Ruler size={24} color="var(--primary-cyan)" />
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Anatomical Measurement Guide</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(MEASUREMENT_GUIDES).map(([key, guide]) => (
            <div
              key={key}
              style={{
                background: 'rgba(2, 6, 23, 0.6)',
                border: '1px solid var(--border-card)',
                borderRadius: '16px',
                padding: '1rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start'
              }}
            >
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.75rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getIcon(guide.icon)}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {guide.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '0.5rem' }}>
                  {guide.description}
                </p>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--primary-cyan)',
                  background: 'rgba(6, 182, 212, 0.1)',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Info size={12} />
                  <span><strong>Pro Tip:</strong> {guide.tip}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="btn-primary"
          style={{ width: '100%', marginTop: '1.5rem' }}
        >
          Got It, Ready to Measure!
        </button>
      </div>
    </div>
  );
}
