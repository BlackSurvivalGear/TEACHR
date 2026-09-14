# Pro TEACHR Stripe subscription backend

1. Create a Google Apps Script project owned by the account that can access Firebase project `teachr-bf740`.
2. Copy `Code.gs` and `appsscript.json` into the project.
3. In **Project Settings → Script properties**, add `STRIPE_SECRET_KEY` using a Stripe test key first. Never commit this key.
4. Deploy as a web app: execute as **Me** and allow access to **Anyone**.
5. Paste the `/exec` URL into `payment-config.js` as `appsScriptUrl`.
6. Run and authorise `syncAllSubscriptions`, then create a daily time-driven trigger for it. This revokes TEACHR access after a Stripe subscription becomes cancelled or unpaid (within the trigger interval).
7. Deploy `firestore.rules`, test a successful £9.99 subscription, a cancelled checkout and a cancelled subscription before switching to a live Stripe key.

The browser never grants Pro access. The backend verifies the Stripe Checkout Session against the signed-in Firebase UID and email before writing the Pro role to Firestore.

## Stage 2 — AI generation through the same web app

The Apps Script backend replaces the proposed Vercel generation host. Existing
Stripe GET handlers and subscription reconciliation remain unchanged. The new
`doPost` in `Generation.gs` handles generation only.

### Deploy the backend before merging the frontend

1. Open the existing TEACHR Apps Script project linked to the `/exec` URL in
   `payment-config.js`. Preserve its existing `Code.gs`, Stripe properties and
   subscription trigger.
2. Add **Generation.gs** and **GenerationUsage.gs** from this directory. Do not
   create a second `doPost` if the live project already has one: inspect and
   reconcile that handler before deployment. `GenerationUsage.gs` is an exact
   copy of the canonical `generation-usage.js`; the test suite checks parity.
3. Add Script Properties `AI_API_KEY` and `AI_MODEL`. Use an OpenAI API key with
   API billing enabled and a chat-completions model available to that account.
   Neither value is taken from browser requests. Do not paste the secret into
   repository files or client configuration.
4. Keep the existing manifest's `script.external_request` and `datastore` scopes.
   The deploying Google account must have Firestore read/write IAM access to
   `teachr-bf740`. The Firebase public API key used by the identity lookup must
   permit server-side Identity Toolkit requests. No Firebase service-account
   private key is needed when using the deploying account's OAuth token.
5. Use **Deploy → Manage deployments → Edit → New version → Deploy**, preserving
   the existing deployment URL. Execute as **Me**, access **Anyone**; Firebase
   authentication and verified-email checks are enforced inside the endpoint.
   Complete Google authorization if prompted. Never remove or replace existing
   Stripe properties while adding the AI settings.
6. Before merging, use the frontend branch with a dedicated verified Firebase
   account to test the actual browser POST/redirect flow, each of the six tools,
   usage counters, exhausted allowance and Pro access. Confirm payment checkout
   and the daily reconciliation trigger still work. Local mocks cannot verify
   Google's CORS behavior, authorization, actual Firestore transactions or billing.

### Ask TEACHR / AI Chat deployment sync

Ask TEACHR uses the same `/exec` web app as the six generators, but its server path
also depends on **ChatUsage.gs**. A deployment that contains `Generation.gs` but
not the current `ChatUsage.gs` can leave the six generators working while chat
fails with the generic `Generation service is unavailable. Please try again.`
response.

For every Apps Script AI deployment, treat these repository files as one deployable
backend set and synchronise all of them before creating the new Apps Script version:

- `Code.gs` — existing Stripe/subscription GET handlers and shared `CONFIG`.
- `Generation.gs` — the single generation `doPost`, Firebase identity verification,
  provider call, and routing between generator and chat usage.
- `GenerationUsage.gs` — the six generating-tool allowance implementation.
- `ChatUsage.gs` — Ask TEACHR's independent 10-message free allowance and success
  recording.
- `appsscript.json` — required Apps Script OAuth scopes.

Do not create a second Apps Script project and do not change `payment-config.js`
when synchronising an existing deployment. In the existing TEACHR Apps Script
project, add/update the files above, then use **Deploy → Manage deployments → Edit
→ New version → Deploy** so the current `/exec` URL remains stable.

Before redeploying, confirm Script Properties still contain `AI_API_KEY`, `AI_MODEL`
and the existing Stripe configuration. After redeploying, test in this order:

1. Lesson Builder still returns AI content.
2. Ask TEACHR returns AI content for a signed-in, verified member.
3. A successful Ask TEACHR response increments only `users/{uid}/usage/chat`.
4. Ask TEACHR failures consume no chat allowance.
5. Generator usage remains independent from chat usage.
6. Pro/Admin/Superadmin chat remains unlimited.
7. Stripe checkout and subscription reconciliation still work.

If Ask TEACHR still returns the generic availability message after a complete sync,
inspect the Apps Script execution log for the failing `doPost`. Known chat errors
(`AUTH_REQUIRED`, `INVALID_TOKEN`, `EMAIL_NOT_VERIFIED`, `PROFILE_REQUIRED`,
`CHAT_LIMIT_REACHED`, `AI_NOT_CONFIGURED`, `AI_PROVIDER_FAILED`,
`AI_EMPTY_RESPONSE`, `USAGE_UNAVAILABLE`) should reach the client with their
specific messages; the generic message indicates an unexpected server exception.

The production client uses the existing `TEACHR_PAYMENT.appsScriptUrl`. Firebase
ID tokens travel in a JSON body sent as `text/plain` to avoid a CORS preflight;
no token is placed in a URL. Redirects are followed and Google cookies are omitted.
ContentService returns an `{ok,status,...}` JSON envelope because it cannot set
custom HTTP error statuses. The client handles envelope failures even on HTTP 200.
Localhost retains the existing Node `/api/generate` development path.

A free user's successful result is charged only after a Firestore transaction
re-reads their current profile and usage and commits the increment. Failed
provider calls and invalid output do not write usage. Concurrent calls can invoke
the provider, but only calls which commit within the remaining allowance return
content; the other calls may still incur provider cost. Admin allowance changes
and audit fields are preserved. Subscription revocation during generation is
checked again before returning content. As with the previous backend, a network
failure after the server commits can leave usage recorded without delivery;
there is no automatic retry or request replay facility in this stage.

Apps Script has execution/concurrency and daily URL Fetch quotas, so it is a
bounded hosting option, not unlimited infrastructure. OpenAI API usage and any
Firestore usage outside its allowance are billed separately.

Verification: `npm run check` and `npm test`. The new tests exercise the actual
Apps Script functions with mocked Google/OpenAI services, including transaction
conflict retries and subscription revocation. Live deployment remains a separate
gate before declaring Stage 2 complete.
