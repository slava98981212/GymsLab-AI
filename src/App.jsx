import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import OnboardingModal from './components/OnboardingModal';
import MorningWeightModal from './components/MorningWeightModal';
import NutritionTracker from './components/NutritionTracker';
import WorkoutSession from './components/WorkoutSession';
import VideoRecorder from './components/VideoRecorder';
import DailySummaryModal from './components/DailySummaryModal';
import WeeklyCheckin from './components/WeeklyCheckin';
import SettingsModal from './components/SettingsModal';
import MaxTest1RMModal from './components/MaxTest1RMModal';
import MeasurementGuideModal from './components/MeasurementGuideModal';
import Statistics from './components/Statistics';
import MealPlanView from './components/MealPlanView';

import {
  getProfile,
  saveProfile,
  getDailyLog,
  saveDailyLog,
  getAllDailyLogs,
  getAll1RMTests,
  getSetting,
  saveSetting
} from './services/db';

import {
  Scale,
  Sparkles,
  Dumbbell,
  Utensils,
  Video,
  Award,
  Calendar,
  Flame,
  CheckCircle2,
  TrendingDown,
  Plane,
  Ruler,
  HelpCircle,
  TrendingUp,
  Droplets,
  Footprints,
  Pill,
  ChefHat
} from 'lucide-react';

const DEFAULT_OPENAI_KEY = '';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [loadingDB, setLoadingDB] = useState(true);

  // Today string YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [dailyLog, setDailyLog] = useState({
    date: todayStr,
    weight: null,
    meals: [],
    foodPhotos: [],
    exercises: [],
    videos: [],
    warmupCompleted: false,
    cooldownCompleted: false,
    warmupChecks: {},
    cooldownChecks: {},
    mwfChecks: {},
    calisthenicsCompleted: false,
    saunaCompleted: false,
    waterLiters: 0,
    steps: 0,
    supplements: { creatine: false, protein: false },
    vitamins: { magnesium: false, zinc: false, vitaminD: false },
    totalMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    aiDailySummary: null
  });

  // Historical memory state
  const [historicalMemory, setHistoricalMemory] = useState({});
  const [allDailyLogsList, setAllDailyLogsList] = useState([]);
  const [is1RMDue, setIs1RMDue] = useState(false);

  // Settings & Modals state
  const [apiKey, setApiKey] = useState(DEFAULT_OPENAI_KEY);
  const [travelMode, setTravelMode] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMorningWeightModal, setShowMorningWeightModal] = useState(false);
  const [showDailySummaryModal, setShowDailySummaryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [show1RMModal, setShow1RMModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    loadInitialAppData();
  }, []);

  useEffect(() => {
    loadLogForDate(selectedDate);
  }, [selectedDate]);

  const loadInitialAppData = async () => {
    try {
      const prof = await getProfile();
      if (!prof) {
        setShowOnboarding(true);
      } else {
        setProfile(prof);
      }

      const savedKey = await getSetting('openai_api_key');
      const keyToUse = savedKey || DEFAULT_OPENAI_KEY;
      setApiKey(keyToUse);

      const savedTravel = await getSetting('travel_mode');
      if (savedTravel !== null) setTravelMode(savedTravel);

      const allDaily = await getAllDailyLogs();
      setAllDailyLogsList(allDaily);

      const recentWeights = allDaily
        .filter((d) => d.weight)
        .slice(-7)
        .map((d) => ({ date: d.date, weight: d.weight }));

      const recentGrades = allDaily
        .filter((d) => d.aiDailySummary?.grade)
        .slice(-7)
        .map((d) => ({ date: d.date, grade: d.aiDailySummary.grade }));

      const all1RM = await getAll1RMTests();
      const latest1RM = all1RM.length > 0 ? all1RM[0] : null;

      if (all1RM.length === 0) {
        setIs1RMDue(true);
      } else {
        const lastTestTime = new Date(all1RM[0].timestamp).getTime();
        const now = Date.now();
        const daysDiff = (now - lastTestTime) / (1000 * 3600 * 24);
        if (daysDiff >= 15) {
          setIs1RMDue(true);
        }
      }

      setHistoricalMemory({
        recentWeights,
        recentGrades,
        latest1RM
      });
    } catch (err) {
      console.error('Database load error', err);
    } finally {
      setLoadingDB(false);
    }
  };

  const loadLogForDate = async (dateStr) => {
    const logData = await getDailyLog(dateStr);
    if (logData) {
      setDailyLog(logData);
    } else {
      setDailyLog({
        date: dateStr,
        weight: null,
        meals: [],
        foodPhotos: [],
        exercises: [],
        videos: [],
        warmupCompleted: false,
        cooldownCompleted: false,
        warmupChecks: {},
        cooldownChecks: {},
        mwfChecks: {},
        calisthenicsCompleted: false,
        saunaCompleted: false,
        waterLiters: 0,
        steps: 0,
        supplements: { creatine: false, protein: false },
        vitamins: { magnesium: false, zinc: false, vitaminD: false },
        totalMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        aiDailySummary: null
      });

      if (dateStr === todayStr && profile && !travelMode) {
        setShowMorningWeightModal(true);
      }
    }
  };

  const handleSaveProfile = async (profData) => {
    await saveProfile(profData);
    setProfile(profData);
    if (profData.apiKey) {
      setApiKey(profData.apiKey);
      await saveSetting('openai_api_key', profData.apiKey);
    }
    setShowOnboarding(false);
  };

  const handleUpdateDailyLog = async (fieldsToUpdate) => {
    const updated = { ...dailyLog, ...fieldsToUpdate, travelMode, date: selectedDate };
    setDailyLog(updated);
    await saveDailyLog(selectedDate, updated);
  };

  const handleSaveMorningWeight = async (w) => {
    await handleUpdateDailyLog({ weight: w });
  };

  const handleSaveTargetMacros = async (newMacros) => {
    if (!profile) return;
    const updatedProfile = { ...profile, targetMacros: newMacros };
    setProfile(updatedProfile);
    await saveProfile(updatedProfile);
  };

  const handleSaveSettings = async ({ apiKey: newKey, travelMode: newTravel }) => {
    setApiKey(newKey);
    setTravelMode(newTravel);
    await saveSetting('openai_api_key', newKey);
    await saveSetting('travel_mode', newTravel);
  };

  const handleToggleTravelMode = async () => {
    const next = !travelMode;
    setTravelMode(next);
    await saveSetting('travel_mode', next);
  };

  const handleResetProfile = async () => {
    localStorage.clear();
    indexedDB.deleteDatabase('GymsLabDB');
    window.location.reload();
  };

  if (loadingDB) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#080c14', color: '#fff' }}>
        <Sparkles className="spin" size={32} color="var(--primary-cyan)" />
      </div>
    );
  }

  const targetMacros = profile?.targetMacros || { calories: 2400, protein: 180, carbs: 240, fat: 70 };
  const currentWeight = dailyLog.weight || profile?.weight || 80;
  const waistSize = profile?.waist || 85;

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Top Header with Historical Date Navigator */}
      <Header
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onOpenSettings={() => setShowSettingsModal(true)}
        travelMode={travelMode}
        onToggleTravelMode={handleToggleTravelMode}
        onOpen1RMTest={() => setShow1RMModal(true)}
        is1RMDue={is1RMDue}
      />

      {/* Main Container Content */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Travel Mode Banner */}
        {travelMode && (
          <div style={{
            margin: '1rem 0 0',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '16px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            color: 'var(--accent-amber)',
            fontSize: '0.85rem'
          }}>
            <Plane size={20} />
            <div>
              <strong>Vacation / Travel Mode Active</strong>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>
                Required daily logs are paused while keeping your historical streak intact.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
            {/* Quick Hero Stat Banner */}
            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span className="badge badge-cyan"><Sparkles size={12} /> GYMSLAB ATHLETE PROFILE</span>
                  <h2 style={{ fontSize: '1.3rem', marginTop: '0.35rem' }}>{profile?.goalType || 'Body Recomposition'}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                    Waist: <strong>{waistSize} cm</strong> | Height: {profile?.height || 180} cm
                  </p>
                </div>

                <button
                  onClick={() => setShowGuideModal(true)}
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-card)', color: 'var(--primary-cyan)', padding: '0.4rem 0.65rem', borderRadius: '10px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Ruler size={14} /> Guide
                </button>
              </div>

              {/* Stat grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center' }}>
                <div
                  onClick={() => setShowMorningWeightModal(true)}
                  style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '0.85rem', borderRadius: '14px', cursor: 'pointer', border: '1px solid var(--border-card)' }}
                >
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Scale size={12} color="var(--primary-cyan)" /> Fast Weight
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {currentWeight} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kg</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Utensils size={12} color="var(--accent-emerald)" /> Calories
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
                    {dailyLog.totalMacros?.calories || 0} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>/{targetMacros.calories}</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Dumbbell size={12} color="var(--accent-amber)" /> Workout
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                    {dailyLog.exercises?.length || 0} <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>sets</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily 23:00 AI Executive Summary Launcher */}
            <div className="glass-card" style={{ border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <span className="badge badge-cyan"><Sparkles size={12} /> DAILY 23:00 EVALUATION</span>
                  <h3 style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>End-of-Day AI Summary</h3>
                </div>
                {dailyLog.aiDailySummary?.grade && (
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-emerald)' }}>
                    Grade {dailyLog.aiDailySummary.grade}
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Evaluates weight, macros, 3.5L water, 10k steps, supplements/vitamins, workout sets, sauna, and 20s form videos.
              </p>

              <button
                onClick={() => setShowDailySummaryModal(true)}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                Open 23:00 AI Daily Review <Sparkles size={16} />
              </button>
            </div>

            {/* 15-Day 1RM Test Trigger Banner */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className={`badge ${is1RMDue ? 'badge-amber' : 'badge-emerald'}`}>
                    <Award size={12} /> {is1RMDue ? '1RM TEST DUE NOW' : '15-DAY STRENGTH TEST'}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', marginTop: '0.25rem' }}>Bench, Pull-ups, Squat, Deadlift</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    {historicalMemory.latest1RM ? `Latest Bench: ${historicalMemory.latest1RM.bench}kg` : 'No 1RM tests logged yet'}
                  </p>
                </div>

                <button
                  onClick={() => setShow1RMModal(true)}
                  className={is1RMDue ? 'btn-emerald' : 'btn-secondary'}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Start Test
                </button>
              </div>
            </div>

            {/* Quick Action Navigation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                onClick={() => setActiveTab('meals')}
                className="glass-card"
                style={{ cursor: 'pointer', textAlign: 'center', padding: '1.25rem' }}
              >
                <Utensils color="var(--primary-cyan)" size={24} style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '0.95rem', margin: 0 }}>AI Food & Recipes</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>Photos, Text & Meal Plans</p>
              </div>

              <div
                onClick={() => setActiveTab('workout')}
                className="glass-card"
                style={{ cursor: 'pointer', textAlign: 'center', padding: '1.25rem' }}
              >
                <Dumbbell color="var(--accent-emerald)" size={24} style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Weekly Split</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>Supersets, Sauna & Memory</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NUTRITION & FOOD LOG */}
        {activeTab === 'meals' && (
          <NutritionTracker
            profile={profile}
            dailyLog={dailyLog}
            targetMacros={targetMacros}
            apiKey={apiKey}
            onUpdateLog={handleUpdateDailyLog}
            onSaveTargetMacros={handleSaveTargetMacros}
          />
        )}

        {/* TAB 3: DEDICATED AI MEAL PLAN & RECIPES PAGE */}
        {activeTab === 'mealplan' && (
          <MealPlanView
            profile={profile}
            targetMacros={targetMacros}
            apiKey={apiKey}
            dailyLog={dailyLog}
            onUpdateLog={handleUpdateDailyLog}
          />
        )}

        {/* TAB 3: WORKOUT ENGINE */}
        {activeTab === 'workout' && (
          <WorkoutSession
            dailyLog={dailyLog}
            allDailyLogs={allDailyLogsList}
            onUpdateLog={handleUpdateDailyLog}
            onSelectDate={setSelectedDate}
          />
        )}

        {/* TAB 4: STATISTICS & ANALYTICS */}
        {activeTab === 'stats' && (
          <Statistics profile={profile} />
        )}

        {/* TAB 5: 20S FORM VIDEO VAULT */}
        {activeTab === 'videos' && (
          <VideoRecorder
            dailyLog={dailyLog}
            onUpdateLog={handleUpdateDailyLog}
          />
        )}

        {/* TAB 6: 1RM STRENGTH BENCHMARK */}
        {activeTab === '1rm' && (
          <div style={{ padding: '1rem 0' }}>
            <MaxTest1RMModal
              apiKey={apiKey}
              onClose={() => setActiveTab('dashboard')}
            />
          </div>
        )}

        {/* TAB 7: WEEKLY CHECK-IN */}
        {activeTab === 'weekly' && (
          <WeeklyCheckin
            profile={profile}
            historicalMemory={historicalMemory}
            apiKey={apiKey}
            onOpenGuide={() => setShowGuideModal(true)}
          />
        )}
      </main>

      {/* Bottom iOS Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        is1RMDue={is1RMDue}
      />

      {/* MODALS */}
      {showOnboarding && (
        <OnboardingModal
          onSaveProfile={handleSaveProfile}
          onOpenGuide={() => setShowGuideModal(true)}
        />
      )}

      {showMorningWeightModal && (
        <MorningWeightModal
          currentWeight={currentWeight}
          targetWeight={profile?.targetWeight}
          onSaveWeight={handleSaveMorningWeight}
          onClose={() => setShowMorningWeightModal(false)}
        />
      )}

      {showDailySummaryModal && (
        <DailySummaryModal
          dailyLog={dailyLog}
          profile={profile}
          historicalMemory={historicalMemory}
          apiKey={apiKey}
          onSaveSummary={(summaryRes) => handleUpdateDailyLog({ aiDailySummary: summaryRes })}
          onClose={() => setShowDailySummaryModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          profile={profile}
          apiKey={apiKey}
          travelMode={travelMode}
          targetMacros={targetMacros}
          onSaveSettings={handleSaveSettings}
          onSaveTargetMacros={handleSaveTargetMacros}
          onResetProfile={handleResetProfile}
          onOpenGuide={() => setShowGuideModal(true)}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {show1RMModal && (
        <MaxTest1RMModal
          apiKey={apiKey}
          onClose={() => setShow1RMModal(false)}
        />
      )}

      {showGuideModal && (
        <MeasurementGuideModal
          onClose={() => setShowGuideModal(false)}
        />
      )}
    </div>
  );
}
