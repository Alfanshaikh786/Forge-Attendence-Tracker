import React, { useState, useEffect } from 'react';
import { Menu, Bell, Check, User as UserIcon, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

export const Topbar = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (user?.role === 'student') {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('attendance')) return 'Attendance';
    if (path.includes('students')) return 'Student History';
    if (path.includes('upload')) return 'CSV Upload';
    if (path.includes('materials')) return 'Materials Library';
    if (path.includes('upcoming')) return 'Upcoming Session';
    return 'ForgeTrack';
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-10 backdrop-blur-md sticky top-0 z-30 page-header" style={{
      borderBottomColor: 'rgba(255, 255, 255, 0.05)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      backgroundColor: 'rgba(17, 17, 24, 0.5)',
    }}>
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md transition-all"
          style={{
            color: 'var(--text-secondary)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
        
        <h1 className="text-lg font-semibold md:text-xl" style={{
          fontFamily: "'Space Grotesk', sans-serif",
          color: 'var(--text-primary)',
        }}>
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={clsx(
              "p-2 rounded-md transition-all relative",
              showNotifications ? "bg-accent/10 text-accent" : "bg-white/5 text-fg-tertiary hover:text-fg-primary"
            )}
          >
            <Bell size={20} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-void bg-accent" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-raised border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in origin-top-right">
              <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface">
                <h3 className="text-sm font-bold text-fg-primary">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-accent hover:underline uppercase tracking-widest">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div 
                      key={n._id} 
                      className={clsx(
                        "p-4 border-b border-border-subtle last:border-0 hover:bg-surface transition-colors cursor-pointer relative",
                        !n.isRead && "bg-accent/5"
                      )}
                      onClick={() => {
                        handleMarkRead(n._id);
                        if (n.link) navigate(n.link);
                        setShowNotifications(false);
                      }}
                    >
                      {!n.isRead && <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent" />}
                      <h4 className={clsx("text-xs font-bold mb-0.5", n.isRead ? "text-fg-secondary" : "text-fg-primary")}>{n.title}</h4>
                      <p className="text-[11px] text-fg-tertiary leading-relaxed">{n.message}</p>
                      <span className="text-[9px] text-fg-tertiary font-mono mt-2 block opacity-60">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <Bell size={32} className="mx-auto text-fg-tertiary opacity-20 mb-3" />
                    <p className="text-xs text-fg-tertiary italic">No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative ml-1">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-full border border-border-subtle bg-surface-raised/50 hover:border-accent/50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden border border-accent/20">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-accent">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-raised border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in origin-top-right">
              <div className="p-4 bg-surface border-b border-border-subtle">
                <p className="text-sm font-bold text-fg-primary truncate">{user?.name}</p>
                <p className="text-[10px] text-fg-tertiary truncate uppercase tracking-widest font-mono mt-0.5">{user?.role}</p>
              </div>
              <div className="p-1">
                <button 
                  onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-fg-secondary hover:text-fg-primary hover:bg-surface rounded-md transition-all"
                >
                  <SettingsIcon size={16} />
                  Settings
                </button>
                <div className="h-px bg-border-subtle my-1 mx-2" />
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-md transition-all"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
