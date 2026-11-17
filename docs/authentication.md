# Bloommerce — Authentication and Authorization

## Overview

Bloommerce uses Spring Security and JSON Web Tokens (JWT) for stateless authentication.

Passwords are hashed using BCrypt and stored in PostgreSQL. JWTs are signed using HMAC-SHA256 (HS256).

The system supports two roles:

- `CUSTOMER` — Can browse products and access authenticated shopping functionality.
- `ADMIN` — Can browse products and manage product inventory.

Public registration always assigns the `CUSTOMER` role.

## Authentication Endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |

### Registration

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

Successful registration returns HTTP `201 Created` with user information, excluding the password hash.

Duplicate email registration returns HTTP `409 Conflict`.

### Login

**POST `/api/auth/login`**

Request:

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

Successful login returns HTTP `200 OK`:

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

Invalid credentials or inactive accounts return HTTP `401 Unauthorized`.

### Authenticated User

**GET `/api/auth/me`**

Include:

```http
Authorization: Bearer <access-token>
```

The endpoint returns the authenticated user's information without exposing the password hash.

## Authorization

| Resource | Public | CUSTOMER | ADMIN |
|---|---|---|---|
| Product browsing | Allowed | Allowed | Allowed |
| Product creation | Denied | Denied | Allowed |
| Product updates | Denied | Denied | Allowed |
| Product deletion | Denied | Denied | Allowed |
| Authenticated profile | Denied | Allowed | Allowed |

Product deletion is implemented as soft deletion.

## JWT Security

- JWT signatures are validated using Spring Security.
- Tokens expire after the configured lifetime.
- The token issuer is validated.
- The backend verifies current user information in PostgreSQL during JWT authentication.
- Inactive accounts and tokens with outdated roles are rejected.
- Access tokens are not persisted in the database.
- Authentication is stateless.

## Environment Variables

Generate a random signing secret:

```bash
openssl rand -base64 32
```

Configure the root `.env`:

```dotenv
JWT_SECRET=<generated-base64-secret>
```

The signing key must never be committed to Git.

Application settings:

```properties
bloommerce.jwt.secret=${JWT_SECRET}
bloommerce.jwt.expiration-seconds=3600
bloommerce.jwt.issuer=bloommerce
```

## Swagger Authentication

Start the backend and open:

`http://localhost:8080/swagger-ui/index.html`

1. Register or log in using the authentication endpoints.
2. Copy the returned access token.
3. Click **Authorize** in Swagger.
4. Paste the JWT into the Bearer authentication field.
5. Execute authenticated operations.

## Testing

Run the security integration tests:

```bash
cd backend
./mvnw -Dtest=SecurityIntegrationTest test
```

Run all backend tests:

```bash
./mvnw clean verify
```

Tests use JUnit, Mockito, MockMvc, PostgreSQL, and Testcontainers.

## Known Limitations

- Refresh tokens are not implemented.
- An expired or invalidated access token requires the user to log in again.
- Database-backed JWT validation introduces a user lookup for authenticated requests.
- The current CORS configuration targets the local React development server.
- Production deployment requires HTTPS, secure secret management, and an appropriate production CORS configuration.