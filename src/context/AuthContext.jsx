import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, isAuthenticated, getUserType, logout } from '../services/AuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      if (isAuthenticated()) {
        const user = getCurrentUser();
        setUsuario(user);
        setIsAuth(true);
      } else {
        setUsuario(null);
        setIsAuth(false);
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      setUsuario(null);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUsuario(userData);
    setIsAuth(true);
  };

  const handleLogout = () => {
    logout();
    setUsuario(null);
    setIsAuth(false);
  };

  const value = {
    usuario,
    isAuth,
    loading,
    login: handleLogin,
    logout: handleLogout,
    checkAuth,
    userType: getUserType()
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
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

