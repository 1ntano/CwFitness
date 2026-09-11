# 02: Complete account authentication

**What to build:** A User can complete the full email-and-password account lifecycle: sign up, verify the email address, sign in, recover a forgotten password, and sign out.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Sign-up sends a verification message through a local-development email seam and clearly reports that verification is pending.
- [x] An unverified User cannot use authenticated product features until verification succeeds.
- [x] A valid verification link marks the email as verified and signs the User into the appropriate state.
- [x] Invalid, expired, and already-used verification links show actionable feedback without leaking account existence.
- [x] Forgot-password requests always return the same public response, whether or not the email belongs to a User.
- [x] A valid reset link allows the User to choose a new password; invalid or expired links fail safely.
- [x] Existing Session cookies remain Secure, HttpOnly, and SameSite compliant, and sign-out invalidates the current Session.
- [x] Automated tests cover the verification, recovery, expiry, and sign-out paths.

## Answer

Enabled Better Auth email verification and password recovery with a local JSON-lines email outbox for development and tests. Added verification-result, forgot-password, and reset-password UI flows, plus a verified-session guard that bypasses cookie caching and protects every authenticated API from legacy unverified Sessions.
