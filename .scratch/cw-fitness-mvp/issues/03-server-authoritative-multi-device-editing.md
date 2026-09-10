# 03: Establish server-authoritative multi-device editing

**What to build:** Multiple devices can view the same User's data, but conflicting edits are explicit and only one device may edit an In-progress Session at a time. PostgreSQL remains the authoritative source.

**Blocked by:** 01 (Establish local test and sync seams)

**Status:** ready-for-agent

- [ ] Mutable Workout Plans, Workout Days, Planned Exercises, Exercises, and In-progress Sessions expose a server version.
- [ ] Mutating requests carry the version the client edited from; stale versions return a conflict with the current server state instead of being applied.
- [ ] The UI presents a conflict that requires refresh and new editing; no last-write-wins or field-level merge occurs.
- [ ] An In-progress Session has exactly one editing device lease at a time.
- [ ] A second device can explicitly take ownership; after takeover, the previous device becomes read-only and receives a clear prompt.
- [ ] A completed or abandoned Session releases its editing ownership.
- [ ] Automated tests cover two devices editing the same Workout Plan and two devices operating the same In-progress Session.

