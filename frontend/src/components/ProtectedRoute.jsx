import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, isAuthenticated, isInitialized, hasValidToken } = useAuth();

    console.log('🛡️ ProtectedRoute - user:', user);
    console.log('🛡️ ProtectedRoute - isAuthenticated:', isAuthenticated);
    console.log('🛡️ ProtectedRoute - allowedRoles:', allowedRoles);
    console.log('🛡️ ProtectedRoute - isInitialized:', isInitialized);
    console.log('🛡️ ProtectedRoute - hasValidToken:', hasValidToken);
    console.log('🛡️ ProtectedRoute - localStorage token:', localStorage.getItem('token') ? 'present' : 'missing');
    console.log('🛡️ ProtectedRoute - localStorage user:', localStorage.getItem('user') ? 'present' : 'missing');

    // Wait for initialization to complete
    if (!isInitialized) {
        console.log('🛡️ Waiting for initialization...');
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        console.log('🛡️ Not authenticated, redirecting to login');
        console.log('🛡️ Token from localStorage:', localStorage.getItem('token'));
        console.log('🛡️ User from localStorage:', localStorage.getItem('user'));
        console.log('🛡️ hasValidToken:', hasValidToken);

        // Clear any invalid data before redirecting
        if (!localStorage.getItem('token') || !localStorage.getItem('user')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('tokenTimestamp');
        }

        return <Navigate to="/login" replace />;
    }

    // If no specific roles required, allow access
    if (allowedRoles.length === 0) {
        console.log('🛡️ No specific roles required, allowing access');
        return children;
    }

    // Check if user has required role
    if (user && allowedRoles.includes(user.role)) {
        console.log('🛡️ User has required role, allowing access');
        return children;
    }

    // If user doesn't have required role, redirect to appropriate dashboard
    if (user) {
        console.log('🛡️ User role not allowed, redirecting to appropriate dashboard');
        console.log('🛡️ Current user role:', user.role);
        console.log('🛡️ Required roles:', allowedRoles);

        switch (user.role) {
            case 'admin':
                return <Navigate to="/admin" replace />;
            case 'owner':
                return <Navigate to="/owner" replace />;
            case 'user':
                return <Navigate to="/dashboard" replace />;
            default:
                console.log('🛡️ Unknown user role, redirecting to dashboard');
                return <Navigate to="/dashboard" replace />;
        }
    }

    // Fallback to login
    console.log('🛡️ Fallback to login - no user data available');
    return <Navigate to="/login" replace />;
};

export default ProtectedRoute;



