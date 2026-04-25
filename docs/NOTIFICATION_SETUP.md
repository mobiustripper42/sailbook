# Notification Provider Setup — Twilio + Resend

Human-facing checklist for Phase 3 tasks 3.1 and 3.2. Walk through these before starting 3.3 (the notification service), which needs real credentials to talk to.

Final env var names and `from` address get locked in 3.3. Names used here are placeholders that match what the service will likely expect.

> **Do `docs/EMAIL_SETUP.md` (Cloudflare Email Routing + Gmail for `info@sailbook.live`) before task 3.2.** Cloudflare Email Routing adds MX records and may add a TXT record for the domain. Resend then stacks on top — check for an existing SPF record and merge if one is present, don't create a duplicate. Twilio (3.1) has no DNS dependency, so do it whenever.

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

### 3. Buy a phone number — decision point: toll-free vs local

Two viable paths. Pick one for V1; nothing stops you from buying a second number later.

**Toll-free (recommended for V1):**
- Console → Phone Numbers → Manage → Buy a number → check the **Toll-Free** box
- Country: US. Capabilities: SMS.
- Prefix will be 833/844/855/866/877/888 — not local, but skips A2P 10DLC entirely (no $14/mo brand + campaign fees).
- Cost: ~$2/mo for the number. Per-message rate is slightly higher than 10DLC, but at SailBook's volume the avoided 10DLC fees more than cover it.
- **Verification required before sending at volume.** Console → Messaging → Regulatory Compliance → Toll-Free Verification. One-time form: business name, website, use case, sample message bodies, opt-in description. Approval takes a few business days. Unverified toll-free numbers can send small volumes for testing but get rate-limited and may be filtered.
- Tradeoff: no local-area familiarity. Some students may not recognize the number on first text. Acceptable cost for skipping 10DLC overhead in V1.

**Local 216 (Cleveland) — alternative:**
- Console → Phone Numbers → Manage → Buy a number → leave **Local** selected
- Area code 216 reads better to Simply Sailing students than a random one.
- Cost: ~$1.15/mo for the number.
- Requires A2P 10DLC registration before sending business messages reliably: Brand registration ($4 one-time) + Campaign registration (~$10/mo). Total carrier fees ~$14/mo on top of usage.
- Pick this path later if local presence matters more than the monthly fee — easy to add a second number once volume justifies it.

Either way, the trial credit covers the first month of number rental.

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

Resend will show you a list of DNS records to add — typically a few TXT records (SPF, DKIM) and possibly a CNAME. Resend does **not** need MX records (it's send-only; Cloudflare Email Routing handles inbound).

### 3. Add the DNS records in Cloudflare
Assumes `docs/EMAIL_SETUP.md` (Cloudflare Email Routing) was completed first, so MX records are already present.

- Cloudflare dashboard → `sailbook.live` → DNS → Records
- **SPF — check before adding.** Look for an existing TXT record starting with `v=spf1`. If one exists, edit it to add Resend's include value rather than creating a second record — a domain with two SPF records fails validation on most mail servers. If none exists, add Resend's as a new TXT record.

  Cloudflare Email Routing leaves a Google SPF record in place if Gmail is the destination. Merge Resend into it:
  ```
  # Before (Google only)
  v=spf1 include:_spf.google.com ~all

  # After (Google + Resend)
  v=spf1 include:_spf.google.com include:_spf.resend.com ~all
  ```
  (Use whatever `include:` value Resend shows you — it may differ.)
- **DKIM — add as a new record.** Resend's DKIM uses its own selector (e.g. `resend._domainkey`). Copy Resend's exact host/value.
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
- `info@sailbook.live` — friendlier, replies route through Cloudflare Email Routing into your Gmail (useful if students hit reply with questions)
- `notifications@sailbook.live` — middle ground (would need an additional Cloudflare routing rule)

Recommendation: `info@sailbook.live` for V1. Cloudflare Email Routing already forwards it to Gmail, Andy can respond from the branded address via Gmail's Send-As — clean loop. Revisit if volume grows.

### 7. Smoke test
Resend dashboard → "Send test email" — send to your own address. Confirms domain verification + key + DNS all line up before 3.3.

---

## Checklist summary

Twilio:
- [ ] Account created
- [ ] Phone number purchased (toll-free for V1, or 216 local + 10DLC if going local)
- [ ] Toll-Free Verification submitted (if toll-free) — approval takes a few business days
- [ ] Credentials in `.env.local`
- [ ] Test SMS received
- [ ] (Before go-live) Upgraded from trial

Resend (do after `docs/EMAIL_SETUP.md`):
- [ ] Account created
- [ ] `sailbook.live` added as sending domain
- [ ] SPF record added or merged — no duplicate TXT `v=spf1` records
- [ ] Resend DKIM record added
- [ ] Domain verified in Resend
- [ ] API key in `.env.local`
- [ ] `from` address decided
- [ ] Test email received
