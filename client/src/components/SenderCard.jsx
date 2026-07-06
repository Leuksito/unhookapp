import { useState, memo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { Scissors, Clock, AlertTriangle } from 'lucide-react';
import './SenderCard.css';

const SenderCard = memo(function SenderCard({ sender, onCut, onSnooze }) {
  const { t } = useTranslation();
  const [isCutting, setIsCutting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCut = () => {
    setIsCutting(true);
    setTimeout(() => {
      onCut(sender);
    }, 600);
  };

  const initial = sender.name.charAt(0).toUpperCase();

  return (
    <div
      className={`sender-card ${isCutting ? 'cutting-out' : ''}`}
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <div className="card-content">
        <div className={`avatar cat-${sender.category}`}>
          {initial}
        </div>
        <div className="sender-info">
          <h4>{sender.name}</h4>
          <p className="subject">{sender.exampleSubject || sender.email}</p>
          <div className="meta">
            <span className={`badge badge-${sender.category}`}>
              {t(`dashboard.tabs.${sender.category}`)}
            </span>
            <span className="frequency">
              ~{sender.frequency} {t('dashboard.freq')}
            </span>
          </div>
        </div>
      </div>

      {!sender.unsubLink && (
        <div className="no-link-warning">
          <AlertTriangle size={14} />
          <span>{t('dashboard.no_link')}</span>
        </div>
      )}

      {showPreview && sender.lastSnippet && (
        <div className="email-preview">
          <p>{sender.lastSnippet}</p>
        </div>
      )}

      <div className="card-actions">
        <button
          className="btn-snooze"
          onClick={() => onSnooze(sender)}
          title={t('dashboard.actions.snooze')}
        >
          <Clock size={16} />
        </button>
        <button
          className="btn-cut"
          onClick={handleCut}
        >
          <Scissors size={16} />
          {t('dashboard.actions.cut')}
        </button>
      </div>
    </div>
  );
});

export default SenderCard;
