
package com.bloommerce.backend.order;

import com.bloommerce.backend.order.dto.CreateOrderRequest;
import com.bloommerce.backend.order.dto.OrderItemRequest;
import com.bloommerce.backend.order.dto.OrderResponse;
import com.bloommerce.backend.order.dto.OrderSummaryResponse;
import com.bloommerce.backend.product.ElectronicsProduct;
import com.bloommerce.backend.product.Product;
import com.bloommerce.backend.product.ProductRepository;
import com.bloommerce.backend.user.User;
import com.bloommerce.backend.user.UserRepository;

import org.junit.jupiter.api.Test;

import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("integration")
@Testcontainers
class OrderIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres =
        new PostgreSQLContainer("postgres:17");

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    private User createCustomer() {
        String email = "customer-"
            + UUID.randomUUID()
            + "@example.com";

        User user = new User(
            "Test",
            "Customer",
            email,
            "test-only-hashed-password"
        );

        return userRepository.saveAndFlush(user);
    }

    private Product createProduct(
        String price,
        int stock
    ) {
        ElectronicsProduct product = new ElectronicsProduct(
            "SKU-" + UUID.randomUUID(),
            "Test Laptop",
            "Electronics",
            new BigDecimal(price),
            stock
        );

        product.setActive(true);

        return productRepository.saveAndFlush(product);
    }

    private CreateOrderRequest cart(
        Long productId,
        int quantity
    ) {
        return new CreateOrderRequest(
            List.of(
                new OrderItemRequest(
                    productId,
                    quantity
                )
            )
        );
    }

    @Test
    void shouldCreateOrderAndDeductStock() {
        User customer = createCustomer();
        Product product = createProduct("250.00", 10);

        Order order = orderService.checkout(
            customer.getEmail(),
            cart(product.getId(), 2)
        );

        assertNotNull(order.getId());
        assertEquals(
            OrderStatus.CONFIRMED,
            order.getStatus()
        );

        assertEquals(
            0,
            new BigDecimal("500.00").compareTo(
                order.getTotalAmount()
            )
        );

        assertEquals(1, order.getItems().size());
        assertEquals(2, order.getItems().getFirst().getQuantity());

        assertEquals(
            8,
            productRepository.findById(product.getId())
                .orElseThrow()
                .getStockQuantity()
        );
    }

    @Test
    void shouldMergeDuplicateProductIds() {
        User customer = createCustomer();
        Product product = createProduct("100.00", 10);

        CreateOrderRequest request = new CreateOrderRequest(
            List.of(
                new OrderItemRequest(product.getId(), 2),
                new OrderItemRequest(product.getId(), 3)
            )
        );

        Order order = orderService.checkout(
            customer.getEmail(),
            request
        );

        assertEquals(1, order.getItems().size());
        assertEquals(5, order.getItems().getFirst().getQuantity());

        assertEquals(
            0,
            new BigDecimal("500.00").compareTo(
                order.getTotalAmount()
            )
        );

        assertEquals(
            5,
            productRepository.findById(product.getId())
                .orElseThrow()
                .getStockQuantity()
        );
    }

    @Test
    void shouldRollbackEverythingWhenStockIsInsufficient() {
        User customer = createCustomer();

        Product available = createProduct("100.00", 10);
        Product insufficient = createProduct("50.00", 1);

        long originalOrderCount = orderRepository.count();

        CreateOrderRequest request = new CreateOrderRequest(
            List.of(
                new OrderItemRequest(available.getId(), 2),
                new OrderItemRequest(insufficient.getId(), 5)
            )
        );

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> orderService.checkout(
                customer.getEmail(),
                request
            )
        );

        assertEquals(
            HttpStatus.CONFLICT,
            exception.getStatusCode()
        );

        assertEquals(
            10,
            productRepository.findById(available.getId())
                .orElseThrow()
                .getStockQuantity()
        );

        assertEquals(
            1,
            productRepository.findById(insufficient.getId())
                .orElseThrow()
                .getStockQuantity()
        );

        assertEquals(originalOrderCount, orderRepository.count());
    }

    @Test
    void shouldRejectEmptyCart() {
        User customer = createCustomer();

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> orderService.checkout(
                customer.getEmail(),
                new CreateOrderRequest(List.of())
            )
        );

        assertEquals(
            HttpStatus.BAD_REQUEST,
            exception.getStatusCode()
        );
    }

    @Test
    void shouldPreservePurchaseTimePrice() {
        User customer = createCustomer();
        Product product = createProduct("199.99", 10);

        Order order = orderService.checkout(
            customer.getEmail(),
            cart(product.getId(), 2)
        );

        Product updatedProduct = productRepository
            .findById(product.getId())
            .orElseThrow();

        updatedProduct.setPrice(new BigDecimal("299.99"));
        productRepository.saveAndFlush(updatedProduct);

        OrderResponse details = orderService.findMyOrderById(
            customer.getEmail(),
            order.getId()
        );

        assertEquals(
            0,
            new BigDecimal("199.99").compareTo(
                details.items().getFirst().unitPrice()
            )
        );

        assertEquals(
            0,
            new BigDecimal("399.98").compareTo(
                details.totalAmount()
            )
        );
    }

    @Test
    void shouldPreventAccessToAnotherCustomersOrder() {
        User owner = createCustomer();
        User otherCustomer = createCustomer();

        Product product = createProduct("150.00", 10);

        Order order = orderService.checkout(
            owner.getEmail(),
            cart(product.getId(), 1)
        );

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> orderService.findMyOrderById(
                otherCustomer.getEmail(),
                order.getId()
            )
        );

        assertEquals(
            HttpStatus.NOT_FOUND,
            exception.getStatusCode()
        );

        Page<OrderSummaryResponse> otherHistory =
            orderService.findMyOrders(
                otherCustomer.getEmail(),
                PageRequest.of(0, 10)
            );

        assertTrue(otherHistory.isEmpty());
    }

    @Test
    void shouldPreventConcurrentOverselling() throws Exception {
        User firstCustomer = createCustomer();
        User secondCustomer = createCustomer();

        Product product = createProduct("99.00", 1);

        CountDownLatch start = new CountDownLatch(1);

        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<Boolean> first = executor.submit(() -> {
                start.await();

                try {
                    orderService.checkout(
                        firstCustomer.getEmail(),
                        cart(product.getId(), 1)
                    );
                    return true;
                } catch (ResponseStatusException ex) {
                    assertEquals(
                        HttpStatus.CONFLICT,
                        ex.getStatusCode()
                    );
                    return false;
                }
            });

            Future<Boolean> second = executor.submit(() -> {
                start.await();

                try {
                    orderService.checkout(
                        secondCustomer.getEmail(),
                        cart(product.getId(), 1)
                    );
                    return true;
                } catch (ResponseStatusException ex) {
                    assertEquals(
                        HttpStatus.CONFLICT,
                        ex.getStatusCode()
                    );
                    return false;
                }
            });

            start.countDown();

            boolean firstSucceeded =
                first.get(30, TimeUnit.SECONDS);

            boolean secondSucceeded =
                second.get(30, TimeUnit.SECONDS);

            // Exactly one checkout must succeed.
            assertNotEquals(firstSucceeded, secondSucceeded);

            assertEquals(
                0,
                productRepository.findById(product.getId())
                    .orElseThrow()
                    .getStockQuantity()
            );

            long successfulOrders =
                orderRepository.findByUserId(
                    firstCustomer.getId(),
                    PageRequest.of(0, 10)
                ).getTotalElements()
                    +
                    orderRepository.findByUserId(
                        secondCustomer.getId(),
                        PageRequest.of(0, 10)
                    ).getTotalElements();

            assertEquals(1, successfulOrders);

        } finally {
            start.countDown();
            executor.shutdownNow();
        }
    }


    @Test
    void shouldRejectInactiveProduct() {
        User customer = createCustomer();
        Product product = createProduct("100.00", 10);

        product.setActive(false);
        productRepository.saveAndFlush(product);

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> orderService.checkout(
                customer.getEmail(),
                cart(product.getId(), 1)
            )
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());

        assertEquals(
            10,
            productRepository.findById(product.getId())
                .orElseThrow()
                .getStockQuantity()
        );
    }

    @Test
    void shouldRejectInvalidQuantity() {
        User customer = createCustomer();
        Product product = createProduct("100.00", 10);

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> orderService.checkout(
                customer.getEmail(),
                cart(product.getId(), 0)
            )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());

        assertEquals(
            10,
            productRepository.findById(product.getId())
                .orElseThrow()
                .getStockQuantity()
        );
    }

    @Test
    void shouldRejectNonexistentProduct() {
        User customer = createCustomer();

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> orderService.checkout(
                customer.getEmail(),
                cart(Long.MAX_VALUE, 1)
            )
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void shouldPaginateOnlyCurrentCustomersOrders() {
        User customer = createCustomer();
        User otherCustomer = createCustomer();

        Product product = createProduct("50.00", 10);

        orderService.checkout(
            customer.getEmail(),
            cart(product.getId(), 1)
        );

        orderService.checkout(
            customer.getEmail(),
            cart(product.getId(), 1)
        );

        orderService.checkout(
            otherCustomer.getEmail(),
            cart(product.getId(), 1)
        );

        Page<OrderSummaryResponse> firstPage =
            orderService.findMyOrders(
                customer.getEmail(),
                PageRequest.of(
                    0,
                    1,
                    Sort.by("createdAt").descending()
                )
            );

        assertEquals(2, firstPage.getTotalElements());
        assertEquals(1, firstPage.getContent().size());
        assertEquals(2, firstPage.getTotalPages());
    }

}
