import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export const AppShell = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen text-fg-primary flex overflow-x-hidden" style={{
      backgroundColor: 'var(--primary-bg)',
      color: 'var(--text-primary)',
    }}>
      {/* Aurora Glow - Global single instance */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[300px] pointer-events-none z-0" style={{
        background: 'radial-gradient(ellipse 600px 300px at 50% -60px, rgba(108,99,255,0.25), transparent 70%)',
      }} />
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-60">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 relative z-10 p-4 md:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
