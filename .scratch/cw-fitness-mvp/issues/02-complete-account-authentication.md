# 02: Complete account authentication

**What to build:** A User can complete the full email-and-password account lifecycle: sign up, verify the email address, sign in, recover a forgotten password, and sign out.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Sign-up sends a verification message through a local-development email seam and clearly reports that verification is pending.
- [ ] An unverified User cannot use authenticated product features until verification succeeds.
- [ ] A valid verification link marks the email as verified and signs the User into the appropriate state.
- [ ] Invalid, expired, and already-used verification links show actionable feedback without leaking account existence.
- [ ] Forgot-password requests always return the same public response, whether or not the email belongs to a User.
- [ ] A valid reset link allows the User to choose a new password; invalid or expired links fail safely.
- [ ] Existing Session cookies remain Secure, HttpOnly, and SameSite compliant, and sign-out invalidates the current Session.
- [ ] Automated tests cover the verification, recovery, expiry, and sign-out paths.

