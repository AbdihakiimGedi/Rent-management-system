import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if user is authenticated - more lenient check that only requires valid token
  const hasValidToken = !!token && token.split('.').length === 3;
  const isAuthenticatedStrict = !!(token && user);
  const isAuthenticated = hasValidToken; // More lenient - just check token validity

  const login = (token, userData) => {
    console.log('🔐 Login called with:', { token: token ? 'present' : 'missing', userData });

    // Store in localStorage first with timestamp
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('tokenTimestamp', Date.now().toString());

    // Then update state
    setToken(token);
    setUser(userData);

    console.log('🔐 Login completed, state updated');
  };

  const logout = () => {
    console.log('🔐 Logout called');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenTimestamp');
  };

  const refreshUserData = () => {
    console.log('🔐 Refreshing user data...');
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedToken.split('.').length === 3) {
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
          console.log('🔐 User data refreshed from localStorage');
          return true;
        } catch (error) {
          console.error('🔐 Error parsing stored user:', error);
        }
      }

      // Try to extract user data from token
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const placeholderUser = {
          id: payload.user_id,
          role: payload.role,
          username: payload.username || 'Unknown'
        };
        setUser(placeholderUser);
        setToken(storedToken);
        console.log('🔐 User data extracted from token');
        return true;
      } catch (error) {
        console.error('🔐 Error decoding token:', error);
        logout();
        return false;
      }
    }

    return false;
  };

  // Initialize user from localStorage on app start
  useEffect(() => {
    console.log('🔐 AuthContext initializing...');
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    console.log('🔐 Stored token:', storedToken ? 'present' : 'missing');
    console.log('🔐 Stored user:', storedUser);

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('🔐 Parsed user:', parsedUser);

        // Validate token format
        if (storedToken.split('.').length === 3) {
          setUser(parsedUser);
          setToken(storedToken);
          console.log('🔐 User and token restored from localStorage');
        } else {
          console.log('🔐 Invalid token format, clearing storage');
          logout();
        }
      } catch (error) {
        console.error('🔐 Error parsing stored user:', error);
        logout();
      }
    } else if (storedToken && !storedUser) {
      // If we have a token but no user data, try to decode it
      if (storedToken.split('.').length === 3) {
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          const placeholderUser = {
            id: payload.user_id,
            role: payload.role,
            username: 'Unknown'
          };
          setUser(placeholderUser);
          setToken(storedToken);
          console.log('🔐 User data extracted from token');
        } catch (error) {
          console.error('🔐 Error decoding token:', error);
          logout();
        }
      } else {
        console.log('🔐 Invalid token format, clearing storage');
        logout();
      }
    } else {
      console.log('🔐 No stored credentials found');
    }

    setIsInitialized(true);
    console.log('🔐 AuthContext initialization complete');
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('🔐 AuthContext state changed:', {
      user: user ? { id: user.id, role: user.role, username: user.username } : null,
      token: token ? 'present' : 'missing',
      isAuthenticated
    });
  }, [user, token, isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      refreshUserData,
      isAuthenticated,
      isAuthenticatedStrict,
      hasValidToken,
      isInitialized
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);