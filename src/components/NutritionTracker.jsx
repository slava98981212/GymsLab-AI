import React, { useState } from 'react';
import { Camera, Sparkles, Plus, Trash2, Utensils, Edit2, Check, FileText, X, Droplets, Footprints, Pill, ChefHat, CheckSquare, Square, BookOpen, ShoppingCart, Flame } from 'lucide-react';
import { analyzeFoodPhoto, analyzeFoodText } from '../services/openai';
import MealPlannerModal from './MealPlannerModal';

export default function NutritionTracker({ profile, dailyLog, targetMacros, apiKey, onUpdateLog, onSaveTargetMacros }) {
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [analyzingText, setAnalyzingText] = useState(false);

  const [selectedMealCategory, setSelectedMealCategory] = useState('Lunch');

  // Text AI Modal State
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState('');

  // Single Photo Food Scanner Modal State
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoSelected, setPhotoSelected] = useState(null);
  const [photoNotesInput, setPhotoNotesInput] = useState('');

  // Edit Single Logged Meal Modal State
  const [editingMeal, setEditingMeal] = useState(null);

  // View Detailed Recipe & Ingredients Modal State (Double Click / Tap on Logged Meal)
  const [recipeMealView, setRecipeMealView] = useState(null);

  // AI Meal Planner Modal State
  const [showPlannerModal, setShowPlannerModal] = useState(false);

  // Quick Add from Meal List Modal State
  const [showMealListModal, setShowMealListModal] = useState(false);

  const PRESET_MEALS_VAULT = [
    { name: 'Grilled Chicken & Sweet Potato', category: 'Lunch', calories: 520, protein: 48, carbs: 55, fat: 10, notes: '200g grilled chicken breast, 200g baked sweet potato, steamed broccoli.' },
    { name: 'Salmon & Quinoa Bowl', category: 'Dinner', calories: 610, protein: 42, carbs: 48, fat: 22, notes: '200g Atlantic salmon fillet, 150g cooked quinoa, asparagus.' },
    { name: 'Oatmeal & Whey Protein Shake', category: 'Breakfast', calories: 450, protein: 40, carbs: 52, fat: 8, notes: '80g oats cooked in almond milk, 1 scoop whey protein, 1 tbsp peanut butter.' },
    { name: 'Steak & Eggs Breakfast', category: 'Breakfast', calories: 650, protein: 55, carbs: 5, fat: 42, notes: '200g sirloin steak, 3 whole eggs fried in butter.' },
    { name: 'Post-Workout Whey & Banana', category: 'Post-Workout', calories: 280, protein: 30, carbs: 32, fat: 2, notes: '1 scoop whey protein isolate, 1 large ripe banana.' },
    { name: 'Tuna & Avocado Salad', category: 'Lunch', calories: 420, protein: 38, carbs: 12, fat: 24, notes: '1 canned tuna in water, 1/2 avocado, mixed greens, olive oil dressing.' },
    { name: 'Cottage Cheese & Berries', category: 'Snacks', calories: 250, protein: 28, carbs: 20, fat: 4, notes: '200g low-fat cottage cheese, 100g fresh blueberries.' }
  ];

  const handleAddFromMealList = (presetMeal) => {
    const newMeal = {
      id: `meal_list_${Date.now()}`,
      category: presetMeal.category || selectedMealCategory,
      name: presetMeal.name,
      calories: presetMeal.calories,
      protein: presetMeal.protein,
      carbs: presetMeal.carbs,
      fat: presetMeal.fat,
      notes: presetMeal.notes || '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMeals = [...meals, newMeal];
    onUpdateLog({ meals: updatedMeals });
    setShowMealListModal(false);
  };

  const meals = dailyLog?.meals || [];
  const foodPhotos = dailyLog?.foodPhotos || [];

  // Water & Steps State
  const waterLiters = dailyLog?.waterLiters || 0;
  const stepsCount = dailyLog?.steps || 0;

  // Supplements & Vitamins State
  const supplements = dailyLog?.supplements || { creatine: false, protein: false };
  const vitamins = dailyLog?.vitamins || {
    magnesium: false,
    zinc: false,
    vitaminD: false
  };

  const totalMacros = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (Number(m.calories) || 0),
      protein: acc.protein + (Number(m.protein) || 0),
      carbs: acc.carbs + (Number(m.carbs) || 0),
      fat: acc.fat + (Number(m.fat) || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleAddWater = (delta) => {
    const next = Math.max(0, parseFloat((waterLiters + delta).toFixed(1)));
    onUpdateLog({ waterLiters: next, waterGoalMet: next >= 3.5 });
  };

  const handleStepsChange = (val) => {
    const s = parseInt(val, 10) || 0;
    onUpdateLog({ steps: s, stepsGoalMet: s >= 10000 });
  };

  const handleToggleSupplement = (key) => {
    const next = { ...supplements, [key]: !supplements[key] };
    onUpdateLog({ supplements: next });
  };

  const handleToggleVitamin = (key) => {
    const next = { ...vitamins, [key]: !vitamins[key] };
    onUpdateLog({ vitamins: next });
  };

  const handleAddManualMeal = () => {
    const name = prompt('Enter Meal Name (e.g., Salmon & Sweet Potato):');
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

  const handleFileSelectForPhotoModal = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setPhotoSelected(evt.target.result);
      setShowPhotoModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRunPhotoScan = async () => {
    if (!photoSelected) return;
    if (!apiKey) {
      alert('Please set your OpenAI API key in Settings.');
      return;
    }

    setAnalyzingPhoto(true);
    try {
      const aiResult = await analyzeFoodPhoto(photoSelected, photoNotesInput, apiKey);
      const newMeal = {
        id: `meal_ai_${Date.now()}`,
        category: selectedMealCategory,
        name: aiResult.mealName || 'Scanned Meal',
        calories: aiResult.calories || 0,
        protein: aiResult.protein || 0,
        carbs: aiResult.carbs || 0,
        fat: aiResult.fat || 0,
        notes: aiResult.notes || photoNotesInput || '',
        photoUrl: photoSelected,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedMeals = [...meals, newMeal];
      const updatedPhotos = [...foodPhotos, { id: `photo_${Date.now()}`, url: photoSelected, category: selectedMealCategory }];

      onUpdateLog({ meals: updatedMeals, foodPhotos: updatedPhotos, totalMacros });
      setShowPhotoModal(false);
      setPhotoSelected(null);
      setPhotoNotesInput('');
      alert(`AI Photo Scan Success! Added ${newMeal.name} (${newMeal.calories} kcal, ${newMeal.protein}g Protein).`);
    } catch (err) {
      alert('AI Food Photo Scan Failed: ' + err.message);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleSaveEditedMeal = () => {
    if (!editingMeal) return;
    const updatedMeals = meals.map((m) => (m.id === editingMeal.id ? editingMeal : m));
    onUpdateLog({ meals: updatedMeals });
    setEditingMeal(null);
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
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-cyan)' }}>
              {totalMacros.calories} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {targetMacros?.calories || 2400} kcal</span>
            </div>
          </div>
        </div>

        {/* Progress bars grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
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

        {/* AI Custom Meal Planner Trigger */}
        <button
          onClick={() => setShowPlannerModal(true)}
          className="btn-emerald"
          style={{ width: '100%' }}
        >
          Generate AI Meal Plan & Recipes <ChefHat size={16} />
        </button>
      </div>

      {/* 4 Meal Logging Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.4rem' }}>
        <button
          onClick={() => setShowMealListModal(true)}
          className="btn-primary"
          style={{ padding: '0.75rem 0.25rem', fontSize: '0.75rem', flexDirection: 'column', gap: '0.2rem', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}
        >
          <BookOpen size={18} />
          <span>Meal List</span>
        </button>

        <label
          className="btn-primary"
          style={{ padding: '0.75rem 0.25rem', fontSize: '0.75rem', cursor: 'pointer', flexDirection: 'column', gap: '0.2rem' }}
        >
          <Camera size={18} />
          <span>Photo Food</span>
          <input type="file" accept="image/*" onChange={handleFileSelectForPhotoModal} style={{ display: 'none' }} />
        </label>

        <button
          onClick={() => setShowTextModal(true)}
          className="btn-primary"
          style={{ padding: '0.75rem 0.25rem', fontSize: '0.75rem', flexDirection: 'column', gap: '0.2rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' }}
        >
          <FileText size={18} />
          <span>Text AI</span>
        </button>

        <button
          onClick={handleAddManualMeal}
          className="btn-secondary"
          style={{ padding: '0.75rem 0.25rem', fontSize: '0.75rem', flexDirection: 'column', gap: '0.2rem' }}
        >
          <Plus size={18} />
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

      {/* Logged Meal List with Double-Click / Tap to View Full Recipe & Ingredients */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-muted)' }}>
            Logged Meals ({meals.length})
          </h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--primary-cyan)' }}>
            Tap any meal to view recipe & ingredients
          </span>
        </div>

        {meals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No meals logged yet today. Tap <strong>Photo Food</strong> or <strong>Generate AI Meal Plan</strong> above!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {meals.map((meal) => (
              <div
                key={meal.id}
                onClick={() => setRecipeMealView(meal)}
                style={{
                  background: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '14px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {meal.photoUrl ? (
                    <img src={meal.photoUrl} alt={meal.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Utensils size={20} color="var(--primary-cyan)" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {meal.name} <BookOpen size={13} color="var(--primary-cyan)" />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span>🔥 {meal.calories} kcal</span>
                      <span>💪 P: {meal.protein}g</span>
                      <span>🌾 C: {meal.carbs}g</span>
                      <span>🥑 F: {meal.fat}g</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingMeal(meal)}
                    title="Edit Meal Macros"
                    style={{ background: 'none', border: 'none', color: 'var(--primary-cyan)', cursor: 'pointer', padding: '0.25rem' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteMeal(meal.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.25rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Supplements & Refined Vitamins */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-purple)', marginBottom: '0.75rem' }}>
          <Pill size={18} />
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Supplements & Vitamins Checklist</h3>
        </div>

        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
          MANDATORY SUPPLEMENTS:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
          <div
            onClick={() => handleToggleSupplement('creatine')}
            style={{
              background: supplements.creatine ? 'rgba(139, 92, 246, 0.2)' : 'rgba(2, 6, 23, 0.5)',
              border: supplements.creatine ? '1px solid var(--accent-purple)' : '1px solid var(--border-card)',
              padding: '0.65rem',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {supplements.creatine ? <CheckSquare color="var(--accent-purple)" size={18} /> : <Square color="var(--text-dim)" size={18} />}
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: supplements.creatine ? 'var(--accent-purple)' : 'var(--text-main)' }}>
              Creatine Monohydrate (5g)
            </span>
          </div>

          <div
            onClick={() => handleToggleSupplement('protein')}
            style={{
              background: supplements.protein ? 'rgba(16, 185, 129, 0.2)' : 'rgba(2, 6, 23, 0.5)',
              border: supplements.protein ? '1px solid var(--accent-emerald)' : '1px solid var(--border-card)',
              padding: '0.65rem',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {supplements.protein ? <CheckSquare color="var(--accent-emerald)" size={18} /> : <Square color="var(--text-dim)" size={18} />}
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: supplements.protein ? 'var(--accent-emerald)' : 'var(--text-main)' }}>
              Whey Protein Shake
            </span>
          </div>
        </div>

        {/* Refined Vitamin Checklist: Magnesium, Zinc, Vitamin D */}
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
          ESSENTIAL VITAMINS CHECKLIST:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          {[
            { id: 'magnesium', label: 'Magnesium' },
            { id: 'zinc', label: 'Zinc' },
            { id: 'vitaminD', label: 'Vitamin D' }
          ].map((v) => {
            const isChecked = vitamins[v.id] || false;
            return (
              <div
                key={v.id}
                onClick={() => handleToggleVitamin(v.id)}
                style={{
                  background: isChecked ? 'rgba(6, 182, 212, 0.15)' : 'rgba(2, 6, 23, 0.4)',
                  border: isChecked ? '1px solid var(--primary-cyan)' : '1px solid var(--border-card)',
                  padding: '0.6rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                {isChecked ? <CheckSquare color="var(--primary-cyan)" size={16} /> : <Square color="var(--text-dim)" size={16} />}
                <span style={{ color: isChecked ? 'var(--primary-cyan)' : 'var(--text-muted)', fontWeight: isChecked ? 700 : 400 }}>
                  {v.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOVED TO BOTTOM: Water (3.5L) & Steps (10,000) Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* Water 3.5L Card with Deadline Milestones */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-cyan)' }}>
              <Droplets size={18} />
              <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Water (3.5 Liters)</h3>
            </div>
            <span style={{ fontSize: '0.7rem', color: waterLiters >= 3.5 ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: 700 }}>
              {waterLiters >= 3.5 ? 'GOAL MET ✓' : `${Math.max(0, (3.5 - waterLiters).toFixed(1))}L left`}
            </span>
          </div>

          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0 0.5rem' }}>
            {waterLiters} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 3.5 L</span>
          </div>

          <div className="progress-track" style={{ marginBottom: '0.65rem' }}>
            <div className="progress-fill" style={{ width: `${Math.min(100, (waterLiters / 3.5) * 100)}%`, background: 'var(--primary-cyan)' }} />
          </div>

          {/* Litre Deadline Milestones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.65rem', fontSize: '0.68rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: waterLiters >= 1 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)', padding: '0.25rem 0.4rem', borderRadius: '6px' }}>
              <span>💧 Litre 1 (Deadline 11:00)</span>
              <span style={{ fontWeight: 800, color: waterLiters >= 1 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{waterLiters >= 1 ? 'DONE ✓' : 'LOG'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: waterLiters >= 2 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)', padding: '0.25rem 0.4rem', borderRadius: '6px' }}>
              <span>💧 Litre 2 (Deadline 16:00)</span>
              <span style={{ fontWeight: 800, color: waterLiters >= 2 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{waterLiters >= 2 ? 'DONE ✓' : 'LOG'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: waterLiters >= 3 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)', padding: '0.25rem 0.4rem', borderRadius: '6px' }}>
              <span>💧 Litre 3 (Deadline 23:00)</span>
              <span style={{ fontWeight: 800, color: waterLiters >= 3 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{waterLiters >= 3 ? 'DONE ✓' : 'LOG'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button onClick={() => handleAddWater(0.5)} className="btn-secondary" style={{ flex: 1, padding: '0.35rem', fontSize: '0.7rem' }}>+0.5L</button>
            <button onClick={() => handleAddWater(1.0)} className="btn-emerald" style={{ flex: 1, padding: '0.35rem', fontSize: '0.7rem' }}>+1.0L</button>
          </div>
        </div>

        {/* Steps 10,000 Card */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-amber)', marginBottom: '0.35rem' }}>
            <Footprints size={18} />
            <h3 style={{ fontSize: '0.95rem', margin: 0 }}>Daily Steps (10k)</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
            <input
              type="number"
              value={stepsCount}
              onChange={(e) => handleStepsChange(e.target.value)}
              className="input-field"
              style={{ width: '85px', padding: '0.2rem 0.4rem', textAlign: 'center', fontSize: '1.1rem', fontWeight: 800 }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 10,000</span>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(100, (stepsCount / 10000) * 100)}%`, background: 'var(--accent-amber)' }} />
          </div>
        </div>
      </div>

      {/* MODAL 1: Single Photo Food Scanner */}
      {showPhotoModal && photoSelected && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={20} color="var(--primary-cyan)" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Photo Food Scanner</h3>
              </div>
              <button onClick={() => setShowPhotoModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <img src={photoSelected} alt="Food preview" style={{ width: '100%', height: '180px', borderRadius: '12px', objectFit: 'cover', marginBottom: '1rem' }} />

            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
              Short Description / Quantities (Optional - leave empty for photo only)
            </label>
            <textarea
              rows={4}
              placeholder="e.g. 200g salmon, 150g rice, 1 tbsp olive oil..."
              value={photoNotesInput}
              onChange={(e) => setPhotoNotesInput(e.target.value)}
              className="input-field input-textarea"
              style={{ marginBottom: '1rem' }}
            />

            <button onClick={handleRunPhotoScan} className="btn-primary" style={{ width: '100%' }} disabled={analyzingPhoto}>
              {analyzingPhoto ? 'GPT-4o Vision Analyzing...' : 'Analyze Food with AI'} <Sparkles size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Logged Meal Macros */}
      {editingMeal && (
        <div className="modal-overlay" onClick={() => setEditingMeal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Edit Meal Macros</h3>
              <button onClick={() => setEditingMeal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Meal Name</label>
                <input
                  type="text"
                  value={editingMeal.name}
                  onChange={(e) => setEditingMeal((prev) => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Calories (kcal)</label>
                <input
                  type="number"
                  value={editingMeal.calories}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setEditingMeal((prev) => ({ ...prev, calories: e.target.value === '' ? '' : parseInt(e.target.value, 10) }))}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Protein (g)</label>
                <input
                  type="number"
                  value={editingMeal.protein}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setEditingMeal((prev) => ({ ...prev, protein: e.target.value === '' ? '' : parseInt(e.target.value, 10) }))}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Carbs (g)</label>
                <input
                  type="number"
                  value={editingMeal.carbs}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setEditingMeal((prev) => ({ ...prev, carbs: e.target.value === '' ? '' : parseInt(e.target.value, 10) }))}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Fat (g)</label>
                <input
                  type="number"
                  value={editingMeal.fat}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setEditingMeal((prev) => ({ ...prev, fat: e.target.value === '' ? '' : parseInt(e.target.value, 10) }))}
                  className="input-field"
                />
              </div>
            </div>

            <button onClick={handleSaveEditedMeal} className="btn-emerald" style={{ width: '100%' }}>
              Save Edited Meal <Check size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Detailed Meal Recipe & Ingredients Modal (Opened by Tapping Logged Meal) */}
      {recipeMealView && (
        <div className="modal-overlay" onClick={() => setRecipeMealView(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-cyan">{recipeMealView.category || 'Logged Meal'}</span>
                <h2 style={{ fontSize: '1.25rem', marginTop: '0.25rem', color: 'var(--text-main)' }}>
                  {recipeMealView.name}
                </h2>
                {recipeMealView.timestamp && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🕒 Logged at {recipeMealView.timestamp}</div>
                )}
              </div>
              <button onClick={() => setRecipeMealView(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Photo preview if present */}
            {recipeMealView.photoUrl && (
              <img src={recipeMealView.photoUrl} alt={recipeMealView.name} style={{ width: '100%', height: '180px', borderRadius: '14px', objectFit: 'cover', marginBottom: '1rem' }} />
            )}

            {/* Macros Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem', textAlign: 'center' }}>
              <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '0.65rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Calories</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-cyan)' }}>{recipeMealView.calories} <span style={{ fontSize: '0.6rem' }}>kcal</span></div>
              </div>
              <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '0.65rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Protein</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{recipeMealView.protein} <span style={{ fontSize: '0.6rem' }}>g</span></div>
              </div>
              <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '0.65rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Carbs</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{recipeMealView.carbs} <span style={{ fontSize: '0.6rem' }}>g</span></div>
              </div>
              <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '0.65rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Fat</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{recipeMealView.fat} <span style={{ fontSize: '0.6rem' }}>g</span></div>
              </div>
            </div>

            {/* Notes & Recipe Instructions */}
            {recipeMealView.notes && (
              <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid var(--border-card)', padding: '1rem', borderRadius: '14px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-cyan)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <BookOpen size={16} /> Recipe & Ingredients Details:
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {recipeMealView.notes}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  const m = recipeMealView;
                  setRecipeMealView(null);
                  setEditingMeal(m);
                }}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                <Edit2 size={16} /> Edit Macros
              </button>

              <button onClick={() => setRecipeMealView(null)} className="btn-primary" style={{ flex: 1 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: AI Text Description Scanner */}
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
              rows={4}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g. 3 scrambled eggs with 2 slices of whole wheat toast and 1 apple..."
              className="input-field input-textarea"
              style={{ marginBottom: '1rem' }}
            />

            <button onClick={handleAnalyzeTextMeal} className="btn-primary" style={{ width: '100%' }} disabled={analyzingText}>
              {analyzingText ? 'GPT-4o Analyzing Meal...' : 'Calculate Macros with AI'} <Sparkles size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: AI Meal Planner */}
      {showPlannerModal && (
        <MealPlannerModal
          profile={profile}
          targetMacros={targetMacros}
          apiKey={apiKey}
          onAddMealToLog={(mealObj) => {
            const updatedMeals = [...meals, mealObj];
            onUpdateLog({ meals: updatedMeals });
          }}
          onClose={() => setShowPlannerModal(false)}
        />
      )}

      {/* MODAL 6: Quick Add from Saved Meal List */}
      {showMealListModal && (
        <div className="modal-overlay" onClick={() => setShowMealListModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} color="var(--accent-emerald)" />
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Add from Saved Meal List</h3>
              </div>
              <button onClick={() => setShowMealListModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Tap any pre-configured high-protein athlete meal below to log it into today's food log:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '380px', overflowY: 'auto', marginBottom: '1.25rem' }}>
              {PRESET_MEALS_VAULT.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAddFromMealList(m)}
                  style={{
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '14px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem', marginBottom: '0.2rem' }}>{m.category}</span>
                    <h4 style={{ fontSize: '0.95rem', margin: '0.2rem 0', color: 'var(--text-main)' }}>{m.name}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                      <span>🔥 {m.calories} kcal</span>
                      <span>💪 P: {m.protein}g</span>
                      <span>🌾 C: {m.carbs}g</span>
                      <span>🥑 F: {m.fat}g</span>
                    </div>
                  </div>

                  <button className="btn-emerald" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    + Log Meal <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => setShowMealListModal(false)} className="btn-secondary" style={{ width: '100%' }}>
              Close Meal List
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
