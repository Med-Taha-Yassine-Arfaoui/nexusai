'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

interface ProfessionalNavbarProps {
  userEmail?: string;
  onSearch?: (query: string) => void;
}

const ProfessionalNavbar = ({ userEmail = "User", onSearch }: ProfessionalNavbarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    { id: 1, title: "BTC Alert", message: "Bitcoin crossed $68,000", time: "2m ago", type: "alert" },
    { id: 2, title: "Analysis Complete", message: "AAPL analysis ready", time: "15m ago", type: "success" },
    { id: 3, title: "Market Update", message: "S&P 500 up 1.2%", time: "1h ago", type: "info" }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <motion.nav
      className="bg-gray-900 border-b border-gray-800 px-6 py-3"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Search */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks, analysis, insights..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </form>
        </div>

        {/* Center Section - Market Status */}
        <div className="flex items-center gap-6 mx-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-500 text-sm font-medium">Market Open</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">BTC:</span>
              <span className="text-white font-medium">$67,842</span>
              <span className="text-green-500 text-xs">+2.4%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">ETH:</span>
              <span className="text-white font-medium">$3,456</span>
              <span className="text-green-500 text-xs">+1.8%</span>
            </div>
          </div>
        </div>

        {/* Right Section - User Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <div className="relative">
            <motion.button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fas fa-bell"></i>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </motion.button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <motion.div
                className="absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-white font-medium">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-gray-700 hover:bg-gray-700 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notif.type === 'alert' ? 'bg-red-500' :
                          notif.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-medium">{notif.title}</h4>
                          <p className="text-gray-400 text-xs">{notif.message}</p>
                          <span className="text-gray-500 text-xs">{notif.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-white text-sm font-medium">{userEmail}</div>
              <div className="text-gray-400 text-xs">Premium Account</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default ProfessionalNavbar;
