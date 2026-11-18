
# Bloommerce Testing Strategy

## Overview

Bloommerce uses automated unit, integration, and frontend tests
to verify application behavior and prevent regressions.

## Backend Testing

Technologies:
- Java 21
- JUnit 5
- Mockito
- Spring Boot Test
- MockMvc
- PostgreSQL 17 with Testcontainers
- JaCoCo

Run backend tests and coverage verification:

```bash
cd backend
mvn clean verify
```

JaCoCo enforces a minimum of 80% line coverage.

View the coverage report:

```bash
open target/site/jacoco/index.html
```

The baseline measured on November 17, 2026 was 93.49%.

## Integration Testing

Integration tests run against PostgreSQL 17 using
Testcontainers. Docker must be running.

Covered scenarios include:

- Database migrations and persistence
- Product CRUD operations
- Authentication and JWT validation
- Product authorization
- Order ownership
- Stock deduction
- Transaction rollback
- Concurrent checkout and overselling prevention

Integration tests use isolated database containers rather
than the local development database.

## Frontend Testing

Technologies:
- Vitest
- React Testing Library
- TypeScript

Run tests:

```bash
cd frontend
npm ci
npm run test
npm run lint
npm run build
```

Frontend tests cover authentication, catalog interactions,
shopping cart, checkout, confirmation, and order history.

## Continuous Integration

GitHub Actions runs automatically for pull requests
targeting main and pushes to main.

The pipeline executes:

1. Backend tests and JaCoCo coverage verification
2. Frontend unit and component tests
3. ESLint
4. TypeScript compilation and production build

A failing test, coverage check, lint check, or build
causes the corresponding CI job to fail.

## End-to-End Manual Verification

1. Start PostgreSQL and the backend.
2. Start the React frontend.
3. Register a customer and log in.
4. Browse and filter the product catalog.
5. Add products to the shopping cart.
6. Update quantities and complete checkout.
7. Verify order confirmation and total.
8. Verify inventory deduction in PostgreSQL.
9. Open order history and order details.
10. Log out and verify protected pages are inaccessible.

This is a manual end-to-end checklist, not an
automated browser test.

## Known Limitations

- End-to-end browser testing is not yet automated.
- JaCoCo measures backend code coverage, not frontend coverage.
- Coverage percentage alone does not guarantee correctness.
- Concurrency testing covers competing checkouts for limited stock,
  but not every possible database contention scenario.
```

After saving, run:

```bash
git add docs/TESTING.md
git commit -m "docs: document automated testing strategy"
git push
```

This will automatically trigger CI again on PR #26.

**Once that passes, we'll review the issue's acceptance checklist and decide whether PR #26 is ready to merge.**