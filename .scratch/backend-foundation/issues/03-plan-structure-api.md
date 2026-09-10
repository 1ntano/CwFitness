# Build Workout Plan structure APIs

- Status: resolved
- Labels: enhancement, backend

## Goal

Add authenticated APIs for user-owned Exercises, Workout Days, and Planned Exercises.

## Confirmed test seam

The public HTTP API is the test boundary: Exercise collection and rename endpoints, Workout Day creation, and Planned Exercise creation.

## Acceptance criteria

- Exercise identity survives renaming and Exercises are private to their User.
- Only the owning User can add a Workout Day to a Workout Plan.
- A Planned Exercise stores one uniform target shared by all sets.
- Weighted Exercises require a positive weight; Bodyweight Exercises do not.
- Invalid or cross-User references are rejected.

## Resolution

Implemented the confirmed authenticated HTTP seams with a versioned PostgreSQL migration. Exercise names can change without changing identity; all ownership checks return scoped results; Planned Exercise targets use a canonical gram value for kg/lb input.
