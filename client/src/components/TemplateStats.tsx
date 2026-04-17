'use client';

import { motion } from 'framer-motion';

const stats = [
  { number: '$2.5M', label: 'Assets Analyzed', icon: 'fa-dollar-sign' },
  { number: '15K', label: 'Active Users', icon: 'fa-users' },
  { number: '98.5%', label: 'Accuracy Rate', icon: 'fa-chart-line' },
  { number: '24/7', label: 'Market Monitoring', icon: 'fa-clock' }
];

const TemplateStats = () => {
  return (
    <section className="py-5 bg-dark text-white">
      <div className="container">
        <div className="row g-4">
          {stats.map((stat, index) => (
            <div key={index} className="col-md-6 col-lg-3">
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="stat-icon mb-3">
                  <i className={`fas ${stat.icon} text-primary`}></i>
                </div>
                <motion.h3 
                  className="display-4 fw-bold mb-2"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                  viewport={{ once: true }}
                >
                  {stat.number}
                </motion.h3>
                <p className="text-muted">{stat.label}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TemplateStats;
