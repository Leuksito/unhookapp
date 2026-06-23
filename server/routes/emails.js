const express = require('express');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const { getUserById, addCut, addSnooze, getActiveSnoozes, getStreakInfo, getCutById, getRecentCuts, removeCut } = require('../db/queries');
const { extractUnsubscribeLink, classifySender, estimateFrequency, extractTextSnippet } = require('../services/parser');
const { getMessagesWithBackoff, getMessageDetailsWithBackoff } = require('../services/gmail');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const checkAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = getUserById(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  req.user = user;
  next();
};

const validateEmail = (email) => {
  return email && typeof email === 'string' && email.length < 320 && EMAIL_REGEX.test(email);
};

const getGmailClient = (user) => {
  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials({
    access_token: user.access_token,
    refresh_token: user.refresh_token,
    expiry_date: user.token_expiry
  });
  
  // Handle auto-refresh in DB if needed (google-auth-library does it in memory, 
  // but for a real app we'd attach a 'tokens' event listener to update the DB).
  oAuth2Client.on('tokens', (tokens) => {
    const db = require('../db/init').getDb();
    if (tokens.refresh_token) {
      db.prepare('UPDATE users SET access_token = ?, refresh_token = ?, token_expiry = ? WHERE id = ?')
        .run(tokens.access_token, tokens.refresh_token, tokens.expiry_date, user.id);
    } else {
      db.prepare('UPDATE users SET access_token = ?, token_expiry = ? WHERE id = ?')
        .run(tokens.access_token, tokens.expiry_date, user.id);
    }
  });

  return google.gmail({ version: 'v1', auth: oAuth2Client });
};

router.get('/count', checkAuth, async (req, res) => {
  try {
    if (req.user.id === 'demo_user') {
      return res.json({ total: 6 });
    }
    const gmail = getGmailClient(req.user);
    const response = await getMessagesWithBackoff(gmail, {
      userId: 'me', q: 'unsubscribe', maxResults: 1
    });
    const total = response.data.resultSizeEstimate || 0;
    res.json({ total });
  } catch (error) {
    console.error('Count error:', error);
    res.status(500).json({ error: 'Failed to count emails' });
  }
});

router.get('/scan', checkAuth, async (req, res) => {
  try {
    // Si es el usuario de prueba, devolvemos datos falsos
    if (req.user.id === 'demo_user') {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular carga
      return res.json({
        senders: [
          { email: 'news@netflix.com', name: 'Netflix', exampleSubject: 'Nuevos estrenos para ti', lastSnippet: '¡Hola! Esta semana llegan los estrenos que no te puedes perder: la nueva temporada de Stranger Things, The Crown y más. Haz clic para ver tu lista personalizada.', category: 'promotions', frequency: 12, unsubLink: 'http://localhost' },
          { email: 'info@twitter.com', name: 'Twitter (X)', exampleSubject: 'Tienes 3 nuevas notificaciones', lastSnippet: 'Tienes notificaciones sin leer. @usuario_123 te ha mencionado en un hilo, a @otro_usuario le gustó tu tweet y tienes 1 nuevo seguidor.', category: 'social', frequency: 30, unsubLink: 'http://localhost' },
          { email: 'daily@nytimes.com', name: 'The New York Times', exampleSubject: 'The Morning: Your daily briefing', lastSnippet: 'Good morning. Today we cover the latest developments in climate policy, a surprising playoff run, and how remote work is reshaping cities worldwide.', category: 'newsletter', frequency: 30, unsubLink: 'http://localhost' },
          { email: 'deals@amazon.com', name: 'Amazon Ofertas', exampleSubject: 'Ofertas relámpago del día', lastSnippet: 'Por tiempo limitado: descuentos de hasta 50% en electrónicos, moda y hogar. Ofertas válidas solo por 24 horas. ¡No te lo pierdas!', category: 'promotions', frequency: 15, unsubLink: 'http://localhost' },
          { email: 'updates@linkedin.com', name: 'LinkedIn', exampleSubject: 'Apareciste en 5 búsquedas', lastSnippet: 'Tu perfil está ganando visibilidad. Esta semana apareciste en 5 búsquedas de reclutadores. Actualiza tu experiencia para destacar más.', category: 'social', frequency: 8, unsubLink: 'http://localhost' },
          { email: 'spam@tiendarandom.com', name: 'Tienda Random', exampleSubject: '¡Última oportunidad!', lastSnippet: '¡No dejes pasar esta oportunidad única! Descuentos increíbles en productos seleccionados. Compra ahora y recibe un regalo sorpresa.', category: 'other', frequency: 5, unsubLink: null }
        ].filter(s => !getActiveSnoozes(req.user.id).includes(s.email))
      });
    }

    const gmail = getGmailClient(req.user);
    const snoozedSenders = getActiveSnoozes(req.user.id);
    
    let allMessages = [];
    let pageToken = null;
    let pageCount = 0;
    const maxPages = 10;
    const searchQueries = [
      'unsubscribe',
      'category:promotions',
      'category:social'
    ];

    for (const query of searchQueries) {
      pageToken = null;
      pageCount = 0;
      do {
        const response = await getMessagesWithBackoff(gmail, {
          userId: 'me',
          q: query,
          maxResults: 100,
          pageToken: pageToken
        });
        
        if (response.data.messages) {
          allMessages = allMessages.concat(response.data.messages);
        }
        pageToken = response.data.nextPageToken;
        pageCount++;
      } while (pageToken && pageCount < maxPages);
    }

    // Remove duplicates by message ID
    const seen = new Set();
    allMessages = allMessages.filter(msg => {
      const dup = seen.has(msg.id);
      seen.add(msg.id);
      return !dup;
    });

    // Fetch details in batches to respect rate limits
    const sendersMap = new Map();
    const BATCH_SIZE = 20;

    for (let i = 0; i < allMessages.length; i += BATCH_SIZE) {
      const batch = allMessages.slice(i, i + BATCH_SIZE);
      
      const detailPromises = batch.map(msg => 
        getMessageDetailsWithBackoff(gmail, {
          userId: 'me',
          id: msg.id,
          format: 'full' // Need full to get html body for links
        }).catch(err => {
          console.error(`Error fetching ${msg.id}:`, err.message);
          return null;
        })
      );
      
      const details = await Promise.all(detailPromises);
      
      for (const detail of details) {
        if (!detail) continue;
        
        const headers = detail.data.payload.headers;
        const getHeader = (name) => {
          const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
          return h ? h.value : '';
        };

        const fromHeader = getHeader('From');
        const subject = getHeader('Subject');
        const date = getHeader('Date');
        
        // Parse "Name <email@domain.com>"
        const emailMatch = fromHeader.match(/<([^>]+)>/);
        const senderEmail = emailMatch ? emailMatch[1].toLowerCase() : fromHeader.toLowerCase();
        const senderName = emailMatch ? fromHeader.split('<')[0].trim().replace(/"/g, '') : senderEmail;

        if (snoozedSenders.includes(senderEmail)) {
          continue; // Skip snoozed
        }

        let htmlBody = '';
        const getHtmlPart = (parts) => {
          if (!parts) return;
          for (let part of parts) {
            if (part.mimeType === 'text/html') {
              htmlBody = Buffer.from(part.body.data || '', 'base64').toString('utf8');
            } else if (part.parts) {
              getHtmlPart(part.parts);
            }
          }
        };
        
        if (detail.data.payload.parts) {
            getHtmlPart(detail.data.payload.parts);
        } else if (detail.data.payload.body && detail.data.payload.body.data) {
            htmlBody = Buffer.from(detail.data.payload.body.data, 'base64').toString('utf8');
        }

        const unsubLink = extractUnsubscribeLink(headers, htmlBody);
        const snippet = extractTextSnippet(htmlBody);
        
        if (!sendersMap.has(senderEmail)) {
          sendersMap.set(senderEmail, {
            email: senderEmail,
            name: senderName,
            exampleSubject: subject,
            lastSnippet: snippet,
            category: classifySender(senderEmail, senderName),
            dates: [date],
            unsubLink: unsubLink
          });
        } else {
          const existing = sendersMap.get(senderEmail);
          existing.dates.push(date);
          if (!existing.unsubLink && unsubLink) {
            existing.unsubLink = unsubLink;
          }
          if (!existing.lastSnippet && snippet) {
            existing.lastSnippet = snippet;
          }
        }
      }
    }

    const results = Array.from(sendersMap.values()).map(s => {
      const freq = estimateFrequency(s.dates);
      delete s.dates; // cleanup
      return { ...s, frequency: freq };
    });

    results.sort((a, b) => b.frequency - a.frequency);

    res.json({ senders: results });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to scan emails' });
  }
});

router.post('/cut', checkAuth, async (req, res) => {
  const { senderEmail, senderName } = req.body;
  if (!senderEmail) return res.status(400).json({ error: 'Missing senderEmail' });
  if (!validateEmail(senderEmail)) return res.status(400).json({ error: 'Invalid senderEmail format' });

  try {
    let trashed = 0;
    let filterId = null;

    if (req.user.id !== 'demo_user') {
      const gmail = getGmailClient(req.user);

      let pageToken = null;
      do {
        const response = await getMessagesWithBackoff(gmail, {
          userId: 'me',
          q: `from:${senderEmail}`,
          maxResults: 100,
          pageToken
        });
        if (response.data.messages) {
          const batch = response.data.messages.map(m => m.id);
          await gmail.users.messages.batchModify({
            userId: 'me',
            requestBody: {
              ids: batch,
              addLabelIds: ['TRASH']
            }
          });
          trashed += batch.length;
        }
        pageToken = response.data.nextPageToken;
      } while (pageToken);

      try {
        const filterRes = await gmail.users.settings.filters.create({
          userId: 'me',
          requestBody: {
            criteria: { from: senderEmail },
            action: { addLabelIds: ['TRASH'] }
          }
        });
        filterId = filterRes.data.id;
      } catch (filterErr) {
        console.error('Filter creation error:', filterErr.message);
      }
    }

    const cutId = addCut(req.user.id, senderEmail, senderName || senderEmail, filterId, trashed);
    const streakInfo = getStreakInfo(req.user.id);

    res.json({
      success: true,
      cutId,
      total_cuts: streakInfo.total_cuts,
      streak: streakInfo.current_streak,
      trashed,
      filterCreated: !!filterId
    });
  } catch (error) {
    console.error('Cut error:', error);
    res.status(500).json({ error: 'Failed to cut sender' });
  }
});

router.get('/history', checkAuth, (req, res) => {
  try {
    const cuts = getRecentCuts(req.user.id);
    res.json({ cuts });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.post('/undo', checkAuth, async (req, res) => {
  const { cutId } = req.body;
  if (!cutId) return res.status(400).json({ error: 'Missing cutId' });
  if (typeof cutId !== 'number' && isNaN(Number(cutId))) return res.status(400).json({ error: 'Invalid cutId' });

  try {
    const cut = getCutById(cutId);
    if (!cut) return res.status(404).json({ error: 'Cut not found' });
    if (cut.user_id !== req.user.id) return res.status(403).json({ error: 'Not your cut' });

    let restored = 0;
    let filterDeleted = false;

    if (req.user.id !== 'demo_user') {
      const gmail = getGmailClient(req.user);

      // Restore trashed emails back to inbox
      if (cut.trashed_count > 0) {
        try {
          let pageToken = null;
          do {
            const response = await getMessagesWithBackoff(gmail, {
              userId: 'me',
              q: `from:${cut.sender_email} in:trash`,
              maxResults: 100,
              pageToken
            });
            if (response.data.messages) {
              const batch = response.data.messages.map(m => m.id);
              await gmail.users.messages.batchModify({
                userId: 'me',
                requestBody: {
                  ids: batch,
                  removeLabelIds: ['TRASH'],
                  addLabelIds: ['INBOX']
                }
              });
              restored += batch.length;
            }
            pageToken = response.data.nextPageToken;
          } while (pageToken);
        } catch (restoreErr) {
          console.error('Restore error:', restoreErr.message);
        }
      }

      // Delete the filter
      if (cut.filter_id) {
        try {
          await gmail.users.settings.filters.delete({
            userId: 'me',
            id: cut.filter_id
          });
          filterDeleted = true;
        } catch (filterErr) {
          console.error('Filter delete error:', filterErr.message);
        }
      }
    }

    removeCut(cutId);
    const streakInfo = getStreakInfo(req.user.id);

    res.json({
      success: true,
      restored,
      filterDeleted,
      total_cuts: streakInfo.total_cuts,
      streak: streakInfo.current_streak
    });
  } catch (error) {
    console.error('Undo error:', error);
    res.status(500).json({ error: 'Failed to undo cut' });
  }
});

router.post('/snooze', checkAuth, (req, res) => {
  const { senderEmail } = req.body;
  if (!senderEmail) return res.status(400).json({ error: 'Missing senderEmail' });
  if (!validateEmail(senderEmail)) return res.status(400).json({ error: 'Invalid senderEmail format' });

  try {
    addSnooze(req.user.id, senderEmail);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to snooze' });
  }
});

router.post('/archive', checkAuth, async (req, res) => {
  const { senderEmail } = req.body;
  if (!senderEmail) return res.status(400).json({ error: 'Missing senderEmail' });
  if (!validateEmail(senderEmail)) return res.status(400).json({ error: 'Invalid senderEmail format' });

  try {
    if (req.user.id === 'demo_user') {
      return res.json({ success: true, archived: 5 });
    }
    const gmail = getGmailClient(req.user);
    let archived = 0;
    let pageToken = null;
    do {
      const response = await getMessagesWithBackoff(gmail, {
        userId: 'me',
        q: `from:${senderEmail}`,
        maxResults: 100,
        pageToken
      });
      if (response.data.messages) {
        const batch = response.data.messages.map(m => m.id);
        await gmail.users.messages.batchModify({
          userId: 'me',
          requestBody: {
            ids: batch,
            removeLabelIds: ['INBOX']
          }
        });
        archived += batch.length;
      }
      pageToken = response.data.nextPageToken;
    } while (pageToken);
    res.json({ success: true, archived });
  } catch (error) {
    console.error('Archive error:', error);
    res.status(500).json({ error: 'Failed to archive emails' });
  }
});

router.post('/archive-cut', checkAuth, async (req, res) => {
  const { senderEmail, senderName } = req.body;
  if (!senderEmail) return res.status(400).json({ error: 'Missing senderEmail' });
  if (!validateEmail(senderEmail)) return res.status(400).json({ error: 'Invalid senderEmail format' });

  try {
    addCut(req.user.id, senderEmail, senderName || senderEmail);
    const streakInfo = getStreakInfo(req.user.id);

    let archived = 0;
    if (req.user.id !== 'demo_user') {
      const gmail = getGmailClient(req.user);
      let pageToken = null;
      do {
        const response = await getMessagesWithBackoff(gmail, {
          userId: 'me',
          q: `from:${senderEmail}`,
          maxResults: 100,
          pageToken
        });
        if (response.data.messages) {
          const batch = response.data.messages.map(m => m.id);
          await gmail.users.messages.batchModify({
            userId: 'me',
            requestBody: {
              ids: batch,
              removeLabelIds: ['INBOX']
            }
          });
          archived += batch.length;
        }
        pageToken = response.data.nextPageToken;
      } while (pageToken);
    }

    res.json({
      success: true,
      total_cuts: streakInfo.total_cuts,
      streak: streakInfo.current_streak,
      archived
    });
  } catch (error) {
    console.error('Archive-cut error:', error);
    res.status(500).json({ error: 'Failed to archive and cut' });
  }
});

module.exports = router;
