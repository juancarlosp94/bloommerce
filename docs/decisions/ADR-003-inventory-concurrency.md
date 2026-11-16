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

Use an atomic conditional update to deduct stock only when enough inventory remains.

Conceptual SQL:

```sql
UPDATE products
SET stock_quantity = stock_quantity - :quantity
WHERE id = :productId
  AND active = TRUE
  AND stock_quantity >= :quantity;
```

The operation returns the number of affected rows.

- **1 row affected:** Inventory deduction succeeded.
- **0 rows affected:** The product does not satisfy the required conditions.

The checkout service must handle unsuccessful deductions appropriately.

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

### Pessimistic Locking

Explicitly lock product records before modifying inventory.

This approach protects concurrent updates but can introduce additional lock waiting and transaction contention.

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