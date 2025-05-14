"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Header from './Header';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';
import { SearchProvider } from '@/context/SearchContext';
import GlobalSearchModal from './GlobalSearchModal';

type AppLayoutProps = {
  children: React.ReactNode;
};

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { status } = useSession();
  const pathname = usePathname();
  
  // Close sidebar when path changes (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Don't show sidebar on login/auth pages
  const isAuthPage = pathname.startsWith('/auth');

  if (isAuthPage || status === 'unauthenticated') {
    return <>{children}</>;
  }

  return (
    <SearchProvider>
      <div className="flex h-screen bg-gray-900">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black bg-opacity-70 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Mobile sidebar */}
        <div className={`fixed inset-y-0 left-0 z-30 w-64 transition duration-300 transform bg-gray-950 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Global Search Modal */}
          <GlobalSearchModal />
          <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 overflow-y-auto bg-gray-900 p-4 md:p-6 text-gray-200">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SearchProvider>
  );
};

export default AppLayout;
