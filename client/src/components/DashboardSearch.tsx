'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface DashboardSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const DashboardSearch = ({ onSearch, placeholder = "Search stocks, analysis, or insights...", className = "" }: DashboardSearchProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <motion.i 
              className="fas fa-search text-gray-400"
              animate={{ scale: isFocused ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            />
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={`
              w-full pl-12 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-xl
              text-white placeholder-gray-400 focus:outline-none focus:border-blue-500
              focus:bg-gray-750 transition-all duration-200
              ${isFocused ? 'ring-2 ring-blue-500/20' : ''}
            `}
          />

          {/* Clear Button */}
          {query && (
            <motion.button
              type="button"
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <i className="fas fa-times text-gray-400 hover:text-white transition-colors"></i>
            </motion.button>
          )}

          {/* Search Button */}
          <motion.button
            type="submit"
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className="fas fa-arrow-right text-blue-400 hover:text-blue-300 transition-colors"></i>
          </motion.button>
        </div>

        {/* Search Suggestions Dropdown */}
        {isFocused && query && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="p-2">
              <div className="text-sm text-gray-400 px-3 py-2">Recent searches</div>
              {/* Add recent search items here */}
              <div className="px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded cursor-pointer">
                AAPL - Apple Inc.
              </div>
              <div className="px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded cursor-pointer">
                TSLA - Tesla Inc.
              </div>
            </div>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
};

export default DashboardSearch;
