import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="logo footer-logo">
              <span className="logo-text">TARNOX</span>
            </Link>
            <p className="footer-desc">
              Exquisite jewellery designed for the modern woman who values elegance, quality, and timeless beauty.
            </p>
            <div className="social-links">
              <a href="#"><Instagram size={20} /></a>
              <a href="#"><Facebook size={20} /></a>
              <a href="#"><Twitter size={20} /></a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Shop Collection</Link></li>
              <li><Link to="/about">Our Story</Link></li>
              <li><Link to="/cart">Your Cart</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Customer Care</h4>
            <ul>
              <li><a href="#">Shipping Policy</a></li>
              <li><a href="#">Returns & Exchanges</a></li>
              <li><a href="#">Jewellery Care</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contact Us</h4>
            <div className="contact-item">
              <MapPin size={18} />
              <span>123 Jewellery Lane, Gem City</span>
            </div>
            <div className="contact-item">
              <Phone size={18} />
              <a href="https://wa.me/918136926624" target="_blank" rel="noopener noreferrer">
                +91 81369 26624 (WhatsApp)
              </a>
            </div>
            <div className="contact-item">
              <Mail size={18} />
              <span>hello@tarnox.com</span>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Tarnox Jewellery. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
