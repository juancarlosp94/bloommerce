
package com.bloommerce.backend.order;

import com.bloommerce.backend.order.dto.CreateOrderRequest;
import com.bloommerce.backend.order.dto.OrderResponse;
import com.bloommerce.backend.order.dto.OrderSummaryResponse;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }


    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse checkout(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody CreateOrderRequest request
    ) {
        return orderService.checkoutAndRespond(
            jwt.getSubject(),
            request
        );
    }

    @GetMapping
    public Page<OrderSummaryResponse> findMyOrders(
        @AuthenticationPrincipal Jwt jwt,
        @PageableDefault(
            size = 10,
            sort = "createdAt",
            direction = org.springframework.data.domain.Sort.Direction.DESC
        )
        Pageable pageable
    ) {
        return orderService.findMyOrders(
            jwt.getSubject(),
            pageable
        );
    }

    @GetMapping("/{id}")
    public OrderResponse findMyOrderById(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable Long id
    ) {
        return orderService.findMyOrderById(
            jwt.getSubject(),
            id
        );
    }
}
