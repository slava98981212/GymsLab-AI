import React, { useState } from 'react';
import { Camera, Sparkles, Plus, Trash2, Utensils, Zap, CheckCircle2 } from 'lucide-react';
import { analyzeFoodPhoto } from '../services/openai';

export default function NutritionTracker({ dailyLog, targetMacros, apiKey, onUpdateLog }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedMealCategory, setSelectedMealCategory] = useState('Lunch');

  const meals = dailyLog?.meals || [];
  const foodPhotos = dailyLog?.foodPhotos || [];

  const totalMacros = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (Number(m.calories) || 0),
      protein: acc.protein + (Number(m.protein) || 0),
      carbs: acc.carbs + (Number(m.carbs) || 0),
      fat: acc.fat + (Number(m.fat) || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleAddManualMeal = () => {
    const name = prompt('Enter Meal Name (e.g., Grilled Chicken Breast & Rice):');
    if (!name) return;
    const cals = parseInt(prompt('Calories (kcal):') || '0', 10);
    const p = parseInt(prompt('Protein (g):') || '0', 10);
    const c = parseInt(prompt('Carbs (g):') || '0', 10);
    const f = parseInt(prompt('Fat (g):') || '0', 10);

    const newMeal = {
      id: `meal_${Date.now()}`,
      category: selectedMealCategory,
      name,
      calories: cals,
      protein: p,
      carbs: c,
      fat: f,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMeals = [...meals, newMeal];
    onUpdateLog({ meals: updatedMeals, totalMacros });
  };

  const handleFoodPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!apiKey) {
      alert('Please set your OpenAI API key in Settings to use the AI Food Scanner.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64Image = evt.target.result;
      setAnalyzing(true);
      try {
        const aiResult = await analyzeFoodPhoto(base64Image, apiKey);
        const newMeal = {
          id: `meal_ai_${Date.now()}`,
          category: selectedMealCategory,
          name: aiResult.mealName || 'Scanned Meal',
          calories: aiResult.calories || 0,
          protein: aiResult.protein || 0,
          carbs: aiResult.carbs || 0,
          fat: aiResult.fat || 0,
          notes: aiResult.notes || '',
          photoUrl: base64Image,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedMeals = [...meals, newMeal];
        const updatedPhotos = [...foodPhotos, { id: `photo_${Date.now()}`, url: base64Image, category: selectedMealCategory }];

        onUpdateLog({ meals: updatedMeals, foodPhotos: updatedPhotos, totalMacros });
        alert(`AI Scan Success! Added ${newMeal.name} (${newMeal.calories} kcal, ${newMeal.protein}g Protein).`);
      } catch (err) {
        alert('AI Food Scan Failed: ' + err.message);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMeal = (id) => {
    const updatedMeals = meals.filter((m) => m.id !== id);
    onUpdateLog({ meals: updatedMeals });
  };

  const getPercent = (curr, target) => Math.min(100, Math.round((curr / (target || 1)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
      {/* Daily Macro Dashboard Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <span className="badge badge-emerald"><Utensils size={12} /> MACRO TRACKER</span>
            <h2 style={{ fontSize: '1.2rem', marginTop: '0.25rem' }}>Daily Food Intake</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-cyan)' }}>
              {totalMacros.calories} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {targetMacros?.calories || 2400} kcal</span>
            </div>
          </div>
        </div>

        {/* Progress bars grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>Protein</span>
              <span><strong>{totalMacros.protein}g</strong> / {targetMacros?.protein || 180}g ({getPercent(totalMacros.protein, targetMacros?.protein)}%)</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${getPercent(totalMacros.protein, targetMacros?.protein)}%`, background: 'var(--accent-emerald)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>Carbohydrates</span>
              <span><strong>{totalMacros.carbs}g</strong> / {targetMacros?.carbs || 240}g ({getPercent(totalMacros.carbs, targetMacros?.carbs)}%)</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${getPercent(totalMacros.carbs, targetMacros?.carbs)}%`, background: 'var(--accent-amber)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>Fats</span>
              <span><strong>{totalMacros.fat}g</strong> / {targetMacros?.fat || 70}g ({getPercent(totalMacros.fat, targetMacros?.fat)}%)</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${getPercent(totalMacros.fat, targetMacros?.fat)}%`, background: 'var(--accent-purple)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: Add Meal & AI Photo Scanner */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <label
          className="btn-primary"
          style={{ flex: 1, cursor: 'pointer', opacity: analyzing ? 0.7 : 1 }}
        >
          {analyzing ? <Sparkles className="spin" size={18} /> : <Camera size={18} />}
          <span>{analyzing ? 'GPT-4o Scanning...' : 'AI Food Scanner'}</span>
          <input type="file" accept="image/*" onChange={handleFoodPhotoUpload} disabled={analyzing} style={{ display: 'none' }} />
        </label>

        <button onClick={handleAddManualMeal} className="btn-secondary" style={{ flex: 1 }}>
          <Plus size={18} /> Manual Log
        </button>
      </div>

      {/* Meal Category Picker */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {['Breakfast', 'Lunch', 'Dinner', 'Post-Workout', 'Snacks'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedMealCategory(cat)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '9999px',
              border: selectedMealCategory === cat ? '1px solid var(--primary-cyan)' : '1px solid var(--border-card)',
              background: selectedMealCategory === cat ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: selectedMealCategory === cat ? 'var(--primary-cyan)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Meal List */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
          Logged Meals ({meals.length})
        </h3>

        {meals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No meals logged yet today. Tap <strong>AI Food Scanner</strong> to snap a photo of your dish!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {meals.map((meal) => (
              <div
                key={meal.id}
                style={{
                  background: 'rgba(2, 6, 23, 0.5)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {meal.photoUrl ? (
                    <img src={meal.photoUrl} alt={meal.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Utensils size={20} color="var(--text-dim)" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{meal.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span>🔥 {meal.calories} kcal</span>
                      <span>💪 P: {meal.protein}g</span>
                      <span>🌾 C: {meal.carbs}g</span>
                      <span>🥑 F: {meal.fat}g</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Food Photo Gallery */}
      {foodPhotos.length > 0 && (
        <div className="glass-card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Food Photo History</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {foodPhotos.map((p, idx) => (
              <img key={idx} src={p.url} alt="Meal" style={{ width: '100%', height: '70px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-card)' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
