import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { Order, CreateOrderDto, OrderResponseDto } from '../models/order';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = 'http://localhost:5109/api/Order';
  private http = inject(HttpClient);

  // Real-time sale event emitter
  private orderCreatedSubject = new Subject<void>();
  public orderCreated$ = this.orderCreatedSubject.asObservable();

  notifyOrderCreated(): void {
    this.orderCreatedSubject.next();
  }

  getOrders(status?: string): Observable<Order[]> {
    if (status) {
      return this.http.get<Order[]>(`${this.apiUrl}/search`, { params: { status } });
    }
    return this.http.get<Order[]>(this.apiUrl);
  }

  getOrdersByDateRange(startDate: string, endDate: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/date-range`, {
      params: { startDate, endDate }
    });
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  createOrder(dto: CreateOrderDto): Observable<OrderResponseDto> {
    return this.http.post<OrderResponseDto>(this.apiUrl, dto).pipe(
      tap(() => this.notifyOrderCreated())
    );
  }

  approveOrder(id: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/${id}/approve`, {}).pipe(
      tap(() => this.notifyOrderCreated())
    );
  }

  cancelOrder(id: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/${id}/cancel`, {}).pipe(
      tap(() => this.notifyOrderCreated())
    );
  }
}
