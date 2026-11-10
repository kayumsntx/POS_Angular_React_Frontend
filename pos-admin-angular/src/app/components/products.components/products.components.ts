import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product, ProductDto } from '../../models/product';
import { Category } from '../../models/category';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-products',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './products.components.html',
})
export class ProductsComponents implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  isEditMode = signal<boolean>(false);
  editProductId = signal<number | null>(null);
  message = signal<string>('');
  productForm!: FormGroup;
  serverUrl = 'http://localhost:5109';

  ngOnInit(): void {
    this.productForm = this.fb.group({
      productName: ['', [Validators.required]],
      description: [''],
      barcode: ['', [Validators.required]],
      categoryId: [0, [Validators.required, Validators.min(1)]],
      cost: [0, [Validators.required, Validators.min(0.01)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
    });
    this.loadProducts();
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => this.showError(err),
    });
  }

  imageSrc(p: Product): string {
    return `${this.serverUrl}/images/${p.imageUrl || 'noimage.jpg'}`;
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => this.products.set(data),
      error: (err) => this.showError(err),
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    const dto: ProductDto = this.productForm.value;
    const file = this.selectedFile();
    const editId = this.editProductId();

    if (this.isEditMode() && editId !== null) {
      this.productService.updateProduct(editId, dto).subscribe({
        next: () => this.afterSave(editId, file),
        error: (err) => this.showError(err),
      });
    } else {
      this.productService.createProduct(dto).subscribe({
        next: (p) => this.afterSave(p.productId, file),
        error: (err) => this.showError(err),
      });
    }
  }


//for product img
    private afterSave(id: number, file: File | null): void {
    if (!file) {
      this.finish();
      return;
    }
    this.productService.uploadImage(id, file).subscribe({
      next: () => this.finish(),
      error: (err) => this.showError(err),
    });
  }

  private finish(): void {
    this.productService.notifyCatalogChanged();
    this.loadProducts();
    this.resetForm();
  }

  editProduct(p: Product): void {
    this.isEditMode.set(true);
    this.editProductId.set(p.productId);
    this.selectedFile.set(null);
    this.imagePreview.set(this.imageSrc(p));
    this.productForm.patchValue({
      productName: p.productName,
      description: p.description ?? '',
      barcode: p.barcode,
      categoryId: p.categoryId,
      cost: p.cost,
      price: p.price,
    });
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.productService.notifyCatalogChanged();
          this.loadProducts();
        },
        error: (err) => this.showError(err),
      });
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.message.set('not more than 2MB');
      return;
    }
    this.message.set('');
    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  resetForm(): void {
    this.isEditMode.set(false);
    this.editProductId.set(null);
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.message.set('');
    this.productForm.reset({ productName: '', description: '', barcode: '', categoryId: 0, cost: 0, price: 0 });
  }

  private showError(err: any): void {
    this.message.set(err.error?.message ?? 'Something went wrong');
  }
}
