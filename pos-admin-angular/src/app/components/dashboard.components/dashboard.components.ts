import { Component, OnInit, OnDestroy, HostListener, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { Order } from '../../models/order';
import { Product } from '../../models/product';
import { Subscription, timer, merge, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface DailySales {
  label: string;
  dateStr: string;
  amount: number;
  ordersCount: number;
  percent: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.components.html',
  styleUrls: ['./dashboard.components.css']
})
export class DashboardComponents implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  // Modern Angular Signals for reactive UI
  totalSales = signal<number>(0);
  totalOrders = signal<number>(0);
  totalProducts = signal<number>(0);
  pendingOrders = signal<number>(0);
  avgOrderValue = signal<number>(0);
  recentOrders = signal<Order[]>([]);
  weeklySales = signal<DailySales[]>([]);
  isLoading = signal<boolean>(true);

  private refreshSub?: Subscription;

  ngOnInit(): void {
    // 1. Initial load
    this.loadData();

    // 2. Poll every 5 seconds + listen to in-memory sale events
    this.refreshSub = merge(
      timer(5000, 5000),
      this.orderService.orderCreated$
    ).subscribe(() => {
      this.loadData();
    });
  }

  // 3. Listen to cross-tab / window POS sales
  @HostListener('window:storage', ['$event'])
  onStorageChange(event: StorageEvent): void {
    if (event.key === 'pos_order_sync') {
      this.loadData();
    }
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  loadData(): void {
    this.orderService.getOrders().pipe(
      catchError((err) => {
        console.error('Error fetching dashboard orders:', err);
        return of(null);
      })
    ).subscribe((orders) => {
      if (orders !== null) {
        const sorted = [...orders].sort(
          (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
        const count = sorted.length;
        const sales = sorted.reduce((sum, o) => sum + (o.payableAmount || o.totalAmount || 0), 0);
        const pending = sorted.filter(o => o.status === 'Pending').length;
        const avg = count > 0 ? (sales / count) : 0;

        this.totalOrders.set(count);
        this.totalSales.set(sales);
        this.pendingOrders.set(pending);
        this.avgOrderValue.set(avg);
        this.recentOrders.set(sorted.slice(0, 5));

        // Compute 7-day live breakdown
        this.calculateWeeklySales(sorted);
      }
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });

    this.productService.getProducts().pipe(
      catchError((err) => {
        console.error('Error fetching dashboard products:', err);
        return of(null);
      })
    ).subscribe((products) => {
      if (products !== null) {
        this.totalProducts.set(products.length);
        this.cdr.markForCheck();
      }
    });
  }

  private calculateWeeklySales(orders: Order[]): void {
    const days: DailySales[] = [];
    const now = new Date();

    const getLocalDateKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // 1. Initialize last 7 days buckets
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = getLocalDateKey(d);
      const isToday = i === 0;
      const dayName = isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });

      days.push({
        label: dayName,
        dateStr,
        amount: 0,
        ordersCount: 0,
        percent: 0
      });
    }

    // 2. Aggregate real orders into their respective day
    for (const order of orders) {
      if (!order.orderDate) continue;
      const orderDateStr = getLocalDateKey(new Date(order.orderDate));
      const match = days.find(d => d.dateStr === orderDateStr);
      if (match) {
        match.amount += (order.payableAmount || order.totalAmount || 0);
        match.ordersCount += 1;
      }
    }

    // 3. Compute relative percentage height (max day = 100%)
    const maxAmount = Math.max(...days.map(d => d.amount), 0);
    for (const day of days) {
      day.percent = maxAmount > 0 ? Math.max(12, Math.round((day.amount / maxAmount) * 100)) : 12;
    }

    this.weeklySales.set(days);
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'confirmed':
      case 'paid':
        return 'paid';
      case 'pending':
        return 'partial';
      case 'cancelled':
      case 'failed':
        return 'due';
      default:
        return 'sold';
    }
  }
}
