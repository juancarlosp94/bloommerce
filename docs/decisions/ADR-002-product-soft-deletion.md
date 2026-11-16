# ADR-002: Product Soft Deletion

**Status:** Accepted  
**Project:** Bloommerce

## Context

Products may be referenced by historical customer orders.

Physically deleting products could compromise referential integrity and remove information needed to understand previous purchases.

Bloommerce must support product deletion while preserving historical records.

## Decision

Implement soft deletion using an `active` boolean attribute in the `Product` entity.

Products will be deactivated instead of physically removed from PostgreSQL.

## Alternatives Considered

### Hard Deletion

Permanently delete product records from the database.

This approach simplifies storage management but introduces complications when products are referenced by existing orders.

## Rationale

- Preserves relationships with historical orders.
- Maintains referential integrity.
- Allows administrators to reactivate products.
- Prevents discontinued products from being purchased.

## Consequences

**Advantages**

- Historical orders retain their product references.
- Product records can be recovered.
- Existing foreign-key relationships remain intact.

**Limitations**

- Inactive records remain in the database.
- Public catalog queries must exclude inactive products.
- Checkout must reject inactive products.
- Administrative queries may need to include both active and inactive products.

## Future Improvements

- Add `deletedAt` and `deletedBy` audit fields.
- Introduce more detailed product lifecycle statuses.
- Implement retention and archival policies when necessary.

## Conclusion

Soft deletion provides a practical balance between catalog management and historical data integrity.