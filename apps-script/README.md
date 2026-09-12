# Pro TEACHR Stripe subscription backend

1. Create a Google Apps Script project owned by the account that can access Firebase project `teachr-bf740`.
2. Copy `Code.gs` and `appsscript.json` into the project.
3. In **Project Settings → Script properties**, add `STRIPE_SECRET_KEY` using a Stripe test key first. Never commit this key.
4. Deploy as a web app: execute as **Me** and allow access to **Anyone**.
5. Paste the `/exec` URL into `payment-config.js` as `appsScriptUrl`.
6. Run and authorise `syncAllSubscriptions`, then create a daily time-driven trigger for it. This revokes TEACHR access after a Stripe subscription becomes cancelled or unpaid (within the trigger interval).
7. Deploy `firestore.rules`, test a successful £9.99 subscription, a cancelled checkout and a cancelled subscription before switching to a live Stripe key.

The browser never grants Pro access. The backend verifies the Stripe Checkout Session against the signed-in Firebase UID and email before writing the Pro role to Firestore.
