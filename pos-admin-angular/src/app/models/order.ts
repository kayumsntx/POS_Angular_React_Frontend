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

export enum PaymentMethodType {
  Cash = 1,
  Online = 2,
}

export interface OrderItemRequestDto {
  productId: number;
  quantity: number;
}

export interface CreateOrderDto {
  phone?: string;
  discountPercent: number;
  paymentMethod: PaymentMethodType;
  items: OrderItemRequestDto[];
  deliveryAddress?: DeliveryAddress;
}

export interface OrderResponseDto {
  orderId: number;
  userId?: number;
  phone?: string;
  orderType: string;
  status: string;
  orderDate: string;
  totalAmount: number;
  discountPercent: number;
  discountAmount: number;
  shippingAmount: number;
  payableAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentTransactionId?: string;
  gatewayPageURL?: string | null;
  items: OrderItem[];
}
