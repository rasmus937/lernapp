// === Gamification: XP, Streaks, Progress ===

// XP rewards per action
const XP_CORRECT = 10;
const XP_CORRECT_HARD = 15;    // card with high interval
const XP_WRONG = 2;            // small reward for trying
const XP_STREAK_BONUS = 5;     // per day of streak

// Calculate XP for a review
function calcXP(quality, review) {
  if (quality < 3) return XP_WRONG;
  if (review.interval >= 7) return XP_CORRECT_HARD;
  return XP_CORRECT;
}

// Update streak based on stats history
async function updateStreak() {
  const allStats = await getAllStats();
  if (allStats.length === 0) return 0;

  // Sort by date descending
  allStats.sort((a, b) => b.date.localeCompare(a.date));

  const today = todayStr();
  const yd = new Date(Date.now() - 86400000);
  const yesterday = `${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,'0')}-${String(yd.getDate()).padStart(2,'0')}`;

  // Check if today has activity
  const todayStats = allStats.find(s => s.date === today);
  if (!todayStats || todayStats.cardsReviewed === 0) {
    // Check if yesterday had activity (streak still alive)
    const yesterdayStats = allStats.find(s => s.date === yesterday);
    if (!yesterdayStats || yesterdayStats.cardsReviewed === 0) {
      return 0; // streak broken
    }
  }

  // Count consecutive days with activity
  let streak = 0;
  let checkDate = new Date();
  // If today has no activity yet, start from yesterday
  if (!todayStats || todayStats.cardsReviewed === 0) {
    checkDate = new Date(Date.now() - 86400000);
  }

  for (let i = 0; i < 3650; i++) { // max ~10 years
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth()+1).padStart(2,'0')}-${String(checkDate.getDate()).padStart(2,'0')}`;
    const stat = allStats.find(s => s.date === dateStr);
    if (stat && stat.cardsReviewed > 0) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  return streak;
}

// Get total XP across all time
async function getTotalXP() {
  const allStats = await getAllStats();
  return allStats.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
}

// Get mastered count across all decks
async function getMasteredCount() {
  const allReviews = await dbGetAll('reviews');
  return allReviews.filter(r => r.interval >= 21).length;
}
