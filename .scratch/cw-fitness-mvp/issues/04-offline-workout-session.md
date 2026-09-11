# 04: Persist a complete offline Workout Session

**What to build:** During a short network interruption, a User can continue recording the current Workout Session, refresh or reopen the page, and later synchronize the queued work without duplicate results.

**Blocked by:** 01 (Establish local test and sync seams), 03 (Establish server-authoritative multi-device editing)

**Status:** resolved

- [x] The active Workout Session snapshot, Session Exercise state, set results, skips, additions, removals, and ordering changes are recoverable locally after a refresh.
- [x] Offline mutations update the visible training state immediately and are visibly marked as waiting to synchronize.
- [x] Queued operations retain operation identities and are sent in order after connectivity returns.
- [x] A successful acknowledgement removes the queued operation; retries never create duplicate sets or duplicate state changes.
- [x] A failed synchronization stops the queue at the failed operation, preserves later operations, and shows a recoverable error.
- [x] Offline access is limited to the current In-progress Session; Workout Plan editing and full history browsing still require connectivity.
- [x] Automated tests cover record, skip, add, remove, reorder, refresh recovery, reconnection, and replay.


## Answer

The active Workout Session draft and ordered mutation outbox now persist in IndexedDB per User. Set recording, skips, Session Exercise additions, removals, and ordering are applied optimistically, survive refresh, and replay in order after reconnection; a failed mutation preserves its queue tail and exposes retry feedback. Offline mode limits navigation to the current Session. API writes are idempotent across retries, including added Exercises, removals, ordering, and the latest set update. The local verification suite covers draft recovery, User isolation, replay ordering and failure preservation, set retry idempotency, order replay, and the complete HTTP/browser workflows.
