'use client';

import { motion } from 'framer-motion';

const features = [
  {
    icon: '📊',
    title: 'Real-time Market Data',
    description: 'Access live financial data streams and market indicators updated every second.'
  },
  {
    icon: '🤖',
    title: 'AI-Powered Analysis',
    description: 'Advanced machine learning algorithms analyze patterns and predict market movements.'
  },
  {
    icon: '📈',
    title: 'Predictive Analytics',
    description: 'Forecast financial trends with our sophisticated AI models and historical data analysis.'
  },
  {
    icon: '🔔',
    title: 'Smart Alerts',
    description: 'Receive personalized notifications for market events and investment opportunities.'
  },
  {
    icon: '📱',
    title: 'Mobile Dashboard',
    description: 'Monitor your portfolio and market data on-the-go with our responsive mobile interface.'
  },
  {
    icon: '🔒',
    title: 'Secure & Private',
    description: 'Bank-level encryption and privacy protection for all your financial data.'
  }
];

const TemplateFeatures = () => {
  return (
    <section className="py-5 bg-light">
      <div className="container">
        <motion.div
          className="text-center mb-5"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="display-5 fw-bold mb-3">Powerful Features</h2>
          <p className="lead text-muted">
            Everything you need to make informed financial decisions
          </p>
        </motion.div>

        <div className="row g-4">
          {features.map((feature, index) => (
            <div key={index} className="col-md-6 col-lg-4">
              <motion.div
                className="card h-100 border-0 shadow-sm hover-lift"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
              >
                <div className="card-body text-center p-4">
                  <div className="feature-icon mb-3">
                    <span style={{ fontSize: '3rem' }}>{feature.icon}</span>
                  </div>
                  <h4 className="card-title mb-3">{feature.title}</h4>
                  <p className="card-text text-muted">{feature.description}</p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TemplateFeatures;
