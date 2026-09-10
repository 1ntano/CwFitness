# Fitness Planning and Tracking

This context describes how a person defines recurring fitness plans, records completed workouts, and understands progress within each plan.

## Language

**User**:
A person who owns fitness plans and workout history. The MVP has one user, while ownership remains part of the domain.
_Avoid_: Account, athlete

**Workout Plan**:
A user-owned, reusable weekly fitness plan whose progress is measured independently from the user's other plans.
_Avoid_: Routine, program

**Archived Plan**:
A Workout Plan that cannot start new Workout Sessions but retains all historical results and may be restored.
_Avoid_: Deleted plan, inactive routine

**Workout Day**:
A named part of a Workout Plan containing the exercises intended for one training occasion. It may have a suggested weekday, while the user may perform it earlier or later.
_Avoid_: Split, schedule

**Exercise**:
A named physical activity with a stable identity. Its latest name is used when displaying both current and historical results.
_Avoid_: Movement, exercise name

**Planned Exercise**:
A prescribed Exercise within a Workout Day, with one uniform target shared by all of its planned sets.
_Avoid_: Movement template, task

**Resistance Type**:
Whether an Exercise is performed with external weight (Weighted) or without required external weight (Bodyweight).
_Avoid_: Weight mode, load type

**Target Type**:
Whether an Exercise target is measured by repetitions (Repetitions) or elapsed seconds (Duration).
_Avoid_: Measurement mode, set type

**Workout Session**:
A dated performance of a Workout Day whose targets are fixed when the session starts, so later plan edits cannot change its historical results.
_Avoid_: Workout, activity log

**Added Exercise**:
An exercise added while performing a Workout Session that was not originally part of the selected Workout Day. It must have complete targets before being recorded and may also be saved to the Workout Day for future sessions.
_Avoid_: Temporary exercise, ad hoc movement

**Removed Exercise**:
A Planned Exercise intentionally removed from one Workout Session's targets without changing the Workout Day or reducing that session's Achievement Rate.
_Avoid_: Skipped exercise, deleted exercise

**Skipped Set**:
A planned set retained in a Workout Session but not performed; it contributes zero toward that Exercise's Achievement Rate.
_Avoid_: Removed set, deleted set

**In-progress Session**:
A Workout Session that can still receive results and does not yet contribute to progress statistics. A user may have only one at a time in the MVP.
_Avoid_: Active workout, draft workout

**Completed Session**:
A Workout Session the user has explicitly finished; it contributes to progress statistics using its actual completion date.
_Avoid_: Closed workout, saved workout

**Abandoned Session**:
A retained Workout Session the user chose not to finish; it does not contribute to progress statistics.
_Avoid_: Deleted workout, failed workout

**Exercise Achievement Rate**:
The average of one Exercise's planned-set results in a Workout Session, capped at 100%. Each set uses the lower completion ratio between its Target Type and, for Weighted exercises, its prescribed weight; skipped sets contribute zero.
_Avoid_: Plan achievement rate, completion score

**Exercise Excess**:
The amount by which one Exercise exceeds its prescribed target. It is shown separately from Exercise Achievement Rate and can support progression suggestions.
_Avoid_: Excess volume, bonus completion

**Plan Progress**:
The completed-session dates and per-Exercise trends derived only from Workout Sessions belonging to one Workout Plan; it has no aggregate plan achievement rate.
_Avoid_: User progress, global statistics

**Progression Suggestion**:
An informational prompt shown when the same Exercise in one Workout Plan reaches 100% in three consecutive Completed Sessions and exceeds its target in at least two of them. It never changes the Workout Plan or requires an accept-or-dismiss response.
_Avoid_: Automatic progression, recommendation action
