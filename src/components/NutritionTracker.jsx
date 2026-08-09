import React, { useState } from 'react';
import { Camera, Sparkles, Plus, Trash2, Utensils, Edit2, Check, FileText, X } from 'lucide-react';
import { analyzeFoodPhoto, analyzeFoodText } from '../services/openai';

export default function NutritionTracker({ dailyLog, targetMacros, apiKey, onUpdateLog, onSaveTargetMacros }) {
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [analyzingText, setAnalyzingText] = useState(false);

  const [selectedMealCategory, setSelectedMealCategory] = useState('Lunch');

  // Text AI Modal State
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState('');

  // Edit Macro Target Modal State
  const [showMacroEditor, setShowMacroEditor] = useState(false);
  const [macroEditData, setMacroEditData] = useState(targetMacros || { calories: 2400, protein: 180, carbs: 240, fat: 70 });

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

  const handleSaveMacroGoals = () => {
    onSaveTargetMacros(macroEditData);
    setShowMacroEditor(false);
  };

  const handleAddManualMeal = () => {
    const name = prompt('Enter Meal Name (e.g., Grilled Chicken & Quinoa):');
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

  const handleAnalyzeTextMeal = async () => {
    if (!textInput.trim()) return;
    if (!apiKey) {
      alert('Please set your OpenAI API key in Settings to use the AI Text Scanner.');
      return;
    }

    setAnalyzingText(true);
    try {
      const aiResult = await analyzeFoodText(textInput, apiKey);
      const newMeal = {
        id: `meal_aitext_${Date.now()}`,
        category: selectedMealCategory,
        name: aiResult.mealName || textInput,
        calories: aiResult.calories || 0,
        protein: aiResult.protein || 0,
        carbs: aiResult.carbs || 0,
        fat: aiResult.fat || 0,
        notes: aiResult.notes || '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedMeals = [...meals, newMeal];
      onUpdateLog({ meals: updatedMeals, totalMacros });
      setShowTextModal(false);
      setTextInput('');
      alert(`AI Text Scan Complete! Added ${newMeal.name} (${newMeal.calories} kcal, ${newMeal.protein}g Protein).`);
    } catch (err) {
      alert('AI Text Scan Failed: ' + err.message);
    } finally {
      setAnalyzingText(false);
    }
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
      setAnalyzingPhoto(true);
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
        alert(`AI Photo Scan Success! Added ${newMeal.name} (${newMeal.calories} kcal, ${newMeal.protein}g Protein).`);
      } catch (err) {
        alert('AI Food Photo Scan Failed: ' + err.message);
      } finally {
        setAnalyzingPhoto(false);
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
            <h2 style={{ fontSize: '1.2rem', marginTop: '0.25rem' }}>Daily Food & Macros</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-cyan)' }}>
                {totalMacros.calories} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {targetMacros?.calories || 2400} kcal</span>
              </div>
            </div>
            <button
              onClick={() => setShowMacroEditor(true)}
              title="Edit Macro Targets"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-card)',
                color: 'var(--primary-cyan)',
                padding: '0.4rem 0.6rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Edit2 size={12} /> Goals
            </button>
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

      {/* 3 Meal Logging Option Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        <label
          className="btn-primary"
          style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', opacity: analyzingPhoto ? 0.7 : 1, flexDirection: 'column', gap: '0.25rem' }}
        >
          {analyzingPhoto ? <Sparkles className="spin" size={16} /> : <Camera size={16} />}
          <span>Photo AI</span>
          <input type="file" accept="image/*" onChange={handleFoodPhotoUpload} disabled={analyzingPhoto} style={{ display: 'none' }} />
        </label>

        <button
          onClick={() => setShowTextModal(true)}
          className="btn-primary"
          style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', flexDirection: 'column', gap: '0.25rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' }}
        >
          <FileText size={16} />
          <span>Text AI</span>
        </button>

        <button
          onClick={handleAddManualMeal}
          className="btn-secondary"
          style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', flexDirection: 'column', gap: '0.25rem' }}
        >
          <Plus size={16} />
          <span>Manual</span>
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

      {/* Logged Meal List */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
          Logged Meals ({meals.length})
        </h3>

        {meals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No meals logged yet today. Choose <strong>Photo AI</strong>, <strong>Text AI</strong>, or <strong>Manual</strong> above!
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

      {/* AI Text Description Modal */}
      {showTextModal && (
        <div className="modal-overlay" onClick={() => setShowTextModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="var(--primary-cyan)" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>AI Meal Text Description</h3>
              </div>
              <button onClick={() => setShowTextModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Describe your meal in plain text (e.g. <em>"200g grilled salmon, 1 cup brown rice, 1/2 avocado"</em>). GPT-4o will calculate exact macros automatically!
            </p>

            <textarea
              rows={3}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g. 3 scrambled eggs with 2 slices of whole wheat toast and 1 apple..."
              className="input-field"
              style={{ marginBottom: '1rem', resize: 'none' }}
            />

            <button onClick={handleAnalyzeTextMeal} className="btn-primary" style={{ width: '100%' }} disabled={analyzingText}>
              {analyzingText ? 'GPT-4o Analyzing Meal...' : 'Calculate Macros with AI'} <Sparkles size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Edit Target Macros Modal */}
      {showMacroEditor && (
        <div className="modal-overlay" onClick={() => setShowMacroEditor(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Customize Target Macro Goals</h3>
              <button onClick={() => setShowMacroEditor(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Target Calories (kcal)</label>
                <input
                  type="number"
                  value={macroEditData.calories}
                  onChange={(e) => setMacroEditData((prev) => ({ ...prev, calories: parseInt(e.target.value, 10) || 0 }))}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Target Protein (g)</label>
                <input
                  type="number"
                  value={macroEditData.protein}
                  onChange={(e) => setMacroEditData((prev) => ({ ...prev, protein: parseInt(e.target.value, 10) || 0 }))}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Target Carbs (g)</label>
                <input
                  type="number"
                  value={macroEditData.carbs}
                  onChange={(e) => setMacroEditData((prev) => ({ ...prev, carbs: parseInt(e.target.value, 10) || 0 }))}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Target Fat (g)</label>
                <input
                  type="number"
                  value={macroEditData.fat}
                  onChange={(e) => setMacroEditData((prev) => ({ ...prev, fat: parseInt(e.target.value, 10) || 0 }))}
                  className="input-field"
                />
              </div>
            </div>

            <button onClick={handleSaveMacroGoals} className="btn-emerald" style={{ width: '100%' }}>
              Save Custom Macro Targets <Check size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
