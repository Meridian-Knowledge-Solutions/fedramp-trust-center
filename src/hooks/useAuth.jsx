import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const AuthContext = createContext(null);

// Consistent localStorage key - must match what verification flow uses
const TOKEN_KEY = 'fedramp_token';
const AGENCY_KEY = 'fedramp_agency';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate and decode JWT token
  const validateToken = useCallback((token) => {
    if (!token) return null;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format');
        return null;
      }
      
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // Check expiration
      if (!payload.exp || payload.exp <= Date.now() / 1000) {
        console.warn('Token expired');
        return null;
      }
      
      // Validate required claims exist
      if (!payload.agency || !payload.email) {
        console.warn('Token missing required claims');
        return null;
      }
      
      return payload;
    } catch (e) {
      console.error('Token validation error:', e);
      return null;
    }
  }, []);

  // Initialize auth state from stored token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const payload = validateToken(token);
    
    if (payload) {
      setUser(payload);
    } else if (token) {
      // Token exists but invalid - clean up
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(AGENCY_KEY);
    }
    
    setIsLoading(false);
  }, [validateToken]);

  // Handle successful verification - called after /verify API returns
  const setAuthToken = useCallback((token) => {
    const payload = validateToken(token);
    
    if (payload) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(AGENCY_KEY, payload.agency);
      setUser(payload);
      return true;
    }
    
    return false;
  }, [validateToken]);

  // Handle the full verify API response — extracts fedRAMPAccessToken from backend
  // Backend returns: { success, fedRAMPAccessToken, agency, message, next_steps }
  const handleVerifyResponse = useCallback((response) => {
    const token = response?.fedRAMPAccessToken;

    if (!token) {
      console.error('No fedRAMPAccessToken found in verify response');
      return false;
    }

    return setAuthToken(token);
  }, [setAuthToken]);

  // Get current token for API calls
  const getToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  // Logout - clear all auth state
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AGENCY_KEY);
    setUser(null);
  }, []);

  // Check if current token is still valid (for components that need to re-verify)
  const isTokenValid = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    return validateToken(token) !== null;
  }, [validateToken]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    setAuthToken,          // Use this if you already have the raw token string
    handleVerifyResponse,  // Use this directly with the /verify API response
    getToken,              // Use this for API Authorization headers
    logout,
    isTokenValid,
  };

  return (
    <AuthContext.Provider value={value}>
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
