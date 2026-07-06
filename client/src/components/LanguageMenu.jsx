import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { Globe, ChevronDown, Check } from 'lucide-react';
import './LanguageMenu.css';

const LANGUAGES = [
  { code: 'en', name: 'English', nameLocal: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nameLocal: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nameLocal: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Portuguese', nameLocal: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'German', nameLocal: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nameLocal: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nameLocal: '日本語', flag: '🇯🇵' },
];

export default function LanguageMenu() {
  const { lang, setLang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const menuRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setAnimating(true);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="lang-menu-container" ref={menuRef}>
      <button
        className={`lang-menu-button ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        title="Change language"
      >
        <Globe size={16} className="globe-icon" />
        <span className="lang-current-flag">{currentLang.flag}</span>
        <span className="lang-current-text">{currentLang.code.toUpperCase()}</span>
        <ChevronDown size={14} className={`lang-chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className={`lang-dropdown ${animating ? 'animate-in' : ''}`}
          onAnimationEnd={() => setAnimating(false)}>
          {LANGUAGES.map((language, idx) => (
            <button
              key={language.code}
              className={`lang-option ${lang === language.code ? 'active' : ''}`}
              onClick={() => {
                setLang(language.code);
                setIsOpen(false);
              }}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <span className="lang-option-flag">{language.flag}</span>
              <div className="lang-option-text">
                <span className="lang-name">{language.nameLocal}</span>
                <span className="lang-name-en">{language.name}</span>
              </div>
              {lang === language.code && (
                <span className="lang-check">
                  <Check size={16} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
