import { createContext, useContext, useEffect, useState } from 'react';
import { getProfile, logout as apiLogout } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('forgetrack_token');
      if (token) {
        try {
          const response = await getProfile();
          setUser(response.user || response);
        } catch (err) {
          localStorage.removeItem('forgetrack_token');
          setError(err.message);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setError(null);
  };

  const clearError = () => setError(null);

  const logout = () => {
    apiLogout();
    setUser(null);
    window.location.href = '/login';
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
