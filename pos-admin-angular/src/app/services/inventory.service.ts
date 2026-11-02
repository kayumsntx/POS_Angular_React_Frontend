import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Inventory, LowStockResponse } from '../models/inventory';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private apiUrl = 'http://localhost:5109/api/Inventory';
  private http = inject(HttpClient);

  getInventories(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(this.apiUrl);
  }
  getLowStock(threshold: number): Observable<LowStockResponse> {
    return this.http.get<LowStockResponse>(`${this.apiUrl}/low-stock`, { params: { threshold } });
  }
  createInventory(productId: number, quantity: number): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/create`, { productId, quantity });
  }
  adjustQuantity(id: number, adjustment: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/adjust/${id}`, { adjustment });
  }
  deleteInventory(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
