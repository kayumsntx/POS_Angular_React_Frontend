import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Order } from '../../models/order';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-orders',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './orders.components.html',
})
export class OrdersComponents implements OnInit {
  private orderService = inject(OrderService);
  auth = inject(AuthService);

  orders = signal<Order[]>([]);
  selectedOrder = signal<Order | null>(null);
  filter = signal<string>('');
  message = signal<string>('');

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getOrders(this.filter()).subscribe({
      next: (data) =>
        this.orders.set(
          [...data].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()),
        ),
      error: (err) => this.showError(err),
    });
  }

  onFilterChange(event: Event): void {
    this.filter.set((event.target as HTMLSelectElement).value);
    this.loadOrders();
  }

  viewOrder(id: number): void {
    this.orderService.getOrderById(id).subscribe({
      next: (o) => this.selectedOrder.set(o),
      error: (err) => this.showError(err),
    });
  }

  closeDetails(): void {
    this.selectedOrder.set(null);
  }

  approve(id: number): void {
    if (confirm('Approve this order?')) {
      this.orderService.approveOrder(id).subscribe({
        next: () => this.refresh(),
        error: (err) => this.showError(err),
      });
    }
  }

  cancel(id: number): void {
    if (confirm('Cancel this order? Stock will be restored.')) {
      this.orderService.cancelOrder(id).subscribe({
        next: () => this.refresh(),
        error: (err) => this.showError(err),
      });
    }
  }

  private refresh(): void {
    this.message.set('');
    this.selectedOrder.set(null);
    this.loadOrders();
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-success';
      case 'Pending': return 'bg-warning text-dark';
      case 'Cancelled': return 'bg-secondary';
      default: return 'bg-info text-dark';
    }
  }

  payClass(status: string): string {
    switch (status) {
      case 'Paid': return 'bg-success';
      case 'Unpaid': return 'bg-warning text-dark';
      case 'Failed': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  private showError(err: any): void {
    this.message.set(err.error?.message ?? 'Something went wrong');
  }
}
