import { createContext, useContext, useState, useEffect } from 'react';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import pt from './pt.json';
import de from './de.json';
import it from './it.json';
import ja from './ja.json';

const translations = { en, es, fr, pt, de, it, ja };

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('unhook_lang') || 'es';
  });

  useEffect(() => {
    localStorage.setItem('unhook_lang', lang);
  }, [lang]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      if (value[k] === undefined) return key;
      value = value[k];
    }
    return value;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
