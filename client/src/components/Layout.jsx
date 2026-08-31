import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-x-hidden w-full max-w-full relative">
      {/* Sidebar with Mobile Drawer support */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Container */}
      <div className="flex-1 md:pl-64 pl-0 flex flex-col min-h-screen bg-slate-950 overflow-x-hidden min-w-0 w-full max-w-full">
        <Header onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 p-3 sm:p-6 bg-slate-950 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden w-full max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
