import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('flowmind_token'));
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Validate Token and load User Profile on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('flowmind_token');
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setAuthLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.success && res.data) {
          setUser(res.data);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('[AuthContext] Token validation failed:', err.message);
        logout();
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.token) {
        localStorage.setItem('flowmind_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const res = await authApi.register(name, email, password);
      if (res.success && res.token) {
        localStorage.setItem('flowmind_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const updateProfile = async (name, email) => {
    setAuthError(null);
    try {
      const res = await authApi.updateProfile(name, email);
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setAuthError(null);
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      if (res.success && res.token) {
        localStorage.setItem('flowmind_token', res.token);
        setToken(res.token);
      }
      return res;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('flowmind_token');
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        authLoading,
        authError,
        login,
        register,
        updateProfile,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
