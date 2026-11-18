# Bloommerce — REST API Reference

## Overview

Bloommerce exposes a REST API built with Java 21, Spring Boot 4.1.2, Spring MVC, and Spring Security.

The API supports customer authentication, product management, checkout, and order history.

**Base URL:** `http://localhost:8080/api`

**Swagger UI:** http://localhost:8080/swagger-ui/index.html

**OpenAPI specification:** http://localhost:8080/v3/api-docs

All requests and responses use JSON unless otherwise specified.

## 1. Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a customer |
| POST | `/auth/login` | Public | Authenticate and obtain JWT |
| GET | `/auth/me` | Authenticated | Retrieve current user |

### Login request

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

### Login response

```json
{
  "accessToken": "<signed-jwt>",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "userId": 1,
  "email": "john@example.com",
  "role": "CUSTOMER"
}
```

Authenticated endpoints require the HTTP header:

```http
Authorization: Bearer <access-token>
```

For registration details, JWT validation, and role-based access control, see [Authentication and Authorization](../authentication.md).

## 2. Products

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/products` | Public | List and filter active products |
| GET | `/products/{id}` | Public | Retrieve product details |
| POST | `/products` | ADMIN | Create a product |
| PUT | `/products/{id}` | ADMIN | Update a product |
| DELETE | `/products/{id}` | ADMIN | Soft-delete a product |

### Product listing

**GET `/api/products`**

Supported query parameters:

| Parameter | Description |
|---|---|
| `name` | Filter by product name |
| `category` | Filter by category |
| `minPrice` | Minimum price |
| `maxPrice` | Maximum price |
| `page` | Zero-based page number |
| `size` | Page size |
| `sort` | Sorting field and direction |

Example:

```http
GET /api/products?category=Laptops&minPrice=500&page=0&size=12&sort=price,asc
```

Returns `200 OK` with a paginated product response.

Inactive products are excluded from the public catalog.

### Create an electronics product

**POST `/api/products`**

Requires an ADMIN JWT.

```json
{
  "productFamily": "ELECTRONICS",
  "sku": "BM-LAP-002",
  "name": "Developer Laptop",
  "description": "Laptop for software development",
  "model": "DEV-2026",
  "manufacturer": "BloomTech",
  "category": "Laptops",
  "price": 1499.99,
  "stockQuantity": 10,
  "powerConsumptionWatts": 90,
  "warrantyMonths": 24,
  "voltage": 110
}
```

A successful request returns `201 Created`, including the created product and its ID.

### Create a clothing product

**POST `/api/products`**

```json
{
  "productFamily": "CLOTHING",
  "sku": "BM-TSH-002",
  "name": "Developer T-Shirt",
  "description": "Cotton T-shirt",
  "manufacturer": "BloomWear",
  "category": "T-Shirts",
  "price": 29.99,
  "stockQuantity": 20,
  "fabric": "Cotton",
  "size": "M",
  "color": "Black"
}
```

### Update a product

**PUT `/api/products/{id}`**

Requires an ADMIN JWT and a valid product request body.

Returns `200 OK` on successful update.

### Delete a product

**DELETE `/api/products/{id}`**

Requires an ADMIN JWT.

Returns `204 No Content`.

Deletion is implemented as soft deletion. Historical order references are preserved.

## 3. Orders and Checkout

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/orders` | Authenticated | Create a confirmed order |
| GET | `/orders` | Authenticated | Retrieve own order history |
| GET | `/orders/{id}` | Order owner | Retrieve an order |

### Create an order

**POST `/api/orders`**

```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 3,
      "quantity": 1
    }
  ]
}
```

The request contains only product IDs and quantities.

The backend determines current prices and validates inventory.

A successful request returns `201 Created`.

### Example order response

Illustrative values:

```json
{
  "id": 10,
  "status": "CONFIRMED",
  "totalAmount": 2749.97,
  "createdAt": "2026-11-17T20:30:00Z",
  "items": [
    {
      "productId": 1,
      "productName": "Gaming Laptop Pro",
      "sku": "BM-LAP-001",
      "quantity": 2,
      "unitPrice": 1299.99,
      "subtotal": 2599.98
    },
    {
      "productId": 3,
      "productName": "Wireless Headphones",
      "sku": "BM-ACC-001",
      "quantity": 1,
      "unitPrice": 149.99,
      "subtotal": 149.99
    }
  ]
}
```

### Checkout behavior

Checkout is processed within a database transaction.

The backend:

1. Authenticates the customer.
2. Validates the shopping cart.
3. Merges duplicate product IDs.
4. Retrieves and locks products in ascending ID order.
5. Validates inventory through conditional stock deductions.
6. Calculates order totals using `BigDecimal`.
7. Persists the order and its items.
8. Commits the transaction.

If a required operation fails, the transaction rolls back.

### Order history

**GET `/api/orders?page=0&size=10&sort=createdAt,desc`**

Returns a paginated collection of orders belonging to the authenticated user.

### Order details

**GET `/api/orders/{id}`**

Returns the order and its purchased items.

Only the owner can retrieve the order. Requests for another customer's orders return `404 Not Found`.

Purchase-time unit prices are preserved even when current catalog prices change.

## 4. HTTP Status Codes

| Status | Meaning |
|---|---|
| `200 OK` | Successful retrieval or update |
| `201 Created` | Product, account, or order created |
| `204 No Content` | Product soft deletion successful |
| `400 Bad Request` | Invalid request or validation failure |
| `401 Unauthorized` | Missing or invalid authentication |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Resource missing, inactive, or inaccessible |
| `409 Conflict` | Duplicate resource or insufficient inventory |

The actual error response body may vary depending on the failure and Spring Boot error handling.

## 5. Swagger Authentication

To test protected endpoints:

1. Start the Spring Boot backend.
2. Open http://localhost:8080/swagger-ui/index.html.
3. Execute `POST /api/auth/login`.
4. Copy the returned access token.
5. Click **Authorize**.
6. Enter the JWT in the Bearer authentication field.
7. Execute a protected endpoint.

Customer accounts cannot perform administrator-only product management operations.

## 6. API Testing

Example public request:

```bash
curl -i http://localhost:8080/api/products
```

Example protected request:

```bash
curl -i http://localhost:8080/api/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

The backend also includes automated integration tests using MockMvc and PostgreSQL Testcontainers.

See [Testing Strategy](../TESTING.md).

## 7. Limitations

- Payment gateway integration is not implemented.
- Shipping and order cancellation endpoints are not implemented.
- Inventory is not reserved when products are added to the cart.
- JWT refresh and revocation endpoints are not implemented.
- API pagination response formats may require stabilization before introducing public versioning.
