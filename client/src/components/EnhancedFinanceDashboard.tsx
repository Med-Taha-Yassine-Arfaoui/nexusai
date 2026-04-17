'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardSearch from './DashboardSearch';

interface Stock {
  id: number;
  mnemo: string;
  last_trade_price: number;
  quantity: number;
  var_prev_close: number;
}

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  high24h: number;
  low24h: number;
}

const EnhancedFinanceDashboard = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const timeframes = ['1H', '4H', '1D', '1W', '1M'];
  
  const mockData: MarketData[] = [
    { symbol: 'BTC/USD', price: 67842.50, change: 1523.30, changePercent: 2.30, volume: '28.5B', marketCap: '1.32T', high24h: 68923.10, low24h: 66189.40 },
    { symbol: 'ETH/USD', price: 3456.78, change: 45.92, changePercent: 1.35, volume: '12.3B', marketCap: '415.8B', high24h: 3512.90, low24h: 3398.20 },
    { symbol: 'AAPL', price: 189.25, change: 2.45, changePercent: 1.31, volume: '52.3M', marketCap: '2.95T', high24h: 191.80, low24h: 187.90 },
    { symbol: 'TSLA', price: 245.67, change: -3.21, changePercent: -1.29, volume: '98.7M', marketCap: '780.5B', high24h: 251.30, low24h: 243.80 },
    { symbol: 'GOOGL', price: 142.89, change: 0.95, changePercent: 0.67, volume: '28.1M', marketCap: '1.82T', high24h: 144.20, low24h: 141.30 },
    { symbol: 'MSFT', price: 378.45, change: 4.12, changePercent: 1.10, volume: '31.4M', marketCap: '2.81T', high24h: 381.20, low24h: 375.60 }
  ];

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setMarketData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
  };

  const filteredData = marketData.filter(item =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Market Watch</h1>
            <p className="text-gray-400">Real-time market data and analysis</p>
          </div>
          
          <DashboardSearch 
            onSearch={handleSearch}
            placeholder="Search markets, stocks, crypto..."
            className="w-96"
          />
        </div>
      </motion.div>

      {/* Market Overview Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Market Cap</span>
            <i className="fas fa-chart-pie text-blue-400"></i>
          </div>
          <div className="text-2xl font-bold text-white">$2.45T</div>
          <div className="flex items-center mt-2">
            <i className="fas fa-arrow-up text-green-500 text-xs mr-1"></i>
            <span className="text-green-500 text-sm">+3.2%</span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">24h Volume</span>
            <i className="fas fa-chart-bar text-green-400"></i>
          </div>
          <div className="text-2xl font-bold text-white">$89.3B</div>
          <div className="flex items-center mt-2">
            <i className="fas fa-arrow-up text-green-500 text-xs mr-1"></i>
            <span className="text-green-500 text-sm">+12.5%</span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Pairs</span>
            <i className="fas fa-exchange-alt text-purple-400"></i>
          </div>
          <div className="text-2xl font-bold text-white">1,247</div>
          <div className="flex items-center mt-2">
            <i className="fas fa-arrow-up text-green-500 text-xs mr-1"></i>
            <span className="text-green-500 text-sm">+5.8%</span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Dominance</span>
            <i className="fas fa-crown text-yellow-400"></i>
          </div>
          <div className="text-2xl font-bold text-white">52.3%</div>
          <div className="flex items-center mt-2">
            <i className="fas fa-arrow-down text-red-500 text-xs mr-1"></i>
            <span className="text-red-500 text-sm">-0.8%</span>
          </div>
        </div>
      </motion.div>

      {/* Timeframe Selector */}
      <motion.div
        className="flex items-center gap-2 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {timeframes.map((timeframe) => (
          <motion.button
            key={timeframe}
            onClick={() => setSelectedTimeframe(timeframe)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTimeframe === timeframe
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {timeframe}
          </motion.button>
        ))}
      </motion.div>

      {/* Market Data Table */}
      <motion.div
        className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">24h Change</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Volume</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Market Cap</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">24h Range</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin text-blue-500 text-2xl mr-3"></i>
                      <span className="text-gray-400">Loading market data...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <motion.tr
                    key={item.symbol}
                    className="hover:bg-gray-700 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                          {item.symbol.substring(0, 2)}
                        </div>
                        <span className="text-white font-medium">{item.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white font-medium">${item.price.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <i className={`fas fa-arrow-${item.change >= 0 ? 'up' : 'down'} text-${
                          item.change >= 0 ? 'green' : 'red'
                        }-500 text-xs mr-2`}></i>
                        <span className={`font-medium ${
                          item.change >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-300">{item.volume}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-300">{item.marketCap}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="text-gray-400">${item.low24h.toLocaleString()}</span>
                        <span className="text-gray-600 mx-2">-</span>
                        <span className="text-gray-400">${item.high24h.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <motion.button
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Trade
                        </motion.button>
                        <motion.button
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <i className="fas fa-chart-line"></i>
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedFinanceDashboard;
