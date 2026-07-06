const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const PREFIX = 'enc:v1:';
const IV_LEN = 12;

// Tokens that should never be encrypted (demo placeholders, empty, or already encrypted).
const SKIP_VALUES = new Set(['demo_token', 'demo_refresh', '']);

let keyCache = null;

function getKey() {
  if (keyCache) return keyCache;

  const explicit = process.env.TOKEN_ENCRYPTION_KEY;
  if (explicit) {
    const buf = Buffer.from(explicit, 'hex');
    if (buf.length !== 32) {
      throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex chars).');
    }
    keyCache = buf;
    return keyCache;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('Either TOKEN_ENCRYPTION_KEY or SESSION_SECRET must be set to encrypt OAuth tokens.');
  }

  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠  TOKEN_ENCRYPTION_KEY not set; deriving from SESSION_SECRET. '
      + 'Set a dedicated TOKEN_ENCRYPTION_KEY (32 bytes hex) in .env for production.');
  }
  keyCache = crypto.createHash('sha256').update(secret).digest();
  return keyCache;
}

function shouldSkip(value) {
  return value == null || typeof value !== 'string' || SKIP_VALUES.has(value) || value.startsWith(PREFIX);
}

function encrypt(plaintext) {
  if (shouldSkip(plaintext)) return plaintext;
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(stored) {
  if (typeof stored !== 'string' || !stored.startsWith(PREFIX)) return stored;
  const payload = stored.slice(PREFIX.length);
  const parts = payload.split(':');
  if (parts.length !== 3) return stored;
  const [ivHex, tagHex, dataHex] = parts;
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(data), decipher.final()]);
    return plain.toString('utf8');
  } catch {
    return stored;
  }
}

module.exports = { encrypt, decrypt, isEncrypted: (v) => typeof v === 'string' && v.startsWith(PREFIX) };
