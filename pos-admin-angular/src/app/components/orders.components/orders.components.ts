import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order } from '../../models/order';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './orders.components.html',
})
export class OrdersComponents implements OnInit {
  private orderService = inject(OrderService);
  auth = inject(AuthService);

  orders = signal<Order[]>([]);
  selectedOrder = signal<Order | null>(null);
  filter = signal<string>('');
  message = signal<string>('');

  // Date Range Filter
  startDate = signal<string>('');
  endDate = signal<string>('');

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.message.set('');
    this.orderService.getOrders(this.filter()).subscribe({
      next: (data) =>
        this.orders.set(
          [...data].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()),
        ),
      error: (err) => this.showError(err),
    });
  }

  applyDateFilter(): void {
    const start = this.startDate();
    const end = this.endDate();

    if (!start || !end) {
      this.message.set('Please select both From Date and To Date.');
      return;
    }

    if (new Date(start) > new Date(end)) {
      this.message.set('From Date must be earlier than or equal to To Date.');
      return;
    }

    this.message.set('');
    this.orderService.getOrdersByDateRange(start, end).subscribe({
      next: (data) => {
        let sorted = [...data].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        if (this.filter()) {
          sorted = sorted.filter(o => 
            (o.status && o.status.toLowerCase() === this.filter().toLowerCase()) ||
            (o.paymentStatus && o.paymentStatus.toLowerCase() === this.filter().toLowerCase()) ||
            (o.orderType && o.orderType.toLowerCase() === this.filter().toLowerCase())
          );
        }
        this.orders.set(sorted);
      },
      error: (err) => this.showError(err)
    });
  }

  resetDateFilter(): void {
    this.startDate.set('');
    this.endDate.set('');
    this.filter.set('');
    this.message.set('');
    this.loadOrders();
  }

  exportToCsv(): void {
    const list = this.orders();
    if (!list || list.length === 0) {
      alert('No orders to export.');
      return;
    }

    const headers = [
      'Order ID',
      'Date',
      'Order Type',
      'Items Count',
      'Items Description',
      'Total Amount',
      'Discount Amount',
      'Shipping Amount',
      'Payable Amount',
      'Payment Method',
      'Payment Status',
      'Order Status'
    ];

    const rows = list.map((o) => [
      `"${o.orderId}"`,
      `"${o.orderDate ? new Date(o.orderDate).toLocaleString() : ''}"`,
      `"${o.orderType || ''}"`,
      o.items?.length || 0,
      `"${(o.items || []).map((i) => `${i.productName} (x${i.quantity})`).join('; ')}"`,
      (o.totalAmount || 0).toFixed(2),
      (o.discountAmount || 0).toFixed(2),
      (o.shippingAmount || 0).toFixed(2),
      (o.payableAmount || 0).toFixed(2),
      `"${o.paymentMethod || ''}"`,
      `"${o.paymentStatus || ''}"`,
      `"${o.status || ''}"`
    ]);

    // Prepend UTF-8 BOM (\uFEFF) so Excel displays unicode characters properly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const fromLabel = this.startDate() || 'start';
    const toLabel = this.endDate() || 'end';
    const filename = `Orders_Report_${fromLabel}_to_${toLabel}_${new Date().toISOString().slice(0, 10)}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  onFilterChange(event: Event): void {
    this.filter.set((event.target as HTMLSelectElement).value);
    if (this.startDate() && this.endDate()) {
      this.applyDateFilter();
    } else {
      this.loadOrders();
    }
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
