import React, { useEffect, useState } from 'react';
import './PaymentSuccess.css';

interface OrderItemInfo {
  orderItemId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderDetails {
  orderId: number;
  status: string;
  paymentStatus: string;
  paymentMethod: number;
  paymentTransactionId?: string;
  payableAmount: number;
  orderDate: string;
  orderItems?: OrderItemInfo[];
  deliveryAddress?: {
    recipientName: string;
    phone: string;
    address: string;
  };
}

export const PaymentSuccess: React.FC = () => {
  const [status, setStatus] = useState<string>('success');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [tranId, setTranId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Read query parameters
    const params = new URLSearchParams(window.location.search);
    const paramStatus = params.get('status') || 'success';
    const paramOrderId = params.get('orderId');
    const paramTranId = params.get('tranId');
    const paramAmount = params.get('amount');

    setStatus(paramStatus);
    setOrderId(paramOrderId);
    setTranId(paramTranId);
    setAmount(paramAmount);

    // Try fetching full order details if token exists
    if (paramOrderId) {
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`/api/Order/${paramOrderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            if (res.ok) return res.json();
            return null;
          })
          .then((data) => {
            if (data) {
              setOrderDetails(data);
              if (data.payableAmount && !paramAmount) {
                setAmount(data.payableAmount.toFixed(2));
              }
              if (data.paymentTransactionId && !paramTranId) {
                setTranId(data.paymentTransactionId);
              }
            }
          })
          .catch((err) => console.warn('Could not load order details:', err))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const isSuccess = status.toLowerCase() === 'success';
  const isCancelled = status.toLowerCase() === 'cancel' || status.toLowerCase() === 'cancelled';

  return (
    <div className="payment-result-page">
      <div className="payment-result-container">
        {isSuccess ? (
          // SUCCESS STATE
          <div className="payment-card success-card">
            <div className="payment-badge-icon success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h1 className="payment-heading">Thank you! We have received your payment.</h1>
            <p className="payment-subheading">
              Your online payment was processed successfully. A confirmation has been registered for your order.
            </p>

            <div className="payment-receipt-box">
              <div className="receipt-header">
                <span className="receipt-tag">PAYMENT RECEIPT</span>
                <span className="receipt-status-pill success">
                  <span className="dot"></span> Paid
                </span>
              </div>

              <div className="receipt-grid">
                {orderId && (
                  <div className="receipt-row">
                    <span className="receipt-label">Order ID</span>
                    <span className="receipt-value order-id-highlight">#{orderId}</span>
                  </div>
                )}

                {tranId && (
                  <div className="receipt-row">
                    <span className="receipt-label">Transaction ID</span>
                    <span className="receipt-value code-font">{tranId}</span>
                  </div>
                )}

                <div className="receipt-row">
                  <span className="receipt-label">Payment Method</span>
                  <span className="receipt-value">Online Gateway (SSLCommerz)</span>
                </div>

                {amount && (
                  <div className="receipt-row highlight-row">
                    <span className="receipt-label">Amount Paid</span>
                    <span className="receipt-value amount-text">BDT. {parseFloat(amount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Delivery Address Preview */}
              {orderDetails?.deliveryAddress && (
                <div className="delivery-summary-box">
                  <div className="delivery-summary-title">📦 Delivery Details</div>
                  <div className="delivery-summary-text">
                    <strong>{orderDetails.deliveryAddress.recipientName}</strong> ({orderDetails.deliveryAddress.phone})<br />
                    {orderDetails.deliveryAddress.address}
                  </div>
                </div>
              )}
            </div>

            <div className="payment-actions">
              <a href="/my-orders" className="btn-primary-orders">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                View in My Orders
              </a>
              <a href="/home" className="btn-secondary-home">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Continue Shopping
              </a>
            </div>
          </div>
        ) : (
          // FAILED OR CANCELLED STATE
          <div className="payment-card failed-card">
            <div className={`payment-badge-icon ${isCancelled ? 'cancel-icon' : 'fail-icon'}`}>
              {isCancelled ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              )}
            </div>

            <h1 className="payment-heading failed-heading">
              {isCancelled ? 'Payment Cancelled' : 'Payment Failed'}
            </h1>
            <p className="payment-subheading">
              {isCancelled
                ? 'You cancelled the payment process. Your order has been marked as cancelled.'
                : 'We were unable to process your transaction. Please try placing your order again or choose a different payment method.'}
            </p>

            {orderId && (
              <div className="payment-receipt-box failed-receipt">
                <div className="receipt-row">
                  <span className="receipt-label">Order Reference</span>
                  <span className="receipt-value">#{orderId}</span>
                </div>
                {tranId && (
                  <div className="receipt-row">
                    <span className="receipt-label">Transaction ID</span>
                    <span className="receipt-value code-font">{tranId}</span>
                  </div>
                )}
                <div className="receipt-row">
                  <span className="receipt-label">Payment Status</span>
                  <span className="receipt-value status-fail-text">
                    {isCancelled ? 'Cancelled' : 'Failed'}
                  </span>
                </div>
              </div>
            )}

            <div className="payment-actions">
              <a href="/cart" className="btn-primary-orders">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Return to Cart
              </a>
              <a href="/my-orders" className="btn-secondary-home">
                View My Orders
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;

