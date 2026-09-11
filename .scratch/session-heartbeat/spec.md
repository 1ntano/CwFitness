# Active Session heartbeat during set recording

## Goal

An active Workout Session must not be auto-paused while the User is actively recording planned sets.

## Scope

- Recording a set refreshes the active Session heartbeat.
- The heartbeat remains the source of truth for inactive-session detection.
- Stale sessions still pause when there is no activity.

## Success criteria

- Recording a set after a stale heartbeat succeeds.
- The Session heartbeat is newer after the set is recorded.
- Existing stale-session behavior remains unchanged.
