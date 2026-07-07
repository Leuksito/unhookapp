/**
 * Known paid-subscription services catalog.
 *
 * Each entry maps one or more sender email domains (the part after the "@")
 * that the service uses to send billing receipts, renewal notices, and
 * marketing emails. When we detect a sender matching one of these domains in
 * the user's inbox, we flag it as a tracked paid subscription and surface the
 * estimated monthly cost in the UI.
 *
 * `price` is the standard monthly price in USD for the most common plan.
 * `cycle` indicates the billing period — most services bill monthly, but some
 * offer an annual discount; we expose both so the UI can display either.
 *
 * Prices are crowd-sourced averages for the entry-level tier as of 2026.
 * They are best-effort estimates and users can edit them from the UI.
 */

const SUBSCRIPTION_CATALOG = [
  { service: 'Netflix',       domains: ['netflix.com', 'netflix@email-and-notifications.com', 'mail.netflix.com'], icon: '🎬', priceMonthly: 15.49, cycle: 'monthly', category: 'streaming' },
  { service: 'Spotify',        domains: ['spotify.com', 'em.spotify.com', 'news.spotify.com', 'no-reply@spotify.com'], icon: '🎵', priceMonthly: 10.99, cycle: 'monthly', category: 'streaming' },
  { service: 'Disney+',       domains: ['disneyplus.com', 'mail.disneyplus.com', 'help.disneyplus.com'],         icon: '🏰', priceMonthly: 7.99,  cycle: 'monthly', category: 'streaming' },
  { service: 'HBO Max',        domains: ['hbomax.com', 'mail.hbomax.com', 'ping.hbomax.com'],                       icon: '🐉', priceMonthly: 9.99,  cycle: 'monthly', category: 'streaming' },
  { service: 'Apple Music',    domains: ['apple.com', 'no_reply@email.apple.com', 'media.apple.com'],             icon: '🎼', priceMonthly: 10.99, cycle: 'monthly', category: 'streaming' },
  { service: 'Apple TV+',      domains: ['tv.apple.com', 'no_reply@apple.com'],                                   icon: '📺', priceMonthly: 9.99,  cycle: 'monthly', category: 'streaming' },
  { service: 'YouTube Premium',domains: ['youtube.com', 'noreply@youtube.com', 'accounts.google.com'],            icon: '▶',  priceMonthly: 11.99, cycle: 'monthly', category: 'streaming' },
  { service: 'Amazon Prime',   domains: ['amazon.com', 'amazon.es', 'amazon.com.mx', 'email.amazon.com', 'payments.amazon.com'], icon: '📦', priceMonthly: 14.99, cycle: 'monthly', category: 'shopping' },
  { service: 'Adobe Creative Cloud', domains: ['adobe.com', 'adobe-marketing.com', 'mail.adobe.com'],              icon: '🎨', priceMonthly: 54.99, cycle: 'monthly', category: 'software' },
  { service: 'Microsoft 365',  domains: ['microsoft.com', 'account.microsoft.com', 'mail.microsoft.com'],         icon: '🪟', priceMonthly: 6.99,  cycle: 'monthly', category: 'software' },
  { service: 'Google One',     domains: ['google.com', 'one.google.com', 'no-reply@accounts.google.com'],         icon: '💾', priceMonthly: 1.99,  cycle: 'monthly', category: 'software' },
  { service: 'Dropbox',        domains: ['dropbox.com', 'mail.dropbox.com', 'no-reply@dropbox.com'],               icon: '📁', priceMonthly: 11.99, cycle: 'monthly', category: 'software' },
  { service: 'Notion',         domains: ['notion.so', 'mail.notion.so', 'team@makenotion.com'],                   icon: '📝', priceMonthly: 8.00,  cycle: 'monthly', category: 'software' },
  { service: 'ChatGPT Plus',   domains: ['openai.com', 'email.openai.com', 'no-reply@openai.com'],                icon: '🤖', priceMonthly: 20.00, cycle: 'monthly', category: 'software' },
  { service: 'Claude Pro',     domains: ['anthropic.com', 'no-reply@anthropic.com'],                              icon: '🧠', priceMonthly: 20.00, cycle: 'monthly', category: 'software' },
  { service: 'GitHub Copilot', domains: ['github.com', 'noreply@github.com', 'notifications@github.com'],         icon: '🐙', priceMonthly: 10.00, cycle: 'monthly', category: 'software' },
  { service: 'iCloud+',        domains: ['apple.com', 'no_reply@email.apple.com'],                                icon: '☁️', priceMonthly: 0.99,  cycle: 'monthly', category: 'storage' },
  { service: 'Adobe Stock',    domains: ['adobe.com', 'stock.adobe.com'],                                          icon: '🖼️', priceMonthly: 29.99, cycle: 'monthly', category: 'software' },
  { service: 'LinkedIn Premium', domains: ['linkedin.com', 'info@linkedin.com', 'mail.linkedin.com'],             icon: '💼', priceMonthly: 39.99, cycle: 'monthly', category: 'social' },
  { service: 'New York Times', domains: ['nytimes.com', 'nytdirect@nytimes.com', 'mail@nytimes.com'],            icon: '📰', priceMonthly: 17.00, cycle: 'monthly', category: 'news' },
  { service: 'Washington Post',domains: ['washingtonpost.com', ' newsletters@washingtonpost.com'],                icon: '📰', priceMonthly: 10.00, cycle: 'monthly', category: 'news' },
  { service: 'The Guardian',   domains: ['guardian.co.uk', 'theguardian.com', 'newsletters@guardian.co.uk'],     icon: '📰', priceMonthly: 5.00,  cycle: 'monthly', category: 'news' },
  { service: 'Medium',         domains: ['medium.com', 'noreply@medium.com', 'mail.medium.com'],                  icon: '✍️', priceMonthly: 5.00,  cycle: 'monthly', category: 'news' },
  { service: 'Substack',       domains: ['substack.com', 'substackinc.com', 'no-reply@substack.com'],             icon: '✉️', priceMonthly: 5.00,  cycle: 'monthly', category: 'news' },
  { service: 'Patreon',         domains: ['patreon.com', 'mail.patreon.com', 'no-reply@patreon.com'],              icon: '🎭', priceMonthly: 5.00,  cycle: 'monthly', category: 'creator' },
  { service: 'Twitch Turbo',    domains: ['twitch.tv', 'mail.twitch.tv', 'no-reply@twitch.tv'],                    icon: '🎮', priceMonthly: 8.99,  cycle: 'monthly', category: 'gaming' },
  { service: 'PlayStation Plus',domains: ['playstation.com', 'sony.com', 'mail.playstation.com'],                 icon: '🎮', priceMonthly: 9.99,  cycle: 'monthly', category: 'gaming' },
  { service: 'Xbox Game Pass',  domains: ['xbox.com', 'microsoft.com', 'mail.xbox.com'],                           icon: '🎮', priceMonthly: 16.99, cycle: 'monthly', category: 'gaming' },
  { service: 'Nintendo Switch Online', domains: ['nintendo.com', 'mail.nintendo.com', 'no-reply@nintendo.com'],  icon: '🕹️', priceMonthly: 3.99,  cycle: 'monthly', category: 'gaming' },
  { service: 'Steam',           domains: ['steamcommunity.com', 'steampowered.com', 'no-reply@steampowered.com'],  icon: '🎮', priceMonthly: 0.00,  cycle: 'monthly', category: 'gaming' },
];

// Pre-build a reverse lookup table: domain -> service entry, for O(1) matching.
const DOMAIN_INDEX = new Map();
for (const entry of SUBSCRIPTION_CATALOG) {
  for (const domain of entry.domains) {
    // Normalize: lowercase. Some catalog entries include the full email
    // address; we index by the part after "@" if present, otherwise by the
    // bare domain.
    const key = domain.includes('@')
      ? domain.split('@').pop().toLowerCase()
      : domain.toLowerCase();
    if (!DOMAIN_INDEX.has(key)) {
      DOMAIN_INDEX.set(key, entry);
    }
  }
}

/**
 * Try to match a sender email against the subscription catalog.
 *
 * @param {string} senderEmail — full "from" address, e.g. "news@netflix.com".
 * @returns {object|null} the matched subscription entry, or null.
 */
function matchSubscription(senderEmail) {
  if (!senderEmail || typeof senderEmail !== 'string') return null;
  const domain = senderEmail.split('@').pop().toLowerCase();
  if (!domain) return null;

  // Direct domain hit
  if (DOMAIN_INDEX.has(domain)) {
    return DOMAIN_INDEX.get(domain);
  }

  // Try progressively larger suffixes — handles subdomains like
  // "mailer.email.netflix.com" matching "netflix.com".
  const parts = domain.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const suffix = parts.slice(i).join('.');
    if (DOMAIN_INDEX.has(suffix)) {
      return DOMAIN_INDEX.get(suffix);
    }
  }
  return null;
}

/**
 * Given an array of scanned senders (as returned by /scan), return the list
 * of detected paid subscriptions with their estimated monthly cost.
 *
 * We de-duplicate by `service` so that e.g. "news@netflix.com" and
 * "billing@netflix.com" both count as a single Netflix subscription.
 *
 * @param {Array<{email: string, name: string, frequency?: number}>} senders
 * @returns {Array<{service, icon, senderEmail, senderName, priceMonthly, cycle, category, frequency?}>}
 */
function detectSubscriptions(senders) {
  const seen = new Map();
  for (const s of senders) {
    const match = matchSubscription(s.email);
    if (!match) continue;
    if (seen.has(match.service)) {
      // Keep the most-frequent sender as the "primary" surface for that
      // service — usually the marketing/newsletter sends more than billing.
      const existing = seen.get(match.service);
      if ((s.frequency || 0) > (existing.frequency || 0)) {
        seen.set(match.service, {
          ...match,
          senderEmail: s.email,
          senderName: s.name,
          frequency: s.frequency,
        });
      }
    } else {
      seen.set(match.service, {
        ...match,
        senderEmail: s.email,
        senderName: s.name,
        frequency: s.frequency,
      });
    }
  }
  return Array.from(seen.values());
}

/**
 * Sum the monthly cost of detected subscriptions.
 * @param {Array} subscriptions — output of detectSubscriptions
 * @returns {number}
 */
function totalMonthlyCost(subscriptions) {
  return subscriptions.reduce((acc, s) => acc + (s.priceMonthly || 0), 0);
}

/**
 * Demo data for the demo user — fake "what we'd find" payload.
 */
function demoSubscriptions() {
  return [
    { service: 'Netflix',       icon: '🎬', senderEmail: 'news@netflix.com',        senderName: 'Netflix',       priceMonthly: 15.49, cycle: 'monthly', category: 'streaming', frequency: 12 },
    { service: 'Spotify',       icon: '🎵', senderEmail: 'no-reply@spotify.com',     senderName: 'Spotify',       priceMonthly: 10.99, cycle: 'monthly', category: 'streaming', frequency: 4  },
    { service: 'Amazon Prime',  icon: '📦', senderEmail: 'auto-confirm@amazon.com', senderName: 'Amazon',        priceMonthly: 14.99, cycle: 'monthly', category: 'shopping',  frequency: 6  },
    { service: 'Adobe Creative Cloud', icon: '🎨', senderEmail: 'mail.adobe.com',   senderName: 'Adobe',         priceMonthly: 54.99, cycle: 'monthly', category: 'software',  frequency: 2  },
    { service: 'ChatGPT Plus',  icon: '🤖', senderEmail: 'no-reply@openai.com',     senderName: 'OpenAI',        priceMonthly: 20.00, cycle: 'monthly', category: 'software',  frequency: 1  },
  ];
}

module.exports = {
  SUBSCRIPTION_CATALOG,
  matchSubscription,
  detectSubscriptions,
  totalMonthlyCost,
  demoSubscriptions,
};