import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('skillswap_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // App Startup: Check and verify existing token with backend GET /api/auth/me
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('skillswap_token');
      if (!storedToken) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const response = await API.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
          setToken(storedToken);
          setIsAuthenticated(true);
        } else {
          throw new Error('Token verification failed');
        }
      } catch (error) {
        console.warn('Session expired or invalid token. Clearing credentials.');
        localStorage.removeItem('skillswap_token');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Login action
  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        localStorage.setItem('skillswap_token', newToken);
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Login failed.' };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid email or password.';
      return { success: false, message };
    }
  };

  // Register action
  const register = async (name, email, password) => {
    try {
      const response = await API.post('/auth/register', { name, email, password });
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        localStorage.setItem('skillswap_token', newToken);
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Registration failed.' };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  // Google Login action (GIS ID Token Verification)
  const googleLogin = async (credential) => {
    try {
      const response = await API.post('/auth/google', { credential });
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        localStorage.setItem('skillswap_token', newToken);
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
      }
      return {
        success: false,
        message: response.data.message || 'Google login failed.',
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Google authentication failed. Please try again.';
      return { success: false, message };
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('skillswap_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        googleLogin,
        logout,
      }}
    >
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

export default AuthContext;
