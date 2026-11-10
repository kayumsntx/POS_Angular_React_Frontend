import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ReturnItemRequest {
  orderItemId: number;
  quantity: number;
  returnReason?: string;
}

export interface CreateReturnRequest {
  orderId: number;
  items: ReturnItemRequest[];
}

export interface ReturnItemResponse {
  returnItemId: number;
  orderItemId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  returnReason?: string;
}

export interface ReturnResponse {
  returnId: number;
  orderId: number;
  returnDate: string;
  items: ReturnItemResponse[];
}

@Injectable({ providedIn: 'root' })
export class ReturnService {
  private apiUrl = 'http://localhost:5109/api/Return';
  private http = inject(HttpClient);

  getReturns(): Observable<ReturnResponse[]> {
    return this.http.get<ReturnResponse[]>(this.apiUrl);
  }

  getReturnById(id: number): Observable<ReturnResponse> {
    return this.http.get<ReturnResponse>(`${this.apiUrl}/${id}`);
  }

  getReturnsByOrderId(orderId: number): Observable<ReturnResponse[]> {
    return this.http.get<ReturnResponse[]>(`${this.apiUrl}/order/${orderId}`);
  }

  createReturn(dto: CreateReturnRequest): Observable<ReturnResponse> {
    return this.http.post<ReturnResponse>(this.apiUrl, dto);
  }
}

