import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { api } from '../utils/api';
import Header from './Header';
import HealthScore from './HealthScore';
import SenderCard from './SenderCard';
import Celebration from './Celebration';
import ZenMode from './ZenMode';
import ScanProgress from './ScanProgress';
import HistoryPanel from './HistoryPanel';
import { Scissors, Wind, Clock, RotateCcw, Sparkles, Share2 } from 'lucide-react';
import Classifier from './Classifier';
import ShareCard from './ShareCard';
import SubscriptionsPanel from './SubscriptionsPanel';
import './Dashboard.css';

export default function Dashboard({ user, setAuth }) {
  const { t } = useTranslation();
  const [senders, setSenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ streak: user?.streak ?? 0, total_cuts: user?.total_cuts ?? 0 });
  const [showCelebration, setShowCelebration] = useState(false);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showClassifier, setShowClassifier] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadData();
    async function loadData() {
      setLoading(true);
      try {
        const data = await api.scanEmails();
        setSenders(data.senders);
        setOriginalTotal(data.senders.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const showToast = useCallback((msg, undoCut = null) => {
    setToast({ msg, undoCut });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const removeSender = useCallback((email) => {
    setSenders(prev => {
      const updated = prev.filter(s => s.email !== email);
      if (updated.length === 0 && prev.length > 0) {
        setTimeout(() => setShowCelebration(true), 300);
      }
      return updated;
    });
  }, []);

  const handleUndoToast = useCallback(async (cutId) => {
    try {
      const result = await api.undoCut(cutId);
      setStats({ streak: result.streak, total_cuts: result.total_cuts });
      setToast(null);
      showToast(`↩️ ${t('dashboard.history_undo')} — restored ${result.restored} emails`);
    } catch (err) {
      console.error(err);
    }
  }, [showToast, t]);

  const handleUndone = useCallback((cut, result) => {
    setStats({ streak: result.streak, total_cuts: result.total_cuts });
    showToast(`↩️ ${cut.sender_name || cut.sender_email} — restored ${result.restored} emails`);

    setSenders(prev => {
      if (prev.some(s => s.email === cut.sender_email)) return prev;
      return [...prev, { email: cut.sender_email, name: cut.sender_name || cut.sender_email, category: 'other' }];
    });
  }, [showToast]);

  const handleCut = useCallback(async (sender) => {
    try {
      const result = await api.cutSender(sender.email, sender.name);
      setStats({ streak: result.streak, total_cuts: result.total_cuts });
      removeSender(sender.email);
      if (result.cutId) {
        showToast(`✂️ ${sender.name} — ${result.trashed} correos eliminados${result.filterCreated ? ' + filtro' : ''}`, result.cutId);
      }
    } catch (err) {
      console.error(err);
    }
  }, [removeSender, showToast]);

  const handleSnooze = useCallback(async (sender) => {
    try {
      await api.snoozeSender(sender.email);
      removeSender(sender.email);
    } catch (err) {
      console.error(err);
    }
  }, [removeSender]);

  const handleCutAll = useCallback(async () => {
    const visibleSenders = senders.filter(s => filter === 'all' || s.category === filter);
    const toCut = visibleSenders.filter(s => s.unsubLink);
    const toRemove = visibleSenders.map(s => s.email);

    if (toCut.length > 0) {
      const results = await Promise.allSettled(
        toCut.map(s => api.cutSender(s.email, s.name))
      );
      let totalCuts = 0;
      let totalStreak = 0;
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value) {
          totalCuts = r.value.total_cuts;
          totalStreak = r.value.streak;
        }
      });
      if (totalCuts > 0) {
        setStats({ streak: totalStreak, total_cuts: totalCuts });
      }
    }

    setSenders(prev => {
      const updated = prev.filter(s => !toRemove.includes(s.email));
      if (updated.length === 0 && prev.length > 0) {
        setTimeout(() => setShowCelebration(true), 300);
      }
      return updated;
    });
  }, [senders, filter]);

  const filteredSenders = useMemo(
    () => senders.filter(s => filter === 'all' || s.category === filter),
    [senders, filter]
  );

  const healthScore = useMemo(() => {
    if (originalTotal === 0) return 100;
    const cut = originalTotal - senders.length;
    return Math.max(0, Math.min(100, Math.round((cut / originalTotal) * 100)));
  }, [originalTotal, senders.length]);

  return (
    <div className="dashboard-layout animate-fade-in">
      <Header user={user} setAuth={setAuth} streak={stats.streak} />

      <main className="container dashboard-main">
        {loading ? (
          <ScanProgress />
        ) : (
          <>
            <div className="dashboard-top">
              <HealthScore totalItems={originalTotal} pendingItems={senders.length} />

                <div className="stats-panel">
                  <div className="stat-box">
                    <span className="stat-value">{stats.total_cuts}</span>
                    <span className="stat-label">{t('dashboard.stats.total_cuts')}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-value">{stats.streak}🔥</span>
                    <span className="stat-label">{t('dashboard.stats.streak')}</span>
                  </div>
                  <button className="stat-box stat-btn" onClick={() => setShowHistory(true)} title={t('dashboard.history_title')}>
                    <Clock size={20} />
                  </button>
                </div>
            </div>

            <div className="filters">
              {['all', 'promotions', 'newsletter', 'social', 'other'].map(cat => (
                <button
                  key={cat}
                  className={`filter-btn ${filter === cat ? 'active' : ''}`}
                  onClick={() => setFilter(cat)}
                >
                  {t(`dashboard.tabs.${cat}`)}
                </button>
              ))}
            </div>

            <SubscriptionsPanel onCut={handleCut} />

            {filteredSenders.length > 0 && (
              <div className="action-bar" style={{ marginBottom: '2rem' }}>
                <button className="btn-secondary" onClick={() => setIsZenMode(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-success)', color: 'white' }}>
                  <Wind size={18} />
                  {t('zen.enter')}
                </button>
                <button className="btn-secondary" onClick={() => setShowClassifier(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} />
                  {t('classifier.classify')}
                </button>
                {stats.total_cuts > 0 && (
                  <button
                    className="btn-secondary"
                    onClick={() => setShowShare(true)}
                    title={t('share.button_tooltip')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--accent-primary), #ff6b9d)', color: 'white' }}
                  >
                    <Share2 size={18} />
                    {t('share.button')}
                  </button>
                )}
              </div>
            )}

            {filteredSenders.length > 0 ? (
              <>
                <div className="sender-grid animate-slide-up">
                  {filteredSenders.map(sender => (
                    <SenderCard
                      key={sender.email}
                      sender={sender}
                      onCut={handleCut}
                      onSnooze={handleSnooze}
                    />
                  ))}
                </div>

                <div className="fab-container">
                  <button className="btn-primary fab" onClick={handleCutAll}>
                    <Scissors size={20} />
                    {t('dashboard.actions.cut_all')}
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>{t('dashboard.empty')}</p>
              </div>
            )}
          </>
        )}
      </main>

      {isZenMode && (
        <ZenMode
          senders={filteredSenders}
          onCut={handleCut}
          onSnooze={handleSnooze}
          onExit={() => setIsZenMode(false)}
        />
      )}

      {showCelebration && <Celebration onDone={() => setShowCelebration(false)} />}

      {showHistory && (
        <HistoryPanel
          onClose={() => setShowHistory(false)}
          onUndone={handleUndone}
        />
      )}

      {showClassifier && senders.length > 0 && (
        <Classifier
          senders={senders}
          onClose={() => setShowClassifier(false)}
        />
      )}

      {showShare && (
        <ShareCard
          stats={{ totalCuts: stats.total_cuts, streak: stats.streak, healthScore }}
          onClose={() => setShowShare(false)}
        />
      )}

      {toast && (
        <div className="toast-notification animate-slide-up">
          <span>{toast.msg}</span>
          {toast.undoCut && (
            <button className="toast-undo" onClick={() => handleUndoToast(toast.undoCut)}>
              <RotateCcw size={14} />
              {t('dashboard.history_undo')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
