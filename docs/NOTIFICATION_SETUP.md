# Notification Provider Setup — Twilio + Resend

Human-facing checklist for Phase 3 tasks 3.1 and 3.2. Walk through these before starting 3.3 (the notification service), which needs real credentials to talk to.

Final env var names and `from` address get locked in 3.3. Names used here are placeholders that match what the service will likely expect.

> **Do `docs/EMAIL_SETUP.md` (Zoho mailboxes for `info@` / `andy@sailbook.live`) before task 3.2.** Zoho sets the MX record and the initial SPF record for the domain. Resend then stacks on top — you'll *merge* into the existing SPF record, not create a new one. Twilio (3.1) has no DNS dependency, so do it whenever.

---

## 3.1 — Twilio (SMS)

### 1. Create the account
- Sign up at [twilio.com](https://www.twilio.com/try-twilio)
- Verify email and phone number
- Complete the onboarding questionnaire (pick "SMS", "Node.js", "Alerts & Notifications" — these just tailor the dashboard, they don't lock anything in)

### 2. Trial vs paid — decision point
Twilio starts you on a trial account: free credit (~$15), one free trial number, but:
- Every message is prefixed with "Sent from your Twilio trial account"
- You can only send to numbers you've verified in the console

Trial is fine for building and testing 3.3–3.9. **Upgrade before go-live** (before 3.14 / Phase 3 close). Upgrade is a one-click "Upgrade" button in the console — adds a payment method, drops the prefix, removes the verified-recipient restriction.

### 3. Buy a phone number
- Console → Phone Numbers → Manage → Buy a number
- Country: US. Capabilities: SMS (MMS optional).
- Pick a local number — area code 216 (Cleveland) reads better to LTSC students than a random one.
- Cost: ~$1.15/mo. The trial credit covers this for now.

### 4. Grab credentials
From Console home (twilio.com/console):
- **Account SID** — visible on the dashboard
- **Auth Token** — click "View" to reveal
- **Phone Number** — the one you just bought, in E.164 format (e.g. `+12165551234`)

### 5. Drop into `.env.local`
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+12165551234
```

(Variable names may change slightly in 3.3 — update `.env.local` to match whatever the service imports.)

### 6. Smoke test
Console → Phone Numbers → your number → "Send a test SMS" — send to your own phone. Confirms the account + number are live before 3.3 depends on them.

---

## 3.2 — Resend (email)

### 1. Create the account
- Sign up at [resend.com](https://resend.com)
- Verify email

### 2. Add the sending domain
- Dashboard → Domains → Add Domain
- Enter `sailbook.live`
- Region: US (closest to Vercel's default edge)

Resend will show you a list of DNS records to add — typically a few TXT records (SPF, DKIM) and possibly a CNAME. Resend does **not** need MX records (it's send-only; Zoho handles inbound).

### 3. Add the DNS records in Cloudflare
Assumes Zoho was set up first per `docs/EMAIL_SETUP.md`, so an SPF record already exists.

- Cloudflare dashboard → `sailbook.live` → DNS → Records
- **SPF — merge, don't duplicate.** Find the existing TXT record starting with `v=spf1` (the Zoho one). Edit it to add Resend's include. Result looks like:
  ```
  v=spf1 include:zoho.com include:_spf.resend.com ~all
  ```
  (Use whatever `include:` value Resend shows you — it may differ.) A domain with two separate SPF records will fail validation on most mail servers.
- **DKIM — add as a new record.** Resend's DKIM uses its own selector (e.g. `resend._domainkey`), so it coexists with Zoho's DKIM. Copy Resend's exact host/value.
- **CNAME (if Resend asks)** — add as shown.
- **Turn off the orange cloud (proxy)** for all mail-related records — they need to resolve to the actual mail servers, not through Cloudflare.
- TTL: Auto is fine.

Back in Resend, click "Verify". Usually takes under a minute. If it fails, double-check the record values (Resend's UI lets you re-check individual records).

### 4. Create an API key
- Dashboard → API Keys → Create API Key
- Name: `sailbook-dev` (create a separate `sailbook-prod` later — keys can be scoped to specific domains)
- Permission: "Sending access"
- Copy the key immediately — it's shown once.

### 5. Drop into `.env.local`
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 6. Decide on the `from` address — decision point
Pick one before 3.3. Options:
- `noreply@sailbook.live` — standard, signals "don't reply to this"
- `info@sailbook.live` — friendlier, replies land in the Zoho/Gmail inbox set up in `EMAIL_SETUP.md` (useful if students hit reply with questions)
- `notifications@sailbook.live` — middle ground (would need a new Zoho mailbox or alias)

Recommendation: `info@sailbook.live` for V1. Zoho is already hosting that mailbox, replies land in Gmail, Andy can respond from the branded address — clean loop. Revisit if volume grows.

### 7. Smoke test
Resend dashboard → "Send test email" — send to your own address. Confirms domain verification + key + DNS all line up before 3.3.

---

## Checklist summary

Twilio:
- [ ] Account created
- [ ] Phone number purchased (216 area code)
- [ ] Credentials in `.env.local`
- [ ] Test SMS received
- [ ] (Before go-live) Upgraded from trial

Resend (do after Zoho / `EMAIL_SETUP.md`):
- [ ] Account created
- [ ] `sailbook.live` added as sending domain
- [ ] SPF record *merged* (not duplicated) with Resend's include
- [ ] Resend DKIM record added
- [ ] Domain verified in Resend
- [ ] API key in `.env.local`
- [ ] `from` address decided
- [ ] Test email received
