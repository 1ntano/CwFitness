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
A named part of a Workout Plan containing the exercises intended for one training occasion; it may be performed on any user-chosen day of the week.
_Avoid_: Split, schedule

**Planned Exercise**:
An exercise prescribed within a Workout Day, including its planned sets and targets such as repetitions, weight, or duration.
_Avoid_: Movement template, task

**Workout Session**:
One dated performance of a Workout Day in which the user records actual results for each set.
_Avoid_: Workout, activity log

**Added Exercise**:
An exercise added while performing a Workout Session that was not part of the selected Workout Day and is included in that plan's statistics.
_Avoid_: Temporary exercise, ad hoc movement

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
