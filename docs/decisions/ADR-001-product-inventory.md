# ADR-001: Product Inventory Management

**Status:** Accepted  
**Project:** Bloommerce

## Context

Bloommerce requires product management and order processing with basic inventory availability validation.

In a larger e-commerce system, catalog information and inventory management would typically have separate responsibilities.

However, Bloommerce has a limited development timeframe and does not require multi-warehouse inventory management.

## Decision

Store inventory quantity directly in the `Product` entity using a `stockQuantity` attribute.

Each product represents a sellable catalog item with an associated available stock quantity.

## Alternatives Considered

### Separate Inventory Entity

Introduce a dedicated `Inventory` entity associated with `Product`.

This would support more advanced inventory management but require additional entities, relationships, and business logic.

## Rationale

- Reduces implementation complexity.
- Simplifies product availability queries.
- Avoids unnecessary relationships for the current requirements.
- Allows development time to focus on authentication, order management, and automated testing.

## Consequences

**Advantages**

- Simpler database schema.
- Fewer persistence operations.
- Straightforward product availability validation.

**Limitations**

- Couples catalog and inventory responsibilities.
- Does not support warehouse-specific stock.
- Does not provide inventory movement history.
- Does not track individual serialized units.

## Future Improvements

Introduce a dedicated inventory model supporting:

- Multiple warehouses.
- Stock movements.
- Inventory reservations.
- Available and reserved quantities.
- Serialized product tracking.

## Conclusion

The selected approach prioritizes simplicity while providing sufficient inventory functionality for Bloommerce's MVP.