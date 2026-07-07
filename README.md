# UnhookApp

> Clean up your Gmail inbox — unsubscribe, trash, and filter unwanted emails in bulk.

UnhookApp connects to your Gmail account via OAuth 2.0, scans your inbox for newsletters, promotions, and social notifications, and lets you cut them out with one click. Includes a keyboard-driven **Zen Mode** for rapidly swiping through senders.

## Features

- **OAuth 2.0 Gmail integration** — read-only scan, then cut/undo with Gmail API
- **Smart sender classification** — categorizes senders as newsletter, promotional, social, or transactional
- **Cut** — trashes all emails from a sender + creates a Gmail filter to auto-trash future ones
- **Undo** — restores trashed emails and removes the auto-trash filter
- **Snooze** — hide a sender for 30 days
- **Cut All** — batch-process all visible senders
- **Zen Mode** — keyboard-only session (← / →) to rapidly cut or keep senders
- **History** — full log of past cuts with undo support
- **Inbox Health Score** — visual progress indicator
- **Streak tracking** — gamification with day streaks
- **Celebration animation** — confetti burst when you hit milestones
- **i18n** — 7 languages: English, Spanish, French, Portuguese, German, Italian, Japanese
- **Demo mode** — try the app without connecting a real Gmail account
- **Paid subscription tracker** — detects senders from services you already pay for (Netflix, Spotify, etc.) and shows your estimated monthly / yearly spend

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7, Lucide icons |
| Backend | Node.js, Express 5 |
| Database | SQLite (better-sqlite3) |
| Auth | Google OAuth 2.0 (googleapis + google-auth-library) |
| Security | Helmet, express-rate-limit, express-session, CSRF protection |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm
- A Google Cloud project with the Gmail API enabled

## Setup

### 1. Get Google API credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Enable the **Gmail API** (APIs & Services > Library)
4. Go to **APIs & Services > Credentials**
5. Click **+ CREATE CREDENTIALS > OAuth 2.0 Client ID**
6. Application type: **Web application**
7. Add this redirect URI: `http://localhost:3001/api/auth/callback`
8. Copy the **Client ID** and **Client Secret**

### 2. Configure environment

Copy the example env file and fill in your credentials:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback
SESSION_SECRET=choose_a_random_secret
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### 3. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 4. Run

Start the server (port 3001) and client (port 5173) in separate terminals:

```bash
# Terminal 1 — server
cd server
npm start

# Terminal 2 — client
cd client
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### Windows — one-click setup

Run the included PowerShell script from the project root:

```powershell
.\setup.ps1
```

It checks for credentials, installs dependencies, and launches both server and client automatically.

## Usage

1. Open the app and click **Connect Gmail** to authenticate
2. Click **Scan Inbox** — UnhookApp will analyze your recent emails
3. Review detected senders, sorted by frequency
4. **Cut** unwanted senders, or use **Cut All** for bulk cleanup
5. Use **Undo** anytime to reverse a cut
6. Try **Zen Mode** (keyboard icon) for rapid-fire sender triage
7. Check your **History** to see everything you've cut

Or use **Demo Mode** to explore the app without a real Gmail connection.

## Project Structure

```
UnhookApp/
├── client/                  # React SPA (Vite)
│   └── src/
│       ├── components/      # React components
│       ├── i18n/            # Translations (7 languages)
│       └── utils/           # API client
├── server/                  # Express REST API
│   ├── db/                  # SQLite initialization
│   ├── routes/              # API routes (auth, emails)
│   └── services/            # Gmail API client + parser
├── setup.ps1                # Windows setup script
└── README.md
```

## Security Notes

- OAuth tokens are stored server-side in session, never exposed to the client
- The app requests the minimum Gmail scope: `gmail.readonly`, `gmail.modify`, and `gmail.labels`
- Rate limiting and CSRF protection are enabled on all API endpoints
- No email data is stored permanently — only unsubscribe link metadata and action logs

## License

[Apache 2.0](LICENSE) — Copyright 2024 Leuksito
