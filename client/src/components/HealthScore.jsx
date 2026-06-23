import { useMemo } from 'react';
import './HealthScore.css';
import { useTranslation } from '../i18n';

export default function HealthScore({ totalItems, pendingItems }) {
  const { t } = useTranslation();

  const score = useMemo(() => {
    if (totalItems === 0) return 100;
    const cutItems = totalItems - pendingItems;
    return Math.round((cutItems / totalItems) * 100);
  }, [totalItems, pendingItems]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = 'score-green';
  if (score < 40) colorClass = 'score-red';
  else if (score < 75) colorClass = 'score-amber';

  return (
    <div className="health-score-container">
      <div className="health-circle-wrapper">
        <svg className="health-svg" width="160" height="160">
          <circle
            className="health-bg"
            cx="80"
            cy="80"
            r={radius}
            strokeWidth="12"
          />
          <circle
            className={`health-progress ${colorClass}`}
            cx="80"
            cy="80"
            r={radius}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="health-number">
          <span>{score}</span>
        </div>
      </div>
      <h3>{t('dashboard.health_score')}</h3>
      <p>{pendingItems} {t('dashboard.pending')}</p>
    </div>
  );
}
