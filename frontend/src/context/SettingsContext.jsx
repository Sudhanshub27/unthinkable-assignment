import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    society_name: 'Unthinkable Society',
    support_email: 'office@unthinkable.com',
    emergency_phone: '+91 98765 43210',
    overdue_threshold_days: '5',
    max_upload_size_mb: '5',
    email_notifications: 'enabled',
  });
  const [loading, setLoading] = useState(true);

  async function fetchSettings() {
    if (!user) return;
    try {
      const res = await client.get('/settings');
      if (res.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Failed to load society settings in context:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return (
    <SettingsContext.Provider value={{ settings, fetchSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      settings: {
        society_name: 'Unthinkable Society',
        support_email: 'office@unthinkable.com',
        emergency_phone: '+91 98765 43210',
        overdue_threshold_days: '5',
        max_upload_size_mb: '5',
        email_notifications: 'enabled',
      },
      fetchSettings: () => {},
      loading: false,
    };
  }
  return context;
}
