# TaskFlow — Task Management REST API

A beginner-friendly, production-ready RESTful API for managing tasks, built with **Node.js**, **Express.js**, and **PostgreSQL**. Designed with clean architecture, strict input validation, parameterized database queries, centralized error handling, and automated testing with Jest and Supertest.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Architecture & Directory Structure](#project-architecture--directory-structure)
- [Prerequisites](#prerequisites)
- [Installation & Environment Setup](#installation--environment-setup)
- [PostgreSQL Database Setup](#postgresql-database-setup)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [API Documentation & Examples](#api-documentation--examples)
  - [Endpoints Summary](#endpoints-summary)
  - [Create Task (`POST /api/tasks`)](#1-create-task-post-apitasks)
  - [List Tasks (`GET /api/tasks`)](#2-list-tasks-get-apitasks)
  - [Retrieve Task by ID (`GET /api/tasks/:id`)](#3-retrieve-task-by-id-get-apitasks-id)
  - [Update Task (`PUT /api/tasks/:id`)](#4-update-task-put-apitasks-id)
  - [Delete Task (`DELETE /api/tasks/:id`)](#5-delete-task-delete-apitasks-id)
- [Error Handling & Status Codes](#error-handling--status-codes)
- [Request Lifecycle Explanation](#request-lifecycle-explanation)
- [Key Architectural & Security Decisions](#key-architectural--security-decisions)
- [Known Limitations & Future Improvements](#known-limitations--future-improvements)
- [Interview Preparation Questions & Answers](#interview-preparation-questions--answers)

---

## Overview

**TaskFlow** provides a clean baseline REST API for managing tasks with statuses (`pending`, `in_progress`, `completed`) and priority levels (`low`, `medium`, `high`). It serves as an exemplary backend portfolio project demonstrating core backend engineering practices:
- **Separation of Concerns**: Modular organization dividing routing, validation, business logic, and database access.
- **Database Security**: Fully parameterized SQL queries preventing SQL injection vulnerabilities.
- **Data Integrity**: Database-level `CHECK` constraints, default values, and automatic `updated_at` PostgreSQL triggers.
- **Robust Error Handling**: Centralized error middleware ensuring consistent JSON error responses without leaking sensitive system details.

---

## Features

- **Full Task CRUD**: Create, Read, Update (full resource replacement), and Delete tasks.
- **Filtering Support**: Filter tasks by `status`, `priority`, or both combined.
- **Strict Validation**: `express-validator` chains enforcing string types, non-empty titles, positive integer IDs, allowed enum values, and rejection of server-managed body fields (`id`, `created_at`, `updated_at`).
- **Automated Database Timestamping**: PostgreSQL trigger updates `updated_at` on record modification.
- **Graceful Shutdown**: Intercepts `SIGINT` and `SIGTERM` signals to cleanly close HTTP listeners and database connection pools.
- **Isolated Testing Suite**: Automated tests using Jest and Supertest with strict database guards preventing accidental development database teardowns.

---

## Technology Stack

- **Runtime**: Node.js (JavaScript CommonJS `require` / `module.exports`)
- **Framework**: Express.js (`v4.19.2`)
- **Database**: PostgreSQL (`pg v8.11.5` client with `pg.Pool`)
- **Validation**: `express-validator` (`v7.0.1`)
- **Environment Management**: `dotenv` (`v16.4.5`)
- **Testing**: Jest (`v29.7.0`) & Supertest (`v6.3.4`)

---

## Project Architecture & Directory Structure

```text
askFlow/
├── src/
│   ├── app.js                 # Express app setup, JSON body parser, & route binding
│   ├── server.js              # Server entry point, HTTP listener, & graceful shutdown
│   ├── config/
│   │   └── db.js              # PostgreSQL pg.Pool configuration & query helpers
│   ├── controllers/
│   │   └── taskController.js  # HTTP request parsing & response handling
│   ├── middleware/
│   │   ├── errorHandler.js    # Centralized Express JSON error handler
│   │   └── notFound.js        # Catch-all middleware for 404 unmatched endpoints
│   ├── routes/
│   │   └── taskRoutes.js      # REST API route declarations & validator binding
│   ├── services/
│   │   └── taskService.js     # Data access layer & parameterized SQL operations
│   └── validators/
│       └── taskValidator.js   # Request validation chains (express-validator)
├── sql/
│   └── schema.sql             # PostgreSQL schema, constraints, & trigger function
├── tests/
│   └── task.test.js           # Integration test suite (Jest + Supertest)
├── .editorconfig              # Editor formatting configuration
├── .env.example               # Environment variables configuration template
├── .gitignore                 # Version control file exclusions
├── package.json               # Node.js project metadata & npm scripts
├── package-lock.json          # Locked dependency tree
└── README.md                  # Comprehensive API documentation
```

---

## Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: `v12.0` or higher (installed and running locally or via cloud instance)

---

## Installation & Environment Setup

1. **Clone or Navigate to the Project Directory**:
   ```bash
   cd "d:/Projects/askFlow — Task Management REST API"
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to create a real `.env` file:
   ```bash
   cp .env.example .env
   ```

   Configure `.env` with your local database credentials:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # PostgreSQL Development Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=taskflow_dev
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password

   # PostgreSQL Test Database (Must be separate from DB_NAME)
   TEST_DB_HOST=localhost
   TEST_DB_PORT=5432
   TEST_DB_NAME=taskflow_test
   TEST_DB_USER=postgres
   TEST_DB_PASSWORD=your_postgres_password
   ```

---

## PostgreSQL Database Setup

1. **Create Development and Test Databases**:
   Using `psql` command line tool:
   ```bash
   psql -U postgres -c "CREATE DATABASE taskflow_dev;"
   psql -U postgres -c "CREATE DATABASE taskflow_test;"
   ```

2. **Initialize Database Schema**:
   Run `sql/schema.sql` against both databases:
   ```bash
   psql -U postgres -d taskflow_dev -f sql/schema.sql
   psql -U postgres -d taskflow_test -f sql/schema.sql
   ```

   *Note: `sql/schema.sql` uses non-destructive `CREATE TABLE IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION` statements, ensuring existing tables are not dropped.*

---

## Running the Application

- **Development Mode (with auto-reload via `nodemon`)**:
  ```bash
  npm run dev
  ```

- **Production Mode**:
  ```bash
  npm start
  ```

Once started, the API will be accessible at `http://localhost:3000`.

---

## Running Tests

Execute the automated test suite powered by Jest and Supertest:

```bash
npm test
```

- Tests cover request validation, malformed JSON handling, 404 unmatched endpoints, task CRUD, and filtering.
- If PostgreSQL is offline, input validation tests will execute and pass, while database integration tests will report as skipped/blocked.

---

## API Documentation & Examples

### Endpoints Summary

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/tasks` | Create a new task | `201 Created`, `400 Bad Request` |
| `GET` | `/api/tasks` | List tasks (Optional `status` & `priority` filters) | `200 OK`, `400 Bad Request` |
| `GET` | `/api/tasks/:id` | Retrieve task by integer ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `PUT` | `/api/tasks/:id` | Replace an existing task | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/tasks/:id` | Delete task by integer ID | `204 No Content`, `400 Bad Request`, `404 Not Found` |

---

### 1. Create Task (`POST /api/tasks`)

**curl Request**:
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design Database Schema",
    "description": "Create PostgreSQL table and indexes",
    "status": "in_progress",
    "priority": "high"
  }'
```

**Response (`201 Created`)**:
```json
{
  "id": 1,
  "title": "Design Database Schema",
  "description": "Create PostgreSQL table and indexes",
  "status": "in_progress",
  "priority": "high",
  "created_at": "2026-10-09T08:00:00.000Z",
  "updated_at": "2026-10-09T08:00:00.000Z"
}
```

---

### 2. List Tasks (`GET /api/tasks`)

**curl Request (With Filters)**:
```bash
curl -X GET "http://localhost:3000/api/tasks?status=in_progress&priority=high"
```

**Response (`200 OK`)**:
```json
[
  {
    "id": 1,
    "title": "Design Database Schema",
    "description": "Create PostgreSQL table and indexes",
    "status": "in_progress",
    "priority": "high",
    "created_at": "2026-10-09T08:00:00.000Z",
    "updated_at": "2026-10-09T08:00:00.000Z"
  }
]
```

---

### 3. Retrieve Task by ID (`GET /api/tasks/:id`)

**curl Request**:
```bash
curl -X GET http://localhost:3000/api/tasks/1
```

**Response (`200 OK`)**:
```json
{
  "id": 1,
  "title": "Design Database Schema",
  "description": "Create PostgreSQL table and indexes",
  "status": "in_progress",
  "priority": "high",
  "created_at": "2026-10-09T08:00:00.000Z",
  "updated_at": "2026-10-09T08:00:00.000Z"
}
```

---

### 4. Update Task (`PUT /api/tasks/:id`)

*Note: `PUT` represents a complete resource replacement. `title` is mandatory. Omitted optional fields default to baseline values (`description = null`, `status = 'pending'`, `priority = 'medium'`).*

**curl Request**:
```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design PostgreSQL Database Schema",
    "description": "Updated description with trigger logic",
    "status": "completed",
    "priority": "high"
  }'
```

**Response (`200 OK`)**:
```json
{
  "id": 1,
  "title": "Design PostgreSQL Database Schema",
  "description": "Updated description with trigger logic",
  "status": "completed",
  "priority": "high",
  "created_at": "2026-10-09T08:00:00.000Z",
  "updated_at": "2026-10-09T08:25:00.000Z"
}
```

---

### 5. Delete Task (`DELETE /api/tasks/:id`)

**curl Request**:
```bash
curl -X DELETE http://localhost:3000/api/tasks/1
```

**Response (`204 No Content`)**:
*(Empty response body)*

---

## Error Handling & Status Codes

All API errors return a consistent JSON response structure:

```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```

### Supported HTTP Status Codes

- **`200 OK`**: Request succeeded (GET, PUT).
- **`201 Created`**: Resource created successfully (POST).
- **`204 No Content`**: Resource deleted successfully (DELETE).
- **`400 Bad Request`**: Client input validation failed, malformed JSON body, or unsupported query parameter.
- **`404 Not Found`**: Requested resource or endpoint route does not exist.
- **`500 Internal Server Error`**: Unexpected server error (Internal details masked in production).

---

## Request Lifecycle Explanation

When a client sends a request to TaskFlow (e.g., `POST /api/tasks`), it travels through the following layers:

```text
Client Request
      │
      ▼
1. server.js (HTTP Listener)
      │
      ▼
2. app.js (Express Middleware: JSON Body Parser)
      │
      ▼
3. taskRoutes.js (Endpoint Matching)
      │
      ▼
4. taskValidator.js (express-validator rules & constraint middleware)
      │  └─► If Invalid: Returns HTTP 400 JSON response immediately
      ▼
5. taskController.js (Parses req.body/req.params, calls service, returns HTTP response)
      │
      ▼
6. taskService.js (Constructs parameterized SQL query with $1, $2)
      │
      ▼
7. db.js (pg.Pool acquires connection & executes query on PostgreSQL)
      │
      ▼
PostgreSQL Database (Executes table constraints & triggers -> Returns result row)
      │
      ▼
Response travels back through Service -> Controller -> Express -> Client
```

---

## Key Architectural & Security Decisions

1. **SQL Injection Protection**: All database queries use `$1, $2` parameters in `pg.query(sql, params)`. User input is sent separately from SQL code, completely eliminating SQL injection risks.
2. **Decoupled App/Server (`app.js` vs `server.js`)**: `app.js` exports the Express app instance without starting `.listen()`. This enables Supertest to run unit and integration tests against Express handlers without occupying a network port.
3. **Database Guard in Tests**: `src/config/db.js` verifies `TEST_DB_NAME !== DB_NAME` when `NODE_ENV === 'test'`. Tests will abort immediately if attempted against the development database.
4. **Server-Managed Field Safeguard**: `taskValidator.js` explicitly blocks clients from injecting `id`, `created_at`, or `updated_at` in request bodies.
5. **Sanitization of Error Output**: In production (`NODE_ENV=production`), `errorHandler.js` hides internal error messages and stack traces to prevent credential or schema leaks.

---

## Known Limitations & Future Improvements

- **Authentication & Authorization**: Currently open API. Future versions can add JWT (JSON Web Token) authentication and user ownership (`user_id` foreign key).
- **Pagination**: `GET /api/tasks` returns all matching tasks. Large datasets would benefit from `limit` and `offset` query parameters.
- **Soft Deletes**: Task deletion physically removes rows. A `deleted_at` timestamp could be introduced for soft deletion.
- **CORS Support**: Cross-Origin Resource Sharing is currently unconfigured. `cors` package can be added when connecting a web frontend.

---

## Interview Preparation Questions & Answers

### Q1: How does TaskFlow prevent SQL Injection vulnerabilities?
> **Answer**: TaskFlow strictly uses **parameterized queries** via the `pg` library. Instead of concatenating string inputs into SQL (e.g., `'SELECT * FROM tasks WHERE title = ' + input`), parameterized queries use placeholders like `$1, $2` (e.g., `'SELECT * FROM tasks WHERE title = $1'`). The database driver sends the query text and input parameters separately. The PostgreSQL engine treats the parameters purely as literal data, making it impossible for malicious user input to alter the SQL query structure.

### Q2: Why are `app.js` and `server.js` separated in this project?
> **Answer**: Separating `app.js` from `server.js` separates application configuration from network side-effects. `app.js` builds and exports the Express app (middleware, routes, error handlers). `server.js` imports `app.js` and calls `app.listen()`. This separation is crucial for automated testing: Supertest can import `app.js` directly to simulate HTTP requests in memory without binding to an actual port or conflicting with running instances.

### Q3: What is PostgreSQL Connection Pooling and why is it used?
> **Answer**: Opening a TCP connection to PostgreSQL is computationally expensive (handshakes, authentication, process allocation). A **connection pool** (`pg.Pool`) maintains a pool of pre-opened database connections. When a request arrives, `db.query()` borrows an idle connection from the pool, executes the query, and immediately returns the connection to the pool. This drastically increases API throughput and prevents server exhaustion under concurrent load.

### Q4: What is the difference between HTTP status codes 200, 201, 204, 400, 404, and 500?
> **Answer**:
> - **`200 OK`**: Standard success response for retrieving or updating data (GET, PUT).
> - **`201 Created`**: Success response when a new resource is created (POST).
> - **`204 No Content`**: Success response with no body content (DELETE).
> - **`400 Bad Request`**: Client-side error indicating invalid inputs, malformed JSON, or missing parameters.
> - **`404 Not Found`**: Client-side error indicating the requested endpoint or resource ID does not exist.
> - **`500 Internal Server Error`**: Unexpected server-side failure.

### Q5: How does TaskFlow guarantee that `updated_at` timestamps stay up to date?
> **Answer**: Rather than relying on application code to manually pass updated timestamps, TaskFlow uses a **PostgreSQL trigger** (`BEFORE UPDATE ON tasks`). Whenever any column in a task row is modified via an `UPDATE` query, the PostgreSQL trigger function `update_updated_at_column()` fires automatically and sets `NEW.updated_at = CURRENT_TIMESTAMP`. This guarantees 100% data integrity even if updates are performed outside the Node.js application.

---

*TaskFlow REST API — Built with standard engineering practices for internship readiness.*
