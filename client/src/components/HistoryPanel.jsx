import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { api } from '../utils/api';
import { Clock, RotateCcw, X, Trash2 } from 'lucide-react';
import './HistoryPanel.css';

export default function HistoryPanel({ onClose, onUndone }) {
  const { t } = useTranslation();
  const [cuts, setCuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [undoing, setUndoing] = useState(null);

  useEffect(() => {
    api.getHistory().then(data => {
      setCuts(data.cuts || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleUndo = async (cut) => {
    setUndoing(cut.id);
    try {
      const result = await api.undoCut(cut.id);
      setCuts(prev => prev.filter(c => c.id !== cut.id));
      if (onUndone) onUndone(cut, result);
    } catch (err) {
      console.error(err);
    } finally {
      setUndoing(null);
    }
  };

  return (
    <div className="history-overlay">
      <div className="history-panel animate-slide-up">
        <div className="history-header">
          <h2><Clock size={20} /> {t('dashboard.history_title')}</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {loading ? (
          <div className="history-loading">{t('dashboard.loading')}</div>
        ) : cuts.length === 0 ? (
          <div className="history-empty">
            <Trash2 size={32} />
            <p>{t('dashboard.history_empty')}</p>
          </div>
        ) : (
          <div className="history-list">
            {cuts.map(cut => (
              <div key={cut.id} className="history-item">
                <div className="history-item-info">
                  <strong>{cut.sender_name || cut.sender_email}</strong>
                  <span className="history-meta">
                    {cut.trashed_count > 0 && `${cut.trashed_count} emails`}
                    {cut.filter_id && ' · filtro'}
                    {' · '}{new Date(cut.cut_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  className="btn-undo"
                  onClick={() => handleUndo(cut)}
                  disabled={undoing === cut.id}
                >
                  <RotateCcw size={14} className={undoing === cut.id ? 'spin' : ''} />
                  {t('dashboard.history_undo')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
