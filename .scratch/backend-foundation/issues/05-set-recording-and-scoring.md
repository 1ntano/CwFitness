# Record sets and score Exercises

- Status: resolved
- Labels: enhancement, backend

## Confirmed test seam

Authenticated HTTP endpoints for recording or skipping a set, adding and removing a Session Exercise, and completing a Workout Session with per-Exercise results.

## Acceptance criteria

- Only an active owned Session accepts set results.
- Missing and skipped sets score zero.
- Weighted set scoring uses the lower target and weight ratio, capped at 100%.
- Excess target and weight values are returned separately.
- Added Exercises require complete targets and contribute to history.
- Removed Exercises do not reduce achievement and do not alter the Workout Day.

## Resolution

Added idempotent per-set results, Added/Removed Exercise state, active-session write guards, canonical kg/lb conversion, and completion-time per-Exercise achievement and excess calculations. Removed Exercises are retained in the Session but excluded from scoring.
