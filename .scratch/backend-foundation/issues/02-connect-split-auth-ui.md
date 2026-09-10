# Connect the Split authentication UI

- Status: resolved
- Labels: enhancement, frontend

## Problem

The formal Next.js root only renders a backend-foundation placeholder, so the approved Split prototype is not available for end-to-end manual testing.

## Acceptance criteria

- The root route renders the approved dark, low-saturation Split experience.
- A user can register, sign in, sign out, create a Workout Plan, and see only their plans.
- The password reveal control is vertically centered.
- The image transitions naturally into the form side.
- Integration tests and project validation pass.

## Resolution

Moved the Split experience into the formal Next.js application and connected it to Better Auth and the user-scoped Workout Plans API.
