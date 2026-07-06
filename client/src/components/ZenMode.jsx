import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import SenderCard from './SenderCard';
import { X, ArrowLeft, ArrowRight, ArrowUp, Zap } from 'lucide-react';
import './ZenMode.css';

function getComboLabel(combo) {
  if (combo >= 25) return 'LEGENDARY';
  if (combo >= 15) return 'EPIC';
  if (combo >= 10) return 'AMAZING';
  if (combo >= 5) return 'GREAT';
  if (combo >= 3) return 'NICE';
  return '';
}

export default function ZenMode({ senders, onCut, onSnooze, onExit }) {
  const { t } = useTranslation();
  const [queue, setQueue] = useState(senders);
  const [direction, setDirection] = useState(null);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [showComboPop, setShowComboPop] = useState(false);
  const [prevSenders, setPrevSenders] = useState(senders);

  // Sync queue to prop changes during render (React-recommended pattern).
  if (senders !== prevSenders) {
    setPrevSenders(senders);
    setQueue(senders);
    setCombo(0);
  }

  const currentSender = queue[0];
  const progress = senders.length > 0 ? ((senders.length - queue.length) / senders.length) * 100 : 0;
  const totalCards = senders.length;

  const triggerComboPop = (newCombo, actionType) => {
    if (actionType !== 'cut') return;
    setShowComboPop(true);
    setTimeout(() => setShowComboPop(false), 900);
  };

  const handleAction = useCallback((actionType) => {
    if (!currentSender) return;

    if (actionType === 'cut' && !currentSender.unsubLink) {
      actionType = 'keep';
    }

    setDirection(actionType === 'cut' ? 'left' : actionType === 'keep' ? 'right' : 'up');

    if (actionType === 'cut') {
      window.open(currentSender.unsubLink, '_blank');
      onCut(currentSender);
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > bestCombo) setBestCombo(newCombo);
      triggerComboPop(newCombo, actionType);
    } else if (actionType === 'snooze') {
      onSnooze(currentSender);
      setCombo(0);
    } else {
      setCombo(0);
    }

    setTimeout(() => {
      setQueue(prev => prev.slice(1));
      setDirection(null);
    }, 400);
  }, [currentSender, onCut, onSnooze, combo, bestCombo]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!currentSender) return;
      if (direction) return;

      if (e.key === 'ArrowLeft') {
        handleAction('cut');
      } else if (e.key === 'ArrowRight') {
        handleAction('keep');
      } else if (e.key === 'ArrowUp') {
        handleAction('snooze');
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSender, direction, handleAction, onExit]);

  const comboLabel = getComboLabel(combo);

  return (
    <div className="zen-overlay">
      <div className="zen-header">
        <div className="zen-title">
          <h2>{t('zen.title')}</h2>
          <p>{t('zen.subtitle')}</p>
        </div>
        <div className="zen-header-right">
          <div className={`combo-indicator ${combo > 0 ? 'active' : ''} ${comboLabel.toLowerCase()}`}>
            <Zap size={16} className={combo > 0 ? 'combo-pulse' : ''} />
            <span className="combo-count">{combo}</span>
          </div>
          <button className="icon-btn zen-close" onClick={onExit} title={t('zen.exit')}>
            <X size={28} />
          </button>
        </div>
      </div>

      <div className="zen-progress-bar">
        <div className="zen-progress-fill" style={{ width: `${progress}%` }} />
        <span className="zen-progress-text">{queue.length} / {totalCards} {t('zen.remaining')}</span>
      </div>

      {showComboPop && combo >= 3 && (
        <div className="combo-pop">
          <span className="combo-pop-label">{comboLabel}</span>
          <span className="combo-pop-x">{combo}x</span>
        </div>
      )}

      <div className="zen-stage">
        {currentSender ? (
          <div className={`zen-card-wrapper ${direction ? `slide-${direction}` : ''}`}>
            <SenderCard 
              sender={currentSender} 
              onCut={() => handleAction('cut')}
              onSnooze={() => handleAction('snooze')}
            />
          </div>
        ) : (
          <div className="zen-empty">
            <div className="zen-empty-badge">
              <Zap size={48} />
              <span className="zen-empty-best">Best Combo: {bestCombo}x</span>
            </div>
            <p>{t('zen.empty')}</p>
            <button className="btn-primary" onClick={onExit}>{t('zen.exit')}</button>
          </div>
        )}
      </div>

      <div className="zen-controls">
        <button className="zen-btn cut-btn" onClick={() => handleAction('cut')} disabled={!currentSender?.unsubLink}>
          <ArrowLeft size={20} />
          <span>{t('zen.cut')}</span>
        </button>
        <button className="zen-btn snooze-btn" onClick={() => handleAction('snooze')} disabled={!currentSender}>
          <ArrowUp size={20} />
          <span>{t('zen.snooze')}</span>
        </button>
        <button className="zen-btn keep-btn" onClick={() => handleAction('keep')} disabled={!currentSender}>
          <span>{t('zen.keep')}</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
