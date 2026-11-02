import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CategoryDto } from '../models/category';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private apiUrl = 'http://localhost:5109/api/Category';
  private http = inject(HttpClient);

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }
  createCategory(dto: CategoryDto): Observable<unknown> {
    return this.http.post(this.apiUrl, dto);
  }
  updateCategory(id: number, dto: CategoryDto): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/update/${id}`, dto);
  }
  deleteCategory(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
