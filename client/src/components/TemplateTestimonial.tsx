'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Financial Analyst',
    content: 'NexusAI has transformed how we analyze market data. The AI insights are incredibly accurate and have saved us countless hours.',
    avatar: 'SJ',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'Investment Manager',
    content: 'The real-time monitoring and predictive analytics have given us a competitive edge in the market. Highly recommended!',
    avatar: 'MC',
    rating: 5
  },
  {
    name: 'Emily Davis',
    role: 'Portfolio Manager',
    content: 'The platform is intuitive and powerful. The AI-powered recommendations have significantly improved our investment strategies.',
    avatar: 'ED',
    rating: 5
  }
];

const TemplateTestimonial = () => {
  const [activeIndex, setActiveIndex] = useState(0);

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
          <h2 className="display-5 fw-bold mb-3">What Our Users Say</h2>
          <p className="lead text-muted">
            Trusted by financial professionals worldwide
          </p>
        </motion.div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="testimonial-slider">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className={`testimonial-item ${index === activeIndex ? 'active' : ''}`}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ 
                    opacity: index === activeIndex ? 1 : 0,
                    x: index === activeIndex ? 0 : 100,
                    display: index === activeIndex ? 'block' : 'none'
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="card border-0 shadow-sm p-5">
                    <div className="d-flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <i key={i} className="fas fa-star text-warning me-1"></i>
                      ))}
                    </div>
                    
                    <blockquote className="mb-4">
                      <p className="fs-5 text-muted">"{testimonial.content}"</p>
                    </blockquote>
                    
                    <div className="d-flex align-items-center">
                      <div className="avatar-circle bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px' }}>
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h5 className="mb-0">{testimonial.name}</h5>
                        <small className="text-muted">{testimonial.role}</small>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Testimonial indicators */}
            <div className="d-flex justify-content-center mt-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`btn btn-sm rounded-circle mx-1 ${index === activeIndex ? 'bg-primary' : 'bg-secondary'}`}
                  style={{ width: '10px', height: '10px' }}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TemplateTestimonial;
