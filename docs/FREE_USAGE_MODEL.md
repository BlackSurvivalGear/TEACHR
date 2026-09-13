# Free generation usage model

TEACHR free Members receive three successful generations independently for each generating tool:

- `lesson`
- `worksheet`
- `quiz`
- `differentiate`
- `curriculum`
- `revision`
- `parent`

The Resource Library is not a generating tool and has no allowance.

## Firestore record

Each tool's future server-controlled record uses this path and shape:

```text
users/{uid}/usage/{toolId}
  toolId: string
  successfulGenerations: number
  allowance: 3
  updatedAt: timestamp
```

A missing record means zero successful generations. This gives existing Members the full three-use allowance without a migration. Pro plans and `pro`, `admin`, or `superadmin` roles are unlimited.

Stage 1 defines and tests the model only. Server-side enforcement, atomic counter writes, Firestore security rules and user-interface counters are implemented in later stages.
