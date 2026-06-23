export const api = {
  async getAuthStatus() {
    const res = await fetch('/api/auth/status');
    return res.json();
  },

  async getAuthUrl() {
    const res = await fetch('/api/auth/url');
    return res.json();
  },

  async loginDemo() {
    const res = await fetch('/api/auth/demo', { method: 'POST' });
    return res.json();
  },

  async logout() {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    return res.json();
  },

  async scanEmails() {
    const res = await fetch('/api/emails/scan');
    if (!res.ok) throw new Error('Failed to scan emails');
    return res.json();
  },

  async cutSender(senderEmail, senderName) {
    const res = await fetch('/api/emails/cut', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail, senderName })
    });
    return res.json();
  },

  async snoozeSender(senderEmail) {
    const res = await fetch('/api/emails/snooze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail })
    });
    return res.json();
  },

  async getHistory() {
    const res = await fetch('/api/emails/history');
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  async undoCut(cutId) {
    const res = await fetch('/api/emails/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cutId })
    });
    return res.json();
  },

  async archiveSender(senderEmail) {
    const res = await fetch('/api/emails/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail })
    });
    return res.json();
  },

  async cutAndArchive(senderEmail, senderName) {
    const res = await fetch('/api/emails/archive-cut', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail, senderName })
    });
    return res.json();
  }
};
