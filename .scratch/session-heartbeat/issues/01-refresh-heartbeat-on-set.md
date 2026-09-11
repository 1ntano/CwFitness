# 01: Refresh heartbeat when recording a set

**What to build:** Recording a planned set should count as activity and refresh the active Workout Session heartbeat.

**Blocked by:** None

**Status:** resolved

- [x] Update `lastHeartbeatAt` in the active-session lease when a set is recorded.
- [x] Keep completed-session corrections unchanged.
- [x] Add an HTTP regression test that starts a Session, makes its heartbeat stale, records a set, and verifies the heartbeat was refreshed.
- [x] Run the full test suite.

## Answer

Set recording now refreshes `lastHeartbeatAt` in the same transaction that writes the set result. The regression test verifies a set can be recorded after the previous heartbeat was ten minutes old.
