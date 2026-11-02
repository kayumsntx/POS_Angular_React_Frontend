export interface Inventory {
  inventoryId: number;
  productId: number;
  productName: string;
  barcode?: string;
  categoryName?: string;
  quantity: number;
  updatedAt: string;
}

export interface LowStockResponse {
  threshold: number;
  count: number;
  items: Inventory[];
}
