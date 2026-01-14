import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RequireRoleProps {
  role: UserRole;
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ role, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={user.role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor'} replace />;
  }

  return <>{children}</>;
};
