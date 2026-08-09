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

// Daily Logs API
export async function saveDailyLog(dateStr, logData) {
  const db = await initDB();
  const existing = (await db.get('dailyLogs', dateStr)) || { date: dateStr };
  const updated = { ...existing, ...logData, date: dateStr, updatedAt: new Date().toISOString() };
  await db.put('dailyLogs', updated);
  return updated;
}

export async function getDailyLog(dateStr) {
  const db = await initDB();
  return (await db.get('dailyLogs', dateStr)) || null;
}

export async function getAllDailyLogs() {
  const db = await initDB();
  return (await db.getAll('dailyLogs')) || [];
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
