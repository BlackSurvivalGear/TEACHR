# TEACHR Credits — Stage 3 migration

Stage 3 converts the remaining legacy per-tool allowance into one universal Credit balance.

## Migration rule

For each of the six generating tools:

`remaining = max(0, allowance - successfulGenerations)`

Universal Credit balance is the sum of all six remaining values. This preserves historical admin grants because any allowance above the original 3-per-tool baseline remains part of the sum.

## Safety

- Migration version: `1`.
- A record already marked `migrated` or `migrationVersion >= 1` is skipped.
- The migration does not delete or alter legacy usage documents.
- Production generation enforcement remains on the legacy quota system until the later cutover stage.
- The migration ledger entry records the opening universal Credit balance.

## Example from admin usage

A member with 10 successful generations and 27 currently available across the legacy tools migrates to exactly **27 Credits**. The previous admin-granted allowance is preserved rather than resetting the member to 18.

## Rollout boundary

This stage supplies deterministic/idempotent migration logic and tests. Actual production Firestore writes must be performed only through the authenticated backend transaction in the rollout stage; clients must never be allowed to self-award or migrate Credits.
