import React from 'react';
import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';

const Toast = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);

  return (
    <div className="fixed top-0 right-0 p-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`mb-2 p-3 rounded shadow-lg transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-white">{notification.message}</span>
            <button
              className="text-white font-bold"
              onClick={() => removeNotification(notification.id)}
            >
              &times;
            </button> 
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toast;