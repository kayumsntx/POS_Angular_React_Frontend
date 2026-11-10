import React, { useState, useEffect } from 'react';
import { cartService, CartItem } from '../services/cartService';
import './Cart.css';

const API_BASE_URL = 'http://localhost:5109';

export const Cart: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>(() => cartService.getCart());
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  // Form fields
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<number>(1); // 1 = Cash on Delivery, 2 = Online Payment
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const token = localStorage.getItem('token');
    const exp = localStorage.getItem('expiresAt');
    return !!token && (!exp || new Date(exp) > new Date());
  });
  const [currentUserName, setCurrentUserName] = useState<string>(
    () => localStorage.getItem('userName') || ''
  );

  // Sync cart from localStorage across browser tabs & page reloads
  useEffect(() => {
    const syncCart = () => {
      setItems(cartService.getCart());
    };

    window.addEventListener('techpoint_cart_updated', syncCart);
    window.addEventListener('storage', syncCart);

    return () => {
      window.removeEventListener('techpoint_cart_updated', syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, []);

  // Pre-fill profile info if logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const exp = localStorage.getItem('expiresAt');
    const loggedIn = !!token && (!exp || new Date(exp) > new Date());
    setIsLoggedIn(loggedIn);
    const storedName = localStorage.getItem('userName') || '';
    setCurrentUserName(storedName);

    if (loggedIn && token) {
      if (!recipientName) setRecipientName(storedName);

      fetch(`${API_BASE_URL}/api/Account/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (data.fullName && !recipientName) setRecipientName(data.fullName);
            if (data.phoneNumber && !phone) setPhone(data.phoneNumber);
            if (data.defaultAddress && !address) setAddress(data.defaultAddress);
          }
        })
        .catch(() => {});
    }
  }, []);

  const { totalCount, totalPrice } = cartService.getTotals(items);

  const handleUpdateQty = (productId: number, newQty: number) => {
    const updated = cartService.updateQuantity(productId, newQty);
    setItems(updated);
  };

  const handleRemoveItem = (productId: number) => {
    const updated = cartService.removeFromCart(productId);
    setItems(updated);
  };

  const handleClearCart = () => {
    cartService.clearCart();
    setItems([]);
  };

  const getProductImage = (item: CartItem): string => {
    if (!item?.imageUrl) {
      return `${API_BASE_URL}/images/noimage.jpg`;
    }
    if (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://')) {
      return item.imageUrl;
    }
    const clean = item.imageUrl.startsWith('/') ? item.imageUrl : `/images/${item.imageUrl}`;
    return `${API_BASE_URL}${clean}`;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const token = localStorage.getItem('token');
    if (!token || !isLoggedIn) {
      setErrorMessage('You must be logged in to place an order.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    if (!recipientName.trim()) {
      setErrorMessage('Recipient Name is required.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Phone number is required for delivery.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Delivery Address is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        phone: phone.trim(),
        discountPercent: 0,
        paymentMethod: Number(paymentMethod),
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        deliveryAddress: {
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
      };

      const res = await fetch(`${API_BASE_URL}/api/Order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to place order. Please try again.');
      }

      // If Online Payment was selected and gateway URL is returned, redirect to payment gateway
      const gatewayUrl = data?.gatewayPageURL || data?.gatewayPageUrl || data?.GatewayPageURL;
      if (paymentMethod === 2 && gatewayUrl) {
        cartService.clearCart();
        window.location.href = gatewayUrl;
        return;
      }

      setOrderSuccess(data);
      cartService.clearCart();
      setItems([]);
      setShowCheckoutForm(false);
      window.dispatchEvent(new CustomEvent('techpoint_order_created', { detail: data }));
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while placing your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cart-page-wrapper">
      <div className="cart-card-container">
        {/* HEADER SECTION (Matching screenshot) */}
        <div className="cart-card-header">
          <div className="cart-header-title">
            <span className="cart-header-icon">🛒</span>
            <h2>Your Cart</h2>
          </div>
          <div className="cart-header-items-count">
            {totalCount} {totalCount === 1 ? 'item' : 'items'}
          </div>
        </div>

        {/* ORANGE UNDERLINE (Matching screenshot) */}
        <div className="cart-orange-divider" />

        {/* ORDER SUCCESS SCREEN */}
        {orderSuccess && (
          <div className="cart-success-banner">
            <div className="success-icon">🎉</div>
            <h3>Order Placed Successfully!</h3>
            <p>
              Your order <strong>#{orderSuccess.orderId}</strong> has been confirmed.
            </p>
            <div className="success-details-pill">
              <span>Status: <strong>{orderSuccess.status || 'Pending'}</strong></span>
              <span>Total: <strong>BDT. {(orderSuccess.payableAmount || totalPrice).toFixed(2)}</strong></span>
            </div>
            <div className="success-action-btns">
              <a href="/my-orders" className="view-orders-btn">
                📦 View in My Orders
              </a>
              <a href="/home" className="continue-shopping-btn">
                Shop More Products
              </a>
            </div>
          </div>
        )}

        {/* EMPTY CART STATE */}
        {!orderSuccess && items.length === 0 ? (
          <div className="cart-empty-state">
            <div className="empty-cart-icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added any products to your cart yet.</p>
            <a href="/home" className="empty-browse-btn">
              🛍️ Explore Products
            </a>
          </div>
        ) : null}

        {/* ITEMS LIST (Matching screenshot) */}
        {!orderSuccess && items.length > 0 && (
          <div className="cart-items-list">
            {items.map((item) => (
              <div key={item.productId} className="cart-item-row">
                {/* Left: Thumbnail & Details */}
                <div className="cart-item-left">
                  <div className="cart-item-img-box">
                    <img
                      src={getProductImage(item)}
                      alt={item.productName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `${API_BASE_URL}/images/noimage.jpg`;
                      }}
                    />
                  </div>

                  <div className="cart-item-meta">
                    <div className="cart-item-title" title={item.productName}>
                      {item.productName}
                    </div>
                    <div className="cart-item-unit-price">
                      BDT. {item.price.toFixed(2)}
                    </div>
                    <div className="cart-item-badges-wrap">
                      <span className="cart-badge-chip">
                        🎨 {item.categoryName || 'Product'}
                      </span>
                      {item.barcode && (
                        <span className="cart-badge-chip">
                          🏷️ {item.barcode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quantity Controls, Delete & Line Total (Matching screenshot) */}
                <div className="cart-item-right">
                  <div className="cart-qty-controls">
                    {/* Circle salmon/reddish minus button */}
                    <button
                      type="button"
                      className="circle-qty-btn minus"
                      onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                      title="Decrease quantity"
                    >
                      −
                    </button>

                    {/* Quantity number */}
                    <span className="qty-number-display">{item.quantity}</span>

                    {/* Circle bright green plus button */}
                    <button
                      type="button"
                      className="circle-qty-btn plus"
                      onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                      title="Increase quantity"
                    >
                      +
                    </button>

                    {/* Circle red trash button */}
                    <button
                      type="button"
                      className="circle-delete-btn"
                      onClick={() => handleRemoveItem(item.productId)}
                      title="Remove product"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Line Total in bold blue */}
                  <div className="cart-item-line-total">
                    BDT. {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BOTTOM TOTAL & PROCEED TO CHECKOUT / LOGIN ROW (Matching screenshot) */}
        {!orderSuccess && items.length > 0 && (
          <div className="cart-footer-bar">
            <div className="cart-total-display">
              <span className="total-label">Total: </span>
              <span className="total-value">BDT. {totalPrice.toFixed(2)}</span>
            </div>

            <div className="cart-action-container">
              {isLoggedIn ? (
                /* Logged In: Show Green "Proceed to Checkout" button */
                <button
                  type="button"
                  className="cart-checkout-btn"
                  onClick={() => setShowCheckoutForm(!showCheckoutForm)}
                >
                  <span className="btn-card-icon">💳</span>
                  <span>{showCheckoutForm ? 'Close Checkout Form' : 'Proceed to Checkout'}</span>
                </button>
              ) : (
                /* Not Logged In: Show Login / Sign Up options instead of Proceed to Checkout */
                <div className="cart-auth-prompt-box">
                  <a href="/login" className="cart-login-btn">
                    🔑 Login to Checkout
                  </a>
                  <a href="/register" className="cart-signup-btn">
                    Sign Up
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHECKOUT DELIVERY FORM (Revealed when Proceed to Checkout is clicked) */}
        {showCheckoutForm && !orderSuccess && items.length > 0 && isLoggedIn && (
          <div className="cart-checkout-card">
            <div className="checkout-card-header">
              <h3>📦 Delivery & Payment Information</h3>
              <small>Ordering as <strong>{currentUserName || 'Customer'}</strong></small>
            </div>

            {errorMessage && (
              <div className="checkout-error-banner">
                <span>⚠️</span> {errorMessage}
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="checkout-form">
              <div className="form-group-row">
                <div className="form-group">
                  <label>Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full recipient name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 017xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Delivery Address *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="House, Road, Area, Thana, District..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <div className="payment-radio-group">
                  <label className={`payment-pill ${paymentMethod === 1 ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={1}
                      checked={paymentMethod === 1}
                      onChange={() => setPaymentMethod(1)}
                    />
                    <span className="pm-icon">💵</span>
                    <span>Cash on Delivery (COD)</span>
                  </label>

                  <label className={`payment-pill ${paymentMethod === 2 ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={2}
                      checked={paymentMethod === 2}
                      onChange={() => setPaymentMethod(2)}
                    />
                    <span className="pm-icon">💳</span>
                    <span>Online Payment</span>
                  </label>
                </div>
              </div>

              <div className="checkout-submit-row">
                <button
                  type="submit"
                  className="confirm-order-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Placing Order... ⏳</span>
                  ) : (
                    <span>🚀 Confirm & Place Order (BDT. {totalPrice.toFixed(2)})</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

