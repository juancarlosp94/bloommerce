export interface OrderItemRequest {
  productId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  items: OrderItemRequest[];
}

export interface OrderItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderSummary {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface OrderPage {
  content: OrderSummary[];
  number: number;
  totalPages: number;
  totalElements: number;
  empty: boolean;
}
