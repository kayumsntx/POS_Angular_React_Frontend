export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  barcode?: string;
  categoryName?: string;
  imageUrl?: string;
  quantity: number;
}

const CART_KEY = 'techpoint_cart';

export const cartService = {
  getCart(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveCart(items: CartItem[]): void {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event('techpoint_cart_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.warn('Failed to save cart to localStorage:', err);
    }
  },

  addToCart(
    product: {
      productId: number;
      productName: string;
      price: number;
      barcode?: string;
      categoryName?: string;
      imageUrl?: string;
    },
    quantity = 1
  ): CartItem[] {
    const current = this.getCart();
    const idx = current.findIndex((item) => item.productId === product.productId);

    if (idx > -1) {
      current[idx].quantity += quantity;
    } else {
      current.push({
        productId: product.productId,
        productName: product.productName,
        price: product.price,
        barcode: product.barcode,
        categoryName: product.categoryName,
        imageUrl: product.imageUrl,
        quantity: quantity > 0 ? quantity : 1,
      });
    }

    this.saveCart(current);
    return current;
  },

  updateQuantity(productId: number, quantity: number): CartItem[] {
    let current = this.getCart();
    if (quantity <= 0) {
      current = current.filter((item) => item.productId !== productId);
    } else {
      const item = current.find((i) => i.productId === productId);
      if (item) {
        item.quantity = quantity;
      }
    }
    this.saveCart(current);
    return current;
  },

  removeFromCart(productId: number): CartItem[] {
    const current = this.getCart().filter((item) => item.productId !== productId);
    this.saveCart(current);
    return current;
  },

  clearCart(): void {
    try {
      localStorage.removeItem(CART_KEY);
      window.dispatchEvent(new Event('techpoint_cart_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  },

  getTotals(items: CartItem[]): { totalCount: number; totalPrice: number } {
    return items.reduce(
      (acc, item) => {
        const qty = item.quantity > 0 ? item.quantity : 1;
        return {
          totalCount: acc.totalCount + qty,
          totalPrice: acc.totalPrice + item.price * qty,
        };
      },
      { totalCount: 0, totalPrice: 0 }
    );
  },
};

