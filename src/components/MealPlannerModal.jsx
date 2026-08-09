import React, { useState } from 'react';
import { ChefHat, Sparkles, Plus, Clock, Utensils, Check, X, BookOpen } from 'lucide-react';
import { generateMealPlan } from '../services/openai';

export default function MealPlannerModal({ targetMacros, apiKey, onAddMealToLog, onClose }) {
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [cravings, setCravings] = useState('');
  const [loading, setLoading] = useState(false);
  const [mealPlanResult, setMealPlanResult] = useState(null);
  const [loggedMealIds, setLoggedMealIds] = useState([]);

  const handleGeneratePlan = async () => {
    if (!apiKey) {
      alert('Please set your OpenAI API key in Settings to generate an AI Meal Plan.');
      return;
    }

    setLoading(true);
    try {
      const res = await generateMealPlan({ mealsPerDay, cravings, targetMacros }, apiKey);
      setMealPlanResult(res);
    } catch (err) {
      alert('Error generating meal plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePushMealToLog = (meal, idx) => {
    const newMeal = {
      id: `meal_plan_${Date.now()}_${idx}`,
      category: meal.category || 'Lunch',
      name: meal.mealName,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      notes: `Recipe: ${meal.instructions || ''}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onAddMealToLog(newMeal);
    setLoggedMealIds((prev) => [...prev, idx]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ChefHat size={26} color="var(--primary-cyan)" />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>AI Custom Meal & Recipe Planner</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Specify how many meals you want today and any special food wishes. GPT-4o will design a complete recipe plan tailored to your target macros.
        </p>

        {/* Input Controls */}
        <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Meals Per Day</label>
              <select
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(parseInt(e.target.value, 10))}
                className="input-field"
              >
                <option value={3}>3 Meals / Day</option>
                <option value={4}>4 Meals / Day</option>
                <option value={5}>5 Meals / Day</option>
                <option value={6}>6 Meals / Day</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                Daily Macro Target
              </label>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', padding: '0.65rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                {targetMacros.calories} kcal ({targetMacros.protein}P / {targetMacros.carbs}C / {targetMacros.fat}F)
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
              Specific Foods / Cravings Wishes Today (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Ribeye steak with sweet potato, berry protein smoothie..."
              value={cravings}
              onChange={(e) => setCravings(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <button onClick={handleGeneratePlan} className="btn-primary" style={{ width: '100%', marginBottom: '1.25rem' }} disabled={loading}>
          {loading ? 'GPT-4o Crafting Custom Recipes...' : 'Generate AI Daily Meal Plan & Recipes'} <Sparkles size={16} />
        </button>

        {/* AI Meal Plan Display */}
        {mealPlanResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '380px', overflowY: 'auto' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '0.85rem', borderRadius: '14px', fontSize: '0.85rem', color: 'var(--primary-cyan)' }}>
              🎯 <strong>Strategy:</strong> {mealPlanResult.summary}
            </div>

            {mealPlanResult.meals.map((m, idx) => {
              const isLogged = loggedMealIds.includes(idx);
              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '16px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="badge badge-cyan" style={{ marginBottom: '0.2rem' }}>{m.category || `Meal #${idx + 1}`}</span>
                      <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)' }}>{m.mealName}</h3>
                    </div>

                    <button
                      onClick={() => handlePushMealToLog(m, idx)}
                      disabled={isLogged}
                      className={isLogged ? 'btn-secondary' : 'btn-emerald'}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    >
                      {isLogged ? 'Logged ✓' : '+ Log Meal'}
                    </button>
                  </div>

                  {/* Macros line */}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 0.75rem', borderRadius: '10px' }}>
                    <span>🔥 {m.calories} kcal</span>
                    <span>💪 P: {m.protein}g</span>
                    <span>🌾 C: {m.carbs}g</span>
                    <span>🥑 F: {m.fat}g</span>
                  </div>

                  {/* Ingredients */}
                  {m.ingredients && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-cyan)', marginBottom: '0.25rem' }}>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
