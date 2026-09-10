# 05: Complete Completed Session history management

**What to build:** A User can review accurate historical Workout Sessions, correct actual results without changing the original snapshot, see that a record was modified, and permanently delete an entire Completed Session when required.

**Blocked by:** 03 (Establish server-authoritative multi-device editing)

**Status:** ready-for-agent

- [ ] Completed Session history displays the latest Exercise name while retaining the Exercise identity and locked Session targets.
- [ ] A User can correct actual value, actual weight, and Skipped Set state for any target set.
- [ ] A corrected Completed Session is persistently marked as modified and recalculates Exercise Achievement Rate, Exercise Excess, and any applicable Progression Suggestion.
- [ ] Historical correction cannot change Session exercises, targets, timing, local start date, or Workout Plan ownership.
- [ ] A User can permanently delete one Completed Session after an explicit second confirmation.
- [ ] Completed Session deletion removes its set results and historical contributions without deleting the Workout Plan or Exercise.
- [ ] Automated tests cover correction, recalculation, naming, ownership, and deletion.

