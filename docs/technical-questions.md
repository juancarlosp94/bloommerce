# Bloommerce — Technical Questions

## 1. What is the Repository Pattern, and why is it useful?

The Repository Pattern separates persistence logic from business logic by providing an abstraction for accessing and manipulating data.

Its main responsibility is to handle operations such as retrieving, saving, updating, and deleting entities without exposing database implementation details to the business layer.

In Bloommerce, I use Spring Data JPA to implement this pattern. For example, `ProductRepository` provides database access methods, while `ProductService` handles product validation, business rules, and inventory-related operations.

The application follows this structure:

```text
ProductController
       |
       v
ProductService
       |
       v
ProductRepository
       |
       v
PostgreSQL
```

This separation improves maintainability, testability, and code organization. It also allows me to unit-test business logic using mocked repositories and verify persistence behavior separately through integration tests.

## 2. What is the difference between JPA and Hibernate?

JPA (Jakarta Persistence API) is a specification that defines how Java objects can be mapped to relational database tables.

Hibernate is an ORM framework that implements the Jakarta Persistence specification and provides the underlying persistence functionality.

Spring Data JPA builds on top of JPA, simplifying data access through repository interfaces and automatically generated implementations.

| Technology | Responsibility |
|---|---|
| JPA | Defines persistence standards, interfaces, and entity annotations |
| Hibernate | Implements ORM behavior, SQL generation, and entity management |
| Spring Data JPA | Simplifies persistence through repository abstractions |
| PostgreSQL | Stores the relational application data |

In Bloommerce, entities such as `Product`, `User`, and `Order` use JPA annotations including `@Entity`, `@Id`, and `@ManyToOne`.

Hibernate manages their persistence in PostgreSQL, while Spring Data JPA provides repository operations.

I chose this combination to reduce boilerplate code, maintain a clear separation of responsibilities, and integrate persistence with Spring's transaction management.

For checkout, Bloommerce also uses custom repository queries for product locking and conditional inventory deduction.

## 3. What are the main advantages of React?

React is a JavaScript library for building interactive user interfaces through reusable components and declarative rendering.

I chose React for Bloommerce because it provides a maintainable way to organize the frontend while supporting dynamic interactions such as product filtering, shopping cart updates, and checkout.

**Component reusability**

Components such as `ProductCard`, `ProductFilters`, and `Pagination` can be reused across the application, reducing duplicated code and improving consistency.

**Declarative rendering**

React updates the interface based on changes in application state rather than requiring developers to manipulate DOM elements manually.

For example, when a customer updates the quantity of a product, Bloommerce automatically recalculates and displays the estimated cart total.

**State management**

React hooks such as `useState`, `useEffect`, and `useMemo` help organize component state, side effects, and derived values.

**Context API**

Bloommerce uses React Context API to share application state:

- `AuthContext` manages authentication and user information.
- `CartContext` manages shopping cart items, quantities, and totals.

The shopping cart persists using `localStorage`, while JWT authentication state remains in memory.

Overall, React allows me to build a modular, responsive frontend that integrates naturally with Spring Boot REST APIs.

## 4. How would you organize the development of Bloommerce in two days?

If I had only two days to develop Bloommerce, I would prioritize a minimum viable product that demonstrates the complete e-commerce flow.

I would organize the work around the most important functional requirements, prioritizing a working backend, database consistency, and frontend integration over advanced features.

### Day 1 — Backend and Database

**Morning**

- Initialize Spring Boot and configure PostgreSQL.
- Set up Docker Compose and Flyway migrations.
- Define the User, Product, Order, and OrderItem entities.
- Implement product CRUD operations and filtering.

**Afternoon**

- Implement registration, login, and JWT authentication.
- Configure role-based authorization.
- Implement transactional checkout and stock validation.
- Add essential unit and integration tests.

**Goal:** Have a working REST API supporting products, authentication, and order creation.

### Day 2 — Frontend and Integration

**Morning**

- Initialize React with TypeScript.
- Implement product catalog and details.
- Add registration and login pages.
- Implement shopping cart state using Context API.

**Afternoon**

- Connect checkout to the backend.
- Implement order confirmation and history.
- Test the complete customer journey.
- Run automated tests and production builds.
- Prepare setup instructions and final documentation.

**Goal:** Deliver a functional full-stack application demonstrating registration, product browsing, checkout, and order history.

### Priorities and Tradeoffs

I would prioritize:

1. Core database entities and persistence.
2. Product management and catalog.
3. Authentication and authorization.
4. Checkout and inventory consistency.
5. Frontend integration and testing.
6. Documentation and demonstration.

If time became limited, I would postpone advanced UI improvements, payment integration, analytics, and automated browser-based E2E tests.

However, I would preserve essential security, transactional integrity, and inventory validation.

I would also use an incremental development approach, validating each feature across the database, backend, and frontend before moving to the next.

This two-day plan represents how I would prioritize an MVP under time constraints, rather than the actual development timeline of Bloommerce.