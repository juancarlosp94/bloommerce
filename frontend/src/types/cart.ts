
export interface CartItem {
  productId: number;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  active: boolean;
}

export interface CartState {
  items: CartItem[];
}
