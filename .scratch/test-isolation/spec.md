# Isolated integration test runtime

## Goal

Make `npm.cmd test` runnable while the development server is already running.

## Scope

- Separate the integration test app from the development app.
- Use a unique Prisma dev server name.
- Read the actual Prisma connection URL instead of assuming a fixed database port.
- Keep the test database and build output out of version control.

## Success criteria

- The full unit, integration, and browser suite passes with the development app running.
- The test app uses a different HTTP port from development.
- The test build directory is isolated from `.next`.
