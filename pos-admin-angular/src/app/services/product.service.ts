import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Product, ProductDto } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = 'http://localhost:5109/api/Products';
  private http = inject(HttpClient);

  notifyCatalogChanged(): void {
    const timestamp = Date.now().toString();
    try {
      const channel = new BroadcastChannel('techpoint_catalog_sync');
      channel.postMessage({ type: 'PRODUCT_UPDATED', timestamp });
      channel.close();
    } catch {}
    window.dispatchEvent(new CustomEvent('techpoint_catalog_updated', { detail: { timestamp } }));
    localStorage.setItem('techpoint_catalog_version', timestamp);
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  createProduct(dto: ProductDto): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/create`, dto).pipe(
      tap(() => this.notifyCatalogChanged())
    );
  }

  updateProduct(id: number, dto: ProductDto): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/update/${id}`, dto).pipe(
      tap(() => this.notifyCatalogChanged())
    );
  }

  deleteProduct(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`).pipe(
      tap(() => this.notifyCatalogChanged())
    );
  }

  uploadImage(id: number, file: File): Observable<{ fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ fileName: string }>(`${this.apiUrl}/upload/${id}`, formData).pipe(
      tap(() => this.notifyCatalogChanged())
    );
  }
}
