'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardSearch from './DashboardSearch';

interface StockData {
  id: number;
  codeisin?: string;
  mnemo?: string;
  last_trade_price?: number;
  quantity?: number;
  var_prev_close?: number;
  time?: string;
  ingested_at?: string;
}

interface MarketResponse {
  stocks: StockData[];
  gainers: StockData[];
  losers: StockData[];
  active: StockData[];
  sectors: any[];
}

const RealStockDashboard = () => {
  const [marketData, setMarketData] = useState<MarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/market', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMarketData(data);
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const formatPrice = (price?: number) => {
    return price ? `$${price.toFixed(2)}` : 'N/A';
  };

  const formatChange = (change?: number) => {
    if (!change) return { text: 'N/A', color: 'text-gray-400', arrow: '' };
    const isPositive = change > 0;
    return {
      text: `${isPositive ? '+' : ''}${change.toFixed(2)}%`,
      color: isPositive ? 'text-green-500' : 'text-red-500',
      arrow: isPositive ? 'fa-arrow-up' : 'fa-arrow-down'
    };
  };

  const formatVolume = (quantity?: number, price?: number) => {
    if (!quantity || !price) return 'N/A';
    const volume = quantity * price;
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const StockTable = ({ stocks, title }: { stocks: StockData[], title: string }) => (
    <motion.div
      className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Symbol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Change</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {stocks.map((stock, index) => {
              const change = formatChange(stock.var_prev_close);
              return (
                <motion.tr
                  key={stock.id}
                  className="hover:bg-gray-700 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                        {stock.mnemo?.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{stock.mnemo || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">
                    {formatPrice(stock.last_trade_price)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <i className={`fas ${change.arrow} ${change.color} text-xs mr-2`}></i>
                      <span className={`font-medium ${change.color}`}>{change.text}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {formatVolume(stock.quantity, stock.last_trade_price)}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <i className="fas fa-spinner fa-spin text-blue-500 text-3xl mr-3"></i>
        <span className="text-gray-400 text-lg">Loading market data...</span>
      </div>
    );
  }

  if (!marketData) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-exclamation-triangle text-yellow-500 text-3xl mb-3"></i>
        <p className="text-gray-400">Failed to load market data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Stock Market Watch</h1>
            <p className="text-gray-400">Real-time stock data from your database</p>
          </div>
          
          <DashboardSearch 
            onSearch={handleSearch}
            placeholder="Search stocks by symbol..."
            className="w-96"
          />
        </div>
      </motion.div>

      {/* Market Overview */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Stocks</span>
            <i className="fas fa-chart-line text-blue-400"></i>
          </div>
          <div className="text-2xl font-bold text-white">{marketData.stocks.length}</div>
          <div className="text-gray-400 text-sm mt-1">Active symbols</div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Top Gainer</span>
            <i className="fas fa-arrow-up text-green-400"></i>
          </div>
          <div className="text-xl font-bold text-white">
            {marketData.gainers[0]?.mnemo || 'N/A'}
          </div>
          <div className="text-green-500 text-sm mt-1">
            {formatChange(marketData.gainers[0]?.var_prev_close).text}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Top Loser</span>
            <i className="fas fa-arrow-down text-red-400"></i>
          </div>
          <div className="text-xl font-bold text-white">
            {marketData.losers[0]?.mnemo || 'N/A'}
          </div>
          <div className="text-red-500 text-sm mt-1">
            {formatChange(marketData.losers[0]?.var_prev_close).text}
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        className="flex items-center gap-2 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {[
          { id: 'all', label: 'All Stocks', data: marketData.stocks },
          { id: 'gainers', label: 'Top Gainers', data: marketData.gainers },
          { id: 'losers', label: 'Top Losers', data: marketData.losers },
          { id: 'active', label: 'Most Active', data: marketData.active }
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.label} ({tab.data.length})
          </motion.button>
        ))}
      </motion.div>

      {/* Stock Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedTab === 'all' && <StockTable stocks={marketData.stocks.slice(0, 10)} title="All Stocks" />}
        {selectedTab === 'gainers' && <StockTable stocks={marketData.gainers} title="Top Gainers" />}
        {selectedTab === 'losers' && <StockTable stocks={marketData.losers} title="Top Losers" />}
        {selectedTab === 'active' && <StockTable stocks={marketData.active} title="Most Active" />}
        
        {/* Show additional data */}
        {selectedTab === 'gainers' && marketData.losers.length > 0 && 
          <StockTable stocks={marketData.losers.slice(0, 5)} title="Also: Top Losers" />}
        {selectedTab === 'losers' && marketData.gainers.length > 0 && 
          <StockTable stocks={marketData.gainers.slice(0, 5)} title="Also: Top Gainers" />}
        {selectedTab === 'active' && marketData.gainers.length > 0 && 
          <StockTable stocks={marketData.gainers.slice(0, 5)} title="Also: Top Gainers" />}
      </div>
    </div>
  );
};

export default RealStockDashboard;
