# Fitness Planning and Tracking

This context describes how a person defines recurring fitness plans, records completed workouts, and understands progress within each plan.

## Language

**User**:
A registered person whose Workout Plans, Exercises, Workout Sessions, settings, and progress are private to that User. The User has a configurable time zone used when starting future sessions.
_Avoid_: Account, athlete

**User Deletion**:
The irreversible removal of a User and all data they own, including plans, exercises, sessions, settings, drafts, and identifiers associated with telemetry.
_Avoid_: Sign out, deactivate account

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
A user-created physical activity with a stable identity, a Resistance Type, and a Target Type, but no prescribed sets or target values. Its latest name is used when displaying both current and historical results; the MVP has no built-in Exercise library.
_Avoid_: Movement, exercise name

**Planned Exercise**:
A use of an Exercise within one Workout Day, defining its number of sets and one uniform repetition or duration target and applicable weight shared by those sets.
_Avoid_: Movement template, task

**Resistance Type**:
Whether an Exercise is performed with external weight (Weighted) or without required external weight (Bodyweight).
_Avoid_: Weight mode, load type

**Weight Unit**:
The user's chosen display unit for equivalent weight values, either kilograms (kg) or pounds (lb). Switching units converts displayed values without changing their meaning.
_Avoid_: Measurement system, stored unit

**Target Type**:
Whether an Exercise target is measured by repetitions (Repetitions) or elapsed seconds (Duration).
_Avoid_: Measurement mode, set type

**Workout Session**:
A performance of a Workout Day whose targets, time zone, and local start date are fixed when the session starts, so they cannot be edited during training and later setting or plan edits cannot change its historical results. It cannot be backdated; if it crosses midnight, it belongs to its start date.
_Avoid_: Workout, activity log

**Added Exercise**:
An exercise added while performing a Workout Session that was not originally part of the selected Workout Day. It must have complete targets before being added, after which those targets are locked; it may also be saved to the Workout Day for future sessions.
_Avoid_: Temporary exercise, ad hoc movement

**Removed Exercise**:
A Planned Exercise intentionally removed from one Workout Session's targets without changing the Workout Day or reducing that session's Achievement Rate.
_Avoid_: Skipped exercise, deleted exercise

**Skipped Set**:
A planned set retained in a Workout Session but not performed; it contributes zero toward that Exercise's Achievement Rate.
_Avoid_: Removed set, deleted set

**In-progress Session**:
A Workout Session that can still receive results and does not yet contribute to progress statistics. It is either active or paused, and a user may have only one at a time in the MVP.
_Avoid_: Active workout, draft workout

**Paused Session**:
An In-progress Session temporarily stopped by the user; its records are frozen and its paused intervals do not contribute to Training Time.
_Avoid_: Abandoned session, stopped workout

**Training Time**:
The sum of a Workout Session's active intervals between starting and completing it, excluding every paused interval and any unknown interval after more than five minutes without a heartbeat. Daily Training Time is the sum across Completed Sessions on their start date, across all plans.
_Avoid_: Elapsed time, session span

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

**Permanent Exercise Deletion**:
The irreversible removal of an Exercise from every Workout Plan and Workout Session, including all of its set results, trends, and Progression Suggestions; the surrounding sessions and their other exercises remain.
_Avoid_: Archive exercise, remove from plan

**Plan Progress**:
The completed-session dates and per-Exercise trends derived only from Workout Sessions belonging to one Workout Plan; it has no aggregate plan achievement rate.
_Avoid_: User progress, global statistics

**Progression Suggestion**:
An informational prompt shown when the same Exercise in one Workout Plan reaches 100% in three consecutive Completed Sessions with unchanged targets and exceeds its target in at least two of them. It suggests only a direction and remains until the Planned Exercise target changes; it never changes the plan or requires a response.
_Avoid_: Automatic progression, recommendation action
