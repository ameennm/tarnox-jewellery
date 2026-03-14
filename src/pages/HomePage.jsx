import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(3);
      if (data) setFeaturedProducts(data);
    };
    fetchFeatured();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text animate-fade-in">
            <span className="hero-subtitle">New Collection 2024</span>
            <h1>Timeless Elegance For Every Occasion</h1>
            <p>Discover our curated collection of fine jewellery, from diamond rings to pearl necklaces, crafted with passion and precision.</p>
            <div className="hero-btns">
              <Link to="/shop" className="btn btn-primary">
                Shop Collection <ArrowRight size={18} />
              </Link>
              <Link to="/about" className="btn btn-outline">Our Story</Link>
            </div>
          </div>
          <div className="hero-image animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="image-wrapper">
              <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80" alt="Premium Jewellery" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <p>Thoughtfully curated collections for every style</p>
          </div>
          <div className="category-grid">
            {[
              { name: 'Rings', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80' },
              { name: 'Necklaces', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&q=80' },
              { name: 'Earrings', image: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80' },
              { name: 'Bracelets', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80' }
            ].map((cat, idx) => (
              <Link 
                to={`/shop?category=${cat.name}`} 
                key={cat.name} 
                className="category-card animate-fade-in"
                style={{ animationDelay: `${0.1 * idx}s` }}
              >
                <div className="category-image">
                  <img src={cat.image} alt={cat.name} />
                  <div className="category-overlay">
                    <h3>{cat.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features bg-accent">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <Truck size={32} />
              <h3>Free Shipping</h3>
              <p>On all orders over $500</p>
            </div>
            <div className="feature-item">
              <ShieldCheck size={32} />
              <h3>Secure Payment</h3>
              <p>100% secure checkout</p>
            </div>
            <div className="feature-item">
              <Star size={32} />
              <h3>Premium Quality</h3>
              <p>Certified gemstones & gold</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <div className="section-header">
            <h2>Featured Collection</h2>
            <Link to="/shop" className="view-all">View All Products</Link>
          </div>
          <div className="products-grid">
            {featuredProducts.length > 0 ? (
              featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p>Loading curated selection...</p>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
