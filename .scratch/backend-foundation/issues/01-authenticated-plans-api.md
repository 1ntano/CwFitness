# Authenticated plans API

Type: task
Status: resolved

Implement the first vertical slice: a user signs up, creates a workout plan, and another user cannot see it.

## Acceptance

- Anonymous plan reads return `401`.
- An authenticated user can create a named Workout Plan.
- Plan listing is scoped to the authenticated User.
- The behavior is verified through HTTP against a local PostgreSQL-compatible database.

## Comments

- 2026-09-10: HTTP API seam confirmed by the user.
## Answer

Implemented email/password sign-up and session handling through Better Auth, plus authenticated `GET` and `POST` Route Handlers for Workout Plans. Every query derives `userId` from the server-side session; the HTTP integration test proves that one user's plans are absent from another user's response.