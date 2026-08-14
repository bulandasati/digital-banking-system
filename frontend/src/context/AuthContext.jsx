import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // App Startup Flow: Verify active session & role with GET /api/v1/auth/me
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axiosClient.get('/api/v1/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Session verification failed:', err);
        localStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (emailOrUsername, password) => {
    const res = await axiosClient.post('/api/v1/auth/login', { emailOrUsername, password });
    const { accessToken, user: userData } = res.data;
    
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await axiosClient.post('/api/v1/auth/register', formData);
    const { accessToken, user: userData } = res.data || {};
    
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      setUser(userData);
    }
    return res.data;
  };

  const forgotPassword = async (email) => {
    const res = await axiosClient.post('/api/v1/auth/forgot-password', { email });
    return res.data;
  };

  const verifyOtp = async (email, token) => {
    const res = await axiosClient.post('/api/v1/auth/verify-otp', { email, token });
    return res.data;
  };

  const resetPassword = async (email, token, newPassword) => {
    const res = await axiosClient.post('/api/v1/auth/reset-password', { email, token, newPassword });
    return res.data;
  };

  const logout = async () => {
    try {
      await axiosClient.post('/api/v1/auth/logout');
    } catch (e) {
      // Ignore
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, forgotPassword, verifyOtp, resetPassword, logout, isAdmin: user?.role === 'ROLE_ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
