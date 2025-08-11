import React from 'react';
import { Navigate } from 'react-router-dom';

const isAuthenticated = () => {
  // Placeholder for your authentication logic
  // e.g., check if a token exists in localStorage
  return localStorage.getItem(`token`) !== null;
};

export const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // Redirect to the login page if not authenticated
    return <Navigate
      to="/login"
      replace />;
  }

  return children;
};