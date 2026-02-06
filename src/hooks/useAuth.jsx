import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'fedRAMPAccessToken';

// Allow 30 seconds of clock skew between client and server.
// If the server's clock is slightly behind the client, a freshly-minted
// token could appear "expired" to validateToken without this buffer.
const CLOCK_SKEW_TOLERANCE_SECONDS = 30;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate and decode JWT token
  const validateToken = useCallback((token) => {
    if (!token) {
      console.debug('[useAuth] validateToken: no token provided');
      return null;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('[useAuth] validateToken: token does not have 3 parts (not a valid JWT)');
        return null;
      }

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      const now = Date.now() / 1000;

      // Check for exp claim
      if (!payload.exp) {
        console.warn('[useAuth] validateToken: token has no exp claim — accepting it anyway');
        // Some backends issue tokens without exp for long-lived sessions.
        // If your backend ALWAYS sets exp, change this to return null.
        return payload;
      }

      // Apply clock-skew tolerance
      if (payload.exp + CLOCK_SKEW_TOLERANCE_SECONDS <= now) {
        console.warn(
          `[useAuth] validateToken: token expired. exp=${payload.exp}, now=${now}, diff=${(now - payload.exp).toFixed(1)}s`
        );
        return null;
      }

      console.debug(
        `[useAuth] validateToken: valid. exp in ${(payload.exp - now).toFixed(0)}s, agency=${payload.agency || 'N/A'}`
      );
      return payload;
    } catch (e) {
      console.error('[useAuth] validateToken: failed to decode token:', e.message);
      return null;
    }
  }, []);

  // Initialize auth state from stored token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      const payload = validateToken(token);

      if (payload) {
        console.log('[useAuth] Restored session from localStorage');
        setUser(payload);
      } else {
        console.log('[useAuth] Stored token is invalid/expired — clearing');
        localStorage.removeItem(TOKEN_KEY);
      }
    }

    setIsLoading(false);
  }, [validateToken]);

  // Handle the /verify API response directly.
  // Backend returns: { success, fedRAMPAccessToken, agency, message, next_steps }
  const handleVerifyResponse = useCallback((response) => {
    console.log('[useAuth] handleVerifyResponse called, response keys:', Object.keys(response || {}));

    const token = response?.fedRAMPAccessToken;

    if (!token) {
      console.error('[useAuth] handleVerifyResponse: no fedRAMPAccessToken in response');
      console.error('[useAuth] Full response:', JSON.stringify(response, null, 2));
      return false;
    }

    const payload = validateToken(token);

    if (payload) {
      localStorage.setItem(TOKEN_KEY, token);
      setUser(payload);
      console.log('[useAuth] handleVerifyResponse: JWT stored, user set. agency=', payload.agency);
      return true;
    }

    console.error('[useAuth] handleVerifyResponse: validateToken rejected the token');
    return false;
  }, [validateToken]);

  // Get current token for API Authorization headers
  const getToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    console.log('[useAuth] User logged out');
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
