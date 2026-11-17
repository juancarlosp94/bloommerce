
package com.bloommerce.backend.order.dto;

import com.bloommerce.backend.order.Order;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record OrderResponse(
    Long id,
    String status,
    BigDecimal totalAmount,
    OffsetDateTime createdAt,
    List<OrderItemResponse> items
) {
    public static OrderResponse fromEntity(Order order) {
        return new OrderResponse(
            order.getId(),
            order.getStatus().name(),
            order.getTotalAmount(),
            order.getCreatedAt(),
            order.getItems()
                .stream()
                .map(OrderItemResponse::fromEntity)
                .toList()
        );
    }
}
