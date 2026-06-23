import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { Scissors, Search, Inbox, Loader2 } from 'lucide-react';
import './ScanProgress.css';

const PHASES = [
  { key: 'connecting', icon: Search, color: '#C75B39' },
  { key: 'counting', icon: Inbox, color: '#D4A574' },
  { key: 'scanning', icon: Scissors, color: '#6B8E6B' },
];

export default function ScanProgress() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2000);
    const t2 = setTimeout(() => setPhase(2), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="scan-progress">
      <div className="scan-phases">
        {PHASES.map((p, i) => {
          const Icon = p.icon;
          const isActive = i === phase;
          const isDone = i < phase;
          return (
            <div key={p.key} className={`scan-phase ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="scan-phase-icon" style={{
                backgroundColor: isDone ? p.color : 'transparent',
                borderColor: isDone ? p.color : p.color,
                opacity: i > phase ? 0.3 : 1,
              }}>
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <Icon size={16} color={isActive ? p.color : '#9B8B7F'} />
                )}
              </div>
              <span className="scan-phase-label">
                {t(`dashboard.phase_${p.key}`)}
              </span>
              {isActive && <Loader2 size={14} className="scan-phase-spinner" style={{ color: p.color }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
