import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product, ProductDto } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = 'http://localhost:5109/api/Products';
  private http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }
  createProduct(dto: ProductDto): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/create`, dto);
  }
  updateProduct(id: number, dto: ProductDto): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/update/${id}`, dto);
  }
  deleteProduct(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
  uploadImage(id: number, file: File): Observable<{ fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ fileName: string }>(`${this.apiUrl}/upload/${id}`, formData);
  }
}
