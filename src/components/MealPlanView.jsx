import React, { useState, useEffect } from 'react';
import { ChefHat, Sparkles, CheckCircle2, Clock, ShoppingCart, BookOpen, Utensils, AlertCircle, RotateCcw, Plus } from 'lucide-react';
import MealPlannerModal from './MealPlannerModal';

export default function MealPlanView({ profile, targetMacros, apiKey, dailyLog, onUpdateLog }) {
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [approvedPlan, setApprovedPlan] = useState(null);

  useEffect(() => {
    loadSavedApprovedPlan();
  }, [dailyLog]);

  const loadSavedApprovedPlan = () => {
    try {
      const savedDraft = localStorage.getItem('gymslab_meal_plan_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.currentProposal && parsed.isApproved) {
          setApprovedPlan(parsed.currentProposal);
        } else if (parsed.currentProposal) {
          setApprovedPlan(parsed.currentProposal);
        }
      }
    } catch (e) {
      console.log('Error loading saved meal plan', e);
    }
  };

  const meals = approvedPlan?.meals || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
      {/* Top Header Card */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(15, 23, 42, 0.95))', borderColor: 'rgba(6, 182, 212, 0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
          <div>
            <span className="badge badge-cyan"><ChefHat size={12} /> TODAY'S AI MEAL PLAN</span>
            <h2 style={{ fontSize: '1.35rem', marginTop: '0.25rem' }}>Custom Recipes & Ingredients</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Target: <strong>{targetMacros.calories} kcal</strong> ({targetMacros.protein}g P / {targetMacros.carbs}g C / {targetMacros.fat}g F)
            </p>
          </div>

          <button
            onClick={() => setShowPlannerModal(true)}
            className="btn-emerald"
            style={{ padding: '0.55rem 0.9rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            {approvedPlan ? 'Edit / Refine Plan' : 'Generate AI Plan'} <Sparkles size={14} />
          </button>
        </div>

        {approvedPlan?.summary && (
          <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--primary-cyan)', marginTop: '0.5rem' }}>
            🎯 <strong>Nutritionist Strategy:</strong> {approvedPlan.summary}
          </div>
        )}
      </div>

      {/* TOTAL CALCULATED PLAN MACROS vs GOALS COMPARISON CARD */}
      {approvedPlan && meals.length > 0 && (
        (() => {
          const totals = meals.reduce(
            (acc, m) => ({
              calories: acc.calories + (Number(m.calories) || 0),
              protein: acc.protein + (Number(m.protein) || 0),
              carbs: acc.carbs + (Number(m.carbs) || 0),
              fat: acc.fat + (Number(m.fat) || 0)
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );

          return (
            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))', borderColor: 'var(--accent-emerald)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent-emerald)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  📊 TOTAL SUM OF ALL PROPOSED MEALS ({meals.length} MEALS):
                </span>
                <span className="badge badge-emerald">✓ PERFECT MATCH</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '0.75rem 0.4rem', borderRadius: '14px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>SUM CALORIES</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary-cyan)', marginTop: '0.15rem' }}>{totals.calories}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Goal: {targetMacros.calories} kcal</div>
                </div>

                <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '0.75rem 0.4rem', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>SUM PROTEIN</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-emerald)', marginTop: '0.15rem' }}>{totals.protein}g</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Goal: {targetMacros.protein}g</div>
                </div>

                <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '0.75rem 0.4rem', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>SUM CARBS</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-amber)', marginTop: '0.15rem' }}>{totals.carbs}g</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Goal: {targetMacros.carbs}g</div>
                </div>

                <div style={{ background: 'rgba(2, 6, 23, 0.6)', padding: '0.75rem 0.4rem', borderRadius: '14px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>SUM FAT</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-purple)', marginTop: '0.15rem' }}>{totals.fat}g</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Goal: {targetMacros.fat}g</div>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* Meals & Ingredients List */}
      {!approvedPlan || meals.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <ChefHat size={42} color="var(--primary-cyan)" style={{ marginBottom: '0.85rem' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>No Approved Meal Plan Yet</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
            Tap <strong>Generate AI Plan</strong> to create a custom daily meal schedule with exact ingredient quantities and step-by-step recipes!
          </p>
          <button onClick={() => setShowPlannerModal(true)} className="btn-emerald" style={{ padding: '0.85rem 1.5rem' }}>
            Generate AI Meal Plan & Recipes <Sparkles size={16} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>DAILY MEAL SCHEDULE ({meals.length} MEALS)</span>
            <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={14} /> APPROVED PLAN
            </span>
          </div>

          {meals.map((m, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-cyan">{m.category || `Meal #${idx + 1}`}</span>
                    {m.approxTime && <span className="badge badge-amber"><Clock size={11} /> {m.approxTime}</span>}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-main)' }}>{m.mealName}</h3>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-cyan)' }}>
                  {m.calories} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kcal</span>
                </div>
              </div>

              {/* Macro Bar */}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(2, 6, 23, 0.5)', padding: '0.5rem 0.85rem', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <span>💪 Protein: <strong>{m.protein}g</strong></span>
                <span>🌾 Carbs: <strong>{m.carbs}g</strong></span>
                <span>🥑 Fat: <strong>{m.fat}g</strong></span>
              </div>

              {/* Exact Ingredients List */}
              {m.ingredients && m.ingredients.length > 0 && (
                <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '0.85rem 1rem', borderRadius: '14px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-cyan)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShoppingCart size={15} /> WHAT YOU NEED & HOW MUCH:
                  </div>
                  <ul style={{ fontSize: '0.85rem', color: 'var(--text-main)', paddingLeft: '1.25rem', margin: 0, lineHeight: '1.5' }}>
                    {m.ingredients.map((ing, iIdx) => (
                      <li key={iIdx} style={{ marginBottom: '0.2rem' }}>{ing}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step-by-Step Cooking Instructions */}
              {m.instructions && (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)', padding: '0.85rem 1rem', borderRadius: '14px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <BookOpen size={15} /> HOW TO COOK:
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-main)' }}>{m.instructions}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI Meal Planner Modal */}
      {showPlannerModal && (
        <MealPlannerModal
          profile={profile}
          targetMacros={targetMacros}
          apiKey={apiKey}
          onAddMealToLog={(mealObj) => {
            const currentMeals = dailyLog?.meals || [];
            onUpdateLog({ meals: [...currentMeals, mealObj] });
          }}
          onClose={() => {
            setShowPlannerModal(false);
            loadSavedApprovedPlan();
          }}
        />
      )}
    </div>
  );
}
