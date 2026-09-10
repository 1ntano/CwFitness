# Build Workout Session lifecycle

- Status: resolved
- Labels: enhancement, backend

## Confirmed test seam

Authenticated HTTP endpoints for starting, restoring, pausing, resuming, and completing a Workout Session.

## Acceptance criteria

- Starting snapshots the Workout Day and all Planned Exercise targets, time zone, and local date.
- A User can have only one In-progress Session.
- Only the owning User can operate a Workout Session.
- Paused time does not count toward Training Time.
- A Completed Session is no longer returned as active.

## Resolution

Added versioned Workout Session and Session Exercise snapshot storage plus authenticated lifecycle endpoints. A partial unique database index enforces one In-progress Session per User, and completion subtracts all recorded paused intervals from Training Time.
