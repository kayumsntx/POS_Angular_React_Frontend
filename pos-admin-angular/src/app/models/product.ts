export interface Product {
  productId: number;
  productName: string;
  description?: string;
  barcode: string;
  categoryId: number;
  categoryName: string;
  cost: number;
  price: number;
  imageUrl?: string;
  createdAt: string;
}

export interface ProductDto {
  productName: string;
  description?: string;
  barcode: string;
  categoryId: number;
  cost: number;
  price: number;
}
