# Backend foundation

Build the first production-shaped backend slice for CwFitness using Next.js Route Handlers, Better Auth, Prisma, and PostgreSQL.

## Confirmed test seam

Browser-facing HTTP endpoints are the public seam:

- `/api/auth/*` for sign-up, sign-in, sign-out, and session reads.
- `/api/plans` for authenticated creation and user-scoped listing.

Integration tests must exercise HTTP and a real local Prisma Postgres database. They must not assert Better Auth or Prisma internals.

