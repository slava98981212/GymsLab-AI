import React, { useState } from 'react';
import { Settings, Key, Plane, HelpCircle, Save, X, Utensils, ChefHat, Edit2 } from 'lucide-react';
import MealPlannerModal from './MealPlannerModal';

export default function SettingsModal({ apiKey, travelMode, targetMacros, onSaveSettings, onSaveTargetMacros, onResetProfile, onOpenGuide, onClose }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [travelState, setTravelState] = useState(travelMode || false);

  // Macro Target Editor state in Settings
  const [macroGoals, setMacroGoals] = useState({
    calories: targetMacros?.calories ?? 2400,
    protein: targetMacros?.protein ?? 180,
    carbs: targetMacros?.carbs ?? 240,
    fat: targetMacros?.fat ?? 70
  });

  const [showPlannerModal, setShowPlannerModal] = useState(false);

  const handleMacroChange = (field, valStr) => {
    if (valStr === '') {
      setMacroGoals((prev) => ({ ...prev, [field]: '' }));
      return;
    }
    const num = parseInt(valStr, 10);
    setMacroGoals((prev) => ({ ...prev, [field]: isNaN(num) ? '' : num }));
  };

  const handleSave = () => {
    onSaveSettings({ apiKey: keyInput, travelMode: travelState });
    onSaveTargetMacros({
      calories: Number(macroGoals.calories) || 2400,
      protein: Number(macroGoals.protein) || 180,
      carbs: Number(macroGoals.carbs) || 240,
      fat: Number(macroGoals.fat) || 70
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings size={24} color="var(--primary-cyan)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>App Settings & Nutrition Controls</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Target Macro Goals Editor in Settings */}
          <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Edit2 size={16} /> Target Macro Goals
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Calories (kcal)</label>
                <input
                  type="number"
                  value={macroGoals.calories}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleMacroChange('calories', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Protein (g)</label>
                <input
                  type="number"
                  value={macroGoals.protein}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleMacroChange('protein', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Carbs (g)</label>
                <input
                  type="number"
                  value={macroGoals.carbs}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleMacroChange('carbs', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Fat (g)</label>
                <input
                  type="number"
                  value={macroGoals.fat}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleMacroChange('fat', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* AI Meal Plan Generator Switch in Settings */}
          <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ChefHat size={18} /> AI Meal Plan & Recipe Generator
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', margin: 0 }}>
                Specify 3-8 meals/day, food requests, and meal times (07:00 AM - 22:00 PM). Includes mandatory Creatine (5g) & Whey Protein.
              </p>
            </div>

            <button
              onClick={() => setShowPlannerModal(true)}
              className="btn-emerald"
              style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', padding: '0.45rem 0.75rem' }}
            >
              Launch Generator
            </button>
          </div>

          {/* OpenAI API Key Card */}
          <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-cyan)', display: 'block', marginBottom: '0.4rem' }}>
              OpenAI API Key (Stored safely on iPhone)
            </label>
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
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plane size={16} color="var(--accent-amber)" /> Travel / Vacation Mode
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', margin: 0 }}>
                Pauses required daily check-ins while preserving historical streaks.
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
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
                  height: '18px',
                  width: '18px',
                  left: travelState ? '24px' : '4px',
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

        {/* AI Meal Planner Modal from Settings */}
        {showPlannerModal && (
          <MealPlannerModal
            targetMacros={{
              calories: Number(macroGoals.calories) || 2400,
              protein: Number(macroGoals.protein) || 180,
              carbs: Number(macroGoals.carbs) || 240,
              fat: Number(macroGoals.fat) || 70
            }}
            apiKey={apiKey}
            onAddMealToLog={() => {}}
            onClose={() => setShowPlannerModal(false)}
          />
        )}
      </div>
    </div>
  );
}
