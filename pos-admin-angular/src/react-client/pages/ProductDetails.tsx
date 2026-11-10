import React, { useState, useEffect } from 'react';
import { cartService } from '../services/cartService';
import './ProductDetails.css';

const API_BASE_URL = 'http://localhost:5109';

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

export const ProductDetails: React.FC = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedImg, setSelectedImg] = useState<string>('');
  const [stock, setStock] = useState<number | null>(null);

  // Extract product ID from URL (/product/:id or ?id=...)
  useEffect(() => {
    const getProductIdFromUrl = (): number | null => {
      // 1. Try query param ?id=123
      const searchParams = new URLSearchParams(window.location.search);
      const queryId = searchParams.get('id');
      if (queryId && !isNaN(Number(queryId))) {
        return Number(queryId);
      }

      // 2. Try pathname /product/123
      const pathParts = window.location.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && !isNaN(Number(lastPart))) {
        return Number(lastPart);
      }

      const productIndex = pathParts.indexOf('product');
      if (productIndex !== -1 && pathParts[productIndex + 1]) {
        const id = Number(pathParts[productIndex + 1]);
        if (!isNaN(id)) return id;
      }

      return null;
    };

    const id = getProductIdFromUrl();
    if (!id) {
      setError('Product ID was not specified.');
      setLoading(false);
      return;
    }

    // Fetch actual live inventory stock
    const fetchInventory = (prodId: number) => {
      fetch(`${API_BASE_URL}/api/Inventory/product/${prodId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((inv) => {
          if (inv && typeof inv.quantity === 'number') {
            setStock(inv.quantity);
          } else {
            setStock(0);
          }
        })
        .catch(() => setStock(0));
    };

    setLoading(true);
    fetchInventory(id);
    fetch(`${API_BASE_URL}/api/Products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Product not found (Status ${res.status})`);
        return res.json();
      })
      .then((data: Product) => {
        setProduct(data);
        setSelectedImg(getProductImage(data));
        setLoading(false);
      })
      .catch((err) => {
        // Fallback: search in all products
        fetch(`${API_BASE_URL}/api/Products`)
          .then((res) => (res.ok ? res.json() : []))
          .then((all: Product[]) => {
            const found = all.find((p) => p.productId === id);
            if (found) {
              setProduct(found);
              setSelectedImg(getProductImage(found));
              setLoading(false);
            } else {
              setError(err.message || 'Product not found.');
              setLoading(false);
            }
          })
          .catch(() => {
            setError(err.message || 'Failed to load product details.');
            setLoading(false);
          });
      });
  }, []);

  function getProductImage(prod: { imageUrl?: string }): string {
    if (!prod?.imageUrl) {
      return `${API_BASE_URL}/images/noimage.jpg`;
    }
    if (prod.imageUrl.startsWith('http://') || prod.imageUrl.startsWith('https://')) {
      return prod.imageUrl;
    }
    const clean = prod.imageUrl.startsWith('/') ? prod.imageUrl : `/images/${prod.imageUrl}`;
    return `${API_BASE_URL}${clean}`;
  }

  const handleIncrement = () => {
    if (stock !== null && stock > 0 && quantity >= stock) {
      setNotification(`Only ${stock} items available in inventory.`);
      setTimeout(() => setNotification(null), 2500);
      return;
    }
    setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = () => {
    if (!product) return;

    cartService.addToCart(
      {
        productId: product.productId,
        productName: product.productName,
        barcode: product.barcode,
        categoryName: product.categoryName,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      quantity
    );

    setNotification(`Added ${quantity} x "${product.productName}" to cart! 🛒`);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleOrderNow = () => {
    if (!product) return;

    cartService.addToCart(
      {
        productId: product.productId,
        productName: product.productName,
        barcode: product.barcode,
        categoryName: product.categoryName,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      quantity || 1
    );

    // Directly navigate to http://localhost:4200/cart page as requested
    window.location.href = '/cart';
  };

  if (loading) {
    return (
      <div className="product-details-page-wrapper">
        <div className="pd-loading-card">
          <div className="pd-spinner">⏳</div>
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-page-wrapper">
        <div className="pd-error-card">
          <div className="pd-error-icon">⚠️</div>
          <h3>Product Not Found</h3>
          <p>{error || 'The requested product could not be found.'}</p>
          <a href="/home" className="pd-back-home-btn">
            ← Back to Store
          </a>
        </div>
      </div>
    );
  }

  const displayImage = selectedImg || getProductImage(product);

  return (
    <div className="product-details-page-wrapper">
      {/* Toast Alert */}
      {notification && (
        <div className="pd-toast-alert" role="alert">
          {notification}
        </div>
      )}

      {/* Main Product Card (Matching user mockup) */}
      <div className="pd-card-container">
        {/* Breadcrumb Navigation */}
        <div className="pd-breadcrumb">
          <a href="/home">Home</a>
          <span className="sep">/</span>
          {product.categoryName && (
            <>
              <span>{product.categoryName}</span>
              <span className="sep">/</span>
            </>
          )}
          <span className="current">{product.productName}</span>
        </div>

        <div className="pd-content-grid">
          {/* LEFT COLUMN: Main Image & Gallery */}
          <div className="pd-image-section">
            <div className="pd-main-img-box">
              <img
                src={displayImage}
                alt={product.productName}
                className="pd-main-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `${API_BASE_URL}/images/noimage.jpg`;
                }}
              />
            </div>

            {/* Thumbnail Strip */}
            <div className="pd-thumbnail-strip">
              <div
                className={`pd-thumb-item ${displayImage === getProductImage(product) ? 'active' : ''}`}
                onClick={() => setSelectedImg(getProductImage(product))}
              >
                <img src={getProductImage(product)} alt="Thumbnail 1" />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Info & Actions */}
          <div className="pd-info-section">
            <h1 className="pd-title">{product.productName}</h1>

            {/* Badges / Chips */}
            <div className="pd-badges-row">
              {product.categoryName && (
                <span className="pd-chip">{product.categoryName}</span>
              )}
              {product.barcode && (
                <span className="pd-chip">🏷️ {product.barcode}</span>
              )}
            </div>

            {/* Description (From database /products) */}
            <div className="pd-description">
              {product.description && product.description.trim() ? (
                <p>{product.description}</p>
              ) : (
                <p className="pd-no-desc">
                  High-quality authentic product with official manufacturer warranty and guaranteed durability.
                </p>
              )}
            </div>

            {/* Price (In bold red text as in mockup) */}
            <div className="pd-price-row">
              <span className="pd-price-bdt">BDT. {product.price.toFixed(2)}</span>
            </div>

            {/* Actual Inventory Stock Status */}
            {stock !== null && (
              <div
                className={`pd-stock-alert-banner ${
                  stock === 0 ? 'out-of-stock' : stock <= 5 ? 'low-stock' : 'in-stock'
                }`}
              >
                {stock === 0 ? (
                  <>
                    <span className="stock-icon">❌</span>
                    <span>Out of Stock (0 available in inventory)</span>
                  </>
                ) : stock <= 5 ? (
                  <>
                    <span className="stock-icon">⚠️</span>
                    <span>Limited Stock - Only {stock} left!</span>
                  </>
                ) : (
                  <>
                    <span className="stock-icon"></span>
                    <span>In Stock ({stock} available)</span>
                  </>
                )}
              </div>
            )}

            {/* Quantity Stepper (Matching mockup) */}
            <div className="pd-quantity-row">
              <span className="qty-label">Quantity:</span>
              <div className="pd-qty-stepper">
                <button
                  type="button"
                  className="qty-btn minus"
                  onClick={handleDecrement}
                  disabled={quantity <= 1 || stock === 0}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="qty-value">{stock === 0 ? 0 : quantity}</span>
                <button
                  type="button"
                  className="qty-btn plus"
                  onClick={handleIncrement}
                  disabled={stock === 0 || (stock !== null && quantity >= stock)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons (Matching mockup) */}
            <div className="pd-action-buttons-row">
              <button
                type="button"
                className="pd-btn-add-cart"
                onClick={handleAddToCart}
                disabled={stock === 0}
              >
                <span>🛒</span>
                <span>{stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>

              <button
                type="button"
                className="pd-btn-order-now"
                onClick={handleOrderNow}
                disabled={stock === 0}
              >
                <span>⚡</span>
                <span>{stock === 0 ? 'Out of Stock' : 'Order Now'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

