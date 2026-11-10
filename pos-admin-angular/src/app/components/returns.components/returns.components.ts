import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrderService } from '../../services/order.service';
import { ReturnService, CreateReturnRequest, ReturnResponse } from '../../services/return.service';

export interface ReturnProductRow {
  orderItemId: number;
  productId: number;
  productName: string;
  orderedQuantity: number;
  alreadyReturnedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  isReturn: boolean;
  returnQuantity: number;
  remark: string;
}

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './returns.components.html',
  styleUrls: ['./returns.components.css']
})
export class ReturnsComponents implements OnInit {
  private orderService = inject(OrderService);
  private returnService = inject(ReturnService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'process' | 'history' = 'process';

  // Process Return State
  searchOrderId: number | null = null;
  isLoadingOrder = false;
  orderData: any = null;
  productRows: ReturnProductRow[] = [];
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  // History State
  returnHistory: ReturnResponse[] = [];
  isLoadingHistory = false;
  selectedHistoryReturn: ReturnResponse | null = null;

  ngOnInit(): void {
    this.loadHistory();
  }

  setTab(tab: 'process' | 'history'): void {
    this.activeTab = tab;
    if (tab === 'history') {
      this.loadHistory();
    }
  }

  fetchOrder(): void {
    if (!this.searchOrderId || this.searchOrderId <= 0) {
      this.errorMessage = 'Please enter a valid Order ID.';
      return;
    }

    this.isLoadingOrder = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.productRows = [];
    this.orderData = null;

    const orderId = Number(this.searchOrderId);

    forkJoin({
      order: this.orderService.getOrderById(orderId),
      existingReturns: this.returnService.getReturnsByOrderId(orderId).pipe(
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ order, existingReturns }) => {
        this.isLoadingOrder = false;
        this.orderData = order;

        // Calculate already returned quantities
        const returnedMap: { [orderItemId: number]: number } = {};
        for (const ret of existingReturns || []) {
          for (const item of ret.items || []) {
            returnedMap[item.orderItemId] = (returnedMap[item.orderItemId] || 0) + (item.quantity || 0);
          }
        }

        const items = order.items || [];
        if (items.length === 0) {
          this.errorMessage = `Order #${orderId} contains no items.`;
          this.cdr.detectChanges();
          return;
        }

        this.productRows = items.map((item: any) => {
          const alreadyReturned = returnedMap[item.orderItemId] || 0;
          const remaining = Math.max(0, item.quantity - alreadyReturned);

          return {
            orderItemId: item.orderItemId,
            productId: item.productId,
            productName: item.productName,
            orderedQuantity: item.quantity,
            alreadyReturnedQuantity: alreadyReturned,
            remainingQuantity: remaining,
            unitPrice: item.unitPrice,
            isReturn: false,
            returnQuantity: remaining > 0 ? 1 : 0,
            remark: ''
          };
        });

        const allReturned = this.productRows.every(r => r.remainingQuantity <= 0);
        if (allReturned) {
          this.errorMessage = `All items in Order #${orderId} have already been fully returned.`;
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingOrder = false;
        this.errorMessage = err.error?.message || err.message || `Order #${orderId} not found.`;
        this.cdr.detectChanges();
      }
    });
  }

  onToggleItemReturn(row: ReturnProductRow): void {
    if (row.remainingQuantity <= 0) {
      row.isReturn = false;
      return;
    }
    if (row.isReturn && row.returnQuantity <= 0) {
      row.returnQuantity = 1;
    }
  }

  onReturnQuantityChange(row: ReturnProductRow): void {
    if (row.returnQuantity > row.remainingQuantity) {
      row.returnQuantity = row.remainingQuantity;
    }
    if (row.returnQuantity < 1) {
      row.returnQuantity = 1;
    }
  }

  get selectedReturnCount(): number {
    return this.productRows.filter(r => r.isReturn && r.returnQuantity > 0).length;
  }

  get totalRefundAmount(): number {
    return this.productRows
      .filter(r => r.isReturn && r.returnQuantity > 0)
      .reduce((sum, r) => sum + (r.unitPrice * r.returnQuantity), 0);
  }

  confirmReturn(): void {
    const selectedRows = this.productRows.filter(r => r.isReturn && r.returnQuantity > 0);
    if (selectedRows.length === 0) {
      this.errorMessage = 'Please select at least one item to return.';
      return;
    }

    for (const r of selectedRows) {
      if (r.returnQuantity > r.remainingQuantity) {
        this.errorMessage = `Return quantity for "${r.productName}" cannot exceed remaining returnable (${r.remainingQuantity}).`;
        return;
      }
    }

    const orderId = Number(this.searchOrderId);
    const confirmed = window.confirm(
      `Confirm Return for Order #${orderId}?\n` +
      `Items to return: ${selectedRows.length}\n` +
      `Total refund amount: ৳ ${this.totalRefundAmount.toFixed(2)}`
    );

    if (!confirmed) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: CreateReturnRequest = {
      orderId: orderId,
      items: selectedRows.map(r => ({
        orderItemId: r.orderItemId,
        quantity: r.returnQuantity,
        returnReason: r.remark?.trim() || 'Customer return'
      }))
    };

    this.returnService.createReturn(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = `Return #${res.returnId} processed successfully! Total Refund Amount: ৳ ${this.totalRefundAmount.toFixed(2)}`;

        // Broadcast catalog update so POS and online storefront update stock
        try {
          const ch = new BroadcastChannel('techpoint_catalog_sync');
          ch.postMessage({ type: 'catalog_updated', timestamp: Date.now() });
          ch.close();
        } catch {}

        this.productRows = [];
        this.orderData = null;
        this.loadHistory();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || err.message || 'Failed to process return.';
        this.cdr.detectChanges();
      }
    });
  }

  loadHistory(): void {
    this.isLoadingHistory = true;
    this.returnService.getReturns().subscribe({
      next: (data) => {
        this.isLoadingHistory = false;
        this.returnHistory = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingHistory = false;
        console.warn('Could not load return history:', err);
      }
    });
  }

  getReturnTotal(ret: ReturnResponse): number {
    return (ret.items || []).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  viewHistoryDetails(ret: ReturnResponse): void {
    this.selectedHistoryReturn = ret;
  }

  closeHistoryDetails(): void {
    this.selectedHistoryReturn = null;
  }
}

