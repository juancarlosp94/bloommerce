# ADR-003: Inventory Concurrency and Reservation Strategy

**Status:** Accepted  
**Project:** Bloommerce

## Context

Bloommerce must prevent inventory from becoming negative when multiple customers attempt to purchase the same product concurrently.

A shopping cart does not represent a completed purchase, and reserving stock whenever a customer adds an item to their cart could unnecessarily restrict product availability.

The initial implementation must provide reliable checkout behavior without introducing excessive complexity.

## Decision

Validate and deduct inventory during checkout using atomic conditional SQL updates within a single database transaction.

Adding products to a shopping cart will not reserve inventory.

The backend will verify current availability when the customer submits an order.

## Selected Concurrency Strategy

Bloommerce combines pessimistic row-level locking with atomic conditional inventory updates.

During checkout, the backend:

1. Validates the authenticated customer and requested cart items.
2. Merges duplicate product IDs.
3. Sorts product IDs in ascending order.
4. Retrieves and locks active products using `findActiveByIdForUpdate()`.
5. Captures purchase-time prices.
6. Deducts inventory using conditional updates.
7. Creates the order and associated order items.
8. Commits the transaction only when all operations succeed.

The conditional stock deduction follows this SQL pattern:

```sql
UPDATE products
SET stock_quantity = stock_quantity - :quantity
WHERE id = :productId
  AND active = TRUE
  AND stock_quantity >= :quantity;
```

If the update affects zero rows, checkout fails with an inventory conflict and the transaction rolls back.

### Why Combine Both Mechanisms?

Pessimistic locking coordinates concurrent access to product records, while conditional stock deductions independently verify that sufficient inventory remains at update time.

Processing products in ascending ID order also helps reduce deadlock risk when multiple orders involve overlapping products.

### Tradeoffs

This strategy prioritizes inventory consistency over maximum concurrency.

Transactions competing for the same products may experience lock contention, but the implementation prevents successful purchases from exceeding available inventory.

The shopping cart does not reserve stock. Availability is validated when checkout occurs.

## Transaction Management

The entire checkout operation runs within a single Spring-managed database transaction.

The operation includes:

1. Validate the order request.
2. Validate product availability and pricing.
3. Deduct inventory using atomic conditional updates.
4. Persist the Order and OrderItems.
5. Commit only when every operation succeeds.

If any required operation fails, all inventory deductions and order persistence operations must roll back.

Stock deductions for multiple products should use a consistent product ordering to reduce deadlock risk.

## Alternatives Considered

### Optimistic Locking

Use entity versioning to detect concurrent modifications.

This avoids explicit locking during reads but requires handling version conflicts and potentially retrying failed operations.

### Temporary Inventory Reservations

Reserve inventory when products are added to a shopping cart.

Reservations would expire after a configured period if checkout is not completed.

This improves checkout predictability but requires reservation records, expiration handling, and additional concurrency management.

## Rationale

- Provides atomic inventory validation and deduction.
- Prevents overselling under concurrent checkout requests.
- Avoids unnecessary explicit read-then-update operations.
- Keeps shopping cart functionality lightweight.
- Fits the assignment's development constraints.

## Consequences

**Advantages**

- Reliable stock deductions.
- Reduced application-level concurrency complexity.
- No abandoned-cart reservation management.
- Straightforward integration with PostgreSQL transactions.

**Limitations**

- Concurrent updates to the same product may still wait for row-level locks.
- A product may become unavailable while it remains in a customer's cart.
- Checkout transactions must remain short.
- Failed transactions must be handled correctly.

## Future Improvements

Introduce temporary inventory reservations with:

- Reservation expiration timestamps.
- Automatic reservation cleanup.
- Available-versus-reserved stock calculations.
- Atomic reservation creation.
- Idempotent checkout handling.

## Conclusion

Bloommerce will prioritize inventory correctness during checkout rather than guaranteeing availability when products are added to shopping carts.

The chosen strategy provides sufficient consistency for the MVP while allowing more advanced reservation mechanisms to be introduced later.