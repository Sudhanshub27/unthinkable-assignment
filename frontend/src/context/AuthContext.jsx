import { createContext, useContext, useState, useEffect } from 'react';
import client, { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!raw || !token) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return null;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load saved user session:', e);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });

  useEffect(() => {
    // When any protected API returns a 401, purge React user state
    setUnauthorizedHandler(() => {
      setUser(null);
    });
  }, []);

  async function login(email, password) {
    // Purge any stale token before attempting new login
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const res = await client.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(payload) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const res = await client.post('/auth/register', payload);
    if (res.data.requiresApproval) {
      return res.data;
    }
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
