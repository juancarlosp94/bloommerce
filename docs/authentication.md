# Bloommerce — Authentication and Authorization

## 1. Overview

Bloommerce uses **Spring Security and JSON Web Tokens (JWT)** for stateless authentication and role-based authorization.

Passwords are hashed using BCrypt and stored securely in PostgreSQL. JWT access tokens are signed using HMAC-SHA256 (HS256).

The system supports two roles:

- **CUSTOMER:** Can browse products, manage a shopping cart, complete checkout, and access their own orders.
- **ADMIN:** Can browse products, manage product inventory, complete checkout, and access their own orders.

Public registration always assigns the `CUSTOMER` role. Administrator privileges cannot be requested through the registration endpoint.

Authentication is stateless, meaning the backend does not maintain HTTP sessions for authenticated users.

## 2. Authentication Endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |

### 2.1 Customer Registration

**POST `/api/auth/register`**

Request:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phone": "3001234567"
}
```

A successful registration returns **HTTP 201 Created**, including user information without exposing the password hash.

Registration includes the following behavior:

- Email addresses are normalized to lowercase.
- Leading and trailing whitespace is removed from email addresses.
- Passwords are hashed using BCrypt before persistence.
- New users receive the `CUSTOMER` role.
- New accounts are active by default.
- Duplicate email addresses are rejected.

**Important responses:**

| HTTP Status | Description |
|---|---|
| 201 Created | Customer registered successfully |
| 400 Bad Request | Invalid registration data |
| 409 Conflict | Email address already registered |

### 2.2 Login

**POST `/api/auth/login`**

Request:

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

Successful login returns **HTTP 200 OK**:

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

The example assumes the default token lifetime of 3,600 seconds.

During authentication, the backend:

1. Normalizes the submitted email.
2. Retrieves the user from PostgreSQL.
3. Checks whether the account is active.
4. Verifies the password using BCrypt.
5. Generates a signed JWT containing the user's identity and role.

Incorrect credentials and inactive accounts return **HTTP 401 Unauthorized**.

### 2.3 Authenticated User Profile

**GET `/api/auth/me`**

This endpoint requires a valid JWT.

Request header:

```http
Authorization: Bearer <access-token>
```

The endpoint returns the authenticated user's profile without exposing their password hash.

**Important responses:**

| HTTP Status | Description |
|---|---|
| 200 OK | Profile retrieved successfully |
| 401 Unauthorized | Token missing, expired, invalid, or account unavailable |

## 3. Authorization and Roles

Bloommerce uses role-based access control through Spring Security.

| Resource | Public | CUSTOMER | ADMIN |
|---|---|---|---|
| Product browsing | Allowed | Allowed | Allowed |
| Product details | Allowed | Allowed | Allowed |
| Product creation | Denied | Denied | Allowed |
| Product updates | Denied | Denied | Allowed |
| Product deletion | Denied | Denied | Allowed |
| Authenticated profile | Denied | Allowed | Allowed |
| Checkout | Denied | Allowed | Allowed |
| Order history | Denied | Own orders | Own orders |
| Order details | Denied | Own orders | Own orders |

### Product Administration

Only users with the `ADMIN` role can create, update, or delete products.

Product deletion is implemented as **soft deletion**. Instead of physically removing the database record, the product is marked inactive.

This helps preserve references from historical orders.

An authenticated CUSTOMER attempting an administrative operation receives **HTTP 403 Forbidden**.

### Order Ownership

Order access is restricted to the authenticated user.

Bloommerce validates ownership through backend service and repository operations that filter orders using the authenticated user's identity.

For example, a customer cannot access another customer's order by changing the order ID in the request URL.

Requests for orders that do not belong to the current user return **HTTP 404 Not Found**.

The `ADMIN` role does not automatically grant access to another customer's orders.

## 4. JWT Authentication

### 4.1 Token Generation

After successful login, Bloommerce generates a JWT signed using HS256.

The token contains claims including:

| Claim | Description |
|---|---|
| `iss` | Token issuer, configured as `bloommerce` |
| `sub` | Authenticated user's email |
| `iat` | Token issuance timestamp |
| `exp` | Token expiration timestamp |
| `userId` | Authenticated user's database ID |
| `roles` | User's assigned role |

The default token lifetime is **3,600 seconds (1 hour)**.

### 4.2 Token Validation

When a protected endpoint receives a JWT, Spring Security verifies:

1. The JWT signature.
2. Token expiration and applicable timestamp constraints.
3. The configured token issuer.
4. The existence of the user in PostgreSQL.
5. Whether the user account is active.
6. Whether the token's `userId` matches the current user.
7. Whether the token's role claim matches the user's current role.

These checks ensure that authentication reflects the current user state rather than relying exclusively on previously issued JWT claims.

For example:

- Deactivating an account invalidates access through its existing tokens.
- Changing a user's role causes previously issued tokens containing the old role to be rejected.
- A user who has been promoted must obtain a new token containing the updated permissions.

### 4.3 JWT Signing Secret

Bloommerce requires a cryptographically secure signing secret.

The secret must:

- Use **standard Base64 encoding**.
- Decode to at least **32 bytes**.
- Remain private.
- Never be committed to Git.

Generate a suitable secret:

```bash
openssl rand -base64 32
```

The backend decodes this value and uses it as an HMAC-SHA256 signing key.

Invalid Base64 input or insufficient key length prevents the application from initializing its JWT configuration.

### 4.4 Stateless Authentication

Bloommerce uses:

```text
SessionCreationPolicy.STATELESS
```

The backend does not rely on server-side HTTP sessions to identify authenticated users.

Instead, each protected HTTP request must include a valid Bearer token.

Access tokens are not stored in the application's database.

## 5. Frontend Authentication

The React frontend uses Context API to manage authentication state.

`AuthProvider` provides authentication information to components through the `useAuth` hook.

### Token Storage

JWT access tokens are maintained in React application memory rather than browser `localStorage`.

This avoids persisting access tokens in browser storage, although in-memory tokens still require protection against malicious JavaScript.

A full page reload resets the in-memory authentication state and requires the user to log in again.

### Protected Routes

Bloommerce uses a `ProtectedRoute` component to restrict navigation to authenticated pages.

Protected routes include:

- `/account`
- `/checkout`
- `/orders`
- `/orders/:id`
- `/order-confirmation/:id`

Unauthenticated visitors are redirected to the login page.

**Frontend route protection is not a security boundary.** Spring Security independently enforces authentication and authorization for protected API endpoints.

### Logout

Logout clears the frontend's authentication state.

Because the backend uses stateless JWTs and does not implement token revocation, logging out does not cryptographically invalidate an already issued JWT.

The token becomes unusable after expiration or when the backend rejects it because of account or permission changes.

## 6. Environment Configuration

The root `.env` file defines local environment variables.

Example:

```dotenv
POSTGRES_DB=bloommerce
POSTGRES_USER=bloommerce
POSTGRES_PASSWORD=replace_with_local_password

JWT_SECRET=replace_with_generated_base64_secret
```

Generate a signing secret:

```bash
openssl rand -base64 32
```

Replace the placeholder with the generated value.

### Spring Boot Configuration

The backend uses the following settings in `application.properties`:

```properties
bloommerce.jwt.secret=${JWT_SECRET}
bloommerce.jwt.expiration-seconds=3600
bloommerce.jwt.issuer=bloommerce
```

On macOS or Linux, load the variables before running Spring Boot:

```bash
set -a
source .env
set +a

cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The `.env` file must remain excluded from version control.

## 7. Swagger Authentication

Bloommerce provides interactive API documentation through Swagger UI.

Start Spring Boot and open:

http://localhost:8080/swagger-ui/index.html

To test protected endpoints:

1. Execute `POST /api/auth/login` using valid credentials.
2. Copy the returned `accessToken`.
3. Click **Authorize** in Swagger UI.
4. Paste the JWT into the Bearer authentication field.
5. Confirm the authorization.
6. Execute a protected endpoint, such as `GET /api/auth/me`.
7. Verify that authenticated operations succeed.

You can also inspect the OpenAPI specification at:

http://localhost:8080/v3/api-docs

### Testing Authorization Failures

To verify access restrictions:

- Call `GET /api/auth/me` without a JWT and expect `401 Unauthorized`.
- Call `POST /api/products` using a CUSTOMER token and expect `403 Forbidden`.
- Call `GET /api/orders` without a JWT and expect `401 Unauthorized`.
- Attempt to retrieve another customer's order and expect `404 Not Found`.

## 8. Security Testing

Bloommerce includes automated security tests using:

- JUnit 5
- Spring Boot Test
- Spring Security Test
- MockMvc
- PostgreSQL 17
- Testcontainers

The integration tests verify:

- Successful customer registration.
- Duplicate email rejection.
- BCrypt password hashing.
- Successful and unsuccessful login.
- JWT generation and validation.
- Expired, malformed, and tampered tokens.
- Inactive user authentication rejection.
- Customer and administrator authorization.
- Rejection of tokens after account deactivation.
- Rejection of tokens containing outdated roles.
- Unauthorized order access.
- Customer order ownership.

### Prerequisites

Java 21, Maven, and a running Docker daemon are required.

PostgreSQL integration tests use isolated Testcontainers databases, not the local development database.

### Run Security Integration Tests

From the repository root:

```bash
cd backend
./mvnw -Dtest=SecurityIntegrationTest test
```

### Run All Backend Tests

From `backend/`:

```bash
./mvnw clean verify
```

This runs the automated backend verification and enforces the JaCoCo minimum line coverage threshold of 80%.

For additional information, see [Testing Strategy](TESTING.md).

## 9. Known Limitations and Production Considerations

### Refresh Tokens

Refresh tokens are not implemented.

When an access token expires, users must authenticate again.

### Token Revocation

Bloommerce does not currently maintain a token revocation list.

Logout clears client-side authentication state, but an otherwise valid JWT may remain accepted until expiration.

Account deactivation and role changes are checked against PostgreSQL during authentication.

### Database Lookups

Authenticated requests require a lookup of the current user in PostgreSQL.

This strengthens permission consistency but introduces additional database overhead.

### CORS

The current CORS configuration allows the local React development origin:

`http://localhost:5173`

Production deployment requires an appropriate list of trusted frontend origins.

### HTTPS and Secret Management

A production deployment should enforce HTTPS and use secure configuration or secret management systems.

JWT signing keys and database credentials must not be committed to the repository.

### Additional Security Considerations

A production-ready system would benefit from further protections such as:

- Authentication rate limiting.
- Centralized monitoring and security logging.
- Secure signing-key rotation.
- Refresh token rotation and revocation, if refresh tokens are introduced.
- Additional security testing against common web vulnerabilities.

These improvements are outside the current Bloommerce implementation.

---

## 10. Summary

Bloommerce implements stateless authentication using Spring Security, BCrypt, and signed JWT access tokens.

Authorization is enforced through role-based security rules and backend ownership checks.

The application validates account status and current permissions against PostgreSQL, helping prevent inactive accounts and outdated roles from retaining access.

The implementation supports secure product administration and customer-specific order access while maintaining separation between frontend navigation control and backend security enforcement.