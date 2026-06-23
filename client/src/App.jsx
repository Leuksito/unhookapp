import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { api } from './utils/api';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

function AppContent() {
  const [auth, setAuth] = useState(() => ({ loading: true, user: null }));
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.getAuthStatus();
      if (data.authenticated) {
        setAuth({ loading: false, user: data.user });
      } else {
        setAuth({ loading: false, user: null });
      }
    } catch {
      setAuth({ loading: false, user: null });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (auth.loading) return;
    if (auth.user) {
      if (window.location.pathname === '/') {
        navigate('/dashboard', { replace: true });
      }
    } else {
      navigate('/', { replace: true });
    }
  }, [auth.loading, auth.user, navigate]);

  if (auth.loading) {
    return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<LoginScreen onLogin={checkAuth} />} />
      <Route path="/dashboard" element={<Dashboard user={auth.user} setAuth={setAuth} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
