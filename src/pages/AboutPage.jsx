import React from 'react';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1 className="animate-fade-in">Our Journey Of Radiance</h1>
          <p className="animate-fade-in" style={{ animationDelay: '0.2s' }}>The story of Tarnox is one of passion, precision, and the pursuit of perfection.</p>
        </div>
      </section>

      <section className="about-content container">
        <div className="about-grid">
          <div className="about-text">
            <h2>The Tarnox Vision</h2>
            <p>Founded with the belief that jewellery should be more than just an accessory, Tarnox aim to create pieces that tell a story. Each design is a reflection of the strength, beauty, and individuality of the people who wear them.</p>
            <p>We source only the finest ethically-obtained gemstones and precious metals, ensuring that our commitment to quality is matched by our commitment to responsibility.</p>
            
            <div className="stats-row">
              <div className="stat">
                <h3>15+</h3>
                <p>Years Experience</p>
              </div>
              <div className="stat">
                <h3>5k+</h3>
                <p>Happy Customers</p>
              </div>
              <div className="stat">
                <h3>100%</h3>
                <p>Ethical Sourcing</p>
              </div>
            </div>
          </div>
          <div className="about-image">
             <img src="https://images.unsplash.com/photo-1573408339375-f99b29bc25df?auto=format&fit=crop&q=80" alt="Craftsmanship" />
          </div>
        </div>
      </section>

      <section className="craftsmanship bg-accent">
        <div className="container">
          <div className="section-header centered">
            <h2>Artisan Craftsmanship</h2>
            <p>Every piece is handcrafted by our master jewellers with attention to the smallest detail.</p>
          </div>
          <div className="craft-grid">
            <div className="craft-item glass-morphism">
               <span className="step">01</span>
               <h3>Design</h3>
               <p>Our designers sketch each piece, finding the perfect balance between classic elegance and modern flair.</p>
            </div>
            <div className="craft-item glass-morphism">
               <span className="step">02</span>
               <h3>Sourcing</h3>
               <p>We hand-select every diamond and gemstone for its color, clarity, and unique character.</p>
            </div>
            <div className="craft-item glass-morphism">
               <span className="step">03</span>
               <h3>Creation</h3>
               <p>Using traditional techniques and modern technology, our artisans bring the design to life.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
