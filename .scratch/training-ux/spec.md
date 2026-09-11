# Training workflow and transient notices

## Goal

Make the common training workflow direct and make temporary status messages less disruptive.

## Scope

- Starting a Workout Session should open the Training view immediately.
- Duplicate-start server errors should be presented in Chinese.
- Top notices should not remain on screen indefinitely.

## Success criteria

- A successful start request navigates to Training before the follow-up refresh completes.
- If an In-progress Session already exists, the User sees a Chinese explanation.
- Workspace notices fade out after five seconds and stop intercepting pointer input.
