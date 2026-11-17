
package com.bloommerce.backend.auth;

import com.bloommerce.backend.user.User;
import com.bloommerce.backend.user.UserRepository;
import com.bloommerce.backend.user.UserRole;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.bloommerce.backend.product.Product;
import com.bloommerce.backend.product.ElectronicsProduct;
import com.bloommerce.backend.product.ProductRepository;

import java.math.BigDecimal;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("integration")
@Testcontainers
class SecurityIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:17");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtEncoder jwtEncoder;

    @Autowired
    private JwtDecoder jwtDecoder;

    private String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }

    private User createUser(UserRole role, boolean active) {
        User user = new User(
            "Test",
            "User",
            uniqueEmail(),
            passwordEncoder.encode("SecurePassword123!")
        );

        user.setRole(role);
        user.setActive(active);

        return userRepository.saveAndFlush(user);
    }


    private Product createOrderTestProduct(int stock) {
        ElectronicsProduct product = new ElectronicsProduct(
            "ORDER-TEST-" + UUID.randomUUID(),
            "Order Test Laptop",
            "Electronics",
            new BigDecimal("150.00"),
            stock
        );

        return productRepository.saveAndFlush(product);
    }

    private String orderRequestJson(Long productId, int quantity) {
        return """
            {
              "items": [
                {
                  "productId": %d,
                  "quantity": %d
                }
              ]
            }
            """.formatted(productId, quantity);
    }


    private String tokenFor(User user) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("bloommerce")
            .subject(user.getEmail())
            .issuedAt(now)
            .expiresAt(now.plusSeconds(3600))
            .claim("userId", user.getId())
            .claim("roles", List.of(user.getRole().name()))
            .build();

        return jwtEncoder.encode(
            JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                claims
            )
        ).getTokenValue();
    }

    private String expiredTokenFor(User user) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("bloommerce")
            .subject(user.getEmail())
            .issuedAt(now.minusSeconds(7200))
            .expiresAt(now.minusSeconds(3600))
            .claim("roles", List.of(user.getRole().name()))
            .build();

        return jwtEncoder.encode(
            JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                claims
            )
        ).getTokenValue();
    }

    private String productJson() {
        return """
                {
                  "productFamily": "ELECTRONICS",
                  "sku": "%s",
                  "name": "Test Laptop",
                  "category": "Computers",
                  "price": 1200.00,
                  "stockQuantity": 5,
                  "powerConsumptionWatts": 65.00,
                  "warrantyMonths": 24,
                  "voltage": 110
                }
                """.formatted("TEST-" + UUID.randomUUID());
    }


    @Test
    void shouldRejectAnonymousCheckout() throws Exception {
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                            {
                              "items": [
                                {
                                  "productId": 1,
                                  "quantity": 1
                                }
                              ]
                            }
                            """))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectAnonymousOrderHistory() throws Exception {
        mockMvc.perform(get("/api/orders"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/orders/1"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldAllowAuthenticatedCustomerCheckout() throws Exception {
        User customer = createUser(UserRole.CUSTOMER, true);
        Product product = createOrderTestProduct(10);

        mockMvc.perform(post("/api/orders")
                .header(
                    "Authorization",
                    "Bearer " + tokenFor(customer)
                )
                .contentType(MediaType.APPLICATION_JSON)
                .content(orderRequestJson(product.getId(), 2)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.totalAmount").value(300.00))
            .andExpect(jsonPath("$.items.length()").value(1))
            .andExpect(jsonPath("$.items[0].quantity").value(2))
            .andExpect(jsonPath("$.items[0].unitPrice").value(150.00));

        assertEquals(
            8,
            productRepository.findById(product.getId())
                .orElseThrow()
                .getStockQuantity()
        );
    }

    @Test
    void shouldAllowCustomerToViewOwnOrders() throws Exception {
        User customer = createUser(UserRole.CUSTOMER, true);
        Product product = createOrderTestProduct(10);

        String authorization = "Bearer " + tokenFor(customer);

        String response = mockMvc.perform(post("/api/orders")
                .header("Authorization", authorization)
                .contentType(MediaType.APPLICATION_JSON)
                .content(orderRequestJson(product.getId(), 1)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        Number orderId = com.jayway.jsonpath.JsonPath.read(
            response,
            "$.id"
        );

        mockMvc.perform(get("/api/orders/" + orderId.longValue())
                .header("Authorization", authorization))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(orderId.longValue()))
            .andExpect(jsonPath("$.totalAmount").value(150.00));

        mockMvc.perform(get("/api/orders")
                .header("Authorization", authorization))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].id")
                .value(orderId.longValue()));
    }

    @Test
    void shouldPreventViewingAnotherCustomersOrder() throws Exception {
        User owner = createUser(UserRole.CUSTOMER, true);
        User otherCustomer = createUser(UserRole.CUSTOMER, true);
        Product product = createOrderTestProduct(10);

        String response = mockMvc.perform(post("/api/orders")
                .header(
                    "Authorization",
                    "Bearer " + tokenFor(owner)
                )
                .contentType(MediaType.APPLICATION_JSON)
                .content(orderRequestJson(product.getId(), 1)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        Number orderId = com.jayway.jsonpath.JsonPath.read(
            response,
            "$.id"
        );

        String otherCustomerAuthorization =
            "Bearer " + tokenFor(otherCustomer);

        mockMvc.perform(get("/api/orders/" + orderId.longValue())
                .header(
                    "Authorization",
                    otherCustomerAuthorization
                ))
            .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/orders")
                .header(
                    "Authorization",
                    otherCustomerAuthorization
                ))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isEmpty());
    }


    @Test
    void shouldAllowPublicProductBrowsing() throws Exception {
        mockMvc.perform(get("/api/products"))
            .andExpect(status().isOk());
    }

    @Test
    void shouldRejectAnonymousProductCreation() throws Exception {
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectCustomerProductCreation() throws Exception {
        User customer = createUser(UserRole.CUSTOMER, true);

        mockMvc.perform(post("/api/products")
                .header(
                    "Authorization",
                    "Bearer " + tokenFor(customer)
                )
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson()))
            .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowAdminProductCreation() throws Exception {
        User admin = createUser(UserRole.ADMIN, true);

        mockMvc.perform(post("/api/products")
                .header(
                    "Authorization",
                    "Bearer " + tokenFor(admin)
                )
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.productFamily")
                .value("ELECTRONICS"));
    }

    @Test
    void shouldRejectUnauthenticatedProfileRequest()
        throws Exception {

        mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnAuthenticatedUserProfile()
        throws Exception {

        User customer = createUser(UserRole.CUSTOMER, true);

        mockMvc.perform(get("/api/auth/me")
                .header(
                    "Authorization",
                    "Bearer " + tokenFor(customer)
                ))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email")
                .value(customer.getEmail()))
            .andExpect(jsonPath("$.role")
                .value("CUSTOMER"))
            .andExpect(jsonPath("$.passwordHash")
                .doesNotExist());
    }

    @Test
    void shouldRejectExpiredJwt() throws Exception {
        User customer = createUser(UserRole.CUSTOMER, true);

        mockMvc.perform(get("/api/auth/me")
                .header(
                    "Authorization",
                    "Bearer " + expiredTokenFor(customer)
                ))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectTamperedJwt() throws Exception {
        User customer = createUser(UserRole.CUSTOMER, true);

        String token = tokenFor(customer);
        String[] parts = token.split("\\.");

        // Change the signed payload without updating its signature.
        String payload = parts[1];
        char first = payload.charAt(0);
        String changedPayload =
            (first == 'A' ? "B" : "A") + payload.substring(1);

        String tampered =
            parts[0] + "." + changedPayload + "." + parts[2];

        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + tampered))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectMalformedJwt() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                .header(
                    "Authorization",
                    "Bearer invalid.jwt.token"
                ))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectInactiveUserProfile() throws Exception {
        User customer = createUser(UserRole.CUSTOMER, false);

        mockMvc.perform(get("/api/auth/me")
                .header(
                    "Authorization",
                    "Bearer " + tokenFor(customer)
                ))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldDecodeValidSignedJwt() {
        User customer = createUser(UserRole.CUSTOMER, true);

        Jwt decoded = jwtDecoder.decode(tokenFor(customer));

        assertEquals(customer.getEmail(), decoded.getSubject());

        assertEquals(
            List.of("CUSTOMER"),
            decoded.getClaimAsStringList("roles")
        );
    }

    @Test
    void shouldRejectExpiredTokenDuringValidation() {
        User customer = createUser(UserRole.CUSTOMER, true);

        assertThrows(
            JwtException.class,
            () -> jwtDecoder.decode(expiredTokenFor(customer))
        );
    }


    @Test
    void shouldRegisterCustomerAndHashPassword() throws Exception {
        String email = uniqueEmail();

        String request = """
            {
              "firstName": "Jane",
              "lastName": "Doe",
              "email": "%s",
              "password": "SecurePassword123!",
              "phone": "3001234567"
            }
            """.formatted(email);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.role").value("CUSTOMER"))
            .andExpect(jsonPath("$.passwordHash").doesNotExist());

        User saved = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow();

        assertEquals(UserRole.CUSTOMER, saved.getRole());

        assertNotEquals(
            "SecurePassword123!",
            saved.getPasswordHash()
        );

        assertTrue(passwordEncoder.matches(
            "SecurePassword123!",
            saved.getPasswordHash()
        ));
    }

    @Test
    void shouldRejectDuplicateRegistration() throws Exception {
        User existing = createUser(UserRole.CUSTOMER, true);

        String request = """
            {
              "firstName": "Another",
              "lastName": "User",
              "email": "%s",
              "password": "SecurePassword123!"
            }
            """.formatted(existing.getEmail());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isConflict());
    }

    @Test
    void shouldLoginAndReceiveValidJwt() throws Exception {
        User customer = createUser(UserRole.CUSTOMER, true);

        String request = """
            {
              "email": "%s",
              "password": "SecurePassword123!"
            }
            """.formatted(customer.getEmail());

        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").exists())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.role").value("CUSTOMER"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        // Extract the token using the actual response field.
        String token = response
            .split("\"accessToken\":\"")[1]
            .split("\"")[0];

        Jwt decoded = jwtDecoder.decode(token);

        assertEquals(customer.getEmail(), decoded.getSubject());
    }

    @Test
    void shouldRejectIncorrectPassword() throws Exception {
        User customer = createUser(UserRole.CUSTOMER, true);

        String request = """
            {
              "email": "%s",
              "password": "WrongPassword123!"
            }
            """.formatted(customer.getEmail());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectLoginForInactiveUser() throws Exception {
        User customer = createUser(UserRole.CUSTOMER, false);

        String request = """
            {
              "email": "%s",
              "password": "SecurePassword123!"
            }
            """.formatted(customer.getEmail());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isUnauthorized());
    }


    @Test
    void shouldRejectCustomerProductUpdate() throws Exception {
        User customer = createUser(UserRole.CUSTOMER, true);

        mockMvc.perform(put("/api/products/1")
                .header(
                    "Authorization",
                    "Bearer " + tokenFor(customer)
                )
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson()))
            .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectCustomerProductDeletion() throws Exception {
        User customer = createUser(UserRole.CUSTOMER, true);

        mockMvc.perform(delete("/api/products/1")
                .header(
                    "Authorization",
                    "Bearer " + tokenFor(customer)
                ))
            .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowAdminProductUpdate() throws Exception {
        User admin = createUser(UserRole.ADMIN, true);

        String authorization = "Bearer " + tokenFor(admin);

        String response = mockMvc.perform(post("/api/products")
                .header("Authorization", authorization)
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson()))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        Number productId = com.jayway.jsonpath.JsonPath.read(
            response,
            "$.id"
        );

        mockMvc.perform(put("/api/products/" + productId.longValue())
                .header("Authorization", authorization)
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test Laptop"));
    }

    @Test
    void shouldAllowAdminProductDeletion() throws Exception {
        User admin = createUser(UserRole.ADMIN, true);

        String authorization = "Bearer " + tokenFor(admin);

        String response = mockMvc.perform(post("/api/products")
                .header("Authorization", authorization)
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson()))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        Number productId = com.jayway.jsonpath.JsonPath.read(
            response,
            "$.id"
        );

        mockMvc.perform(delete("/api/products/" + productId.longValue())
                .header("Authorization", authorization))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/products/" + productId.longValue()))
            .andExpect(status().isNotFound());
    }


    @Test
    void shouldRejectDeactivatedAdminWithExistingToken()
        throws Exception {

        User admin = createUser(UserRole.ADMIN, true);

        // Token was issued while the account was active.
        String token = tokenFor(admin);

        // Account is deactivated after token issuance.
        admin.setActive(false);
        userRepository.saveAndFlush(admin);

        mockMvc.perform(post("/api/products")
                .header(
                    "Authorization",
                    "Bearer " + token
                )
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson()))
            .andExpect(status().isUnauthorized());
    }


    @Test
    void shouldRejectDemotedAdminWithExistingToken()
        throws Exception {

        User admin = createUser(UserRole.ADMIN, true);

        // JWT still contains ADMIN.
        String oldAdminToken = tokenFor(admin);

        // Role changes in PostgreSQL.
        admin.setRole(UserRole.CUSTOMER);
        userRepository.saveAndFlush(admin);

        mockMvc.perform(post("/api/products")
                .header(
                    "Authorization",
                    "Bearer " + oldAdminToken
                )
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson()))
            .andExpect(status().isUnauthorized());
    }


    @Test
    void shouldRequireNewTokenAfterRolePromotion()
        throws Exception {

        User customer = createUser(UserRole.CUSTOMER, true);

        String oldCustomerToken = tokenFor(customer);

        // Account is promoted after token issuance.
        customer.setRole(UserRole.ADMIN);
        userRepository.saveAndFlush(customer);

        // Old CUSTOMER token must be rejected.
        mockMvc.perform(post("/api/products")
                .header(
                    "Authorization",
                    "Bearer " + oldCustomerToken
                )
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson()))
            .andExpect(status().isUnauthorized());

        // A newly issued ADMIN token should work.
        String newAdminToken = tokenFor(customer);

        mockMvc.perform(post("/api/products")
                .header(
                    "Authorization",
                    "Bearer " + newAdminToken
                )
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson()))
            .andExpect(status().isCreated());
    }




}
