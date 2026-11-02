import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Order } from '../models/order';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = 'http://localhost:5109/api/Order';
  private http = inject(HttpClient);

  getOrders(status?: string): Observable<Order[]> {
    if (status) {
      return this.http.get<Order[]>(`${this.apiUrl}/search`, { params: { status } });
    }
    return this.http.get<Order[]>(this.apiUrl);
  }
  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }
  approveOrder(id: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/${id}/approve`, {});
  }
  cancelOrder(id: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/${id}/cancel`, {});
  }
}
