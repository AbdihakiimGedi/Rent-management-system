import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000); // Increased duration for better UX
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Memoize notification styles to prevent infinite re-renders
  const notificationStyles = useMemo(() => ({
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
      border: 'border-green-200/50 dark:border-green-700/50',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      progress: 'bg-white/30'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-pink-500',
      border: 'border-red-200/50 dark:border-red-700/50',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      progress: 'bg-white/30'
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
      border: 'border-amber-200/50 dark:border-amber-700/50',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      progress: 'bg-white/30'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      border: 'border-blue-200/50 dark:border-blue-700/50',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      progress: 'bg-white/30'
    }
  }), []);

  // Memoize the notification container to prevent unnecessary re-renders
  const notificationContainer = useMemo(() => (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => {
        const styles = notificationStyles[notification.type] || notificationStyles.info;

        return (
          <div
            key={notification.id}
            className={`${styles.bg} ${styles.border} backdrop-blur-xl border rounded-2xl shadow-2xl transform transition-all duration-500 ease-out animate-in slide-in-from-right-full`}
            style={{
              animation: 'slideInRight 0.5s ease-out forwards'
            }}
          >
            {/* Notification Content */}
            <div className="p-4 text-white">
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {styles.icon}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-5">
                    {notification.message}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 ml-3 p-1 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-white/20 rounded-b-2xl overflow-hidden">
              <div
                className={`h-full ${styles.progress} transition-all duration-5000 ease-linear`}
                style={{
                  width: '100%',
                  animation: 'progressShrink 5s ease-out forwards'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  ), [notifications, notificationStyles, removeNotification]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    notifications,
    addNotification,
    removeNotification
  }), [notifications, addNotification, removeNotification]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}

      {/* Notification Container */}
      {notificationContainer}

      {/* Custom CSS Animations */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes progressShrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .slide-in-from-right-full {
          animation-name: slideInRight;
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);