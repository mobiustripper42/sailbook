# SailBook Email Setup — info@ and andy@sailbook.live in Gmail

Free Zoho Mail mailboxes for `info@sailbook.live` and `andy@sailbook.live`, pulled into Gmail for unified inbox and branded reply.

---

## Part 1 — Zoho account + domain verification

1. Go to **zoho.com/mail** → sign up for the free "Forever Free Plan" (5 users, 5GB each, 1 domain).
2. Sign up using your **personal Gmail** — this becomes the Zoho admin/recovery account, separate from the mailboxes you'll create.
3. When prompted, choose **"Sign up with a domain I already own"** → enter `sailbook.live`.
4. Zoho gives you a **TXT record** for domain verification. Add it in your DNS provider (Cloudflare, Namecheap, Vercel DNS — wherever sailbook.live is managed).
5. Back in Zoho, click **Verify**. May take 5–15 min for DNS to propagate.

---

## Part 2 — MX, SPF, DKIM records

After verification, Zoho shows the records to add. Copy exactly — values change slightly per account.

### MX records (inbound mail routing)
| Host | Priority | Value |
|------|----------|-------|
| @ | 10 | mx.zoho.com |
| @ | 20 | mx2.zoho.com |
| @ | 50 | mx3.zoho.com |

### SPF record (TXT, prevents spoofing)
| Host | Value |
|------|-------|
| @ | `v=spf1 include:zoho.com ~all` |

### DKIM record (TXT, signs outbound mail)
Zoho generates a unique selector + key pair. Add the TXT record they provide under the host they specify (usually `zoho._domainkey`).

Wait 15–30 min for propagation. Verify all records in Zoho's admin — green checks all around before moving on.

---

## Part 3 — Create mailboxes

In Zoho Mail Admin Console → **Users** → Add User:

1. **info@sailbook.live** — strong password, save to Bitwarden
2. **andy@sailbook.live** — strong password, save to Bitwarden

Log into each once at **mail.zoho.com** to confirm they work (send a test email to your personal Gmail from each).

---

## Part 4 — Generate Zoho app passwords (for SMTP from Gmail)

Zoho's free tier requires app-specific passwords for external clients (Gmail SMTP).

For **each mailbox**, log into that mailbox's Zoho account:

1. Go to **accounts.zoho.com** → Security → App Passwords
2. Generate a new app password (name it "Gmail SMTP" or similar)
3. Copy the generated password — you won't see it again
4. Save to Bitwarden, tagged with the mailbox it belongs to

Do this twice: once logged in as info@sailbook.live, once as andy@sailbook.live.

---

## Part 5 — Pull Zoho into Gmail (receive)

In your personal Gmail:

1. **Settings** (gear) → **See all settings** → **Accounts and Import**
2. Under **Check mail from other accounts** → **Add a mail account**
3. Email address: `info@sailbook.live`
4. Next → **Import emails from my other account (POP3)**
5. Username: `info@sailbook.live`
6. Password: the **Zoho app password** from Part 4 (not the mailbox login password)
7. POP Server: `poppro.zoho.com`
8. Port: `995`
9. Check **Always use a secure connection (SSL)**
10. Check **Label incoming messages** → create label `info@sailbook.live`
11. Save

Repeat for `andy@sailbook.live` with its own app password and label.

> **Note on POP vs IMAP:** Zoho free tier supports POP3 for Gmail pull. If you'd rather use IMAP (keeps mail in sync both ways), you can set it up as a separate Gmail account instead, but POP pulls are simpler for this use case.

---

## Part 6 — Reply from custom addresses (send)

Still in Gmail **Settings → Accounts and Import**:

1. Under **Send mail as** → **Add another email address**
2. Name: `SailBook` (or whatever you want recipients to see)
3. Email: `info@sailbook.live`
4. **Uncheck** "Treat as an alias" — this keeps replies going back to info@ instead of your personal Gmail
5. Next → SMTP settings:
   - SMTP Server: `smtp.zoho.com`
   - Port: `465`
   - Username: `info@sailbook.live`
   - Password: the **Zoho app password** from Part 4
   - Secured connection using **SSL**
6. Add Account
7. Zoho sends a verification email to info@sailbook.live — Gmail will now have pulled it (thanks to Part 5), grab the code, paste into Gmail
8. Done — `info@sailbook.live` now appears in Gmail's "From" dropdown

Repeat for `andy@sailbook.live`.

---

## Part 7 — Set default behavior

In **Settings → Accounts and Import → Send mail as**:

- **"When replying to a message"** → select **"Reply from the same address the message was sent to"**

Now if someone emails `info@sailbook.live`, your reply auto-sends from that address. No manual switching.

---

## Verification checklist

- [ ] Email sent to `info@sailbook.live` from external address lands in Gmail with `info@sailbook.live` label
- [ ] Email sent to `andy@sailbook.live` from external address lands in Gmail with `andy@sailbook.live` label
- [ ] Reply from Gmail to info@ test email goes out **from** `info@sailbook.live` (check sent headers, not just display name)
- [ ] Reply from Gmail to andy@ test email goes out **from** `andy@sailbook.live`
- [ ] Test emails don't land in spam on the recipient side (SPF/DKIM working)

---

## Gotchas

- **App passwords are mandatory.** Using the mailbox login password for SMTP will fail — Zoho blocks it.
- **Zoho can be slow to pull via POP.** Default check interval in Gmail is ~hourly. For faster testing, hit "Check mail now" in Gmail settings.
- **Don't send from Resend as info@ for human replies.** Resend is for transactional/app email only — different purpose. Keep human email through Zoho/Gmail, keep app notifications through Resend.
- **If DKIM fails to verify,** double-check that the TXT record includes the full public key without line breaks. Some DNS providers silently truncate.
- **Outbound deliverability** depends on SPF + DKIM being correct. If test emails land in spam, both records need to validate at mail-tester.com or similar.

---

## If Zoho free SMTP gets blocked

Zoho occasionally restricts SMTP on truly-free accounts for abuse prevention. If Part 6 fails with auth errors despite correct app password:

- **Zoho Mail Lite** is $1/user/month — reliably unlocks SMTP, still cheap
- **Fastmail** — $3/user/month, cleaner UI, better SMTP reliability
- **Google Workspace** — $6/user/month, if Andy wants native Gmail-everything
