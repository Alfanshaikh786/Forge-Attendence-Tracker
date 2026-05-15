import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/api';
import toast from 'react-hot-toast';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { notifications: data } = await getNotifications();
      setNotifications(data || []);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refresh every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'success': return 'bg-success/20 text-success';
      case 'warning': return 'bg-warning/20 text-warning';
      case 'danger': return 'bg-danger/20 text-danger';
      default: return 'bg-accent/20 text-accent';
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'danger': return '✕';
      default: return 'ℹ';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-surface-raised rounded-lg transition-colors group"
        title="Notifications"
      >
        <Bell size={20} className="text-fg-secondary group-hover:text-fg-primary transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-surface-raised border border-border-default rounded-xl shadow-2xl z-50 max-h-[600px] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-surface-inset rounded-t-xl">
              <div>
                <h3 className="font-bold text-fg-primary text-lg">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-fg-tertiary mt-1">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs px-2 py-1 rounded text-accent hover:bg-accent/10 transition-colors font-medium"
                    title="Mark all as read"
                  >
                    <CheckCheck size={16} className="inline mr-1" />
                    All read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-fg-tertiary hover:text-fg-primary transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={40} className="mx-auto mb-3 text-fg-tertiary opacity-20" />
                  <p className="text-fg-secondary text-sm">No notifications yet</p>
                  <p className="text-fg-tertiary text-xs mt-2">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-surface-inset transition-colors ${
                        !notification.isRead ? 'bg-accent/5' : ''
                      }`}
                      onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getStatusColor(notification.type)}`}>
                          {getStatusIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-fg-primary text-sm">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="flex-shrink-0 w-2 h-2 bg-accent rounded-full mt-2 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-fg-secondary mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-fg-tertiary">
                              {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification._id);
                                }}
                                className="text-accent hover:bg-accent/10 rounded p-1 transition-colors"
                                title="Mark as read"
                              >
                                <Check size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-border-subtle bg-surface-inset rounded-b-xl text-center">
                <a 
                  href="/notifications" 
                  className="text-xs text-accent hover:underline font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationCenter;
