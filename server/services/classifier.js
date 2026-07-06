const { GoogleGenerativeAI } = require('@google/generative-ai');

const CATEGORIES = [
  'work',
  'personal',
  'bills',
  'social',
  'promotions',
  'notifications',
  'other'
];

const CATEGORY_LABELS = {
  work: 'Trabajo',
  personal: 'Personal',
  bills: 'Facturas',
  social: 'Social',
  promotions: 'Promociones',
  notifications: 'Notificaciones',
  other: 'Otros'
};

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured in .env');
  }
  return new GoogleGenerativeAI(apiKey);
}

async function classifySenders(senders, onProgress) {
  const results = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < senders.length; i += BATCH_SIZE) {
    const batch = senders.slice(i, i + BATCH_SIZE);
    const batchResults = await classifyBatch(batch);
    results.push(...batchResults);

    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, senders.length), senders.length);
    }
  }

  return results;
}

async function classifyBatch(senders) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const items = senders.map((s, idx) => ({
    idx,
    email: s.email,
    name: s.name,
    subject: s.exampleSubject || '',
    snippet: s.lastSnippet || ''
  }));

  const prompt = `You are an email classifier. For each sender, choose ONE category from: ${CATEGORIES.join(', ')}.

Rules:
- work: job-related, professional, HR, recruitment, LinkedIn work
- personal: friends, family, personal correspondence
- bills: invoices, receipts, payments, subscriptions, bank statements
- social: Facebook, Twitter/X, Instagram, TikTok, social networks
- promotions: marketing, offers, deals, newsletters, commercial
- notifications: alerts, security, account updates, 2FA, reminders
- other: none of the above

Respond with ONLY a valid JSON array. No markdown, no code blocks:
[{ "idx": 0, "category": "...", "confidence": 0.95 }, ...]

Senders to classify:
${JSON.stringify(items, null, 2)}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const json = JSON.parse(text.replace(/```json?/gi, '').replace(/```/g, '').trim());
    return senders.map((s, idx) => {
      const found = json.find(j => j.idx === idx);
      return {
        email: s.email,
        name: s.name,
        exampleSubject: s.exampleSubject || '',
        lastSnippet: s.lastSnippet || '',
        category: found && CATEGORIES.includes(found.category) ? found.category : 'other',
        confidence: clampConfidence(found ? found.confidence : 0.5)
      };
    });
  } catch (err) {
    console.error('Batch classification error:', err.message);
    return senders.map(s => ({
      email: s.email,
      name: s.name,
      exampleSubject: s.exampleSubject || '',
      lastSnippet: s.lastSnippet || '',
      category: 'other',
      confidence: 0
    }));
  }
}

function clampConfidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

module.exports = { classifySenders, CATEGORIES, CATEGORY_LABELS };
