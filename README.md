# Finance Data Processing and Access Control Backend

A submission-ready finance dashboard assessment project. It demonstrates:

- role-based access control with clear behavior for `viewer`, `analyst`, and `admin`
- financial record CRUD with filtering, search, and pagination
- dashboard summary APIs for totals, category breakdowns, recent activity, and monthly trends
- SQLite persistence, request validation, and centralized error handling
- a lightweight browser UI wired directly to the live backend APIs
- a single seeded admin account plus automated API tests

## Stack

- Node.js
- TypeScript
- Express
- SQLite via `better-sqlite3`
- Zod for validation
- JWT-based authentication
- Vanilla JavaScript frontend served by Express
- Vitest + Supertest for API tests

## Access model

- `viewer`: can access dashboard summary endpoints only
- `analyst`: can read financial records and dashboard summaries
- `admin`: full user management and financial record CRUD access

This makes the authorization boundaries very easy to explain during evaluation and directly maps to the assignment.

## Project structure

```text
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
```

## Setup

```bash
npm install
npm run dev
```
## OR IF IIT FAILS THEN USE

```bash
npm run build
node dist\src\server.js
```

The server runs on `http://localhost:3000` by default.

Open `http://localhost:3000` in a browser to use the demo frontend.

## Why This Submission Stands Out

- It focuses on backend thinking first: role enforcement, API behavior, persistence, validation, and aggregation logic.
- It reduces evaluator effort with a browser-based demo that makes the system understandable in a few minutes.
- It proves the project is not hardcoded by allowing real user creation and real record writes through the frontend.
- It stays intentionally practical, favoring clarity and maintainability over unnecessary complexity.

### Optional environment variables

```bash
PORT=3000
JWT_SECRET=your-secret
DATABASE_PATH=./data/finance-dashboard.sqlite
```

## Default admin account

The app seeds only one admin account on first run so the database starts clean while still allowing admin access.

- Fresh database default admin:
- `ID 1` `admin@financedash.local` / `Admin@123`

If your database already existed before first run, the numeric user ID may differ.

## Role identifiers

There is no separate `roles` table in this project. Roles are stored directly in the `users.role` column and used by the API and frontend as string identifiers:

- `admin`
- `analyst`
- `viewer`

User status values:

- `active`
- `inactive`

## API overview

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/register` - public registration for `viewer` and `analyst` only
- `GET /api/auth/me`

### Users

- `GET /api/users` - admin only
- `POST /api/users` - admin only
- `PATCH /api/users/:id` - admin only

### Financial records

- `GET /api/records` - analyst, admin
- `GET /api/records/:id` - analyst, admin
- `POST /api/records` - admin only
- `PATCH /api/records/:id` - admin only
- `DELETE /api/records/:id` - admin only

Supported record query params:

- `type`
- `category`
- `fromDate`
- `toDate`
- `search`
- `page`
- `pageSize`

### Dashboard summary

- `GET /api/dashboard/summary` - viewer, analyst, admin

Returns:

- total income
- total expenses
- net balance
- category-wise totals
- recent activity
- monthly trends

## Demo frontend

The project now includes a lightweight frontend so evaluators can understand the system quickly without manually calling APIs.

The UI supports:

- sign in with the default admin or with newly created users
- public registration for `viewer` and `analyst` accounts
- live dashboard summary cards and recent activity
- record filtering for analyst and admin users
- record create, update, and delete for admin users
- user creation for admin users
- role-based UI visibility that mirrors backend authorization

Important: the frontend is not hardcoded demo data. It uses the real backend endpoints and stores changes in SQLite through the API.

By default, the app starts without sample financial records and without extra non-admin users, so you can add data manually according to your needs.

Recommended evaluator flow:

1. Open the app in the browser and register a new `viewer` or `analyst` account if desired.
2. Sign in as the registered `viewer` to confirm summary-only access.
3. Sign in as a registered `analyst` to inspect records, filters, and read-only behavior.
4. Sign in as `admin` to create records, update data, and add users.
5. Refresh the page to confirm the new data persists.

## Postman Collection

An importable Postman collection is included at [postman_collection.json](C:/Users/Asus/Desktop/Finance%20Data%20Processing%20and%20Access%20Control%20Backend/postman_collection.json).

Use it if the evaluator prefers API-level verification in addition to the frontend walkthrough.

## Example requests

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@financedash.local\",\"password\":\"Admin@123\"}"
```

### Create a record

```bash
curl -X POST http://localhost:3000/api/records \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "{\"amount\":4200,\"type\":\"income\",\"category\":\"Services\",\"date\":\"2026-03-28\",\"notes\":\"Consulting invoice\"}"
```

### Fetch dashboard summary

```bash
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer <token>"
```

## Reliability choices

- Validation is handled at the API boundary with Zod.
- Consistent JSON error responses are returned for validation, authorization, and domain failures.
- SQLite is used for simple local persistence while keeping the project easy to run.
- The app uses a small but clear separation between routing, auth, validation, and data access.
- The frontend is served from the same Express app, so setup stays simple and evaluation friction stays low.

## Testing

```bash
npm test
```

The test suite covers:

- successful admin record creation
- role restrictions for viewer and analyst
- validation error handling

## Assumptions and tradeoffs

- Authentication is intentionally lightweight and uses one seeded admin account plus public non-admin registration because the assignment allows mock/local auth.
- The project favors clarity and maintainability over advanced enterprise abstractions.
- SQLite was chosen to keep setup friction low while still demonstrating real persistence.
- Authorization rules are strict and explicit to make the business behavior easy for reviewers to verify.
