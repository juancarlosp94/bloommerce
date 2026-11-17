
package com.bloommerce.backend.order;

import com.bloommerce.backend.order.dto.CreateOrderRequest;
import com.bloommerce.backend.order.dto.OrderItemRequest;
import com.bloommerce.backend.product.Product;
import com.bloommerce.backend.product.ProductRepository;
import com.bloommerce.backend.user.User;
import com.bloommerce.backend.user.UserRepository;
import com.bloommerce.backend.order.dto.OrderResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.bloommerce.backend.order.dto.OrderResponse;
import com.bloommerce.backend.order.dto.OrderSummaryResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public OrderService(
        OrderRepository orderRepository,
        ProductRepository productRepository,
        UserRepository userRepository
    ) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Order checkout(
        String customerEmail,
        CreateOrderRequest request
    ) {
        User customer = userRepository
            .findByEmailIgnoreCase(customerEmail)
            .filter(User::isActive)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Customer account is unavailable"
            ));

        if (request == null
            || request.items() == null
            || request.items().isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Shopping cart cannot be empty"
            );
        }

        // TreeMap guarantees ascending product ID order.
        Map<Long, Integer> quantities = new TreeMap<>();

        for (OrderItemRequest item : request.items()) {
            if (item == null
                || item.productId() == null
                || item.productId() <= 0
                || item.quantity() <= 0) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid cart item"
                );
            }

            try {
                quantities.merge(
                    item.productId(),
                    item.quantity(),
                    Math::addExact
                );
            } catch (ArithmeticException exception) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested quantity is too large"
                );
            }
        }

        // Capture product references and prices.
        Map<Long, Product> products = new LinkedHashMap<>();
        Map<Long, BigDecimal> prices = new LinkedHashMap<>();

        for (Long productId : quantities.keySet()) {
            Product product = productRepository
                .findActiveByIdForUpdate(productId)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Product not found: " + productId
                ));

            products.put(productId, product);
            prices.put(productId, product.getPrice());
        }

        // Deduct stock atomically, in deterministic order.
        for (Map.Entry<Long, Integer> entry
            : quantities.entrySet()) {

            int updatedRows = productRepository.deductStock(
                entry.getKey(),
                entry.getValue()
            );

            if (updatedRows != 1) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Insufficient stock or unavailable product: "
                        + entry.getKey()
                );
            }
        }

        Order order = new Order(customer);
        BigDecimal total = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry
            : quantities.entrySet()) {

            Long productId = entry.getKey();
            int quantity = entry.getValue();

            BigDecimal unitPrice = prices.get(productId);

            BigDecimal subtotal = unitPrice.multiply(
                BigDecimal.valueOf(quantity)
            );

            total = total.add(subtotal);

            OrderItem orderItem = new OrderItem(
                products.get(productId),
                quantity,
                unitPrice
            );

            order.addItem(orderItem);
        }

        order.setTotalAmount(total);
        order.setStatus(OrderStatus.CONFIRMED);

        return orderRepository.saveAndFlush(order);
    }


    @Transactional
    public OrderResponse checkoutAndRespond(
        String customerEmail,
        CreateOrderRequest request
    ) {
        Order order = checkout(customerEmail, request);

        return OrderResponse.fromEntity(order);
    }



    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> findMyOrders(
        String customerEmail,
        Pageable pageable
    ) {
        Long userId = findActiveCustomer(customerEmail).getId();

        if (pageable.isUnpaged() || pageable.getPageSize() > 100) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Page size must be between 1 and 100"
            );
        }

        Set<String> allowedSortFields = Set.of(
            "id", "createdAt", "totalAmount", "status"
        );

        for (Sort.Order sort : pageable.getSort()) {
            if (!allowedSortFields.contains(sort.getProperty())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported sort field: " + sort.getProperty()
                );
            }
        }

        return orderRepository
            .findByUserId(userId, pageable)
            .map(OrderSummaryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public OrderResponse findMyOrderById(
        String customerEmail,
        Long orderId
    ) {
        Long userId = findActiveCustomer(customerEmail).getId();

        Order order = orderRepository
            .findByIdAndUserId(orderId, userId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Order not found"
            ));

        return OrderResponse.fromEntity(order);
    }

    private User findActiveCustomer(String email) {
        return userRepository.findByEmailIgnoreCase(email)
            .filter(User::isActive)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Customer account is unavailable"
            ));
    }

}
