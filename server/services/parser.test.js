const test = require('node:test');
const assert = require('node:assert');
const {
  extractUnsubscribeLink,
  classifySender,
  estimateFrequency,
  extractTextSnippet
} = require('./parser');

function makeHeaders(pairs) {
  return pairs.map(([name, value]) => ({ name, value }));
}

// --- extractUnsubscribeLink ---

test('extractUnsubscribeLink: List-Unsubscribe con URL http entre <>', () => {
  const headers = makeHeaders([
    ['List-Unsubscribe', '<https://example.com/unsub>, <mailto:unsub@example.com>']
  ]);
  assert.equal(extractUnsubscribeLink(headers, ''), 'https://example.com/unsub');
});

test('extractUnsubscribeLink: List-Unsubscribe con URL suelta', () => {
  const headers = makeHeaders([
    ['List-Unsubscribe', 'https://example.com/leave']
  ]);
  assert.equal(extractUnsubscribeLink(headers, ''), 'https://example.com/leave');
});

test('extractUnsubscribeLink: ignora mailto y solo http', () => {
  const headers = makeHeaders([
    ['List-Unsubscribe', '<mailto:leave@example.com>']
  ]);
  assert.strictEqual(extractUnsubscribeLink(headers, ''), null);
});

test('extractUnsubscribeLink: encuentra enlace en el HTML con keyword', () => {
  const headers = [];
  const html = '<p>Hola</p><a href="https://news.example.com/u/123">Unsubscribe</a>';
  assert.equal(extractUnsubscribeLink(headers, html), 'https://news.example.com/u/123');
});

test('extractUnsubscribeLink: case-insensitive sobre keywords espanol', () => {
  const headers = [];
  const html = '<a href="https://x.com/baja">DARSE DE BAJA</a>';
  assert.equal(extractUnsubscribeLink(headers, html), 'https://x.com/baja');
});

test('extractUnsubscribeLink: devueve null si no hay nada', () => {
  assert.strictEqual(extractUnsubscribeLink([], '', ''), null);
});

test('extractUnsubscribeLink: prefiere el header sobre el HTML', () => {
  const headers = makeHeaders([
    ['List-Unsubscribe', '<https://header.example.com/x>']
  ]);
  const html = '<a href="https://body.example.com/y">Unsubscribe</a>';
  assert.equal(extractUnsubscribeLink(headers, html), 'https://header.example.com/x');
});

test('extractUnsubscribeLink: busca en texto plano si HTML falla', () => {
  const text = 'Visita https://example.com/unsubscribe para darte de baja';
  assert.equal(extractUnsubscribeLink([], '', text), 'https://example.com/unsubscribe');
});

// --- classifySender ---

test('classifySender: dominio social', () => {
  assert.equal(classifySender('alerts@facebook.com', 'Facebook'), 'social');
  assert.equal(classifySender('noreply@twitter.com', 'Twitter'), 'social');
  assert.equal(classifySender('invitations@linkedin.com', 'LinkedIn'), 'social');
});

test('classifySender: dominio de newsletter', () => {
  assert.equal(classifySender('hola@substack.com', 'Substack'), 'newsletter');
  assert.equal(classifySender('marketing@mailchimp.com', 'Mailchimp'), 'newsletter');
});

test('classifySender: palabras promocionales en la parte local', () => {
  assert.equal(classifySender('promos@store.com', 'Store'), 'promotions');
  assert.equal(classifySender('marketing@brand.com', 'Brand'), 'promotions');
  assert.equal(classifySender('news@brand.com', 'Brand'), 'promotions');
  assert.equal(classifySender('offers@brand.com', 'Brand'), 'promotions');
});

test('classifySender: por defecto other', () => {
  assert.equal(classifySender('random@example.org', 'Someone'), 'other');
});

test('classifySender: dominio vacio no rompe', () => {
  assert.equal(classifySender('sin-arroba', 'X'), 'other');
  assert.equal(classifySender('user@', 'X'), 'other');
});

// --- estimateFrequency ---

test('estimateFrequency: 1 fecha -> 1', () => {
  assert.equal(estimateFrequency(['Wed, 1 Jan 2025 10:00:00 +0000']), 1);
});

test('estimateFrequency: 0 fechas -> 1', () => {
  assert.equal(estimateFrequency([]), 1);
});

test('estimateFrequency: 6 emails en 1 mes calendario -> 6/mes', () => {
  const dates = [
    'Wed, 1 Jan 2025 10:00:00 +0000',
    'Wed, 8 Jan 2025 10:00:00 +0000',
    'Wed, 15 Jan 2025 10:00:00 +0000',
    'Wed, 22 Jan 2025 10:00:00 +0000',
    'Wed, 29 Jan 2025 10:00:00 +0000',
    'Wed, 5 Feb 2025 10:00:00 +0000'
  ];
  assert.equal(estimateFrequency(dates), 6);
});

test('estimateFrequency: mismo dia -> al menos 1', () => {
  const dates = [
    'Wed, 1 Jan 2025 10:00:00 +0000',
    'Wed, 1 Jan 2025 11:00:00 +0000'
  ];
  assert.ok(estimateFrequency(dates) >= 1);
});

// --- extractTextSnippet ---

test('extractTextSnippet: quita tags HTML', () => {
  const html = '<p>Hola <b>mundo</b></p>';
  assert.equal(extractTextSnippet(html), 'Hola mundo');
});

test('extractTextSnippet: quita style y script', () => {
  const html = '<style>.a{}</style><script>x()</script><p>Hola</p>';
  assert.equal(extractTextSnippet(html), 'Hola');
});

test('extractTextSnippet: recorta al maxLen con elipsis', () => {
  const html = '<p>' + 'A'.repeat(250) + '</p>';
  const out = extractTextSnippet(html, 50);
  assert.ok(out.endsWith('…'));
  assert.ok(out.length <= 51);
});

test('extractTextSnippet: vacio -> vacio', () => {
  assert.equal(extractTextSnippet(''), '');
  assert.equal(extractTextSnippet(null), '');
});