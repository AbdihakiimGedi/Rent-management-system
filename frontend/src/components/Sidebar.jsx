import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar = ({ onCollapseChange }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapseChange) {
      onCollapseChange(newCollapsedState);
    }
  };

  // Prevent sidebar from moving during scroll
  React.useEffect(() => {
    const handleScroll = () => {
      // Force sidebar to stay in place
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar) {
        sidebar.style.transform = 'translateZ(0)';
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = {
    admin: [
      { name: 'Dashboard', href: '/admin', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: 'Users', href: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
      { name: 'Owners', href: '/admin/owners', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { name: 'Categories', href: '/admin/categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
      { name: 'Owner Requests', href: '/admin/owner-requests', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      { name: 'Owner Requirements', href: '/admin/owner-requirements', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { name: 'Complaints', href: '/complaints', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' },
      { name: 'Payments', href: '/admin/payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
      { name: 'Reports', href: '/admin/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { name: 'Notifications', href: '/notifications', icon: 'M15 17h5l-5 5v-5zM4.5 19.5a2.5 2.5 0 01-2.5-2.5V9a2.5 2.5 0 012.5-2.5h1.5a2.5 2.5 0 012.5-2.5h7a2.5 2.5 0 012.5 2.5v1.5a2.5 2.5 0 002.5 2.5h1.5a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5h-1.5a2.5 2.5 0 01-2.5-2.5v-1.5a2.5 2.5 0 00-2.5-2.5h-7a2.5 2.5 0 00-2.5 2.5v1.5a2.5 2.5 0 01-2.5 2.5h-1.5z' }
    ],
    owner: [
      { name: 'Dashboard', href: '/owner', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: 'Rental Items', href: '/owner/rental-items', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { name: 'Bookings', href: '/bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: 'Complaints', href: '/complaints', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' },
      { name: 'Payments', href: '/payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
      { name: 'Notifications', href: '/notifications', icon: 'M15 17h5l-5 5v-5zM4.5 19.5a2.5 2.5 0 01-2.5-2.5V9a2.5 2.5 0 012.5-2.5h1.5a2.5 2.5 0 012.5-2.5h7a2.5 2.5 0 012.5 2.5v1.5a2.5 2.5 0 002.5 2.5h1.5a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5h-1.5a2.5 2.5 0 01-2.5-2.5v-1.5a2.5 2.5 0 00-2.5-2.5h-7a2.5 2.5 0 00-2.5 2.5v1.5a2.5 2.5 0 01-2.5 2.5h-1.5z' }
    ],
    user: [
      { name: 'Dashboard', href: '/dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: 'Bookings', href: '/bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: 'Complaints', href: '/complaints', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' },
      { name: 'Payments', href: '/payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
      { name: 'Notifications', href: '/notifications', icon: 'M15 17h5l-5 5v-5zM4.5 19.5a2.5 2.5 0 01-2.5-2.5V9a2.5 2.5 0 012.5-2.5h1.5a2.5 2.5 0 012.5-2.5h7a2.5 2.5 0 012.5 2.5v1.5a2.5 2.5 0 002.5 2.5h1.5a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5h-1.5a2.5 2.5 0 01-2.5-2.5v-1.5a2.5 2.5 0 00-2.5-2.5h-7a2.5 2.5 0 00-2.5 2.5v1.5a2.5 2.5 0 01-2.5 2.5h-1.5z' },
      { name: 'Become Owner', href: '/owner/request', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' }
    ]
  };

  const currentNavigation = navigationItems[user?.role] || navigationItems.user;

  return (
    <div
      data-sidebar
      className={`fixed left-0 top-16 h-screen bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 z-40 ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Toggle Button */}
      <div className="flex justify-end p-3">
        <button
          onClick={handleCollapseToggle}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="px-3 pb-4">
        <ul className="space-y-1">
          {currentNavigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/admin' && item.href !== '/owner' && item.href !== '/dashboard' &&
                location.pathname.startsWith(item.href));

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive
                    ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {!isCollapsed && (
                    <span className="ml-3 font-medium flex items-center">
                      {item.name}
                      {item.name === 'Complaints' && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                          Soon
                        </span>
                      )}
                      {item.name === 'Notifications' && (
                        <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">
                          Soon
                        </span>
                      )}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;