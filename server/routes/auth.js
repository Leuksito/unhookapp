const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const { upsertUser, getUserById, getStreakInfo } = require('../db/queries');

const router = express.Router();

const getOAuthClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

router.get('/url', (req, res) => {
  try {
    const oAuth2Client = getOAuthClient();
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.settings.basic', 'https://www.googleapis.com/auth/userinfo.email'],
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      prompt: 'consent',
    });
    res.json({ url: authorizeUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const oAuth2Client = getOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;
    const googleId = userInfo.data.id;

    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const userToSave = {
      id: userId,
      google_id: googleId,
      email: email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.expiry_date
    };

    upsertUser(userToSave);
    
    const db = require('../db/init').getDb();
    const dbUser = db.prepare('SELECT id FROM users WHERE google_id = ?').get(googleId);
    
    req.session.userId = dbUser.id;
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(frontendUrl + '/dashboard');
  } catch (error) {
    console.error('Auth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(frontendUrl + '/?error=auth_failed');
  }
});

router.post('/demo', (req, res) => {
  // Demo mode: creates a temporary session (no real authentication)
  const demoUserId = 'demo_user';
  const demoUser = {
    id: demoUserId,
    google_id: 'demo_google_123',
    email: 'demo@ejemplo.com',
    access_token: 'demo_token',
    refresh_token: 'demo_refresh',
    token_expiry: Date.now() + 1000000
  };
  
  upsertUser(demoUser);
  req.session.userId = demoUserId;
  
  res.json({ success: true, user: { id: demoUserId, email: demoUser.email } });
});

router.get('/status', (req, res) => {
  if (!req.session.userId) {
    return res.json({ authenticated: false });
  }

  const user = getUserById(req.session.userId);
  if (!user) {
    return res.json({ authenticated: false });
  }

  const streakInfo = getStreakInfo(user.id);

  res.json({ 
    authenticated: true, 
    user: { 
      email: user.email, 
      language: user.language,
      streak: streakInfo.current_streak,
      total_cuts: streakInfo.total_cuts
    } 
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

module.exports = router;
