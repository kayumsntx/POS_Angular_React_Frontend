export interface OrderItem {
  orderItemId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface DeliveryAddress {
  recipientName: string;
  phone: string;
  address: string;
}

export interface Order {
  orderId: number;
  userId?: number;
  orderType: string;      // 'Online' | 'POS'
  status: string;         // Pending | Approved | Cancelled | Confirmed
  orderDate: string;
  totalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  payableAmount: number;
  paymentMethod: string;  // Cash | Online
  paymentStatus: string;  // Unpaid | Paid | Failed | Cancelled
  paymentTransactionId?: string;
  deliveryAddress?: DeliveryAddress;
  items: OrderItem[];
}
