require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const dbInit = require('./db/init');

const authRoutes = require('./routes/auth');
const emailsRoutes = require('./routes/emails');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Database (singleton)
dbInit();

// Generate a strong session secret if not provided
const SESSION_SECRET = process.env.SESSION_SECRET 
  || crypto.randomBytes(64).toString('hex');

if (!process.env.SESSION_SECRET) {
  console.warn('⚠  WARNING: No SESSION_SECRET set. Using auto-generated random secret. '
    + 'Set SESSION_SECRET in .env for persistence across restarts.');
}

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Auth-specific stricter limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later.' }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));

// CSRF protection via Origin/Referer check
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') return next();
  
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  const isValid = (origin && origin.startsWith(allowedOrigin))
    || (referer && referer.startsWith(allowedOrigin));
  
  if (!isValid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

// Session
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/emails', emailsRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
