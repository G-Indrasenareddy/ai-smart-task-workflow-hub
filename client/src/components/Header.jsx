import { useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';

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

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Page Title */}
      <h1 className="text-xl font-semibold text-slate-100">{title}</h1>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        <div className="h-5 w-px bg-slate-800" />

        {/* User Profile Placeholder */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-slate-300 hidden sm:inline-block">
            User Profile
          </span>
        </div>
      </div>
    </header>
  );
}
