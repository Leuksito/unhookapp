import { api } from '../utils/api';
import { Scissors, LogOut } from 'lucide-react';
import LanguageMenu from './LanguageMenu';
import './Header.css';

export default function Header({ user, setAuth, streak }) {

  const handleLogout = async () => {
    try {
      await api.logout();
      setAuth({ loading: false, user: null });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="app-header">
      <div className="container header-content">
        <div className="header-logo">
          <Scissors size={24} color="var(--accent-primary)" />
          <span>UnhookApp</span>
        </div>

        <div className="header-actions">
          {streak > 0 && (
            <div className="streak-badge" title="Day Streak">
              🔥 {streak}
            </div>
          )}
          
          <LanguageMenu />
          
          <div className="user-profile">
            <div className="user-avatar">{user?.email?.charAt?.(0)?.toUpperCase() ?? '?'}</div>
            <button className="icon-btn logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
