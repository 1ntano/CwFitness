# Fitness Planning and Tracking

This context describes how a person defines recurring fitness plans, records completed workouts, and understands progress within each plan.

## Language

**User**:
A person who owns fitness plans and workout history. The MVP has one user, while ownership remains part of the domain.
_Avoid_: Account, athlete

**Workout Plan**:
A user-owned, reusable weekly fitness plan whose progress is measured independently from the user's other plans.
_Avoid_: Routine, program

**Workout Day**:
A named part of a Workout Plan containing the exercises intended for one training occasion. It may have a suggested weekday, while the user may perform it earlier or later.
_Avoid_: Split, schedule

**Planned Exercise**:
An exercise prescribed within a Workout Day, including its planned sets and targets such as repetitions, weight, or duration.
_Avoid_: Movement template, task

**Workout Session**:
A dated performance of a Workout Day whose targets are fixed when the session starts, so later plan edits cannot change its historical results.
_Avoid_: Workout, activity log

**Added Exercise**:
An exercise added while performing a Workout Session that was not originally part of the selected Workout Day. It must have target sets, repetitions or duration, and weight when applicable before being recorded.
_Avoid_: Temporary exercise, ad hoc movement

**Removed Exercise**:
A Planned Exercise intentionally removed from one Workout Session's targets without changing the Workout Day or reducing that session's Achievement Rate.
_Avoid_: Skipped exercise, deleted exercise

**Skipped Set**:
A planned set retained in a Workout Session but not performed; it contributes zero completed Training Volume.
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

**Training Volume**:
The measurable amount of work for an exercise: repetitions multiplied by weight for weighted exercises, repetitions for unweighted exercises, or seconds for timed exercises.
_Avoid_: Workload, effort

**Achievement Rate**:
The completed Training Volume divided by the planned Training Volume for a Workout Session, capped at 100%; skipped sets contribute zero.
_Avoid_: Completion rate, compliance score

**Excess Volume**:
Completed Training Volume beyond the planned Training Volume, shown separately rather than increasing Achievement Rate above 100%.
_Avoid_: Bonus completion, overachievement rate

**Plan Progress**:
The dated history and trends derived only from Workout Sessions belonging to one Workout Plan.
_Avoid_: User progress, global statistics
