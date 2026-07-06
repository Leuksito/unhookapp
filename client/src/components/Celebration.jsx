import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import './Celebration.css';

export default function Celebration({ onDone }) {
  const { t } = useTranslation();
  const [particles] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      i,
      cls: `c-${i % 5}`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`
    }))
  );

  return (
    <div className="celebration-overlay">
      <div className="confetti">
        {particles.map(p => (
          <div key={p.i} className={`confetti-piece ${p.cls}`} style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration
          }}></div>
        ))}
      </div>
      
      <div className="celebration-card animate-slide-up">
        <h1 className="celeb-title">{t('celebration.title')}</h1>
        <p className="celeb-desc">{t('celebration.desc')}</p>
        
        <button className="btn-primary" onClick={onDone}>
          {t('celebration.done')}
        </button>
      </div>
    </div>
  );
}
