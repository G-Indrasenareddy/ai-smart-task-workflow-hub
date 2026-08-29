import { useLocation } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const routeTitles = {
  '/': 'Dashboard',
  '/goals': 'Goals',
  '/tasks': 'Tasks',
  '/ai-assistant': 'AI Assistant',
  '/settings': 'Settings',
};

export default function Header() {
  const location = useLocation();
  const title = routeTitles[location.pathname] || 'Dashboard';
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Page Title */}
      <h1 className="text-xl font-semibold text-slate-100">{title}</h1>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell Dropdown */}
        <NotificationDropdown />

        <div className="h-5 w-px bg-slate-800" />

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <span className="text-sm font-medium text-slate-200 hidden sm:inline-block">
            {user?.name || 'User Profile'}
          </span>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={logout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
