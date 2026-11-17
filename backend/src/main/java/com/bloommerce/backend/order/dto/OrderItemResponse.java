
package com.bloommerce.backend.order.dto;

import com.bloommerce.backend.order.OrderItem;

import java.math.BigDecimal;

public record OrderItemResponse(
    Long productId,
    String productName,
    String sku,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal subtotal
) {
    public static OrderItemResponse fromEntity(OrderItem item) {
        return new OrderItemResponse(
            item.getProduct().getId(),
            item.getProduct().getName(),
            item.getProduct().getSku(),
            item.getQuantity(),
            item.getUnitPrice(),
            item.getUnitPrice().multiply(
                BigDecimal.valueOf(item.getQuantity())
            )
        );
    }
}
