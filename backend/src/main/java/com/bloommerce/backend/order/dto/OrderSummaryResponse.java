
package com.bloommerce.backend.order.dto;

import com.bloommerce.backend.order.Order;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record OrderSummaryResponse(
    Long id,
    String status,
    BigDecimal totalAmount,
    OffsetDateTime createdAt
) {
    public static OrderSummaryResponse fromEntity(Order order) {
        return new OrderSummaryResponse(
            order.getId(),
            order.getStatus().name(),
            order.getTotalAmount(),
            order.getCreatedAt()
        );
    }
}
