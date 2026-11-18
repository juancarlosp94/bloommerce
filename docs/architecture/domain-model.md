# Bloommerce — Domain Model

## 1. Overview

Bloommerce uses a relational domain model implemented with Java, Spring Data JPA, Hibernate, and PostgreSQL.

The architecture prioritizes transactional consistency, maintainability, and simplicity while documenting potential improvements for future scalability.

The initial implementation focuses on product management, user authentication, order creation, and order history.

## 2. Core Entities

### 2.1 User

Represents a registered account in Bloommerce.

**Attributes**

| Attribute | Java Type | Constraints |
|---|---|---|
| id | Long | Primary key |
| firstName | String | Required |
| lastName | String | Required |
| email | String | Required, unique |
| passwordHash | String | Required |
| phone | String | Optional |
| role | UserRole (enum) | Required |
| active | Boolean | Required, defaults to true |
| createdAt | OffsetDateTime | Required |
| updatedAt | OffsetDateTime | Required |

**Responsibilities**

- Stores user registration and authentication information.
- Supports CUSTOMER and ADMIN roles.
- Maintains a one-to-many relationship with Order.
- Stores securely hashed passwords, never plaintext credentials.

The initial version supports one role per user. Multiple roles may be introduced later if needed.

### 2.2 Product

Represents a sellable item in the Bloommerce catalog.

**Attributes**

| Attribute | Java Type | Constraints |
|---|---|---|
| id | Long | Primary key |
| sku | String | Required, unique |
| name | String | Required |
| description | String | Optional |
| model | String | Optional |
| manufacturer | String | Optional |
| category | String | Required |
| price | BigDecimal | Required, nonnegative |
| stockQuantity | Integer | Required, nonnegative |
| active | Boolean | Required, defaults to true |
| createdAt | OffsetDateTime | Required |
| updatedAt | OffsetDateTime | Required |

**Responsibilities**

- Stores shared product catalog information.
- Supports search by name, category, and price range.
- Tracks available stock directly for the initial implementation.
- Implements soft deletion using the active attribute.
- Maintains relationships with historical OrderItem records.

Prices use decimal arithmetic to avoid floating-point precision issues.

### 2.3 Product Inheritance

Product is the parent entity for specialized product families.

Bloommerce uses the JPA SINGLE_TABLE inheritance strategy.

**ElectronicsProduct**

Specialized attributes:

- powerConsumptionWatts: BigDecimal (optional)
- warrantyMonths: Integer (optional)
- voltage: Integer (optional)

**ClothingProduct**

Specialized attributes:

- fabric: String (optional)
- size: String (optional)
- color: String (optional)

Hibernate uses a product_family discriminator column to identify the entity subclass.

The category attribute provides more specific classification, such as KEYBOARD, MONITOR, T_SHIRT, or JACKET.

Category values must be compatible with their product family.

The initial implementation stores all products in one database table. Subclass-specific columns are nullable where they do not apply to another product family.

### 2.4 Order

Represents a purchase created by an authenticated user.

**Attributes**

| Attribute | Java Type | Constraints |
|---|---|---|
| id | Long | Primary key |
| user | User | Required, many-to-one |
| totalAmount | BigDecimal | Required, nonnegative |
| status | OrderStatus (enum) | Required |
| createdAt | OffsetDateTime | Required |

**Responsibilities**

- Represents a customer's purchase.
- Maintains a many-to-one relationship with User.
- Contains one or more OrderItem records.
- Stores the total purchase amount calculated by the backend.
- Preserves the historical purchase record.

For the MVP, successfully created orders receive the CONFIRMED status.

Payment processing, shipping, cancellation, and return workflows are outside the initial implementation scope.

### 2.5 OrderItem

Represents a specific purchased product within an order.

**Attributes**

| Attribute | Java Type | Constraints |
|---|---|---|
| id | Long | Primary key |
| order | Order | Required, many-to-one |
| product | Product | Required, many-to-one |
| quantity | Integer | Required, greater than zero |
| unitPrice | BigDecimal | Required, nonnegative |

**Responsibilities**

- Associates an Order with a Product.
- Stores the quantity purchased.
- Preserves the unit price at the time of purchase.
- Allows an order to contain multiple different products.

Each product appears at most once within an order.

A unique constraint on (order_id, product_id) prevents duplicate product lines.

## 3. Entity Relationships

| Relationship | Cardinality |
|---|---|
| User → Order | One-to-many |
| Order → OrderItem | One-to-many |
| Product → OrderItem | One-to-many |
| OrderItem → Order | Many-to-one |
| OrderItem → Product | Many-to-one |

Each Order belongs to exactly one User.

Each Order contains at least one OrderItem as a business rule.

Each OrderItem references exactly one Product.

OrderItem replaces the need for a direct many-to-many mapping between Order and Product.

## 4. Inventory Management

The initial implementation stores stockQuantity directly in Product.

Adding an item to a shopping cart does not reserve inventory.

During checkout, the backend:

1. Validates product IDs and requested quantities.
2. Verifies product availability and current prices.
3. Uses atomic conditional updates to deduct inventory safely.
4. Creates the Order and associated OrderItems.
5. Commits the entire operation only when all required operations succeed.

Checkout runs within a single database transaction.

If any product has insufficient stock, the transaction rolls back, preventing partial inventory deductions and incomplete orders.

Database constraints prevent negative stock quantities.

## 5. Data Integrity and Validation

Bloommerce enforces validation at both application and database levels.

**Application validation**

- Required input fields must be provided.
- Product names and SKUs cannot be blank.
- Prices and stock quantities cannot be negative.
- Order item quantities must be positive.
- Email addresses must follow valid formatting rules.
- Only active products may be purchased.

**Database constraints**

- Primary keys uniquely identify records.
- User emails and product SKUs are unique.
- Foreign keys preserve entity relationships.
- NOT NULL constraints protect mandatory fields.
- CHECK constraints protect numeric values.
- Order items enforce unique product references within each order.

## 6. Historical Data

Products use soft deletion to preserve references from previous orders.

OrderItem stores historical purchase prices so changes to current catalog prices do not affect existing orders.

Order records are retained for purchase history.

For the initial implementation, orders are immutable after

## 7. Architecture Decisions

The following Architecture Decision Records (ADRs) document
the key technical decisions made for Bloommerce:

- [ADR-001: Product Inventory Management](../decisions/ADR-001-product-inventory.md)
- [ADR-002: Product Soft Deletion](../decisions/ADR-002-product-soft-deletion.md)
- [ADR-003: Inventory Concurrency and Reservation Strategy](../decisions/ADR-003-inventory-concurrency.md)