import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../models/category';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-categories',
  imports: [ReactiveFormsModule],
  templateUrl: './categories.components.html',
})
export class CategoriesComponents implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);

  categories = signal<Category[]>([]);
  isEditMode = signal<boolean>(false);
  editCategoryId = signal<number | null>(null);
  message = signal<string>('');
  categoryForm!: FormGroup;

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
    });
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => this.showError(err),
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    const dto = this.categoryForm.value;
    const editId = this.editCategoryId();

    const request =
      this.isEditMode() && editId !== null
        ? this.categoryService.updateCategory(editId, dto)
        : this.categoryService.createCategory(dto);

    request.subscribe({
      next: () => {
        this.loadCategories();
        this.resetForm();
      },
      error: (err) => this.showError(err),
    });
  }

  editCategory(c: Category): void {
    this.isEditMode.set(true);
    this.editCategoryId.set(c.categoryId);
    this.categoryForm.patchValue({ name: c.name, description: c.description ?? '' });
  }

  deleteCategory(id: number): void {
    if (confirm('Are you sure to delete this category?')) {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => this.loadCategories(),
        error: (err) => this.showError(err),
      });
    }
  }

  resetForm(): void {
    this.isEditMode.set(false);
    this.editCategoryId.set(null);
    this.message.set('');
    this.categoryForm.reset({ name: '', description: '' });
  }

  private showError(err: any): void {
    this.message.set(err.error?.message ?? 'Something went wrong');
  }
}
