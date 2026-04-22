# SailBook Email Setup — info@sailbook.live via Cloudflare + Gmail

Free forever. Cloudflare Email Routing forwards inbound to your Gmail; Gmail's "Send mail as" lets you reply *from* `info@sailbook.live`. No Zoho, no IMAP limits, no monthly fee.

---

## Prerequisites

- `sailbook.live` DNS managed by **Cloudflare** (free Cloudflare account, domain nameservers pointed at Cloudflare). If it's not on Cloudflare yet, that's step 0 — add the domain to Cloudflare, update nameservers at your registrar, wait for activation.
- A Gmail account you actually check (your personal one is fine).

---

## Part 1 — Set up Cloudflare Email Routing

1. Log into **dash.cloudflare.com** → select `sailbook.live`.
2. Left sidebar → **Email** → **Email Routing**.
3. Click **Get started** or **Enable Email Routing**.
4. Cloudflare will propose adding MX records and a TXT record automatically. Click **Add records and enable**.
5. Wait a minute for DNS to propagate. The status indicator should flip to green / active.

---

## Part 2 — Add the forwarding rule

Still in Email Routing:

1. Go to the **Routes** tab.
2. Under **Custom addresses** → **Create address**:
   - Custom address: `info`
   - Action: **Send to an email**
   - Destination: your Gmail address
3. Save.
4. Cloudflare sends a **verification email to your Gmail** — click the confirm link. Destination is now verified.

Optional but recommended — add a **catch-all** so any typo address (info2@, contact@, hello@) still reaches you:

- Routes tab → **Catch-all address** → enable → forward to your Gmail.

---

## Part 3 — Test inbound

From a different email account (phone, work email, a friend's), send a test email to `info@sailbook.live`. Should land in your Gmail within seconds.

If it doesn't arrive:
- Check Gmail's spam folder
- Confirm MX records are present in Cloudflare DNS settings (Email Routing auto-adds them, but verify)
- Wait 10-15 min for full DNS propagation if you just enabled it

---

## Part 4 — Configure Gmail to send as info@sailbook.live

This is where Cloudflare's "forwarding-only" limitation gets bypassed. Gmail can send *from* any address you can prove you control.

1. Gmail → **Settings** (gear icon) → **See all settings**
2. **Accounts and Import** tab → **Send mail as** → **Add another email address**
3. Fill in:
   - **Name:** `SailBook` (what recipients see)
   - **Email address:** `info@sailbook.live`
   - **Uncheck** "Treat as an alias"
     *(Unchecking makes replies go back to info@ instead of your personal Gmail — keeps threads on the branded address)*
4. Click **Next Step**
5. On the SMTP screen, use Gmail's own SMTP:
   - **SMTP Server:** `smtp.gmail.com`
   - **Port:** `587`
   - **Username:** your full Gmail address
   - **Password:** a **Gmail App Password** (see below)
   - **Secured connection using TLS**
6. Click **Add Account**

### Getting a Gmail App Password

Required because Gmail blocks "less secure app" logins now. If you have 2-Step Verification on your Google account (you should):

1. Go to **myaccount.google.com/apppasswords**
2. App name: `SailBook SMTP`
3. Generate → copy the 16-character password
4. Paste into the SMTP password field in step 5 above

If 2-Step isn't on, enable it first at **myaccount.google.com/security** — app passwords require it.

---

## Part 5 — Verify the Send-As address

1. Gmail will send a **verification email to info@sailbook.live**.
2. That email gets routed through Cloudflare → lands in your Gmail.
3. Click the link in the verification email, or copy the code and paste it into Gmail's dialog.
4. Done. `info@sailbook.live` now appears in Gmail's "From" dropdown when composing.

---

## Part 6 — Set the default reply behavior

Still in **Settings → Accounts and Import → Send mail as**:

- **"When replying to a message"** → select **"Reply from the same address the message was sent to"**

Now if someone emails `info@sailbook.live`, Gmail auto-replies from that address. No manual switching.

---

## Part 7 — Optional: label inbound info@ mail

So you can tell at a glance which inbox an email hit:

1. Gmail → **Settings** → **Filters and Blocked Addresses** → **Create a new filter**
2. **To:** `info@sailbook.live`
3. Create filter → **Apply the label** → create new label `info@sailbook.live`
4. Save

Every email forwarded from info@ now gets tagged. Search, sort, or archive by label.

---

## Verification checklist

- [ ] Test email sent to `info@sailbook.live` from external address lands in Gmail
- [ ] Gmail compose window shows `info@sailbook.live` in the "From" dropdown
- [ ] Reply from Gmail to an info@ message goes out *from* `info@sailbook.live` (check the sent message's headers, not just display name)
- [ ] Recipient of your reply sees `info@sailbook.live` as the sender and can reply back to it successfully
- [ ] Test emails don't land in the recipient's spam folder

---

## Gotchas

- **Must use Gmail App Password, not your regular Gmail password.** Regular password will fail SMTP auth silently or with a vague error.
- **Send-As verification email can take 2-5 min** to arrive. Don't spam the "resend" button.
- **"Treat as alias" checkbox matters.** Checked = replies go back to your Gmail. Unchecked = replies go to info@. For a branded contact inbox, leave it unchecked.
- **Cloudflare has a 1000-routes-per-zone limit.** Irrelevant for this project (you'll use maybe 5), but worth knowing.
- **Deliverability:** Gmail's SMTP is trusted by most providers, so outbound as `info@sailbook.live` should deliver fine. If you later run into spam issues, add a proper SPF record: `v=spf1 include:_spf.google.com ~all` as a TXT record on sailbook.live.

---

## When to outgrow this setup

Cloudflare + Gmail Send-As is great for a small product inbox. You'd want to move to a real mailbox provider (Fastmail, Google Workspace, paid Zoho) when:

- You need a **shared mailbox** that multiple people send/receive from independently with their own login
- You want `andy@sailbook.live`, `eric@sailbook.live` etc. as **separately managed users**
- You need an **email archive** that lives outside anyone's personal Gmail
- You need **calendar/contacts** tied to the domain
- The business matures enough that client relationships demand clean infrastructure

For now, info@ via Cloudflare + your Gmail is exactly right-sized.

---

## Adding more addresses later

Want `contact@sailbook.live`, `support@sailbook.live`, or anything else? Just repeat Parts 2 + 4-6 for each. Cloudflare routes them all to your Gmail for free, and Gmail Send-As handles unlimited "From" addresses. Zero additional cost, zero additional accounts.
