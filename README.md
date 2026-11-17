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