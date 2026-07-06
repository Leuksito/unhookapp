import { useState, useEffect } from 'react';
import I18nContext from './context';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import pt from './pt.json';
import de from './de.json';
import it from './it.json';
import ja from './ja.json';

const translations = { en, es, fr, pt, de, it, ja };

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('unhook_lang') || 'es';
  });

  useEffect(() => {
    localStorage.setItem('unhook_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key, params) => {
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      if (value === undefined || value === null) return key;
      value = value[k];
    }
    if (typeof value !== 'string') return key;
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, name) =>
        (params[name] !== undefined ? String(params[name]) : `{${name}}`)
      );
    }
    return value;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}
