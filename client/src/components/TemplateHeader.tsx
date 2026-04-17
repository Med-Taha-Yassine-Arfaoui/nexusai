'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const TemplateHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services', dropdown: [
      { label: 'AI Analysis', href: '/analysis' },
      { label: 'Financial Data', href: '/finance' },
      { label: 'Market Insights', href: '/insights' }
    ]},
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Contact', href: '/contact' }
  ];

  return (
    <motion.header 
      className={`main-header ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="navbar navbar-expand-lg">
        <div className="container">
          <Link href="/" className="navbar-brand">
            <h2 className="mb-0">Nexus<span style={{ color: 'var(--template-primary)' }}>AI</span></h2>
          </Link>

          <button 
            className="navbar-toggler"
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`}>
            <ul className="navbar-nav ms-auto">
              {menuItems.map((item, index) => (
                <li key={index} className="nav-item dropdown">
                  <Link 
                    href={item.href} 
                    className="nav-link"
                    onClick={(e) => {
                      if (item.dropdown) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {item.label}
                    {item.dropdown && <i className="fas fa-chevron-down ms-1"></i>}
                  </Link>
                  {item.dropdown && (
                    <ul className="dropdown-menu">
                      {item.dropdown.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link href={subItem.href} className="dropdown-item">
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center">
              <ThemeToggle />
              <div className="header-btn ms-3">
                <Link href="/login" className="btn btn-outline-primary me-2">
                  Login
                </Link>
                <Link href="/register" className="btn btn-primary">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </motion.header>
  );
};

export default TemplateHeader;
