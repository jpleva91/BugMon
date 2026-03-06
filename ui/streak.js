// Streak system - track consecutive days with bug captures

const STORAGE_KEY = 'bugmon_streak';

let streakData = null;

export function initStreak() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      streakData = JSON.parse(saved);
    }
  } catch (e) { /* ignore storage errors */ }

  if (!streakData) {
    streakData = { currentStreak: 0, lastCaptureDate: null, longestStreak: 0 };
  }
}

function getToday() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function recordStreakCapture() {
  if (!streakData) initStreak();

  const today = getToday();

  if (streakData.lastCaptureDate === today) {
    // Already captured today, no streak change
    return;
  }

  if (streakData.lastCaptureDate === getYesterday()) {
    // Consecutive day - extend streak
    streakData.currentStreak++;
  } else {
    // Streak broken or first capture
    streakData.currentStreak = 1;
  }

  streakData.lastCaptureDate = today;
  streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);
  saveStreak();
}

export function getStreakData() {
  if (!streakData) initStreak();
  return streakData;
}

function saveStreak() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(streakData));
  } catch (e) { /* ignore storage errors */ }
}

export function drawStreakHUD(ctx, x, y) {
  if (!streakData || streakData.currentStreak === 0) return;

  ctx.fillStyle = '#f39c12';
  ctx.font = '12px monospace';
  ctx.fillText(`Streak:${streakData.currentStreak}`, x, y);
}
