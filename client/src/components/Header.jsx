import { useLocation, Link } from 'react-router-dom';
import { User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const routeTitles = {
  '/': 'Dashboard',
  '/goals': 'Goals',
  '/tasks': 'Tasks',
  '/ai-assistant': 'AI Assistant',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

export default function Header({ onToggleMobileMenu }) {
  const location = useLocation();
  const title = routeTitles[location.pathname] || 'Dashboard';
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 w-full max-w-full shrink-0 overflow-x-hidden">
      {/* Left Area: Hamburger button on Mobile + Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg md:hidden transition-colors cursor-pointer shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <h1 className="text-base sm:text-xl font-semibold text-slate-100 truncate">{title}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
        {/* Notification Bell Dropdown */}
        <NotificationDropdown />

        <div className="h-4 sm:h-5 w-px bg-slate-800" />

        {/* User Profile Navigation */}
        <Link
          to="/profile"
          className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
          title="View Profile"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold text-xs group-hover:border-indigo-400 transition-colors shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <span className="text-sm font-medium text-slate-200 hidden sm:inline-block group-hover:text-white transition-colors max-w-[120px] truncate">
            {user?.name || 'User Profile'}
          </span>
        </Link>

        {/* Logout Button */}
        <button
          type="button"
          onClick={logout}
          title="Sign out"
          className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
}
