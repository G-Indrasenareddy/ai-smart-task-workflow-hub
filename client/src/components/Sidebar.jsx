import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Target, CheckSquare, Bot, Settings, X } from 'lucide-react';
import flowmindLogo from '../assets/flowmind-logo.png';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Goals', path: '/goals', icon: Target },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'AI Assistant', path: '/ai-assistant', icon: Bot },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const handleNavClick = () => {
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 max-w-[80vw] md:max-w-none md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300 transition-all duration-300 ease-in-out md:translate-x-0 ${
          isOpen
            ? 'translate-x-0 opacity-100 visible pointer-events-auto shadow-2xl'
            : '-translate-x-full opacity-0 invisible pointer-events-none md:opacity-100 md:visible md:pointer-events-auto md:translate-x-0'
        }`}
      >
        {/* Clickable Brand Header */}
        <div className="relative">
          <Link
            to="/"
            onClick={handleNavClick}
            className="h-28 px-2 flex items-center justify-center border-b border-slate-800 hover:bg-slate-800/50 transition-colors group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 overflow-hidden shrink-0"
            title="FlowMind AI Dashboard"
            aria-label="FlowMind AI Dashboard"
          >
            <div className="w-full h-full flex items-center justify-center overflow-hidden p-0.5">
              <img
                src={flowmindLogo}
                alt="FlowMind AI - Think Plan Achieve"
                className="w-full h-auto max-h-24 object-contain scale-130 group-hover:scale-135 transition-transform drop-shadow-md"
              />
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-200 md:hidden bg-slate-800/80 rounded-lg cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          FlowMind AI v1.0
        </div>
      </aside>
    </>
  );
}
