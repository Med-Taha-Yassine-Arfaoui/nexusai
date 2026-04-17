'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

interface MenuItem {
  name: string;
  path: string;
  icon: string;
  badge?: string;
  active?: boolean;
}

const ProfessionalSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems: MenuItem[] = [
    { 
      name: "Dashboard", 
      path: "/", 
      icon: "fas fa-th-large",
      active: pathname === "/"
    },
    { 
      name: "Market Watch", 
      path: "/finance", 
      icon: "fas fa-chart-line",
      badge: "Live",
      active: pathname === "/finance"
    },
    { 
      name: "AI Analysis", 
      path: "/analysis", 
      icon: "fas fa-brain",
      active: pathname === "/analysis"
    },
    { 
      name: "Alerts", 
      path: "/alerts", 
      icon: "fas fa-bell",
      badge: "3",
      active: pathname === "/alerts"
    },
    { 
      name: "Capital Flow", 
      path: "/capital-flow", 
      icon: "fas fa-exchange-alt",
      active: pathname === "/capital-flow"
    },
    { 
      name: "Research", 
      path: "/agents", 
      icon: "fas fa-microscope",
      active: pathname === "/agents"
    },
    { 
      name: "AI Chat", 
      path: "/chat", 
      icon: "fas fa-comments",
      badge: "New",
      active: pathname === "/chat"
    },
    { 
      name: "Account", 
      path: "/account", 
      icon: "fas fa-user-circle",
      active: pathname === "/account"
    }
  ];

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // Implement search functionality
  };

  return (
    <motion.aside
      className={`
        bg-gray-900 border-r border-gray-800 h-screen fixed left-0 top-0 z-40
        ${collapsed ? 'w-20' : 'w-72'}
        transition-all duration-300 ease-in-out
      `}
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <motion.div
            className={`
              flex items-center gap-3 transition-all duration-300
              ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}
            `}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-bolt text-white"></i>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">NEXUS</h1>
              <p className="text-gray-400 text-xs">AI Terminal</p>
            </div>
          </motion.div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
          >
            <i className={`fas ${collapsed ? 'fa-angle-right' : 'fa-angle-left'}`}></i>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {!collapsed && (
        <motion.div
          className="p-4 border-b border-gray-800"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search markets, assets, analysis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.div key={item.path} custom={index}>
              <Link
                href={item.path}
                className={`
                  relative flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                  ${item.active 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <div className="relative">
                  <i className={`${item.icon} ${collapsed ? 'text-lg' : 'text-base'}`}></i>
                  {item.badge && !collapsed && (
                    <motion.span
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </div>

                {!collapsed && (
                  <motion.span
                    className="flex-1 text-sm font-medium"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    {item.name}
                  </motion.span>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Market Status */}
        {!collapsed && (
          <motion.div
            className="mt-6 p-4 bg-gray-800 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Market Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-500 text-xs">Open</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">BTC</span>
                <span className="text-white ml-1">$67,842</span>
              </div>
              <div>
                <span className="text-gray-400">ETH</span>
                <span className="text-white ml-1">$3,456</span>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <motion.button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("userEmail");
            window.location.href = "/login";
          }}
          className={`
            w-full flex items-center gap-3 p-3 bg-red-600 hover:bg-red-700 
            text-white rounded-lg transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <i className="fas fa-sign-out-alt"></i>
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
};

export default ProfessionalSidebar;
