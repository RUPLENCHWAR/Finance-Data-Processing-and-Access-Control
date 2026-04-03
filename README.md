# Finance Data Processing and Access Control

A backend-focused finance dashboard project built for a technical assessment. The system supports user management, role-based access control, financial record management, and dashboard-level analytics. A lightweight frontend is also included to make evaluation easier and to demonstrate the APIs in a more practical way.

The goal of this project was to keep the implementation clear, maintainable, and easy to run locally while still covering the core backend requirements in a realistic way.

## Project Overview

This application is designed around three main ideas:

- managing users with different access levels
- storing and processing financial records
- exposing dashboard summaries and trends based on persisted data

The project includes:

- a Node.js + Express + TypeScript backend
- SQLite-based persistence using `better-sqlite3`
- JWT-based authentication
- role-based authorization
- request validation and structured error handling
- a simple frontend for login, registration, dashboard viewing, and record management
- automated API tests

## Tech Stack

### Backend

- Node.js
- Express
- TypeScript
- SQLite
- better-sqlite3
- Zod
- JSON Web Tokens

### Frontend

- Vanilla JavaScript
- HTML
- CSS

### Testing

- Vitest
- Supertest

## Features

### 1. User and Role Management

The system supports user creation and access control based on roles.

Available roles:

- `admin`
- `analyst`
- `viewer`

Role behavior:

- `viewer` can access dashboard summaries only
- `analyst` can view financial records and dashboard summaries
- `admin` can manage users and perform full CRUD operations on financial records

User status values:

- `active`
- `inactive`

### 2. Financial Records Management

Each financial record includes:

- amount
- type (`income` or `expense`)
- category
- date
- notes
- creator reference

Supported operations:

- create record
- view records
- update record
- delete record
- filter by type
- filter by category
- filter by date range
- search by category or notes

### 3. Dashboard Summary APIs

The dashboard exposes aggregated finance insights, including:

- total income
- total expenses
- net balance
- category-wise totals
- recent activity
- monthly trends

### 4. Access Control

Authorization is enforced at the backend level, not just in the UI. This ensures users cannot perform restricted actions even if they try to call the APIs directly.

### 5. Validation and Error Handling

The application validates incoming requests and returns structured error responses with appropriate status codes for:

- invalid input
- unauthorized access
- forbidden actions
- missing resources
- duplicate users

### 6. Data Persistence

The application uses SQLite for persistence. This keeps the project easy to run locally while still demonstrating real database-backed behavior.

## Authentication Flow

The project supports:

- sign in
- registration for non-admin roles
- authenticated session handling in the frontend

### Public Registration

New users can register themselves only as:

- `viewer`
- `analyst`

Admin registration is not publicly available through the registration form.

### Default Admin Account

On a fresh database, the app seeds one admin account so the system can be managed immediately.

Default admin credentials:

- Email: `admin@financedash.local`
- Password: `Admin@123`

Note: this admin account is seeded only if the database is empty.

## API Endpoints

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Users

- `GET /api/users` — admin only
- `POST /api/users` — admin only
- `PATCH /api/users/:id` — admin only

### Financial Records

- `GET /api/records` — analyst, admin
- `GET /api/records/:id` — analyst, admin
- `POST /api/records` — admin only
- `PATCH /api/records/:id` — admin only
- `DELETE /api/records/:id` — admin only

Supported query parameters for record listing:

- `type`
- `category`
- `fromDate`
- `toDate`
- `search`
- `page`
- `pageSize`

### Dashboard

- `GET /api/dashboard/summary` — viewer, analyst, admin

## Frontend Notes

A lightweight frontend is included to make evaluation easier.

It allows evaluators to:

- sign in
- register as viewer or analyst
- view dashboard summaries
- view filtered records
- create and manage records as admin
- create users as admin

The frontend uses the real backend APIs and does not rely on hardcoded sample data.

## Project Structure

src/
  app.ts
  auth.ts
  config.ts
  db.ts
  errors.ts
  middleware.ts
  routes.ts
  schemas.ts
  server.ts

public/
  index.html
  app.js
  styles.css

tests/
  api.test.ts
Setup Instructions
1. Install dependencies
npm install
2. Run in development
npm run dev
If npm run dev gives a Windows path issue, use:

npm run build
node dist/src/server.js
3. Open in browser
http://localhost:3000
Environment Variables
These are optional:

PORT=3000
JWT_SECRET=your-secret
DATABASE_PATH=./data/finance-dashboard.sqlite
Database Notes
This project uses a SQLite database file.

Default database location:

data/finance-dashboard.sqlite
Important
If you want to start completely fresh:

stop the server
delete data/finance-dashboard.sqlite
run the app again
This will recreate the database with only the seeded admin account and no financial records.

How to Evaluate the Project
A simple evaluation flow could be:

start the app locally
sign in using the default admin account
create a few financial records
verify dashboard totals update correctly
register a new analyst or viewer account
verify access restrictions based on role
refresh the page and confirm data persists
Testing
Run the test suite with:

npm test
The tests cover:

admin record creation
role restrictions
validation errors
public registration for non-admin users
Postman Collection
A Postman collection is included in the repository to make API testing easier.

File:

postman_collection.json
Technical Decisions and Trade-offs
A few important implementation choices:

Express was chosen because it is simple, readable, and fast to work with for an assessment project.
TypeScript was used to improve maintainability and reduce mistakes.
SQLite was chosen to minimize setup friction while still using a real database.
Roles are stored directly on the user record instead of using a separate roles table. This keeps the authorization logic simpler and easier to follow.
JWT authentication was chosen because it is lightweight and suitable for this scope.
The frontend was intentionally kept small so that the backend remains the main focus of the project.
The overall approach was to prioritize correctness, clarity, and ease of evaluation over unnecessary complexity.

Limitations and Possible Improvements
refresh tokens
Swagger / OpenAPI documentation
more detailed unit and integration tests

Final Notes
This project is not intended to be production-ready, but it is designed to reflect practical backend engineering decisions and demonstrate clean handling of business logic, validation, persistence, and access control.

The main focus of the submission is the backend architecture and logic, while the frontend is included as a lightweight usability layer for easier evaluation.
