import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserType } from '../services/AuthService';

const ProtectedRoute = ({ children, allowedTypes }) => {
  const isAuth = isAuthenticated();
  const userType = getUserType();

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (allowedTypes && !allowedTypes.includes(userType)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

