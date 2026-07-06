const { getDb } = require('./init');
const { encrypt, decrypt } = require('../services/crypto');

function getUserById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (row) {
    row.access_token = decrypt(row.access_token);
    row.refresh_token = decrypt(row.refresh_token);
  }
  return row;
}

function upsertUser(user) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE google_id = ?').get(user.google_id);

  if (existing) {
    db.prepare(`
      UPDATE users SET
        access_token = ?,
        refresh_token = COALESCE(?, users.refresh_token),
        token_expiry = ?
      WHERE google_id = ?
    `).run(
      encrypt(user.access_token),
      encrypt(user.refresh_token),
      user.token_expiry,
      user.google_id
    );
    return existing.id;
  } else {
    db.prepare(`
      INSERT INTO users (id, google_id, email, access_token, refresh_token, token_expiry)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.google_id,
      user.email,
      encrypt(user.access_token),
      encrypt(user.refresh_token),
      user.token_expiry
    );
    return user.id;
  }
}

function updateUserTokens(userId, tokens) {
  const db = getDb();
  if (tokens.refresh_token) {
    db.prepare('UPDATE users SET access_token = ?, refresh_token = ?, token_expiry = ? WHERE id = ?')
      .run(encrypt(tokens.access_token), encrypt(tokens.refresh_token), tokens.expiry_date, userId);
  } else {
    db.prepare('UPDATE users SET access_token = ?, token_expiry = ? WHERE id = ?')
      .run(encrypt(tokens.access_token), tokens.expiry_date, userId);
  }
}

function addCut(userId, senderEmail, senderName, filterId, trashedCount) {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO cuts (user_id, sender_email, sender_name, filter_id, trashed_count) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(userId, senderEmail, senderName, filterId || null, trashedCount || 0);
  db.prepare('UPDATE streaks SET total_cuts = total_cuts + 1 WHERE user_id = ?').run(userId);
  updateStreak(userId);
  return info.lastInsertRowid;
}

function getCutById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM cuts WHERE id = ?').get(id);
}

function getRecentCuts(userId, limit = 50) {
  const db = getDb();
  return db.prepare('SELECT * FROM cuts WHERE user_id = ? ORDER BY cut_at DESC LIMIT ?').all(userId, limit);
}

function removeCut(id) {
  const db = getDb();
  const cut = getCutById(id);
  if (cut) {
    db.prepare('UPDATE streaks SET total_cuts = MAX(0, total_cuts - 1) WHERE user_id = ?').run(cut.user_id);
  }
  return db.prepare('DELETE FROM cuts WHERE id = ?').run(id);
}

function addSnooze(userId, senderEmail) {
  const db = getDb();
  const date = new Date();
  date.setDate(date.getDate() + 30);
  const snoozeUntil = date.toISOString();
  
  const stmt = db.prepare('INSERT INTO snoozes (user_id, sender_email, snooze_until) VALUES (?, ?, ?)');
  const info = stmt.run(userId, senderEmail, snoozeUntil);
  return info.lastInsertRowid;
}

function getActiveSnoozes(userId) {
  const db = getDb();
  const stmt = db.prepare("SELECT sender_email FROM snoozes WHERE user_id = ? AND snooze_until > datetime('now')");
  return stmt.all(userId).map(row => row.sender_email);
}

function getStreakInfo(userId) {
  const db = getDb();
  let streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
  if (!streak) {
    db.prepare('INSERT INTO streaks (user_id) VALUES (?)').run(userId);
    streak = { user_id: userId, current_streak: 0, last_use_date: null, total_cuts: 0 };
  }
  return streak;
}

function updateStreak(userId) {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const streakInfo = getStreakInfo(userId);
  
  if (streakInfo.last_use_date === today) {
    return;
  }

  let newStreak = streakInfo.current_streak;
  if (streakInfo.last_use_date) {
    const lastUse = new Date(streakInfo.last_use_date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastUse.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  db.prepare('UPDATE streaks SET current_streak = ?, last_use_date = ? WHERE user_id = ?').run(newStreak, today, userId);
}

function updateLanguage(userId, language) {
  const db = getDb();
  db.prepare('UPDATE users SET language = ? WHERE id = ?').run(language, userId);
}

function saveClassifications(userId, classifications) {
  const db = getDb();
  const del = db.prepare('DELETE FROM classifications WHERE user_id = ?');
  const ins = db.prepare(`
    INSERT INTO classifications (user_id, sender_email, sender_name, example_subject, last_snippet, category, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const transaction = db.transaction((userId, items) => {
    del.run(userId);
    for (const item of items) {
      ins.run(userId, item.email, item.name, item.exampleSubject, item.lastSnippet, item.category, item.confidence);
    }
  });
  transaction(userId, classifications);
}

function getClassifications(userId) {
  const db = getDb();
  return db.prepare('SELECT * FROM classifications WHERE user_id = ? ORDER BY category, sender_name').all(userId);
}

function getClassificationsByCategory(userId) {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM classifications WHERE user_id = ? ORDER BY category, sender_name').all(userId);
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = [];
    grouped[row.category].push(row);
  }
  return grouped;
}

function updateClassification(userId, senderEmail, category) {
  const db = getDb();
  db.prepare('UPDATE classifications SET category = ?, confidence = 1.0 WHERE user_id = ? AND sender_email = ?').run(category, userId, senderEmail);
}

function deleteClassifications(userId) {
  const db = getDb();
  db.prepare('DELETE FROM classifications WHERE user_id = ?').run(userId);
}

function getClassificationByEmail(userId, senderEmail) {
  const db = getDb();
  return db.prepare('SELECT * FROM classifications WHERE user_id = ? AND sender_email = ?').get(userId, senderEmail);
}

module.exports = {
  getUserById,
  upsertUser,
  updateUserTokens,
  addCut,
  addSnooze,
  getActiveSnoozes,
  getStreakInfo,
  updateLanguage,
  getCutById,
  getRecentCuts,
  removeCut,
  saveClassifications,
  getClassifications,
  getClassificationsByCategory,
  updateClassification,
  deleteClassifications,
  getClassificationByEmail
};
