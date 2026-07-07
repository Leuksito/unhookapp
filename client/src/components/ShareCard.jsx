import { useRef, useEffect, useState, useCallback } from 'react';
import { X, Copy, Download, Share2 } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import './ShareCard.css';

const W = 1200;
const H = 630;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function ShareCard({ stats, onClose }) {
  const { t, lang } = useTranslation();
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { totalCuts, streak, healthScore } = stats;

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0f0c29');
    grad.addColorStop(0.5, '#302b63');
    grad.addColorStop(1, '#24243e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Accent blobs
    ctx.fillStyle = 'rgba(124, 131, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(W - 150, 80, 240, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 107, 157, 0.10)';
    ctx.beginPath();
    ctx.arc(140, H - 60, 200, 0, Math.PI * 2);
    ctx.fill();

    // Brand
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#7c83ff';
    ctx.font = '600 32px "Segoe UI", system-ui, -apple-system, sans-serif';
    ctx.fillText('UnhookApp', 60, 75);

    // Brand underline accent
    ctx.fillStyle = '#ff6b9d';
    roundRect(ctx, 60, 88, 56, 4, 2);
    ctx.fill();

    // Big number
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 128px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`${totalCuts}`, 60, 220);

    // Unit line
    ctx.fillStyle = '#b8b8d8';
    ctx.font = '600 44px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(t('share.headline_unit'), 60, 270);

    // Subtitle
    ctx.fillStyle = '#8888a8';
    ctx.font = '400 28px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(t('share.subtitle'), 60, 320);

    // Stats row
    const statsY = 380;
    const statsH = 170;
    const gap = 30;
    const padX = 60;
    const statsW = (W - padX * 2 - gap * 2) / 3;

    const statData = [
      { value: `${totalCuts}`, label: t('share.total_cuts'), color: '#7c83ff' },
      { value: `${streak}`, label: t('share.streak'), color: '#ff6b9d' },
      { value: `${healthScore}%`, label: t('share.health'), color: '#4ade80' }
    ];

    statData.forEach((s, i) => {
      const x = padX + i * (statsW + gap);
      // card background
      roundRect(ctx, x, statsY, statsW, statsH, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();

      // accent bar on left
      ctx.fillStyle = s.color;
      roundRect(ctx, x, statsY, 8, statsH, 4);
      ctx.fill();

      // value
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 68px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(s.value, x + 32, statsY + 85);

      // label
      ctx.fillStyle = '#9090b0';
      ctx.font = '500 24px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(s.label, x + 32, statsY + 130);
    });

    // Footer
    const locale = lang === 'en' ? 'en-US' : lang;
    let dateStr;
    try {
      dateStr = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    ctx.fillStyle = '#606078';
    ctx.font = '400 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`${t('share.footer')} · ${dateStr}`, 60, H - 40);
  }, [totalCuts, streak, healthScore, t, lang]);

  useEffect(() => {
    drawCard();
  }, [drawCard]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    canvas.toBlob((blob) => {
      if (!blob) {
        setDownloading(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unhookapp-${totalCuts}-cortes-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setDownloading(false);
    }, 'image/png');
  }, [totalCuts]);

  const handleCopy = useCallback(async () => {
    const text = t('share.tweet_text', { cuts: totalCuts, streak });
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Legacy fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Clipboard failed', e);
    }
  }, [t, totalCuts, streak]);

  const handleTweet = useCallback(() => {
    const text = encodeURIComponent(t('share.tweet_text', { cuts: totalCuts, streak }));
    window.open(
      `https://twitter.com/intent/tweet?text=${text}`,
      '_blank',
      'noopener,noreferrer,width=600,height=400'
    );
  }, [t, totalCuts, streak]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const nothingToShare = totalCuts === 0 && streak === 0 && healthScore === 0;

  return (
    <div className="share-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="share-modal animate-slide-up" onClick={e => e.stopPropagation()}>
        <button className="share-close" onClick={onClose} aria-label={t('share.close')}>
          <X size={20} />
        </button>

        <h2 className="share-title">{t('share.title')}</h2>
        <p className="share-desc">{t('share.desc')}</p>

        <div className="share-preview">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="share-canvas"
            aria-label={t('share.title')}
          />
        </div>

        {nothingToShare ? (
          <p className="share-empty">{t('share.empty')}</p>
        ) : (
          <div className="share-actions">
            <button className="share-btn primary" onClick={handleTweet}>
              <Share2 size={18} /> {t('share.tweet')}
            </button>
            <button className="share-btn" onClick={handleDownload} disabled={downloading}>
              <Download size={18} />
              {downloading ? t('share.downloading') : t('share.download')}
            </button>
            <button className="share-btn" onClick={handleCopy}>
              <Copy size={18} /> {copied ? t('share.copied') : t('share.copy')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}