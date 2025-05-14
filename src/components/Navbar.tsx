"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { FaSearch } from 'react-icons/fa';
import { useSearch } from '@/context/SearchContext';

const Navbar = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const { openSearch } = useSearch();
  
  return (
    <>
      <nav className="bg-gray-800 text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Left side - Logo and navigation */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold">
                GIS Ticket App
              </Link>
              
              {isAuthenticated && (
                <div className="hidden md:flex space-x-4">
                  <Link 
                    href="/tickets" 
                    className={`hover:text-gray-300 ${pathname.startsWith('/tickets') ? 'text-blue-400' : ''}`}
                  >
                    Tickets
                  </Link>
                  
                  {session?.user?.role === 'admin' && (
                    <Link 
                      href="/users" 
                      className={`hover:text-gray-300 ${pathname.startsWith('/users') ? 'text-blue-400' : ''}`}
                    >
                      Users
                    </Link>
                  )}
                </div>
              )}
            </div>
            
            {/* Right side - Search and user actions */}
            <div className="flex items-center space-x-4">
              {/* Search button */}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    console.log('Search button clicked');
                    openSearch();
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm flex items-center mr-2"
                >
                  <FaSearch className="mr-2" />
                  <span className="hidden md:inline">Search...</span>
                </button>
              )}
              
              {/* User menu */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="hidden md:inline">
                    {session?.user?.name || 'User'}
                  </span>
                  <button 
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link 
                    href="/auth/login" 
                    className={`hover:text-gray-300 px-3 py-1 rounded-md text-sm ${pathname === '/auth/login' ? 'bg-blue-600' : 'bg-blue-500'}`}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className={`hover:text-gray-300 px-3 py-1 rounded-md text-sm ${pathname === '/auth/register' ? 'bg-green-600' : 'bg-green-500'}`}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Global search is now handled by the GlobalSearchModal component */}
    </>
  );
};

export default Navbar;
