# 06: Provide progress views and Home overview

**What to build:** A User can understand training frequency, Training Time, recent sessions, and per-Exercise progress without combining different Exercises into a single score.

**Blocked by:** 01 (Establish local test and sync seams), 05 (Complete Completed Session history management)

**Status:** ready-for-agent

- [ ] The training Calendar marks Completed Sessions by locked local start date and does not use aggregate plan achievement coloring.
- [ ] Progress shows daily Training Time for the most recent four weeks, weekly totals, and recent Completed Sessions.
- [ ] Each Workout Plan shows completed-session count, recent session duration, and latest training date.
- [ ] Exercise trends are isolated by Workout Plan and Exercise.
- [ ] An Exercise trend shows its weight, repetitions or duration, and Exercise Achievement Rate over time.
- [ ] Exercise trends default to the latest 12 Completed Sessions that include the Exercise and can switch to the latest 4 weeks, 12 weeks, or all history.
- [ ] Home shows the current or suggested Workout Session, recent training, and daily Training Time.
- [ ] No plan-wide, cross-Exercise, or cross-plan aggregate achievement rate is introduced.
- [ ] Automated tests cover date ownership, multi-session days, range filtering, plan isolation, and responsive chart states.

