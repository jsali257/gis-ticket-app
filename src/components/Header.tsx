"use client";

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { FaBell, FaSearch, FaUserCircle, FaBars } from 'react-icons/fa';

type HeaderProps = {
  toggleSidebar: () => void;
};

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  
  return (
    <header className="bg-gray-950 text-white shadow-md sticky top-0 z-10 border-b border-gray-800">
      <div className="flex justify-between items-center py-3 px-4">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="mr-4 text-white md:hidden"
            aria-label="Toggle sidebar"
          >
            <FaBars className="h-6 w-6" />
          </button>
          <div className="flex items-center md:hidden">
            <h1 className="text-xl font-bold">RGV911 Tickets</h1>
          </div>
        </div>
        
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-blue-300" />
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
              placeholder="Search tickets..."
              type="search"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-white hover:text-blue-200">
            <FaBell className="h-6 w-6" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 text-white hover:text-blue-200 focus:outline-none"
            >
              <FaUserCircle className="h-8 w-8" />
              <span className="hidden md:block">{session?.user?.name || 'User'}</span>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <Link 
                  href="/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowDropdown(false)}
                >
                  Your Profile
                </Link>
                <Link 
                  href="/settings" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowDropdown(false)}
                >
                  Settings
                </Link>
                <button 
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
