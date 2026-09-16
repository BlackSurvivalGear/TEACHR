# Stage 4 — Universal Credit enforcement cutover

## Acceptance criteria
- The six primary generating tools share one account-level TEACHR Credit balance.
- One successful primary generation consumes exactly one Credit.
- Provider failures and empty responses consume no Credit.
- A zero-Credit member is blocked before provider invocation.
- Pro, Admin and Superadmin remain unlimited and retain their stored balance.
- Existing migrated balances and historical admin grants remain unchanged.
- Ask TEACHR chat keeps its separate chat allowance in this stage.
- Concurrent successful requests cannot overspend the same Credit.
- Client usage display is switched from per-tool remaining values to the universal Credit balance.

## Must remain unchanged
Authentication, email verification, suspension handling, Stripe/Pro access, Ask TEACHR quota, prompt validation and AI provider behaviour.
