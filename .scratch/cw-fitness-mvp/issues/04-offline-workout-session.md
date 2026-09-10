# 04: Persist a complete offline Workout Session

**What to build:** During a short network interruption, a User can continue recording the current Workout Session, refresh or reopen the page, and later synchronize the queued work without duplicate results.

**Blocked by:** 01 (Establish local test and sync seams), 03 (Establish server-authoritative multi-device editing)

**Status:** ready-for-agent

- [ ] The active Workout Session snapshot, Session Exercise state, set results, skips, additions, removals, and ordering changes are recoverable locally after a refresh.
- [ ] Offline mutations update the visible training state immediately and are visibly marked as waiting to synchronize.
- [ ] Queued operations retain operation identities and are sent in order after connectivity returns.
- [ ] A successful acknowledgement removes the queued operation; retries never create duplicate sets or duplicate state changes.
- [ ] A failed synchronization stops the queue at the failed operation, preserves later operations, and shows a recoverable error.
- [ ] Offline access is limited to the current In-progress Session; Workout Plan editing and full history browsing still require connectivity.
- [ ] Automated tests cover record, skip, add, remove, reorder, refresh recovery, reconnection, and replay.

