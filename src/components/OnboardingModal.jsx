import React, { useState } from 'react';
import { Camera, Sparkles, HelpCircle, ArrowRight, Check, Key } from 'lucide-react';
import { generateBaselineSummary } from '../services/openai';

export default function OnboardingModal({ onSaveProfile, onOpenGuide }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    height: 180,
    weight: 82,
    waist: 86, // Waist size in cm
    bicepLeft: 38,
    bicepRight: 38.5,
    chest: 104,
    thigh: 60,
    targetWeight: 78,
    goalType: 'Recomposition',
    apiKey: ''
  });

  const [photos, setPhotos] = useState({
    front: null,
    side: null,
    back: null
  });

  const [aiBaselineResult, setAiBaselineResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (view, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos((prev) => ({ ...prev, [view]: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunBaselineAI = async () => {
    if (!formData.apiKey) {
      alert('Please enter your OpenAI API key to generate your initial AI summary.');
      return;
    }
    setLoading(true);
    try {
      const profileToAnalyze = { ...formData, photos };
      const res = await generateBaselineSummary(profileToAnalyze, formData.apiKey);
      setAiBaselineResult(res);
      setStep(3);
    } catch (err) {
      alert('Error connecting to OpenAI: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    const finalProfile = {
      ...formData,
      photos,
      baselineSummary: aiBaselineResult,
      targetMacros: aiBaselineResult?.recommendedMacros || {
        calories: 2400,
        protein: 180,
        carbs: 240,
        fat: 70
      }
    };
    onSaveProfile(finalProfile);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        {/* Header indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <span className="badge badge-cyan">ONBOARDING SETUP</span>
            <h2 style={{ fontSize: '1.3rem', marginTop: '0.35rem' }}>Build Your Fitness Baseline</h2>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Step {step} of 3
          </div>
        </div>

        {/* STEP 1: Body Measurements */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6, 182, 212, 0.1)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary-cyan)', fontWeight: 600 }}>
                Need help measuring your Waist or Biceps?
              </span>
              <button
                type="button"
                onClick={onOpenGuide}
                style={{
                  background: 'var(--primary-cyan)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <HelpCircle size={12} /> View Guide
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Height (cm)</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Current Weight (kg)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                  Waist Size (cm) *
                </label>
                <input type="number" name="waist" value={formData.waist} onChange={handleChange} className="input-field" style={{ borderColor: 'rgba(6, 182, 212, 0.4)' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Goal Weight (kg)</label>
                <input type="number" name="targetWeight" value={formData.targetWeight} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Left Bicep Peak (cm)</label>
                <input type="number" name="bicepLeft" value={formData.bicepLeft} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Right Bicep Peak (cm)</label>
                <input type="number" name="bicepRight" value={formData.bicepRight} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Chest Size (cm)</label>
                <input type="number" name="chest" value={formData.chest} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Thigh Size (cm)</label>
                <input type="number" name="thigh" value={formData.thigh} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Fitness Goal</label>
              <select name="goalType" value={formData.goalType} onChange={handleChange} className="input-field">
                <option value="Fat Loss Cut">Fat Loss Cut (Lower Waist Size)</option>
                <option value="Hypertrophy Muscle Gain">Hypertrophy Muscle Gain (Build Biceps & Chest)</option>
                <option value="Recomposition">Body Recomposition (Trim Waist + Build Muscle)</option>
              </select>
            </div>

            <button onClick={() => setStep(2)} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Next: Initial Body Photos <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: Baseline Body Photos */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Upload or capture 3 initial photos of your physique. OpenAI Vision will analyze your baseline muscle symmetry and body composition.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              {['front', 'side', 'back'].map((view) => (
                <div key={view} style={{ textAlign: 'center' }}>
                  <label
                    style={{
                      height: '140px',
                      border: '2px dashed var(--border-card)',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative',
                      background: photos[view] ? `url(${photos[view]}) center/cover` : 'rgba(2, 6, 23, 0.4)'
                    }}
                  >
                    {!photos[view] && (
                      <>
                        <Camera size={24} color="var(--text-dim)" />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', textTransform: 'capitalize' }}>
                          {view} Photo
                        </span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(view, e)} style={{ display: 'none' }} />
                  </label>
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                OpenAI API Key (Stored safely on device)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="apiKey"
                  placeholder="sk-proj-..."
                  value={formData.apiKey}
                  onChange={handleChange}
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Key size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
              <button onClick={handleRunBaselineAI} className="btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? 'Analyzing with GPT-4o...' : 'Run AI Baseline Evaluation'} <Sparkles size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Baseline AI Results */}
        {step === 3 && aiBaselineResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles color="var(--accent-emerald)" size={20} />
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>AI Baseline Assessment Ready</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {aiBaselineResult.analysis}
              </p>
            </div>

            <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Recommended Daily Targets</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.6rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-cyan)' }}>{aiBaselineResult.recommendedMacros?.calories}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Calories</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.6rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{aiBaselineResult.recommendedMacros?.protein}g</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Protein</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.6rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{aiBaselineResult.recommendedMacros?.carbs}g</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Carbs</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.6rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{aiBaselineResult.recommendedMacros?.fat}g</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Fat</div>
                </div>
              </div>
            </div>

            <button onClick={handleComplete} className="btn-emerald" style={{ width: '100%', marginTop: '0.5rem' }}>
              Launch GymsLab AI <Check size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
