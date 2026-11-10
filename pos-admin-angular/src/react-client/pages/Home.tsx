import React, { useState, useEffect } from 'react';
import { cartService } from '../services/cartService';

// =============================================================================
// 🖼️ BANNER IMAGE POSITION (Paste your hero banner image link here)
// =============================================================================
export const HERO_BANNER_IMAGE =
  '';

// =============================================================================
// 🖼️ PROMO OFFER BANNER IMAGE POSITION (Paste your promo banner image link here)
// =============================================================================
export const PROMO_BANNER_IMAGE =
  'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=1000&auto=format&fit=crop';

interface Category {
  categoryId: number;
  name: string;
  description?: string;
}

interface Product {
  productId: number;
  productName: string;
  description?: string;
  barcode: string;
  categoryId: number;
  categoryName?: string;
  cost: number;
  price: number;
  imageUrl?: string;
}

const API_BASE_URL = 'http://localhost:5109';

export const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryStock, setInventoryStock] = useState<{ [productId: number]: number }>({});
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState<number>(() => cartService.getTotals(cartService.getCart()).totalCount);
  const [notification, setNotification] = useState<string | null>(null);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const token = localStorage.getItem('token');
    const exp = localStorage.getItem('expiresAt');
    return !!token && (!exp || new Date(exp) > new Date());
  });
  const [currentUserName, setCurrentUserName] = useState<string>(
    () => localStorage.getItem('userName') || ''
  );

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setCurrentUserName('');
    setNotification('Logged out successfully');
    window.dispatchEvent(new Event('storage'));
    window.location.reload();
  };

  const loadCategories = () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_BASE_URL}/api/Category`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Category[]) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((err) => console.warn('Failed to load categories:', err));
  };

  const loadProducts = () => {
    fetch(`${API_BASE_URL}/api/Products`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Product[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch((err) => console.warn('Failed to load products:', err));
  };

  const loadInventory = () => {
    fetch(`${API_BASE_URL}/api/Inventory`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const stockMap: { [productId: number]: number } = {};
          for (const inv of data) {
            stockMap[inv.productId] = (stockMap[inv.productId] || 0) + (inv.quantity || 0);
          }
          setInventoryStock(stockMap);
        }
      })
      .catch((err) => console.warn('Failed to load inventory:', err));
  };

  const getStock = (productId: number): number => {
    return inventoryStock[productId] ?? 0;
  };

  // Real-time catalog synchronization across browser tabs and devices
  useEffect(() => {
    loadCategories();
    loadProducts();
    loadInventory();

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('techpoint_catalog_sync');
      channel.onmessage = () => {
        loadProducts();
        loadCategories();
        loadInventory();
      };
    } catch {}

    const handleLocalUpdate = () => {
      loadProducts();
      loadCategories();
      loadInventory();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'techpoint_catalog_version') {
        loadProducts();
        loadCategories();
        loadInventory();
      }
    };

    window.addEventListener('techpoint_catalog_updated', handleLocalUpdate);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleLocalUpdate);

    // Periodic gentle refresh every 30 seconds for multi-device / multi-browser updates
    const pollTimer = setInterval(() => {
      loadProducts();
      loadCategories();
      loadInventory();
    }, 30000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('techpoint_catalog_updated', handleLocalUpdate);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleLocalUpdate);
      clearInterval(pollTimer);
    };
  }, []);

  // Filtered Products by Category & Search
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory ? p.categoryId === selectedCategory : true;
    const matchesSearch = searchQuery
      ? p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCat && matchesSearch;
  });

  // Sync cart count with localStorage across browser tabs & page reloads
  useEffect(() => {
    const syncCart = () => {
      setCartCount(cartService.getTotals(cartService.getCart()).totalCount);
    };

    window.addEventListener('techpoint_cart_updated', syncCart);
    window.addEventListener('storage', syncCart);

    return () => {
      window.removeEventListener('techpoint_cart_updated', syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, []);

  const handleAddToCart = (prod: Product) => {
    const stock = getStock(prod.productId);
    if (stock <= 0) {
      alert(`"${prod.productName}" is out of stock (0 available).`);
      return;
    }
    cartService.addToCart(
      {
        productId: prod.productId,
        productName: prod.productName,
        barcode: prod.barcode,
        categoryName: prod.categoryName,
        price: prod.price,
        imageUrl: prod.imageUrl,
      },
      1
    );
    setNotification(`Added "${prod.productName}" to cart! 🛒`);
    setTimeout(() => setNotification(null), 2500);
  };

  const getProductImage = (prod: Product): string => {
    if (!prod?.imageUrl) {
      return `${API_BASE_URL}/images/noimage.jpg`;
    }
    if (prod.imageUrl.startsWith('http://') || prod.imageUrl.startsWith('https://')) {
      return prod.imageUrl;
    }
    const clean = prod.imageUrl.startsWith('/') ? prod.imageUrl : `/images/${prod.imageUrl}`;
    return `${API_BASE_URL}${clean}`;
  };

  return (
    <div className="home-container">
      {/* Toast Alert */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            zIndex: 9999,
            fontWeight: 600,
            fontSize: '13.5px',
          }}
        >
          {notification}
        </div>
      )}

      {/* 2. MAIN HEADER */}
      <header className="main-header">
        <div className="main-header-inner">
          {/* Logo / Brand */}
          <a href="/home" className="brand-wrap">
            <div className="brand-logo-icon">💻</div>
            <div>
              <h1 className="brand-title">Tech Point</h1>
              <p className="brand-subtitle">Computer and IT Solutions</p>
            </div>
          </a>

          {/* Search Bar */}
          <div className="header-search-wrap">
            <input
              type="text"
              placeholder="Search for products, components, laptops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-btn" type="button">
              <span>🔍</span> Search
            </button>
          </div>


          {/* Action Area: Cart & Register / Login or Logout */}
          <div className="header-actions">
            <a
              href="/cart"
              className="action-icon-btn"
              title="View Cart"
            >
              <span>🛒</span>
              <span className="action-badge">{cartCount}</span>
            </a>

            {isLoggedIn ? (
              <div className="auth-header-links">
                {currentUserName && <span className="auth-user-name">{currentUserName}</span>}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="auth-header-btn logout-btn"
                  title="Sign out of your account"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-header-links">
                <a href="/login" className="auth-header-btn login-btn">Login</a>
                <span className="auth-sep">/</span>
                <a href="/register" className="auth-header-btn register-btn">Register</a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 5. SHOP BY CATEGORY SECTION */}
      <section className="section-wrapper">
        <div className="section-head">
          <div>
            <h3 className="section-title">Shop by Category</h3>
            <p className="section-sub">Find exactly what you need</p>
          </div>
          <button
            type="button"
            className="view-all-link"
            onClick={() => setSelectedCategory(null)}
          >
            View All Categories →
          </button>
        </div>

        <div className="categories-grid">
          {categories.length > 0 ? (
            categories.map((cat) => (
              <div
                key={cat.categoryId}
                className={`cat-card ${selectedCategory === cat.categoryId ? 'active' : ''}`}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat.categoryId ? null : cat.categoryId)
                }
              >
                <span className="cat-card-title">{cat.name}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', gridColumn: '1 / -1' }}>
              No categories found. Categories created in POS Admin will automatically appear here.
            </div>
          )}
        </div>
      </section>

      {/* 6. BEST SELLING PRODUCTS SECTION (Live DB Products) */}
      <section className="section-wrapper" id="products-section">
        <div className="section-head">
          <div>
            <h3 className="section-title">Our Best Selling Products</h3>
            <p className="section-sub">Top picks from our store</p>
          </div>
          <button
            type="button"
            className="view-all-link"
            onClick={() => setSelectedCategory(null)}
          >
            View All Products →
          </button>
        </div>

        <div className="products-showcase-grid">
          {filteredProducts.map((prod) => {
            const stock = getStock(prod.productId);
            const isOutOfStock = stock <= 0;

            return (
              <div
                key={prod.productId}
                className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
              >
                {/* Card Top: Stock Badge */}
                <div className="prod-card-header">
                  <div
                    className={`prod-stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}
                  >
                    <span className="stock-dot"></span>
                    <span>{stock} In Stock</span>
                  </div>
                </div>

                {/* Product Image (Large & Centered) */}
                <a
                  href={`/product/${prod.productId}`}
                  className="prod-image-wrapper"
                  title="View Product Details"
                >
                  <img
                    src={getProductImage(prod)}
                    alt={prod.productName}
                    className="prod-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `${API_BASE_URL}/images/noimage.jpg`;
                    }}
                    loading="lazy"
                  />
                </a>

                {/* Below Product Image: Name & Price */}
                <div className="prod-details">
                  <a
                    href={`/product/${prod.productId}`}
                    className="prod-name-link"
                    style={{ textDecoration: 'none' }}
                  >
                    <h4 className="prod-name" title={prod.productName}>
                      {prod.productName}
                    </h4>
                  </a>

                  <div className="prod-pricing">
                    <span className="prod-current-price">৳{prod.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Card Action: Add to Cart Button */}
                <button
                  type="button"
                  className="add-to-cart-btn"
                  disabled={isOutOfStock}
                  onClick={() => handleAddToCart(prod)}
                >
                  <span>🛒</span>
                  <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. WHY CHOOSE TECHPOINT POS */}
      <section className="section-wrapper">
        <div className="section-head">
          <div>
            <h3 className="section-title">Why Choose TechPoint POS?</h3>
            <p className="section-sub">Your satisfaction is our priority</p>
          </div>
        </div>

        <div className="why-choose-wrap">
          <div className="why-card">
            <div className="why-icon-box">🚀</div>
            <div>
              <h4 className="why-title">Fast & Reliable</h4>
              <p className="why-desc">Express delivery across Bangladesh</p>
            </div>
          </div>

          <div className="why-card">
            <div className="why-icon-box">🎧</div>
            <div>
              <h4 className="why-title">Expert Technical</h4>
              <p className="why-desc">24/7 dedicated support team</p>
            </div>
          </div>

          <div className="why-card">
            <div className="why-icon-box">🛡️</div>
            <div>
              <h4 className="why-title">Secure Shopping</h4>
              <p className="why-desc">100% safe & verified payments</p>
            </div>
          </div>

          <div className="why-card">
            <div className="why-icon-box">🔄</div>
            <div>
              <h4 className="why-title">Easy Returns</h4>
              <p className="why-desc">Hassle-free within 7 days</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="store-footer">
        <div className="footer-top">
          <div>
            <h3 className="footer-brand-title">TechPoint POS</h3>
            <p className="footer-brand-desc">
              Your Trusted Partner in Technology. Providing genuine computer hardware, laptops, and IT solutions.
            </p>
         
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="#products-section">Shop</a></li>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Customer Service</h4>
            <ul>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Shipping Info</a></li>
              <li><a href="#">Return Policy</a></li>
              <li><a href="#">Support</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contact Us</h4>
            <ul>
              <li>+880 1712 345678</li>
              <li>info@techpoint.com.bd</li>
              <li>Dhaka, Bangladesh</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Subscribe to Our Newsletter</h4>
            <p className="footer-newsletter-text">Get the latest deals and updates.</p>
            <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }}>
              <input
                type="email"
                placeholder="Your Email Address"
                required
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-btn">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <div>© 2026 TechPoint POS. All rights reserved.</div>
            <div className="payment-methods-strip">
              <span>💳 VISA</span>
              <span>💳 MasterCard</span>
              <span>📱 bKash</span>
              <span>📱 Nagad</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
