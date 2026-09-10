# 07: Make Progression Suggestions correct and consistent

**What to build:** A User sees a trustworthy Progression Suggestion when the same Planned Exercise has genuinely repeated success, and the suggestion appears consistently wherever that Exercise is reviewed.

**Blocked by:** 06 (Provide progress views and Home overview)

**Status:** ready-for-agent

- [ ] A suggestion appears only when the same Planned Exercise in one Workout Plan reaches 100% in three consecutive Completed Sessions with identical targets.
- [ ] At least two of those three sessions must include Exercise Excess.
- [ ] A change to weight, set count, repetitions, or duration resets the consecutive streak, including when the target later changes back.
- [ ] Weighted repetitions suggest adding weight; Bodyweight repetitions suggest adding repetitions.
- [ ] Bodyweight duration suggests adding duration; Weighted duration suggests adding weight or duration.
- [ ] The suggestion appears consistently in Home, Workout Plan detail, and the Exercise trend.
- [ ] The suggestion remains until the corresponding Planned Exercise target changes and has no apply, dismiss, notification, or automatic plan-change action.
- [ ] Automated tests cover all four Exercise Type combinations, two-of-three excess, target reset, persistence, and display surfaces.

