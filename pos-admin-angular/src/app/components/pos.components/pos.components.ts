import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { InventoryService } from '../../services/inventory.service';
import { OrderService } from '../../services/order.service';
import { Product } from '../../models/product';
import { Category } from '../../models/category';
import { CreateOrderDto, PaymentMethodType } from '../../models/order';

export interface CartItem {
  product: Product;
  quantity: number;
  serialNumber?: string;
}

export interface InvoiceData {
  orderId: number;
  orderDate: string;
  phone?: string;
  transactionRef?: string;
  totalAmount: number;
  discountPercent: number;
  discountAmount: number;
  payableAmount: number;
  paymentMethod: any;
  paymentStatus: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pos.components.html',
  styleUrls: ['./pos.components.css']
})
export class PosComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private inventoryService = inject(InventoryService);
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Catalog State
  products: Product[] = [];
  categories: Category[] = [];
  inventoryStock: { [productId: number]: number } = {};
  isLoading = true;
  serverUrl = 'http://localhost:5109';

  getImageUrl(prod: Product): string {
    if (!prod?.imageUrl) {
      return `${this.serverUrl}/images/noimage.jpg`;
    }
    if (prod.imageUrl.startsWith('http://') || prod.imageUrl.startsWith('https://')) {
      return prod.imageUrl;
    }
    const clean = prod.imageUrl.startsWith('/') ? prod.imageUrl : `/images/${prod.imageUrl}`;
    return `${this.serverUrl}${clean}`;
  }

  onImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('noimage.jpg')) {
      target.src = `${this.serverUrl}/images/noimage.jpg`;
    }
  }

  // Filter & Search
  selectedCategoryId: number | null = null;
  searchQuery = '';
  barcodeInput = '';

  // Ticket / Cart State
  ticketItems: CartItem[] = [];
  customerPhone = '';
  customerName = 'Walk-in Customer';
  discountPercent = 0;
  taxRate = 0;

  // Payment Options (1 = Cash, 2 = Online)
  paymentType: PaymentMethodType = PaymentMethodType.Cash;
  transactionRef = '';
  isProcessing = false;
  errorMessage = '';
  successNotice = '';

  // Invoice Data for Auto-Print
  invoiceData: InvoiceData | null = null;

  ngOnInit(): void {
    this.loadCatalog();
    this.checkOnlinePaymentReturn();
  }

  loadCatalog(): void {
    this.isLoading = true;
    forkJoin({
      products: this.productService.getProducts().pipe(catchError(() => of([]))),
      categories: this.categoryService.getCategories().pipe(catchError(() => of([]))),
      inventories: this.inventoryService.getInventories().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ products, categories, inventories }) => {
        this.products = products || [];
        this.categories = categories || [];
        this.inventoryStock = {};
        for (const inv of inventories || []) {
          this.inventoryStock[inv.productId] = (this.inventoryStock[inv.productId] || 0) + (inv.quantity || 0);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Handle return from SSLCommerz: /pos?status=success&orderId=123
  private checkOnlinePaymentReturn(): void {
    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      const orderId = params['orderId'];

      if (status === 'success' && orderId) {
        this.successNotice = `Online payment successful for Order #${orderId}. Generating invoice...`;
        this.cdr.detectChanges();

        this.orderService.getOrderById(+orderId).subscribe({
          next: (order) => {
            this.invoiceData = {
              orderId: order.orderId,
              orderDate: order.orderDate,
              phone: order.deliveryAddress?.phone || this.customerPhone,
              transactionRef: order.paymentTransactionId,
              totalAmount: order.totalAmount,
              discountPercent: order.discountAmount ? Math.round((order.discountAmount / order.totalAmount) * 100) : 0,
              discountAmount: order.discountAmount || 0,
              payableAmount: order.payableAmount,
              paymentMethod: 'Online (SSLCommerz)',
              paymentStatus: order.paymentStatus || 'Paid',
              items: (order.items || []).map(i => ({
                productName: i.productName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                subtotal: i.subtotal || (i.quantity * i.unitPrice)
              }))
            };

            this.router.navigate([], { queryParams: {}, replaceUrl: true });
            this.cdr.detectChanges();

            setTimeout(() => {
              window.print();
            }, 300);
          },
          error: (err) => {
            console.error('Failed to load order for invoice print:', err);
          }
        });
      } else if (status === 'fail' || status === 'cancel') {
        this.errorMessage = `Online payment was ${status}ed. You can retry with Cash or another method.`;
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
        this.cdr.detectChanges();
      }
    });
  }

  getStock(productId: number): number {
    return this.inventoryStock[productId] ?? 0;
  }

  get filteredProducts(): Product[] {
    return this.products.filter(p => {
      const matchesCategory = this.selectedCategoryId === null || p.categoryId === this.selectedCategoryId;
      const q = this.searchQuery.trim().toLowerCase();
      const matchesQuery = !q ||
        p.productName.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
  }

  onBarcodeScan(): void {
    const raw = this.barcodeInput.trim().toLowerCase();
    if (!raw) return;

    const matched = this.products.find(p =>
      (p.barcode && p.barcode.toLowerCase() === raw) ||
      p.productName.toLowerCase() === raw ||
      p.productId.toString() === raw
    ) || this.products.find(p => p.productName.toLowerCase().includes(raw));

    if (matched) {
      this.addToTicket(matched);
      this.barcodeInput = '';
    } else {
      alert(`No product found for: "${this.barcodeInput}"`);
    }
  }

  addToTicket(product: Product): void {
    const stock = this.getStock(product.productId);
    if (stock <= 0) {
      alert(`"${product.productName}" is out of stock (0 available).`);
      return;
    }

    const existing = this.ticketItems.find(i => i.product.productId === product.productId);

    if (existing) {
      if (existing.quantity >= stock) {
        alert(`Cannot add more. Available stock limit reached: ${stock}`);
        return;
      }
      existing.quantity += 1;
    } else {
      this.ticketItems.push({
        product,
        quantity: 1,
        serialNumber: ''
      });
    }
    this.cdr.detectChanges();
  }

  incrementQuantity(item: CartItem): void {
    const stock = this.getStock(item.product.productId);
    if (item.quantity >= stock) {
      alert(`Cannot add more. Available stock limit reached: ${stock}`);
      return;
    }
    item.quantity += 1;
    this.cdr.detectChanges();
  }

  decrementQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      this.removeFromTicket(item);
    }
    this.cdr.detectChanges();
  }

  removeFromTicket(item: CartItem): void {
    this.ticketItems = this.ticketItems.filter(i => i !== item);
    this.cdr.detectChanges();
  }

  clearTicket(): void {
    this.ticketItems = [];
    this.discountPercent = 0;
    this.customerPhone = '';
    this.transactionRef = '';
    this.errorMessage = '';
    this.isProcessing = false;
    this.cdr.detectChanges();
  }

  // Financial calculations
  get subtotal(): number {
    return this.ticketItems.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  }

  get discountAmount(): number {
    if (this.discountPercent <= 0) return 0;
    return Math.round(this.subtotal * (this.discountPercent / 100) * 100) / 100;
  }

  get grandTotal(): number {
    return Math.max(0, this.subtotal - this.discountAmount);
  }

  get totalItemsCount(): number {
    return this.ticketItems.reduce((count, i) => count + i.quantity, 0);
  }

  // PROCESS SALE
  processSale(): void {
    if (this.ticketItems.length === 0) {
      alert('Please add at least one product to the ticket.');
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const payload: CreateOrderDto = {
      phone: this.customerPhone.trim() || undefined,
      discountPercent: this.discountPercent || 0,
      paymentMethod: this.paymentType,
      items: this.ticketItems.map(i => ({
        productId: i.product.productId,
        quantity: i.quantity
      }))
    };

    this.orderService.createOrder(payload).subscribe({
      next: (response) => {
        try { localStorage.setItem('pos_order_sync', Date.now().toString()); } catch {}

        // 1. ONLINE PAYMENT FLOW (SSLCOMMERZ)
        if (this.paymentType === PaymentMethodType.Online) {
          this.isProcessing = false;
          this.cdr.detectChanges();
          if (response.gatewayPageURL) {
            window.location.href = response.gatewayPageURL;
            return;
          } else {
            this.errorMessage = 'Could not initialize SSLCommerz gateway session.';
            return;
          }
        }

        // 2. CASH / MANUAL FLOW
        // Populate invoice data for the print template
        this.invoiceData = {
          orderId: response.orderId,
          orderDate: response.orderDate || new Date().toISOString(),
          phone: this.customerPhone || undefined,
          transactionRef: this.transactionRef.trim() || undefined,
          totalAmount: response.totalAmount,
          discountPercent: response.discountPercent,
          discountAmount: response.discountAmount,
          payableAmount: response.payableAmount,
          paymentMethod: 'Cash',
          paymentStatus: response.paymentStatus || 'Paid',
          items: this.ticketItems.map(i => ({
            productName: i.product.productName,
            quantity: i.quantity,
            unitPrice: i.product.price,
            subtotal: i.product.price * i.quantity
          }))
        };

        // Update in-memory inventory
        for (const item of this.ticketItems) {
          if (this.inventoryStock[item.product.productId] !== undefined) {
            this.inventoryStock[item.product.productId] = Math.max(
              0,
              this.inventoryStock[item.product.productId] - item.quantity
            );
          }
        }

        // Reset cart and processing state IMMEDIATELY before printing
        this.isProcessing = false;
        this.ticketItems = [];
        this.discountPercent = 0;
        this.customerPhone = '';
        this.transactionRef = '';
        this.errorMessage = '';

        // Force Angular to instantly repaint the empty cart & reset button
        this.cdr.detectChanges();

        // Trigger browser print dialog
        setTimeout(() => {
          window.print();
        }, 250);
      },
      error: (err) => {
        this.isProcessing = false;
        this.errorMessage = err.error?.message || err.message || 'Failed to complete order. Please check connection.';
        this.cdr.detectChanges();
      }
    });
  }
}
