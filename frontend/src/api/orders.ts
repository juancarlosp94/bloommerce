
import { apiRequest } from "./http";

import type {
  CreateOrderRequest,
  Order,
  OrderPage,
} from "../types/order";

export function createOrder(
  request: CreateOrderRequest,
  token: string,
): Promise<Order> {
  return apiRequest<Order>("/orders", {
    method: "POST",
    token,
    body: request,
  });
}

export function getOrders(
  token: string,
  page = 0,
): Promise<OrderPage> {
  return apiRequest<OrderPage>(
    `/orders?page=${page}&size=10&sort=createdAt,desc`,
    { token },
  );
}

export function getOrderById(
  id: number,
  token: string,
): Promise<Order> {
  return apiRequest<Order>(`/orders/${id}`, {
    token,
  });
}
