import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { notificationApi } from '../../api/notificationApi';
import Button from '../../components/Button';

const NotificationCenter = () => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    fetchNotifications();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Poll every 30 seconds

    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentPage, filter]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getNotifications({
        page: currentPage,
        filter: filter === 'all' ? undefined : filter,
        limit: itemsPerPage
      });

      setNotifications(response.data.notifications || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (error) {
      addNotification('Error fetching notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      addNotification('Notification marked as read', 'success');
    } catch (error) {
      addNotification('Error marking notification as read', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifications.map(n => notificationApi.markAsRead(n.id)));

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true, read_at: new Date().toISOString() }))
      );

      addNotification('All notifications marked as read', 'success');
    } catch (error) {
      addNotification('Error marking notifications as read', 'error');
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      addNotification('Notification deleted', 'success');
    } catch (error) {
      addNotification('Error deleting notification', 'error');
    }
  };

  const getNotificationIcon = (type) => {
    const iconConfig = {
      info: (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      success: (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      booking: (
        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      payment: (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      complaint: (
        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    };

    return iconConfig[type] || iconConfig.info;
  };

  const getNotificationBadge = (type) => {
    const badgeConfig = {
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      booking: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
      payment: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      complaint: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
    };

    return badgeConfig[type] || badgeConfig.info;
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and data
    if (notification.related_type === 'booking' && notification.related_id) {
      navigate(`/bookings/${notification.related_id}`);
    } else if (notification.related_type === 'payment' && notification.related_id) {
      navigate(`/payments/${notification.related_id}`);
    } else if (notification.related_type === 'complaint' && notification.related_id) {
      navigate(`/complaints/${notification.related_id}`);
    } else if (notification.related_type === 'rental_item' && notification.related_id) {
      navigate(`/owner/rental-items/${notification.related_id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Stay updated with system notifications and alerts
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 text-sm font-medium rounded-full">
                {unreadCount} unread
              </span>
            )}
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="secondary"
                size="sm"
              >
                Mark All as Read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <Button
              onClick={() => handleFilterChange('all')}
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
            >
              All ({notifications.length})
            </Button>
            <Button
              onClick={() => handleFilterChange('unread')}
              variant={filter === 'unread' ? 'primary' : 'secondary'}
              size="sm"
            >
              Unread ({unreadCount})
            </Button>
            <Button
              onClick={() => handleFilterChange('read')}
              variant={filter === 'read' ? 'primary' : 'secondary'}
              size="sm"
            >
              Read ({notifications.length - unreadCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5a2.5 2.5 0 01-2.5-2.5V9a2.5 2.5 0 012.5-2.5h1.5a2.5 2.5 0 012.5-2.5h7a2.5 2.5 0 012.5 2.5v1.5a2.5 2.5 0 002.5 2.5h1.5a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5h-1.5a2.5 2.5 0 01-2.5-2.5v-1.5a2.5 2.5 0 00-2.5-2.5h-7a2.5 2.5 0 00-2.5 2.5v1.5a2.5 2.5 0 01-2.5 2.5h-1.5z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No notifications</p>
            <p className="text-gray-400 dark:text-gray-500">
              {filter === 'all' ? 'You\'re all caught up!' :
                filter === 'unread' ? 'No unread notifications' : 'No read notifications'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getNotificationBadge(notification.type)}`}>
                          {notification.type}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          variant="danger"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {notification.message}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-3">
                      {!notification.read && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          variant="secondary"
                          size="sm"
                        >
                          Mark as Read
                        </Button>
                      )}

                      {notification.related_type && notification.related_id && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notification);
                          }}
                          variant="primary"
                          size="sm"
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;