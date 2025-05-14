"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FaTicketAlt, FaUsers, FaHome, FaChartBar, FaFileAlt, FaCog } from 'react-icons/fa';

const Sidebar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: <FaHome className="w-5 h-5" /> },
    { name: 'Tickets', href: '/tickets', icon: <FaTicketAlt className="w-5 h-5" /> },
    { name: 'Reports', href: '/reports', icon: <FaChartBar className="w-5 h-5" /> },
    { name: 'Documents', href: '/documents', icon: <FaFileAlt className="w-5 h-5" /> },
  ];

  // Admin only menu items
  const adminItems = [
    { name: 'Users', href: '/users', icon: <FaUsers className="w-5 h-5" /> },
    { name: 'Settings', href: '/settings', icon: <FaCog className="w-5 h-5" /> },
  ];

  return (
    <div className="h-full bg-gray-950 border-r border-gray-800 w-64 flex-shrink-0 hidden md:block">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center">
          <div className="bg-blue-700 text-white p-2 rounded mr-2">
            <FaTicketAlt className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold text-gray-100">RGV911 Tickets</h1>
        </div>
      </div>
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-base leading-6 font-medium rounded-md ${pathname === item.href ? 'text-blue-400 bg-gray-800' : 'text-gray-300 hover:text-blue-300 hover:bg-gray-800'}`}
            >
              <div className={`mr-4 ${pathname === item.href ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-300'}`}>
                {item.icon}
              </div>
              {item.name}
            </Link>
          ))}
        </div>
        
        {isAdmin && (
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Admin
            </h3>
            <div className="mt-1 space-y-1">
              {adminItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-base leading-6 font-medium rounded-md ${pathname === item.href ? 'text-blue-400 bg-gray-800' : 'text-gray-300 hover:text-blue-300 hover:bg-gray-800'}`}
                >
                  <div className={`mr-4 ${pathname === item.href ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-300'}`}>
                    {item.icon}
                  </div>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
