# Firestore usage security

Generation counters live below each user at `users/{uid}/usage/{toolId}`.

Client access is deliberately limited:

- A signed-in Member may read only their own usage documents.
- Admin and Superadmin accounts may read usage documents for support and administration.
- No browser client may create, update, reset or delete a usage document.
- The Firebase Admin SDK in the trusted generation backend is the sole writer and bypasses client security rules by design.

These rules must be deployed to the TEACHR Firebase project's Firestore Rules before frontend usage counters are enabled.
