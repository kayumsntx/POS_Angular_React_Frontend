import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5109';

interface OrderItem {
  orderItemId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

interface OrderSummary {
  orderId: number;
  userId: number | null;
  orderType: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  discountPercent: number;
  discountAmount: number;
  shippingAmount: number;
  PayableAmount?: number;
  payableAmount?: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentTransactionId?: string;
  itemCount: number;
  items: OrderItem[];
}

export default function MyOrders() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUserOrders();

    const handleOrderCreated = () => {
      loadUserOrders();
    };

    window.addEventListener('techpoint_order_created', handleOrderCreated);
    return () => {
      window.removeEventListener('techpoint_order_created', handleOrderCreated);
    };
  }, []);

  const loadUserOrders = async () => {
    setLoading(true);
    setErrorMessage(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      let ordersData: OrderSummary[] = [];

      // Primary: Use dedicated /api/Order/my-orders endpoint with Authorization header
      const myOrdersRes = await fetch(`${API_BASE_URL}/api/Order/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (myOrdersRes.ok) {
        ordersData = await myOrdersRes.json();
      } else {
        // Fallback: Fetch caller's profile to get userId, then fetch /api/Order/user/{userId} with token
        const profileRes = await fetch(`${API_BASE_URL}/api/Account/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (profileRes.ok) {
          const profile = await profileRes.json();
          const userId = profile.id || profile.Id || profile.userId;

          if (userId) {
            const ordersRes = await fetch(`${API_BASE_URL}/api/Order/user/${userId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (ordersRes.ok) {
              ordersData = await ordersRes.json();
            }
          }
        }
      }

      // Filter: Show only own online orders
      const ownOnlineOrders = (Array.isArray(ordersData) ? ordersData : []).filter((o) => {
        const type = (o.orderType || '').toLowerCase();
        return type === 'online' || (o.shippingAmount && o.shippingAmount > 0) || type !== 'pos';
      });

      // Sort newest first
      ownOnlineOrders.sort(
        (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );
      setOrders(ownOnlineOrders);
    } catch (err: any) {
      console.warn('Error loading orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (amount: number | undefined) => {
    return `৳ ${(amount || 0).toLocaleString('en-US')}`;
  };

  const getStatusClass = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('pending')) return 'tp-status-pending';
    if (s.includes('approved') || s.includes('processing')) return 'tp-status-approved';
    if (s.includes('shipped')) return 'tp-status-shipped';
    if (s.includes('delivered') || s.includes('completed')) return 'tp-status-delivered';
    if (s.includes('cancel')) return 'tp-status-cancelled';
    return 'tp-status-pending';
  };

  const getPayable = (order: OrderSummary) => {
    return order.payableAmount ?? order.PayableAmount ?? order.totalAmount;
  };

  // Filter orders by active tab and search query
  const filteredOrders = orders.filter((order) => {
    const s = (order.status || '').toLowerCase();
    if (activeTab === 'pending' && !s.includes('pending')) return false;
    if (activeTab === 'delivered' && !s.includes('delivered') && !s.includes('completed')) return false;
    if (activeTab === 'cancelled' && !s.includes('cancel')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = order.orderId.toString().includes(q);
      const matchItem = order.items?.some((i) => i.productName.toLowerCase().includes(q));
      return matchId || matchItem;
    }

    return true;
  });

  const pendingCount = orders.filter((o) => (o.status || '').toLowerCase().includes('pending')).length;
  const deliveredCount = orders.filter((o) => {
    const s = (o.status || '').toLowerCase();
    return s.includes('delivered') || s.includes('completed');
  }).length;

  const token = localStorage.getItem('token');

  return (
    <div className="tp-orders-page">
      <div className="tp-orders-container">
        {/* HEADER */}
        <div className="tp-orders-header">
          <div className="tp-orders-title-wrap">
            <h1>
              <span>📦</span>
              <span>My Orders</span>
            </h1>
            <p className="tp-orders-subtitle">Track, review, and view invoice details of your purchases.</p>
          </div>

          <div className="tp-orders-stats">
            <div className="tp-stat-pill">
              Total: <strong>{orders.length}</strong>
            </div>
            <div className="tp-stat-pill">
              Pending: <strong>{pendingCount}</strong>
            </div>
            <div className="tp-stat-pill">
              Delivered: <strong>{deliveredCount}</strong>
            </div>
          </div>
        </div>

        {/* NOT LOGGED IN PROMPT */}
        {!token && (
          <div className="tp-orders-empty">
            <div className="tp-orders-empty-icon">🔒</div>
            <h3>Please Sign In</h3>
            <p>You need to be logged into your account to review your personal order history.</p>
            <a href="/login" className="tp-btn-start-shopping">
              <span>👤</span>
              <span>Sign In to Account</span>
            </a>
          </div>
        )}

        {/* LOGGED IN VIEW */}
        {token && (
          <>
            {/* CONTROLS (TABS & SEARCH) */}
            <div className="tp-orders-controls">
              <div className="tp-filter-tabs">
                <button
                  type="button"
                  className={`tp-filter-tab ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Orders ({orders.length})
                </button>
                <button
                  type="button"
                  className={`tp-filter-tab ${activeTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  className={`tp-filter-tab ${activeTab === 'delivered' ? 'active' : ''}`}
                  onClick={() => setActiveTab('delivered')}
                >
                  Delivered ({deliveredCount})
                </button>
                <button
                  type="button"
                  className={`tp-filter-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
                  onClick={() => setActiveTab('cancelled')}
                >
                  Cancelled
                </button>
              </div>

              <div className="tp-orders-search">
                <span className="search-ico">🔍</span>
                <input
                  type="text"
                  placeholder="Search by Order # or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* LOADING STATE */}
            {loading && (
              <div className="tp-orders-loading">
                <div className="tp-spinner-large" />
                <p>Loading your order history...</p>
              </div>
            )}

            {/* EMPTY STATE (When no online orders) */}
            {!loading && filteredOrders.length === 0 && (
              <div className="tp-orders-empty">
                <div className="tp-orders-empty-icon">🛒</div>
                <h3>No Online Orders Found</h3>
                <p>
                  {searchQuery || activeTab !== 'all'
                    ? 'No orders match your filter criteria.'
                    : "You haven't placed any online orders yet. Explore our store and place your first order!"}
                </p>
                <a href="/home" className="tp-btn-start-shopping">
                  <span>🛍️</span>
                  <span>Start Shopping</span>
                </a>
              </div>
            )}

            {/* ORDERS LIST */}
            {!loading && filteredOrders.length > 0 && (
              <div className="tp-orders-list">
                {filteredOrders.map((order) => (
                  <div key={order.orderId} className="tp-order-card">
                    {/* CARD HEADER */}
                    <div className="tp-order-card-header">
                      <div>
                        <div className="tp-order-id-group">
                          <span className="tp-order-id-badge">Order #{order.orderId}</span>
                          <span className="tp-order-type-badge">
                            {order.orderType === 'Online' ? '🌐 Online Order' : '🖥️ POS Sale'}
                          </span>
                        </div>
                        <div className="tp-order-date">Placed on {formatDate(order.orderDate)}</div>
                      </div>

                      <div className="tp-order-status-group">
                        <span className={`tp-badge-status ${getStatusClass(order.status)}`}>
                          <span>●</span>
                          <span>{order.status || 'Pending'}</span>
                        </span>

                        <span
                          className={`tp-badge-payment ${(order.paymentStatus || '').toLowerCase() === 'paid' ? 'tp-pay-paid' : 'tp-pay-unpaid'}`}
                        >
                          {(order.paymentStatus || '').toLowerCase() === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
                        </span>
                      </div>
                    </div>

                    {/* ITEMS LIST */}
                    <div className="tp-order-items">
                      {(order.items || []).map((item) => (
                        <div key={item.orderItemId || item.productId} className="tp-order-item-row">
                          <div className="tp-item-left">
                            <div className="tp-item-icon-box">💻</div>
                            <div className="tp-item-info">
                              <span className="tp-item-name">{item.productName}</span>
                              <span className="tp-item-pricing-sub">
                                Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                                {item.discount > 0 && ` (Save ${formatPrice(item.discount)})`}
                              </span>
                            </div>
                          </div>
                          <div className="tp-item-subtotal">
                            {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CARD FOOTER & FINANCIALS */}
                    <div className="tp-order-card-footer">
                      <div className="tp-order-meta-info">
                        <div>
                          <strong>Payment Method:</strong> {order.paymentMethod || 'Cash on Delivery'}
                        </div>
                        {order.paymentTransactionId && (
                          <div>
                            <strong>Transaction ID:</strong> {order.paymentTransactionId}
                          </div>
                        )}
                        <div>
                          <strong>Items Count:</strong> {order.itemCount || order.items?.length || 1} item(s)
                        </div>
                      </div>

                      <div className="tp-order-pricing-summary">
                        <div className="tp-payable-wrap">
                          <div className="tp-payable-label">Total Payable</div>
                          <div className="tp-payable-amount">{formatPrice(getPayable(order))}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

