import React, { useState } from 'react';
import { Settings, Key, Plane, HelpCircle, Save, X, RefreshCw, Smartphone } from 'lucide-react';

export default function SettingsModal({ apiKey, travelMode, onSaveSettings, onResetProfile, onOpenGuide, onClose }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [travelState, setTravelState] = useState(travelMode || false);

  const handleSave = () => {
    onSaveSettings({ apiKey: keyInput, travelMode: travelState });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings size={24} color="var(--primary-cyan)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>App Settings & Privacy</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* OpenAI API Key Card */}
          <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-cyan)', display: 'block', marginBottom: '0.4rem' }}>
              OpenAI API Key (Required for GPT-4o AI Coach)
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Your key is stored strictly on your iPhone (localStorage & IndexedDB). It is never sent to third-party servers.
            </p>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="sk-proj-..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Key size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Travel / Vacation Mode Card */}
          <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ paddingRight: '1rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plane size={16} color="var(--accent-amber)" /> Travel / Vacation Pause Mode
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Pauses required daily check-ins, notifications, and streak penalties while you travel.
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={travelState}
                onChange={(e) => setTravelState(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: travelState ? 'var(--accent-amber)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '34px',
                transition: '0.3s'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '20px',
                  width: '20px',
                  left: travelState ? '25px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.3s'
                }} />
              </span>
            </label>
          </div>

          {/* Measurement Guide Link */}
          <button
            onClick={() => { onClose(); onOpenGuide(); }}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <HelpCircle size={18} color="var(--primary-cyan)" /> How to Measure Waist & Biceps Guide
          </button>

          {/* iOS App Store / PWA Install Guide */}
          <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '16px', padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Smartphone size={16} /> Private iPhone Home Screen Setup
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              To use this privately on your iPhone: Open Safari → Tap the <strong>Share Button</strong> (square with up arrow) → Tap <strong>"Add to Home Screen"</strong>. Launches full-screen like a native App Store app!
            </p>
          </div>

          <button onClick={handleSave} className="btn-primary" style={{ width: '100%' }}>
            Save Settings <Save size={16} />
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset your profile and clear onboarding settings?')) {
                onResetProfile();
              }
            }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'center' }}
          >
            Reset Profile Data
          </button>
        </div>
      </div>
    </div>
  );
}
