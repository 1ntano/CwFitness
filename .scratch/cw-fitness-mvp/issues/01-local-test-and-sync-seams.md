# 01: Establish local test and sync seams

**What to build:** A developer can verify the domain rules, browser state, IndexedDB persistence, and critical HTTP flows locally with a reliable test setup. This establishes the shared test seam for every later ticket.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A documented local command runs domain unit tests, component tests, IndexedDB state tests, HTTP integration tests, and a browser smoke test; any failure makes the command fail.
- [ ] The test database is isolated from development data and starts and stops reproducibly.
- [ ] IndexedDB behavior can be driven deterministically without depending on a developer's browser profile.
- [ ] The browser smoke test proves that a User can sign in and reach the authenticated workspace.
- [ ] Existing HTTP integration coverage for authentication, plan isolation, Workout Session lifecycle, set scoring, and Permanent Exercise Deletion remains green.

