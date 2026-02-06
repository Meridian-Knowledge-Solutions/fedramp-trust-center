import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'fedRAMPAccessToken';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate and decode JWT token
  const validateToken = useCallback((token) => {
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      if (!payload.exp || payload.exp <= Date.now() / 1000) {
        return null;
      }

      return payload;
    } catch (e) {
      return null;
    }
  }, []);

  // Initialize auth state from stored token (same as original)
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const payload = validateToken(token);

    if (payload) {
      setUser(payload);
    } else if (token) {
      localStorage.removeItem(TOKEN_KEY);
    }

    setIsLoading(false);
  }, [validateToken]);

  // Handle the /verify API response directly
  // Backend returns: { success, fedRAMPAccessToken, agency, message, next_steps }
  const handleVerifyResponse = useCallback((response) => {
    const token = response?.fedRAMPAccessToken;

    if (!token) {
      console.error('No fedRAMPAccessToken in verify response');
      return false;
    }

    const payload = validateToken(token);

    if (payload) {
      localStorage.setItem(TOKEN_KEY, token);
      setUser(payload);
      return true;
    }

    return false;
  }, [validateToken]);

  // Get current token for API Authorization headers
  const getToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      handleVerifyResponse,
      getToken,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
