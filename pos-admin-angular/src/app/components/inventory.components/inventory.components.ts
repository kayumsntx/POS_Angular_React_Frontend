import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Inventory } from '../../models/inventory';
import { Product } from '../../models/product';
import { InventoryService } from '../../services/inventory.service';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-inventory',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './inventory.components.html',
})
export class InventoryComponents implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  auth = inject(AuthService);

  inventories = signal<Inventory[]>([]);
  products = signal<Product[]>([]);
  showLowStock = signal<boolean>(false);
  threshold = signal<number>(10);
  message = signal<string>('');
  stockForm!: FormGroup;

  ngOnInit(): void {
    this.stockForm = this.fb.group({
      productId: [0, [Validators.required, Validators.min(1)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
    });
    this.productService.getProducts().subscribe({
      next: (data) => this.products.set(data),
      error: (err) => this.showError(err),
    });
    this.loadInventories();
  }

  loadInventories(): void {
    if (this.showLowStock()) {
      this.inventoryService.getLowStock(this.threshold()).subscribe({
        next: (res) => this.inventories.set(res.items),
        error: (err) => this.showError(err),
      });
    } else {
      this.inventoryService.getInventories().subscribe({
        next: (data) => this.inventories.set(data),
        error: (err) => this.showError(err),
      });
    }
  }

  toggleLowStock(): void {
    this.showLowStock.set(!this.showLowStock());
    this.loadInventories();
  }

  onThresholdChange(event: Event): void {
    this.threshold.set(Number((event.target as HTMLInputElement).value));
    this.loadInventories();
  }

  onSubmit(): void {
    if (this.stockForm.invalid) {
      this.stockForm.markAllAsTouched();
      return;
    }
    const { productId, quantity } = this.stockForm.value;
    this.inventoryService.createInventory(productId, quantity).subscribe({
      next: () => {
        this.message.set('');
        this.stockForm.reset({ productId: 0, quantity: 0 });
        this.loadInventories();
      },
      error: (err) => this.showError(err),
    });
  }

  adjust(i: Inventory): void {
    const input = prompt(`${i.productName}: How much will you add/subtract? (e.g., 5 or -3)`);
    if (input === null) return;
    const adjustment = Number(input);
    if (!adjustment) return; // if 0 or wrong nothing happen
    this.inventoryService.adjustQuantity(i.inventoryId, adjustment).subscribe({
      next: () => this.loadInventories(),
      error: (err) => this.showError(err),
    });
  }

  deleteInventory(id: number): void {
    if (confirm('Are you sure to delete this stock record?')) {
      this.inventoryService.deleteInventory(id).subscribe({
        next: () => this.loadInventories(),
        error: (err) => this.showError(err),
      });
    }
  }

  private showError(err: any): void {
    this.message.set(err.error?.message ?? 'Something went wrong');
  }
}
