# Snapshot session targets and score each exercise independently

A Workout Session captures immutable plan targets, time zone, and local date when it starts. Achievement is calculated per Exercise by averaging planned-set scores, with each weighted set using the lower of its target-metric ratio and weight ratio; this preserves historical meaning and prevents extra weight or repetitions from masking a missed target.

## Consequences

Later plan edits cannot rewrite history, removed exercises do not distort the current Session, and different exercise units are never combined into a plan-wide achievement rate. Excess work remains separate and may trigger an informational progression prompt.
