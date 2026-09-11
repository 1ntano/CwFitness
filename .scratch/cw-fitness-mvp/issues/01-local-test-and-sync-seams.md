# 01: Establish local test and sync seams

**What to build:** A developer can verify the domain rules, browser state, IndexedDB persistence, and critical HTTP flows locally with a reliable test setup. This establishes the shared test seam for every later ticket.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] A documented local command runs domain unit tests, component tests, IndexedDB state tests, HTTP integration tests, and a browser smoke test; any failure makes the command fail.
- [x] The test database is isolated from development data and starts and stops reproducibly.
- [x] IndexedDB behavior can be driven deterministically without depending on a developer's browser profile.
- [x] The browser smoke test proves that a User can sign in and reach the authenticated workspace.
- [x] Existing HTTP integration coverage for authentication, plan isolation, Workout Session lifecycle, set scoring, and Permanent Exercise Deletion remains green.

## Answer

Added Vitest, Testing Library, `fake-indexeddb`, and Playwright, with `npm.cmd test` as the documented local entry point. Domain calculations now live behind a database-free module, the dedicated `cwfitness-test` Prisma instance is started and stopped by one lifecycle, and Chrome exercises sign-up, sign-out, and sign-in through the real UI. The browser smoke exposed and fixed the authentication UI's invalid sign-out request and stale sign-up mode.
