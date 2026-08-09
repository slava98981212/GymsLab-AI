import React, { useState, useEffect } from 'react';
import { ChefHat, Sparkles, Check, X, MessageSquare, Send, Award, Dumbbell, Scale, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { generateMealPlan } from '../services/openai';

export default function MealPlannerModal({ profile, targetMacros, apiKey, onAddMealToLog, onClose }) {
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [userWishes, setUserWishes] = useState('');
  const [loading, setLoading] = useState(false);

  // Persistent Chat & Proposal History State
  const [chatHistory, setChatHistory] = useState([]);
  const [currentProposal, setCurrentProposal] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  // Load any existing draft or proposal from localStorage so reopening remembers state
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('gymslab_meal_plan_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.currentProposal) setCurrentProposal(parsed.currentProposal);
        if (parsed.chatHistory) setChatHistory(parsed.chatHistory);
        if (parsed.isApproved) setIsApproved(parsed.isApproved);
        if (parsed.mealsPerDay) setMealsPerDay(parsed.mealsPerDay);
      }
    } catch (e) {
      console.log('Error loading meal draft', e);
    }
  }, []);

  const saveDraftState = (proposal, history, approvedState) => {
    try {
      localStorage.setItem(
        'gymslab_meal_plan_draft',
        JSON.stringify({
          currentProposal: proposal,
          chatHistory: history,
          isApproved: approvedState,
          mealsPerDay
        })
      );
    } catch (e) {
      console.log('Error saving meal draft', e);
    }
  };

  const handleGenerateOrRefinePlan = async () => {
    if (!apiKey) {
      alert('Please set your OpenAI API key in Settings.');
      return;
    }

    setLoading(true);
    try {
      let nextHistory = [...chatHistory];
      const userMessage = userWishes.trim() || 'Please design the optimal daily meal plan according to my goals and macros.';
      nextHistory.push({ role: 'user', content: userMessage });

      const aiResponse = await generateMealPlan(
        {
          mealsPerDay,
          cravings: userWishes,
          targetMacros,
          profile,
          chatHistory: nextHistory
        },
        apiKey
      );

      nextHistory.push({ role: 'assistant', content: aiResponse.summary, mealPlan: aiResponse });

      setCurrentProposal(aiResponse);
      setChatHistory(nextHistory);
      setUserWishes('');
      setIsApproved(false);
      saveDraftState(aiResponse, nextHistory, false);
    } catch (err) {
      alert('AI Meal Generation Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePlan = () => {
    if (!currentProposal || !currentProposal.meals) return;

    // Log all meals to today's log
    currentProposal.meals.forEach((m, idx) => {
      onAddMealToLog({
        id: `meal_plan_${Date.now()}_${idx}`,
        category: m.category || `Meal #${idx + 1}`,
        name: m.mealName,
        calories: m.calories || 0,
        protein: m.protein || 0,
        carbs: m.carbs || 0,
        fat: m.fat || 0,
        notes: `Recipe: ${m.instructions || ''}`,
        timestamp: m.approxTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });

    setIsApproved(true);
    saveDraftState(currentProposal, chatHistory, true);
    alert('✅ Meal Plan Approved & Added to Today\'s Food Log!');
  };

  const handleResetDraft = () => {
    if (confirm('Start a fresh new meal plan conversation?')) {
      setCurrentProposal(null);
      setChatHistory([]);
      setIsApproved(false);
      localStorage.removeItem('gymslab_meal_plan_draft');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ChefHat size={28} color="var(--primary-cyan)" />
            <div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>AI Master Nutritionist & Recipe Engine</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Interactive alignment & custom recipe approval</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* STATS & GOALS SPECIFICATION CARD AT TOP */}
        <div className="glass-card" style={{ background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(6, 182, 212, 0.3)', marginBottom: '1.25rem', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-cyan)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Award size={14} /> YOUR ATHLETE PARAMETERS (CONSIDERED BY AI NUTRITIONIST):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', fontSize: '0.8rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.5rem 0.65rem', borderRadius: '10px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Goal</span>
              <strong style={{ color: 'var(--accent-amber)' }}>{profile?.goalType || 'Recomposition'}</strong>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.5rem 0.65rem', borderRadius: '10px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Weight Stats</span>
              <strong style={{ color: 'var(--text-main)' }}>{profile?.weight || 80}kg → {profile?.targetWeight || 78}kg</strong>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.5rem 0.65rem', borderRadius: '10px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>Exercise Frequency</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>5-6x / Week</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-card)', fontSize: '0.8rem' }}>
            <div style={{ color: 'var(--primary-cyan)', fontWeight: 700 }}>
              Macros: {targetMacros.calories} kcal ({targetMacros.protein}P / {targetMacros.carbs}C / {targetMacros.fat}F)
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-purple)' }}>
              Mandatory: Creatine (5g) + Whey Shake
            </div>
          </div>
        </div>

        {/* INPUT & WISHES SECTION */}
        <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Meals Per Day (3 to 8)</label>
              <select
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(parseInt(e.target.value, 10))}
                className="input-field"
              >
                {[3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n} Meals / Day</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              {currentProposal && (
                <button onClick={handleResetDraft} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <RotateCcw size={12} /> Reset & Start Fresh
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
              {currentProposal ? 'Refine Plan / Type Feedback to AI:' : 'Your Cravings / Wish List (AI decides optimal balance):'}
            </label>
            <textarea
              rows={3}
              placeholder={currentProposal ? 'e.g. "Can you replace brown rice with quinoa in Meal 2?" or "Add more berries to breakfast"' : 'e.g. "I want salmon in my diet today and sweet potato after workout..."'}
              value={userWishes}
              onChange={(e) => setUserWishes(e.target.value)}
              className="input-field input-textarea"
              style={{ marginBottom: '0.85rem' }}
            />
          </div>

          <button onClick={handleGenerateOrRefinePlan} className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'GPT-4o Crafting Custom Recipes...' : currentProposal ? 'Refine & Update Plan with AI' : 'Generate AI Daily Meal Plan'} <Sparkles size={16} />
          </button>
        </div>

        {/* PROPOSED MEAL PLAN DISPLAY & APPROVAL CONTROLS */}
        {currentProposal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Approval Status Banner */}
            <div style={{
              background: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: isApproved ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-amber)',
              borderRadius: '16px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: isApproved ? 'var(--accent-emerald)' : 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {isApproved ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {isApproved ? 'Meal Plan Approved for Today ✓' : 'Plan Drafted - Review & Approve Below'}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                  {isApproved ? 'All meals are logged in your daily nutrition tracker.' : 'Review recipes below or type changes above until you agree!'}
                </p>
              </div>

              {!isApproved && (
                <button onClick={handleApprovePlan} className="btn-emerald" style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}>
                  ✅ APPROVE PLAN TODAY
                </button>
              )}
            </div>

            {/* AI Strategy Rationale */}
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '0.85rem 1rem', borderRadius: '14px', fontSize: '0.85rem', color: 'var(--primary-cyan)' }}>
              🎯 <strong>Master Nutritionist Strategy:</strong> {currentProposal.summary}
            </div>

            {/* Meals List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '380px', overflowY: 'auto' }}>
              {currentProposal.meals.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '16px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-cyan">{m.category || `Meal #${idx + 1}`}</span>
                        {m.approxTime && <span className="badge badge-amber">🕒 {m.approxTime}</span>}
                      </div>
                      <h3 style={{ fontSize: '1.05rem', marginTop: '0.25rem', color: 'var(--text-main)' }}>{m.mealName}</h3>
                    </div>

                    {isApproved && (
                      <span className="badge badge-emerald">LOGGED ✓</span>
                    )}
                  </div>

                  {/* Macros Line */}
                  <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.03)', padding: '0.45rem 0.75rem', borderRadius: '10px' }}>
                    <span>🔥 {m.calories} kcal</span>
                    <span>💪 P: {m.protein}g</span>
                    <span>🌾 C: {m.carbs}g</span>
                    <span>🥑 F: {m.fat}g</span>
                  </div>

                  {/* Ingredients */}
                  {m.ingredients && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-cyan)', marginBottom: '0.2rem' }}>
                        🛒 What You Need & How Much:
                      </div>
                      <ul style={{ fontSize: '0.8rem', color: 'var(--text-main)', paddingLeft: '1.2rem', margin: 0, lineHeight: '1.4' }}>
                        {m.ingredients.map((ing, iIdx) => (
                          <li key={iIdx}>{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cooking Instructions */}
                  {m.instructions && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      📖 <strong>How to Cook:</strong> {m.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!isApproved && (
              <button onClick={handleApprovePlan} className="btn-emerald" style={{ width: '100%', padding: '0.85rem' }}>
                ✅ APPROVE & LOG THIS MEAL PLAN FOR TODAY
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
