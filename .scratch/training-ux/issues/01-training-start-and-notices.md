# 01: Improve training start and transient notices

**What to build:** Starting a Workout Session should immediately open Training, server errors should be understandable in Chinese, and transient notices should disappear.

**Blocked by:** None

**Status:** resolved

- [x] Move `setView("training")` before the follow-up data refresh.
- [x] Translate Workout Session startup errors to Chinese.
- [x] Auto-hide workspace notices after five seconds.
- [x] Prevent hidden notices from intercepting clicks.
- [x] Verify the duplicate-start response is Chinese.

## Comments

- 2026-09-11: Implemented and uploaded in `99cb3c4`.
