import { useState } from 'react';
import { useTranslation } from '../i18n';
import { api } from '../utils/api';
import { Sparkles, Tag, RefreshCw, Check, ChevronDown, Brain, Loader2, Trash2, Undo2 } from 'lucide-react';
import './Classifier.css';

const CATEGORY_META = {
  work: { label: { en: 'Work', es: 'Trabajo' }, color: '#4A6FA5', icon: '💼' },
  personal: { label: { en: 'Personal', es: 'Personal' }, color: '#6B8E6B', icon: '👤' },
  bills: { label: { en: 'Bills', es: 'Facturas' }, color: '#C75B39', icon: '📄' },
  social: { label: { en: 'Social', es: 'Social' }, color: '#A0522D', icon: '🔗' },
  promotions: { label: { en: 'Promotions', es: 'Promociones' }, color: '#D4A574', icon: '🏷️' },
  notifications: { label: { en: 'Notifications', es: 'Notificaciones' }, color: '#8B7B6B', icon: '🔔' },
  other: { label: { en: 'Other', es: 'Otros' }, color: '#9B8B7F', icon: '📁' }
};

const CATEGORY_ORDER = ['work', 'personal', 'bills', 'promotions', 'social', 'notifications', 'other'];

export default function Classifier({ senders, onClose }) {
  const { t, lang } = useTranslation();
  const [classifications, setClassifications] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedCat, setSelectedCat] = useState('all');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [reassigning, setReassigning] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [revertingLabels, setRevertingLabels] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [classifyError, setClassifyError] = useState(null);

  const handleClassify = async () => {
    setClassifying(true);
    setClassifyError(null);
    setProgress({ current: 0, total: senders.length });
    try {
      const result = await api.classifySenders(senders);
      if (!result || !result.classifications) {
        throw new Error('Respuesta inválida del servidor');
      }
      setClassifications(result.classifications);
    } catch (err) {
      console.error('Classification error:', err);
      setClassifyError(err.message || 'Error al clasificar. Revisa que el servidor esté corriendo y la API key de Gemini sea válida.');
    } finally {
      setClassifying(false);
    }
  };

  const handleReassign = async (email, category) => {
    setReassigning(email);
    try {
      const result = await api.reassignClassification(email, category);
      setClassifications(result.classifications);
    } catch (err) {
      console.error(err);
    } finally {
      setReassigning(null);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await api.clearClassifications();
      setClassifications(null);
      setApplied(false);
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  };

  const handleRevertLabels = async () => {
    setRevertingLabels(true);
    try {
      const result = await api.revertLabels();
      setApplied(false);
    } catch (err) {
      console.error(err);
    } finally {
      setRevertingLabels(false);
    }
  };

  const handleApplyLabels = async () => {
    setApplying(true);
    try {
      await api.applyLabels();
      setApplied(true);
    } catch (err) {
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  const allItems = classifications
    ? Object.entries(classifications).flatMap(([cat, items]) =>
        items.map(i => ({ ...i, category: cat }))
      )
    : [];

  const filteredItems = selectedCat === 'all'
    ? allItems
    : allItems.filter(i => i.category === selectedCat);

  const totalByCat = {};
  if (classifications) {
    for (const [cat, items] of Object.entries(classifications)) {
      totalByCat[cat] = items.length;
    }
  }

  const getCategoryLabel = (cat) => {
    const meta = CATEGORY_META[cat];
    return meta ? (meta.label[lang] || meta.label.es) : cat;
  };

  if (!classifications && !classifying) {
    return (
      <div className="classifier-overlay" onClick={onClose}>
        <div className="classifier-panel" onClick={e => e.stopPropagation()}>
          <button className="classifier-close" onClick={onClose}>×</button>
          <div className="classifier-hero">
            <Brain size={48} />
            <h2>Clasificación con IA</h2>
            <p>Usa Gemini AI para clasificar automáticamente tus remitentes en categorías: Trabajo, Personal, Facturas, Redes Sociales, Promociones y más.</p>
            {classifyError && (
              <div className="classifier-error">
                <span>⚠️ {classifyError}</span>
              </div>
            )}
            <button className="btn-primary" onClick={handleClassify} style={{ marginTop: '1.5rem', padding: '0.85rem 2rem', fontSize: '1.1rem' }}>
              <Sparkles size={20} />
              Clasificar con IA
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (classifying) {
    return (
      <div className="classifier-overlay" onClick={onClose}>
        <div className="classifier-panel" onClick={e => e.stopPropagation()}>
          <button className="classifier-close" onClick={onClose}>×</button>
          <div className="classifier-progress">
            <Loader2 size={48} className="spinner" />
            <h3>Analizando remitentes...</h3>
            <p>Gemini IA está clasificando {senders.length} remitentes</p>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <span className="progress-text">{progress.current} / {progress.total}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="classifier-overlay" onClick={onClose}>
      <div className="classifier-panel" onClick={e => e.stopPropagation()}>
        <button className="classifier-close" onClick={onClose}>×</button>

        <div className="classifier-header">
          <Brain size={24} />
          <h2>Clasificación por IA</h2>
          <div className="classifier-actions">
            <button
              className="btn-secondary"
              onClick={handleApplyLabels}
              disabled={applying || applied}
              style={{ background: applied ? 'var(--accent-success)' : '', color: applied ? 'white' : '' }}
            >
              {applied ? <Check size={16} /> : <Tag size={16} />}
              {applied ? '¡Labels aplicadas!' : applying ? 'Aplicando...' : 'Crear labels en Gmail'}
            </button>
            {applied && (
              <button
                className="btn-secondary"
                onClick={handleRevertLabels}
                disabled={revertingLabels}
                style={{ color: 'var(--accent-danger)' }}
              >
                <Undo2 size={16} />
                {revertingLabels ? 'Revirtiendo...' : 'Revertir labels'}
              </button>
            )}
            <button className="btn-secondary" onClick={handleClassify}>
              <RefreshCw size={16} />
              Re-clasificar
            </button>
            {confirmClear ? (
              <div className="confirm-clear">
                <span>¿Eliminar todas?</span>
                <button className="btn-danger" onClick={handleClear} disabled={clearing}>
                  {clearing ? '...' : 'Sí, limpiar'}
                </button>
                <button className="btn-secondary" onClick={() => setConfirmClear(false)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button className="btn-secondary" onClick={() => setConfirmClear(true)} style={{ color: 'var(--accent-danger)' }}>
                <Trash2 size={16} />
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="classifier-summary">
          {CATEGORY_ORDER.map(cat => {
            const count = totalByCat[cat] || 0;
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                className={`category-pill ${selectedCat === cat ? 'active' : ''}`}
                style={{ '--cat-color': meta.color }}
                onClick={() => setSelectedCat(selectedCat === cat ? 'all' : cat)}
              >
                <span>{meta.icon}</span>
                <span>{meta.label[lang] || meta.label.es}</span>
                <span className="category-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="classifier-list">
          {filteredItems.length === 0 ? (
            <div className="classifier-empty">
              <p>No hay remitentes en esta categoría</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const meta = CATEGORY_META[item.category] || CATEGORY_META.other;
              return (
                <div key={item.sender_email} className="classifier-item">
                  <div className="classifier-item-info">
                    <span className="classifier-item-name">{item.sender_name || item.sender_email}</span>
                    {item.exampleSubject && (
                      <span className="classifier-item-subject">{item.exampleSubject}</span>
                    )}
                    <span className="classifier-item-confidence">
                      Confianza: {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                  <div className="classifier-item-category">
                    <span
                      className="category-badge"
                      style={{ background: meta.color }}
                    >
                      {meta.icon} {meta.label[lang] || meta.label.es}
                    </span>
                    <div className="category-select-wrap">
                      <select
                        value={item.category}
                        onChange={e => handleReassign(item.sender_email, e.target.value)}
                        disabled={reassigning === item.sender_email}
                        className="category-select"
                      >
                        {CATEGORY_ORDER.map(c => {
                          const m = CATEGORY_META[c];
                          return (
                            <option key={c} value={c}>
                              {m.icon} {m.label[lang] || m.label.es}
                            </option>
                          );
                        })}
                      </select>
                      {reassigning === item.sender_email && (
                        <Loader2 size={14} className="spinner" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
