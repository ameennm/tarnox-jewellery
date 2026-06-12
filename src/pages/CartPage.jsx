import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { createOrder, trackEvent } from '../lib/api';
import './CartPage.css';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const trackedCheckoutStart = useRef(false);

  useEffect(() => {
    if (cartItems.length > 0 && !trackedCheckoutStart.current) {
      trackedCheckoutStart.current = true;
      trackEvent({
        type: 'checkout_started',
        path: '/cart',
        metadata: {
          item_count: cartItems.length,
          total_quantity: cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0),
          cart_total: cartTotal
        }
      });
    }
  }, [cartItems, cartTotal]);

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value || 0);

  const buildWhatsappLink = (order) => {
    const itemDetails = order.items
      .map((item) => `- ${item.title} (${item.quantity} x ${formatCurrency(item.unit_price)}) = ${formatCurrency(item.line_total)}`)
      .join('\n');
    const message = [
      `Hello Tarnox Jewellery, I want to confirm order ${order.order_number}.`,
      '',
      itemDetails,
      '',
      `Total: ${formatCurrency(order.total_amount)}`,
      `Name: ${order.customer_name}`,
      `Phone: ${order.customer_phone}`,
      order.customer_address ? `Address: ${order.customer_address}` : '',
      order.notes ? `Notes: ${order.notes}` : '',
      '',
      'Please confirm availability and next steps.'
    ].filter(Boolean).join('\n');

    return `https://wa.me/918136926624?text=${encodeURIComponent(message)}`;
  };

  const updateCustomer = (field, value) => {
    setCustomer((current) => ({ ...current, [field]: value }));
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      trackEvent({
        type: 'checkout_submitted',
        path: '/cart',
        metadata: {
          item_count: cartItems.length,
          cart_total: cartTotal,
          has_phone: Boolean(customer.phone),
          has_email: Boolean(customer.email)
        }
      });
      const { order } = await createOrder({
        customer,
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      });
      clearCart();
      trackEvent({
        type: 'whatsapp_click',
        path: '/cart',
        order_id: order.id,
        metadata: {
          order_number: order.order_number,
          customer_phone: order.customer_phone,
          auto_opened_after_checkout: true
        }
      });
      window.location.assign(buildWhatsappLink(order));
    } catch (err) {
      setError(err.message || 'Unable to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page empty-cart container">
        <ShoppingCart size={80} strokeWidth={1} />
        <h1>Your Cart is Empty</h1>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/shop" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="cart-page container">
      <h1 className="page-title">Shopping Cart</h1>
      
      <div className="cart-grid">
        <div className="cart-items">
          {cartItems.map(item => (
            <div key={item.id} className="cart-item glass-morphism">
              <div className="item-image">
                {(item.image_url || item.images?.[0]) ? (
                  <img src={item.image_url || item.images[0]} alt={item.title} />
                ) : (
                  <div className="cart-image-placeholder">Tarnox</div>
                )}
              </div>
              <div className="item-details">
                <h3>{item.title}</h3>
                <p className="item-cat">{item.category}</p>
                <p className="item-price">{formatCurrency(item.price)}</p>
                <p className="item-stock">{item.stock_quantity} available</p>
              </div>
              <div className="item-quantity">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={16} /></button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={16} /></button>
              </div>
              <div className="item-subtotal">
                <p>{formatCurrency((item.price || 0) * item.quantity)}</p>
              </div>
              <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary glass-morphism">
          <h3>Checkout Details</h3>
          <form onSubmit={handleCheckout} className="checkout-form">
            {error && <div className="checkout-error">{error}</div>}
            <label>
              Full Name
              <input
                required
                autoComplete="name"
                value={customer.name}
                onChange={(event) => updateCustomer('name', event.target.value)}
              />
            </label>
            <label>
              WhatsApp / Phone
              <input
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={customer.phone}
                onChange={(event) => updateCustomer('phone', event.target.value)}
              />
            </label>
            <label>
              Delivery Address <span>Optional</span>
              <textarea rows="3" value={customer.address} onChange={(event) => updateCustomer('address', event.target.value)} />
            </label>
            <label>
              Notes <span>Optional</span>
              <textarea rows="2" value={customer.notes} onChange={(event) => updateCustomer('notes', event.target.value)} />
            </label>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>To be confirmed</span>
            </div>
            <div className="summary-row total">
              <span>Order Total</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <button className="btn btn-primary btn-full checkout-btn" disabled={submitting}>
              <MessageCircle size={18} />
              {submitting ? 'Saving order...' : 'Confirm Order & Send WhatsApp'}
            </button>
            <p className="checkout-note">This saves your order first, then opens WhatsApp with the message ready to send.</p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
