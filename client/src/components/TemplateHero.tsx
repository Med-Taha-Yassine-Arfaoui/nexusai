'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const TemplateHero = () => {
  return (
    <section className="hero-section">
      <div className="hero-pattern"></div>
      
      {/* Floating elements from original template */}
      <motion.div 
        className="hero-icon floating-element"
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          fontSize: '3rem',
          opacity: 0.3
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.5 }}
      >
        <i className="fas fa-chart-line"></i>
      </motion.div>

      <motion.div 
        className="hero-icon floating-element"
        style={{
          position: 'absolute',
          top: '30%',
          right: '15%',
          fontSize: '2.5rem',
          opacity: 0.3,
          animationDelay: '2s'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.7 }}
      >
        <i className="fas fa-brain"></i>
      </motion.div>

      <div className="container position-relative">
        <div className="row align-items-center min-vh-100">
          <div className="col-lg-6">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="d-flex align-items-center mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <i className="fas fa-robot me-2" style={{ fontSize: '1.5rem' }}></i>
                <span className="badge bg-light text-dark">AI-Powered</span>
              </motion.div>
              
              <motion.h1 
                className="display-3 fw-bold mb-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                AI Makes Financial Analysis 
                <span className="text-warning"> Fast & Easy</span>
              </motion.h1>
              
              <motion.p 
                className="lead mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Present your financial insights in captivating real-time dashboards. 
                Shine with data-driven decisions powered by advanced AI algorithms.
              </motion.p>
              
              <motion.div 
                className="d-flex gap-3 flex-wrap align-items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link href="/register" className="btn btn-light btn-lg pulse-element">
                  <span className="d-flex align-items-center">
                    Get Started Free
                    <i className="fas fa-arrow-right ms-2"></i>
                  </span>
                </Link>
                
                <Link href="/demo" className="btn btn-outline-light btn-lg">
                  <span className="d-flex align-items-center">
                    <i className="fas fa-play-circle me-2"></i>
                    Watch Demo
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
          
          <div className="col-lg-6">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="position-relative"
            >
              {/* Enhanced visual elements */}
              <div className="hero-visual position-relative">
                <motion.div 
                  className="bg-white bg-opacity-10 rounded-4 p-4 backdrop-blur-sm"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white bg-opacity-20 rounded-3 p-5">
                    <h3 className="text-white mb-4">
                      <i className="fas fa-chart-bar me-2"></i>
                      Real-time Analytics
                    </h3>
                    
                    <div className="row text-center mb-4">
                      <div className="col-4">
                        <motion.div 
                          className="stat-box"
                          whileHover={{ scale: 1.1 }}
                        >
                          <h4 className="text-white display-6">98%</h4>
                          <small>Accuracy</small>
                        </motion.div>
                      </div>
                      <div className="col-4">
                        <motion.div 
                          className="stat-box"
                          whileHover={{ scale: 1.1 }}
                        >
                          <h4 className="text-white display-6">24/7</h4>
                          <small>Monitoring</small>
                        </motion.div>
                      </div>
                      <div className="col-4">
                        <motion.div 
                          className="stat-box"
                          whileHover={{ scale: 1.1 }}
                        >
                          <h4 className="text-white display-6">AI</h4>
                          <small>Powered</small>
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Progress bar visualization */}
                    <div className="progress mb-3" style={{ height: '8px' }}>
                      <motion.div 
                        className="progress-bar bg-success"
                        initial={{ width: 0 }}
                        animate={{ width: '90%' }}
                        transition={{ delay: 1, duration: 1.5 }}
                        style={{ height: '8px' }}
                      >
                        90% Efficiency
                      </motion.div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <small>Annual Goal</small>
                      <span className="text-warning fw-bold">
                        $98,541 
                        <i className="fas fa-caret-up ms-1"></i>
                        110%
                      </span>
                    </div>
                  </div>
                </motion.div>
                
                {/* Floating percentage indicator */}
                <motion.div 
                  className="position-absolute"
                  style={{ top: '-20px', right: '-20px' }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, type: "spring" }}
                >
                  <div className="bg-success text-white rounded-circle p-3 pulse-element">
                    <div className="text-center">
                      <div className="fw-bold">90%</div>
                      <small>Efficiency</small>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TemplateHero;
