async function request(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function post(url, body) {
  return request(url, {
    method: 'POST',
    body: JSON.stringify(body || {})
  });
}

export const api = {
  getAuthStatus: () => request('/api/auth/status'),
  getAuthUrl: () => request('/api/auth/url'),
  loginDemo: () => post('/api/auth/demo'),
  logout: () => post('/api/auth/logout'),

  scanEmails: () => request('/api/emails/scan'),
  cutSender: (senderEmail, senderName) => post('/api/emails/cut', { senderEmail, senderName }),
  snoozeSender: (senderEmail) => post('/api/emails/snooze', { senderEmail }),
  getHistory: () => request('/api/emails/history'),
  undoCut: (cutId) => post('/api/emails/undo', { cutId }),

  classifySenders: (senders) => post('/api/emails/classify', { senders }),
  getClassifications: () => request('/api/emails/classifications'),
  reassignClassification: (senderEmail, category) => post('/api/emails/classifications/reassign', { senderEmail, category }),
  applyLabels: () => post('/api/emails/classifications/apply-labels'),
  clearClassifications: () => post('/api/emails/classifications/clear'),
  revertLabels: () => post('/api/emails/classifications/revert-labels')
};
