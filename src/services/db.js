import { openDB } from 'idb';

const DB_NAME = 'GymsLabDB';
const DB_VERSION = 1;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('dailyLogs')) {
        db.createObjectStore('dailyLogs', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('weeklyLogs')) {
        db.createObjectStore('weeklyLogs', { keyPath: 'weekId' });
      }
      if (!db.objectStoreNames.contains('maxTests1RM')) {
        db.createObjectStore('maxTests1RM', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
}

// Profile API
export async function saveProfile(profileData) {
  const db = await initDB();
  await db.put('profile', { id: 'user_profile', ...profileData, updatedAt: new Date().toISOString() });
}

export async function getProfile() {
  const db = await initDB();
  return (await db.get('profile', 'user_profile')) || null;
}

// Settings API
export async function saveSetting(key, value) {
  const db = await initDB();
  await db.put('settings', { key, value });
}

export async function getSetting(key) {
  const db = await initDB();
  const res = await db.get('settings', key);
  return res ? res.value : null;
}

export function sanitizeDailyLog(rawLog) {
  if (!rawLog || typeof rawLog !== 'object') return rawLog;

  const safeLog = { ...rawLog };

  // Ensure weight, meals, foodPhotos, and videos are 100% preserved
  safeLog.weight = safeLog.weight ?? null;
  safeLog.meals = Array.isArray(safeLog.meals) ? safeLog.meals.filter(Boolean) : [];
  safeLog.foodPhotos = Array.isArray(safeLog.foodPhotos) ? safeLog.foodPhotos.filter(Boolean) : [];
  safeLog.videos = Array.isArray(safeLog.videos) ? safeLog.videos.filter(Boolean) : [];

  // Calculate totalMacros dynamically from safeLog.meals to ensure 100% precision
  safeLog.totalMacros = safeLog.meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (Number(m.calories) || 0),
      protein: acc.protein + (Number(m.protein) || 0),
      carbs: acc.carbs + (Number(m.carbs) || 0),
      fat: acc.fat + (Number(m.fat) || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Ensure exercises is a clean array
  if (!Array.isArray(safeLog.exercises)) {
    safeLog.exercises = [];
  } else {
    safeLog.exercises = safeLog.exercises.filter(Boolean).map((ex) => {
      if (!ex || typeof ex !== 'object') return null;
      return {
        ...ex,
        sets: Array.isArray(ex.sets) ? ex.sets.filter(Boolean) : []
      };
    }).filter(Boolean);
  }

  // Ensure savedWorkouts is a clean array and strictly belongs to this log date
  if (!Array.isArray(safeLog.savedWorkouts)) {
    safeLog.savedWorkouts = [];
  } else {
    safeLog.savedWorkouts = safeLog.savedWorkouts
      .filter(Boolean)
      .map((w) => {
        if (!w || typeof w !== 'object') return null;
        return {
          ...w,
          exercises: Array.isArray(w.exercises) ? w.exercises.filter(Boolean) : []
        };
      })
      .filter((w) => Boolean(w) && (!w.date || !safeLog.date || w.date === safeLog.date));
  }

  return safeLog;
}

// Daily Logs API
export async function saveDailyLog(dateStr, logData) {
  const db = await initDB();
  const existing = (await db.get('dailyLogs', dateStr)) || { date: dateStr };

  // Smart non-destructive merge: Protect existing recorded items if logData passes empty/null arrays from a partial update
  const merged = { ...existing, ...logData, date: dateStr, updatedAt: new Date().toISOString() };

  if (Array.isArray(existing.meals) && existing.meals.length > 0 && Array.isArray(logData.meals) && logData.meals.length === 0 && !logData._allowEmptyMeals) {
    merged.meals = existing.meals;
  }

  if (Array.isArray(existing.savedWorkouts) && existing.savedWorkouts.length > 0 && Array.isArray(logData.savedWorkouts) && logData.savedWorkouts.length === 0 && !logData._allowEmptySavedWorkouts) {
    merged.savedWorkouts = existing.savedWorkouts;
  }

  if (Array.isArray(existing.exercises) && existing.exercises.length > 0 && Array.isArray(logData.exercises) && logData.exercises.length === 0 && !logData._allowEmptyExercises) {
    merged.exercises = existing.exercises;
  }

  if (Array.isArray(existing.foodPhotos) && existing.foodPhotos.length > 0 && Array.isArray(logData.foodPhotos) && logData.foodPhotos.length === 0 && !logData._allowEmptyPhotos) {
    merged.foodPhotos = existing.foodPhotos;
  }

  if (Array.isArray(existing.videos) && existing.videos.length > 0 && Array.isArray(logData.videos) && logData.videos.length === 0 && !logData._allowEmptyVideos) {
    merged.videos = existing.videos;
  }

  if (existing.weight != null && logData.weight == null) {
    merged.weight = existing.weight;
  }

  const updated = sanitizeDailyLog(merged);
  await db.put('dailyLogs', updated);
  return updated;
}

export async function getDailyLog(dateStr) {
  const db = await initDB();
  const rawLog = (await db.get('dailyLogs', dateStr)) || null;
  return rawLog ? sanitizeDailyLog(rawLog) : null;
}

export async function getAllDailyLogs() {
  const db = await initDB();
  const all = (await db.getAll('dailyLogs')) || [];
  return all.map(sanitizeDailyLog);
}

// Weekly Logs API
export async function saveWeeklyLog(weekId, logData) {
  const db = await initDB();
  const existing = (await db.get('weeklyLogs', weekId)) || { weekId };
  const updated = { ...existing, ...logData, weekId, updatedAt: new Date().toISOString() };
  await db.put('weeklyLogs', updated);
  return updated;
}

export async function getWeeklyLog(weekId) {
  const db = await initDB();
  return (await db.get('weeklyLogs', weekId)) || null;
}

export async function getAllWeeklyLogs() {
  const db = await initDB();
  return (await db.getAll('weeklyLogs')) || [];
}

// 15-Day 1RM Max Test API
export async function save1RMTest(testData) {
  const db = await initDB();
  const id = testData.id || `1rm_${Date.now()}`;
  const entry = { id, ...testData, timestamp: new Date().toISOString() };
  await db.put('maxTests1RM', entry);
  return entry;
}

export async function getAll1RMTests() {
  const db = await initDB();
  const all = (await db.getAll('maxTests1RM')) || [];
  return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
