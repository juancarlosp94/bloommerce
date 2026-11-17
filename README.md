# Bloommerce 🌸

A full-stack e-commerce application built with Java, Spring Boot, React, and PostgreSQL.

## Overview

Bloommerce is an e-commerce platform designed to support product management, user authentication, shopping carts, and order processing.

This project focuses on clean architecture, secure REST APIs, automated testing, and modern full-stack development practices.

## Tech Stack

### Backend
- Java
- Spring Boot
- Spring Data JPA / Hibernate
- Spring Security / JWT
- PostgreSQL
- Maven

### Frontend
- React
- TypeScript
- Tailwind CSS
- Context API

### Development Tools
- Git & GitHub
- GitHub Projects
- JUnit & Mockito
- MockMvc

## Development Workflow

Bloommerce follows **GitHub Flow**.

All changes are developed in dedicated branches and integrated into `main` through Pull Requests.

### Branch Naming Conventions

- `feat/` — New features
- `fix/` — Bug fixes
- `chore/` — Configuration and maintenance
- `test/` — Automated testing
- `docs/` — Documentation
- `refactor/` — Code improvements without changing behavior

### Commit Conventions

Commits follow the Conventional Commits format.

Examples:

- `feat(product): implement product creation`
- `fix(auth): handle expired JWT`
- `test(order): add order service tests`
- `chore: configure repository standards`

## Project Status

🚧 **Under Development — Foundation Phase**

The project is currently being initialized. Setup instructions, API documentation, and architectural decisions will be added as development progresses.

## Project Management

Development tasks and progress are tracked using GitHub Issues and GitHub Projects.

Each task follows:

**Issue → Branch → Implementation → Testing → Pull Request → Merge**

## Backend Development

The Bloommerce backend is implemented using Java 21, Spring Boot 4, and Maven.

### Requirements

- Java 21
- Maven Wrapper (included in the backend project)
- PostgreSQL (required to run the application)

### Compile the Backend

From the repository root:

```bash
cd backend
./mvnw clean compile
```

### Run the Backend

Once PostgreSQL is configured, provide the required environment variables and run:

```bash
./mvnw spring-boot:run
```

The application uses the `dev` profile by default.

### API Documentation

Swagger/OpenAPI is included in the backend dependencies. Once the application is running and the appropriate security configuration is in place, the API documentation will be accessible at:

- `/swagger-ui.html`
- `/v3/api-docs`

### Testing

The backend uses JUnit, Mockito, MockMvc, and JaCoCo.

Automated integration testing against PostgreSQL will be configured in a later development phase.

## Frontend Development

The Bloommerce frontend is built using React, TypeScript, and Vite, with Tailwind CSS for styling and React Router for navigation.

### Requirements

- Node.js 20.19+ or a supported newer version
- npm

### Installation

From the repository root:

```bash
cd frontend
npm install
```

### Run Locally

Start the development server:

```bash
npm run dev
```

The application will typically be available at `http://localhost:5173`.

### Environment Configuration

Create a `.env.local` file inside `frontend/` using `.env.example` as a reference.

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
```

The frontend uses this variable to configure communication with the Spring Boot backend.

### Project Structure

The frontend follows a feature-oriented architecture:

- `components/` — Reusable UI components and shared layouts.
- `features/` — Business features such as authentication, products, cart, and orders.
- `pages/` — Application pages.
- `context/` — Shared React state providers.
- `hooks/` — Reusable React hooks.
- `lib/` — API configuration and utilities.
- `types/` — Shared TypeScript types.

### State Management

Bloommerce uses React Context API for shared application state.

Authentication and shopping cart contexts will be implemented alongside their respective features. Local component state will be managed using React hooks.

### Code Quality and Production Build

Run ESLint:

```bash
npm run lint
```

Generate the production build:

```bash
npm run build
```

The production files will be generated in `frontend/dist/`.

### Routing

React Router handles client-side navigation.

Currently configured routes:

- `/` — Home page.
- `*` — Not-found page.

Additional routes for product details, authentication, checkout, and order history will be introduced as those features are developed.## Database Development

Bloommerce uses PostgreSQL 17 with Spring Data JPA, Hibernate, and Flyway.

### Local Setup

From the repository root:

```bash
cp .env.example .env
```

Configure the PostgreSQL credentials in `.env`, then start the database:

```bash
docker compose up -d
docker compose ps
```

### Run Database Migrations

Flyway automatically applies pending migrations when Spring Boot starts with the development profile.

From the repository root:

```bash
set -a
source .env
set +a

cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Migration scripts are stored in `backend/src/main/resources/db/migration/`.

Schema changes must be introduced through new versioned Flyway migrations. Hibernate uses `ddl-auto=validate` to verify the schema.

### Integration Tests

Database integration tests use Testcontainers to start an isolated PostgreSQL instance.

With Docker running, execute from `backend/`:

```bash
./mvnw clean verify
```

Tests do not use the local development database.

### Database Inspection

From the repository root:

```bash
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt"'
```

### Stop Local Database

```bash
docker compose down
```

This stops the container while preserving the database volume.