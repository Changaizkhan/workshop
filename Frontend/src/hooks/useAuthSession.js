import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { firstAllowedPath } from '../routes';

export function useAuthSession() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('ga_token'));
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const sessionEpoch = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const epoch = ++sessionEpoch.current;
    const finishBootstrap = (usr, tkn) => {
      if (cancelled || epoch !== sessionEpoch.current) return;
      if (tkn) {
        localStorage.setItem('ga_token', tkn);
        setToken(tkn);
      } else {
        localStorage.removeItem('ga_token');
        setToken(null);
      }
      setUser(usr);
      setBootstrapping(false);
    };
    (async () => {
      try {
        const stored = localStorage.getItem('ga_token');
        if (stored) {
          try {
            const data = await api.get('/api/auth/me');
            finishBootstrap(data.user, stored);
            return;
          } catch {
            localStorage.removeItem('ga_token');
          }
        }
        finishBootstrap(null, null);
      } catch {
        finishBootstrap(null, null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem('ga_token', token);
    else localStorage.removeItem('ga_token');
  }, [token]);

  const handleLoginSuccess = (usr, tkn) => {
    sessionEpoch.current++;
    localStorage.setItem('ga_token', tkn);
    setUser(usr);
    setToken(tkn);
    setBootstrapping(false);
    navigate(firstAllowedPath(usr), { replace: true });
  };

  const handleLogout = () => {
    sessionEpoch.current++;
    localStorage.removeItem('ga_token');
    queryClient.clear();
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  };

  return {
    user,
    token,
    bootstrapping,
    isAuthenticated: !!(user && token),
    handleLoginSuccess,
    handleLogout,
  };
}
