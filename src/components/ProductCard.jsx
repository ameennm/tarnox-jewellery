import React from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { trackEvent } from '../lib/api';
import './ProductCard.css';

const ProductCard = ({ product, isWholesale = false }) => {
  const { addToCart } = useCart();
  const [currentImgIndex, setCurrentImgIndex] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);
  const images = product.images && product.images.length > 0 ? product.images : [product.image_url].filter(Boolean);
  const displayPrice = isWholesale ? product.wholesale_price : product.price;
  const stockQuantity = Number(product.stock_quantity || 0);
  const isSoldOut = stockQuantity <= 0;
  const maxQuantity = Math.max(1, stockQuantity);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const updateQuantity = (nextQuantity) => {
    setQuantity(Math.min(Math.max(1, nextQuantity), maxQuantity));
  };

  const handleAddToCart = () => {
    if (!isSoldOut) {
      addToCart({ ...product, price: displayPrice }, quantity);
      trackEvent({
        type: 'add_to_cart',
        path: window.location.pathname,
        product_id: product.id,
        metadata: {
          title: product.title,
          quantity,
          price: displayPrice,
          isWholesale
        }
      });
    }
  };

  return (
    <div className="product-card animate-fade-in">
      <div className="product-image-container" onClick={images.length > 1 ? nextImage : undefined}>
        {images.length > 0 ? (
          <img src={images[currentImgIndex]} alt={product.title} className="product-image" />
        ) : (
          <div className="product-image product-image-placeholder">Tarnox</div>
        )}
        
        {images.length > 1 && (
          <div className="image-dots">
            {images.map((_, i) => (
              <span key={i} className={`dot ${i === currentImgIndex ? 'active' : ''}`} />
            ))}
          </div>
        )}
        
        <div className="product-overlay">
          <button 
            className="btn-icon" 
            title="Add to Cart"
            disabled={isSoldOut}
            onClick={handleAddToCart}
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <h3 className="product-title">{product.title}</h3>
        <div className="product-price-container">
          <p className="product-price">₹{parseFloat(displayPrice).toFixed(2)}</p>
          {!isWholesale && product.original_price && product.original_price > product.price && (
            <div className="discount-info">
              <span className="original-price">₹{parseFloat(product.original_price).toFixed(2)}</span>
              <span className="discount-tag">
                {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% off
              </span>
            </div>
          )}
        </div>
        {isWholesale && <p className="wholesale-badge">Wholesale Rate</p>}
        <div className={`stock-line ${isSoldOut ? 'sold-out' : ''}`}>
          {isSoldOut ? 'Sold out' : `${stockQuantity} in stock`}
        </div>
        <div className="quantity-picker" aria-label={`Quantity for ${product.title}`}>
          <button type="button" onClick={() => updateQuantity(quantity - 1)} disabled={quantity <= 1 || isSoldOut}>
            <Minus size={14} />
          </button>
          <span>{quantity}</span>
          <button type="button" onClick={() => updateQuantity(quantity + 1)} disabled={quantity >= maxQuantity || isSoldOut}>
            <Plus size={14} />
          </button>
        </div>
        <button 
          className="btn btn-outline btn-full"
          onClick={handleAddToCart}
          disabled={isSoldOut}
        >
          {isSoldOut ? 'Sold Out' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
