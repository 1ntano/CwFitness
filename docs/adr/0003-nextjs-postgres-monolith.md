# Build a Next.js and PostgreSQL monolith

The MVP will use a single TypeScript application built with Next.js App Router, PostgreSQL, Prisma, and Better Auth. A separate Vite SPA and API would add deployment, CORS, authentication, and contract overhead before the product needs independent clients or service scaling.

## Consequences

Server-rendered pages call the domain and repository layers directly, while browser synchronization uses authenticated, versioned Route Handlers. The application is deployed as one stateless container behind a reverse proxy, with PostgreSQL and database migrations managed separately.
