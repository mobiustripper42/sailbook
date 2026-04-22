# Notification Provider Setup — Twilio + Resend

Human-facing checklist for Phase 3 tasks 3.1 and 3.2. Walk through these before starting 3.3 (the notification service), which needs real credentials to talk to.

Final env var names and `from` address get locked in 3.3. Names used here are placeholders that match what the service will likely expect.

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

Resend will show you a list of DNS records to add (typically one MX, a few TXT for SPF/DKIM/DMARC, and sometimes a CNAME).

### 3. Add the DNS records in Cloudflare
- Cloudflare dashboard → `sailbook.live` → DNS → Records
- For each record Resend shows you, click "Add record" and copy the exact type/name/value
- **Turn off the orange cloud (proxy)** for these records — they need to resolve to Resend's actual servers, not through Cloudflare
- TTL: Auto is fine

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

### 6. Set up `info@sailbook.live` email routing — decision point
This is separate from Resend — it's for *receiving* mail at `info@sailbook.live`, not sending.

- Cloudflare dashboard → `sailbook.live` → Email → Email Routing
- Enable Email Routing (adds its own MX records — check these don't conflict with Resend's, they shouldn't)
- Add a rule: `info@sailbook.live` → forward to your real inbox (eric@stoffer.net or wherever)

### 7. Decide on the `from` address — decision point
Pick one before 3.3. Options:
- `noreply@sailbook.live` — standard, signals "don't reply to this"
- `info@sailbook.live` — friendlier, replies land in the routed inbox (useful if students hit reply with questions)
- `notifications@sailbook.live` — middle ground

Recommendation: `info@sailbook.live` for V1. The school is small enough that a reply landing in Andy's inbox is a feature, not a problem. Revisit if volume grows.

### 8. Smoke test
Resend dashboard → "Send test email" — send to your own address. Confirms domain verification + key + DNS all line up before 3.3.

---

## Checklist summary

Twilio:
- [ ] Account created
- [ ] Phone number purchased (216 area code)
- [ ] Credentials in `.env.local`
- [ ] Test SMS received
- [ ] (Before go-live) Upgraded from trial

Resend:
- [ ] Account created
- [ ] `sailbook.live` added as sending domain
- [ ] DNS records added in Cloudflare (proxy off)
- [ ] Domain verified in Resend
- [ ] API key in `.env.local`
- [ ] `info@sailbook.live` routing set up in Cloudflare
- [ ] `from` address decided
- [ ] Test email received
