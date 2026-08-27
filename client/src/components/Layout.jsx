import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Container */}
      <div className="flex-1 pl-64 flex flex-col h-screen bg-slate-950 overflow-hidden">
        <Header />
        <main className="flex-1 p-6 bg-slate-950 flex flex-col min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
