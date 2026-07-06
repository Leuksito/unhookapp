import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { api } from '../utils/api';
import { Scissors } from 'lucide-react';
import LanguageMenu from './LanguageMenu';
import './LoginScreen.css';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await api.getAuthUrl();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await api.loginDemo();
      window.location.reload(); // Reload to trigger auth check in App.jsx
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-header">
        <LanguageMenu />
      </div>
      <div className="login-card animate-slide-up">
        <div className="logo">
          <Scissors size={48} color="var(--accent-primary)" />
          <h1>UnhookApp</h1>
        </div>
        
        <h2>{t('login.title')}</h2>
        <p className="subtitle">{t('login.subtitle')}</p>
        
        <button 
          className="btn-primary login-btn" 
          onClick={handleLogin} 
          disabled={loading}
        >
          {loading ? '...' : t('login.connect')}
        </button>

        <button 
          className="btn-secondary login-btn" 
          onClick={handleDemo} 
          disabled={loading}
          style={{ marginTop: '-0.5rem', marginBottom: '1.5rem', background: '#e0e0e0' }}
        >
          {t('login.demo')}
        </button>
        
        <p className="privacy-notice">{t('login.privacy')}</p>
      </div>
    </div>
  );
}
