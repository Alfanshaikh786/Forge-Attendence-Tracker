import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  Flame,
  LayoutDashboard, 
  ClipboardCheck, 
  Users, 
  BookOpen, 
  Settings as SettingsIcon, 
  LogOut,
  X,
  BarChart2,
  Calendar,
  MessageSquare,
  Bell,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const mentorLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/mentor/dashboard' },
    { name: 'Mark Attendance', icon: ClipboardCheck, path: '/mentor/attendance' },
    { name: 'Manage Students', icon: Users, path: '/mentor/students' },
    { name: 'Student History', icon: BarChart2, path: '/mentor/students-history' },
    { name: 'Bulk Import', icon: FileSpreadsheet, path: '/mentor/bulk-import' },
    { name: 'Materials', icon: BookOpen, path: '/mentor/materials' },
  ];

  const studentLinks = [
    { name: 'My Attendance', icon: BarChart2, path: '/student/dashboard' },
    { name: 'Upcoming Session', icon: Calendar, path: '/student/upcoming' },
    { name: 'Materials', icon: BookOpen, path: '/student/materials' },
  ];

  const commonLinks = [
    { name: 'Messages', icon: MessageSquare, path: '/messages' },
    { name: 'Announcements', icon: Bell, path: '/announcements' },
    { name: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  const links = user?.role === 'mentor' ? mentorLinks : studentLinks;

  const NavItem = ({ link }) => (
    <NavLink
      to={link.path}
      onClick={onClose}
      className={({ isActive }) => clsx(
        'flex items-center gap-3 px-6 py-3 transition-all duration-200 nav-item',
        isActive && 'active'
      )}
      style={({ isActive }) => isActive ? {
        background: 'rgba(108, 99, 255, 0.15)',
        borderLeft: '3px solid var(--accent-primary)',
        color: 'var(--text-primary)',
      } : {
        borderLeft: 'none',
        color: 'var(--text-secondary)',
      }}
    >
      <link.icon size={20} strokeWidth={1.75} />
      <span className="font-medium">{link.name}</span>
    </NavLink>
  );

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={clsx(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside className={clsx(
        'fixed top-0 left-0 h-screen w-60 flex flex-col z-50 transition-transform duration-300 md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{
        backgroundColor: '#0E0E16',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b" style={{ borderBottomColor: 'rgba(255, 255, 255, 0.05)' }}>
          <div className="flex items-center gap-2">
            <Flame className="logo-icon" size={28} strokeWidth={2} style={{ color: 'var(--accent-primary)' }} />
            <span className="logo-wordmark">ForgeTrack</span>
          </div>
          <button onClick={onClose} className="md:hidden p-1" style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <div className="px-6 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-secondary)' }}>
              Main Menu
            </span>
          </div>
          <div className="flex flex-col">
            {links.map((link) => (
              <NavItem key={link.path} link={link} />
            ))}
          </div>

          <div className="px-6 mt-6 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-secondary)' }}>
              Account
            </span>
          </div>
          <div className="flex flex-col">
            {commonLinks.map((link) => (
              <NavItem key={link.path} link={link} />
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t space-y-2" style={{ borderTopColor: 'rgba(255, 255, 255, 0.05)' }}>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all"
            style={{ color: '#F43F5E' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <LogOut size={20} strokeWidth={1.75} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>

          <div className="mt-4 pt-4 border-t flex items-center gap-3 px-2" style={{ borderTopColor: 'rgba(255, 255, 255, 0.05)' }}>
            <Avatar name={user?.name || 'User'} size="sm" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</span>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{user?.role}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
