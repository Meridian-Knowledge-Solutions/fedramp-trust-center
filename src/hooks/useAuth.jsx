import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ported from FedRAMPAuth.constructor
    const token = localStorage.getItem('fedRAMPAccessToken');
    if (token) {
      try {
        // Ported from FedRAMPAuth.validateToken
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        if (payload.exp > Date.now() / 1000) {
          setUser(payload);
        } else {
          localStorage.removeItem('fedRAMPAccessToken');
        }
      } catch (e) {
        localStorage.removeItem('fedRAMPAccessToken');
      }
    }
    setIsLoading(false);
  }, []);

  // Ported from handleRegistration (Demo Mode Logic)
  const login = (email, agency) => {
    const mockTokenPayload = {
      agency: agency,
      email: email,
      exp: Math.floor(Date.now() / 1000) + 86400 
    };
    const token = `header.${btoa(JSON.stringify(mockTokenPayload))}.signature`;
    localStorage.setItem('fedRAMPAccessToken', token);
    setUser(mockTokenPayload);
  };

  const logout = () => {
    localStorage.removeItem('fedRAMPAccessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);