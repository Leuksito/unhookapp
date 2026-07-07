import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { api } from '../utils/api';
import { CreditCard, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import './SubscriptionsPanel.css';

function formatCurrency(amount, code) {
  if (amount == null || isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code || 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

const CATEGORY_KEYS = {
  streaming: 'subscriptions.cat_streaming',
  shopping: 'subscriptions.cat_shopping',
  software: 'subscriptions.cat_software',
  storage: 'subscriptions.cat_storage',
  social: 'subscriptions.cat_social',
  news: 'subscriptions.cat_news',
  creator: 'subscriptions.cat_creator',
  gaming: 'subscriptions.cat_gaming',
};

export default function SubscriptionsPanel({ onCut }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getSubscriptions();
      setData(result);
    } catch (err) {
      setError(err.message || 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getSubscriptions();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message || 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const sorted = useMemo(() => {
    if (!data?.subscriptions) return [];
    return [...data.subscriptions].sort(
      (a, b) => (b.priceMonthly || 0) - (a.priceMonthly || 0)
    );
  }, [data]);

  const monthly = data?.monthlyTotal ?? 0;
  const yearly = data?.yearlyTotal ?? 0;
  const currency = data?.currency || 'USD';

  return (
    <div className="subs-panel">
      <div className="subs-header">
        <div className="subs-title-row">
          <CreditCard size={22} />
          <h3>{t('subscriptions.title')}</h3>
          <button
            className="subs-refresh"
            onClick={load}
            title={t('subscriptions.refresh')}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>
        <p className="subs-subtitle">{t('subscriptions.subtitle')}</p>
      </div>

      {loading ? (
        <div className="subs-loading">
          <RefreshCw size={20} className="spinning" />
          <span>{t('subscriptions.loading')}</span>
        </div>
      ) : error ? (
        <div className="subs-error">
          <AlertCircle size={18} />
          <span>{t('subscriptions.error')}</span>
          <button onClick={load}>{t('subscriptions.retry')}</button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="subs-empty">
          <span>{t('subscriptions.empty')}</span>
        </div>
      ) : (
        <>
          <div className="subs-totals">
            <div className="subs-total-box">
              <span className="subs-total-label">
                {t('subscriptions.monthly')}
              </span>
              <span className="subs-total-value">
                {formatCurrency(monthly, currency)}
              </span>
            </div>
            <div className="subs-total-box">
              <span className="subs-total-label">
                {t('subscriptions.yearly')}
              </span>
              <span className="subs-total-value">
                {formatCurrency(yearly, currency)}
              </span>
            </div>
          </div>

          <ul className="subs-list">
            {sorted.map(s => (
              <li key={s.service} className="subs-row">
                <span className="subs-icon">{s.icon || '💳'}</span>
                <div className="subs-row-main">
                  <span className="subs-row-name">{s.service}</span>
                  <span className="subs-row-meta">
                    {t(CATEGORY_KEYS[s.category] || 'subscriptions.cat_other')}
                  </span>
                </div>
                <span className="subs-row-price">
                  {s.priceMonthly > 0
                    ? formatCurrency(s.priceMonthly, currency) +
                      '/' + t('subscriptions.mo')
                    : t('subscriptions.free')}
                </span>
                {onCut && s.priceMonthly > 0 && (
                  <button
                    className="subs-row-cut"
                    onClick={() => onCut({
                      email: s.senderEmail,
                      name: s.senderName || s.service,
                    })}
                    title={t('subscriptions.cut_hint')}
                  >
                    {t('subscriptions.cancel')}
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="subs-footer">
            <TrendingUp size={14} />
            <span>{t('subscriptions.disclaimer')}</span>
          </div>
        </>
      )}
    </div>
  );
}