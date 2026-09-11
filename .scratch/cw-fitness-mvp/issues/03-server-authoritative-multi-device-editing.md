# 03: Establish server-authoritative multi-device editing

**What to build:** Multiple devices can view the same User's data, but conflicting edits are explicit and only one device may edit an In-progress Session at a time. PostgreSQL remains the authoritative source.

**Blocked by:** 01 (Establish local test and sync seams)

**Status:** resolved

- [x] Mutable Workout Plans, Workout Days, Planned Exercises, Exercises, and In-progress Sessions expose a server version.
- [x] Mutating requests carry the version the client edited from; stale versions return a conflict with the current server state instead of being applied.
- [x] The UI presents a conflict that requires refresh and new editing; no last-write-wins or field-level merge occurs.
- [x] An In-progress Session has exactly one editing device lease at a time.
- [x] A second device can explicitly take ownership; after takeover, the previous device becomes read-only and receives a clear prompt.
- [x] A completed or abandoned Session releases its editing ownership.
- [x] Automated tests cover two devices editing the same Workout Plan and two devices operating the same In-progress Session.

## Answer

Added integer server versions to mutable plan, exercise, and Workout Session entities; all mutations now use version checking and return the latest record on conflict. In-progress Sessions use a per-login device lease with atomic takeover, read-only legacy devices, and release on completion or abandonment. The Playwright smoke also covers the existing UI while API tests cover stale parent edits, concurrent takeover, and lease release.
