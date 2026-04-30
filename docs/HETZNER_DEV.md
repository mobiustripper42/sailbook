# Hetzner Remote Dev Environment

The SailBook dev environment runs on a Hetzner Cloud server (`sailbook-dev`),
accessed over Tailscale. VS Code Remote-SSH from Windows edits files on the
server; `npm run dev` runs on the server; the browser connects to a
forwarded port.

## What's where

| Thing | Location |
|---|---|
| Dev server (Node, Docker, Supabase, repo) | Hetzner `sailbook-dev` (ccx23, Ashburn, $40/mo) |
| Source of truth for editing | VS Code on Windows via Remote-SSH |
| Network | Tailscale (`mobiustripper42.github` tailnet). Public SSH closed. |
| Provisioning script | `scripts/hetzner-bootstrap.sh` (idempotent) |
| Tooling install script | `scripts/hetzner-dev-tooling.sh` (idempotent) |
| Hetzner API token | `~/.config/hcloud/cli.toml` on WSL (mode 600, gitignored) |
| SSH key for the box | `~/.ssh/sailbook_hetzner` (WSL) and `C:\Users\eric\.ssh\sailbook_hetzner` (Windows) |

## Daily workflow

1. Open VS Code on Windows
2. Ctrl+Shift+P → **Remote-SSH: Connect to Host** → `sailbook-dev`
3. Open folder `/home/eric/sailbook`
4. Terminal: `supabase start` (only if not already running) then `npm run dev`
5. Browse `http://localhost:3000` — VS Code auto-forwards the port

End of session: just close the VS Code window. Server keeps running.

## Mobile access (Termius + tmux)

When SSH'ing into the box from a phone (Termius), two things matter: keeping a shell alive across flaky connections, and not getting blocked by Tailscale SSH.

### Tailscale SSH conflicts with Termius

Earlier we ran `sudo tailscale up --ssh` on the host, which enables Tailscale's own SSH interceptor. That works fine for VS Code Remote-SSH from a device signed in to the tailnet, but **Termius (which uses standard SSH key auth) hangs or fails to authenticate** against a host that has Tailscale SSH on. Disable it on the host:

```bash
sudo tailscale set --ssh=false
```

Standard OpenSSH on port 22 over the tailnet keeps working — VS Code Remote-SSH and `ssh sailbook-dev` both use the SSH key in `~/.ssh/sailbook_hetzner` and don't need Tailscale's interceptor. Re-enable with `sudo tailscale set --ssh=true` only if you specifically want Tailscale-identity auth.

### tmux for connection resilience

Mobile SSH connections drop constantly (network changes, screen lock, app switch). Run work inside a tmux session so a dropped connection doesn't kill what you were doing.

```bash
tmux new -s work        # create a new session named "work"
tmux a                  # attach to the most recent session
tmux a -t work          # attach to a specific session
tmux ls                 # list sessions
# Inside tmux:
#   Ctrl-b d            detach (session keeps running)
#   Ctrl-b c            new window
#   Ctrl-b n / p        next / previous window
#   Ctrl-b [            enter copy/scroll mode (q to exit)
```

When Termius drops, just reconnect and `tmux a` — picks up exactly where you left off.

### Scrolling in tmux on Termius

By default tmux swallows the terminal's native scrollback, so two-finger swipe in Termius does nothing. Two fixes — both already configured in `~/.tmux.conf` on the box:

```
set -g mouse on
set -g history-limit 10000
```

With `mouse on`, two-finger swipe in Termius enters copy mode automatically and scrolls the tmux scrollback. Tap or press `q` to drop back to live. If you'd rather not enable mouse mode globally, `Ctrl-b [` then PgUp / arrow keys works without it.

If `~/.tmux.conf` ever goes missing (fresh box, snapshot restore from before this was added), recreate it with the two lines above and run `tmux source-file ~/.tmux.conf` from inside any session.

## Pausing / stopping the server

Hetzner bills hourly **whether the server is running or powered off** — a stopped server still reserves disk + IP, so `poweroff` does not save money. The only ways to stop paying:

| Option | Cost | Restore time | Loses |
|---|---|---|---|
| Leave running | $40/mo | n/a | nothing |
| Delete | $0 | ~20 min (re-provision + bootstrap + tooling + repo) | everything on the box |
| **Snapshot + delete** | ~$2/mo (snapshot of 160 GB) | ~5 min (create from snapshot) | public IP changes (Tailscale handles this) |

Snapshot-and-delete is the right move when stepping away for weeks:

```bash
# Create the snapshot (server can stay running; quiesce DB first if mid-work)
hcloud server create-image --type snapshot \
  --description "sailbook-dev pre-pause $(date +%F)" sailbook-dev

# Verify and capture the snapshot ID
hcloud image list --type snapshot

# Delete the server
hcloud server delete sailbook-dev

# Later, restore from the snapshot:
hcloud server create --name sailbook-dev --type ccx23 --location ash \
  --image <snapshot-id> --ssh-key sailbook-laptop --firewall sailbook-dev-fw
```

The restore creates a new public IPv4 (Tailscale handles routing transparently — `sailbook-dev` MagicDNS still resolves). If you've hard-coded the public IP anywhere outside Tailscale, that'll need to be updated.

Snapshots cost ~$0.012/GB/month — about $2/mo for the 160 GB disk. Periodically prune old snapshots: `hcloud image delete <snapshot-id>`.

## First-time access from a new device

You need three things: the SSH key, Tailscale, and (for VS Code) the
Remote-SSH extension.

### Linux / WSL
```bash
# Copy ~/.ssh/sailbook_hetzner from your existing device
chmod 600 ~/.ssh/sailbook_hetzner
# Install + join Tailscale
curl -fsSL https://tailscale.com/install.sh | sudo sh
sudo tailscale up --ssh
# SSH config entry — see ~/.ssh/config on the existing device
ssh sailbook-dev
```

### Windows
```powershell
# Copy sailbook_hetzner key into C:\Users\<you>\.ssh\
icacls $HOME\.ssh\sailbook_hetzner /inheritance:r
icacls $HOME\.ssh\sailbook_hetzner /grant:r "${env:USERNAME}:R"
# Install Tailscale for Windows from tailscale.com/download/windows, sign in
# Add a Host block to C:\Users\<you>\.ssh\config (NOT config.txt — Notepad
# saves with .txt by default, save with quotes around the filename)
ssh sailbook-dev hostname    # should print sailbook-dev
# In VS Code: install Remote-SSH extension, then Ctrl+Shift+P → Remote-SSH: Connect to Host
```

## Rebuilding from scratch

If the server is gone or you want to start over. Total time: ~20 minutes.

```bash
# 1. Provision a new server (from WSL with hcloud configured)
hcloud server create \
  --name sailbook-dev --type ccx23 --location ash \
  --image ubuntu-24.04 \
  --ssh-key sailbook-laptop --firewall sailbook-dev-fw

# 2. Bootstrap (hardening + Tailscale install)
scp scripts/hetzner-bootstrap.sh root@<new-ip>:/root/
ssh root@<new-ip> 'bash /root/hetzner-bootstrap.sh eric'

# 3. Auth Tailscale interactively (browser auth)
ssh -i ~/.ssh/sailbook_hetzner eric@<new-ip>
sudo tailscale up         # do NOT pass --ssh — it breaks Termius (see Mobile access section)
exit

# 4. Lock down sshd + close public port 22
ssh root@<new-ip> 'TAILSCALE_UP=1 bash /root/hetzner-bootstrap.sh eric'
hcloud firewall replace-rules sailbook-dev-fw --rules-file scripts/firewall-locked.json

# 5. Dev tooling (run as eric over Tailscale)
scp scripts/hetzner-dev-tooling.sh eric@sailbook-dev:~/
ssh eric@sailbook-dev 'bash ~/hetzner-dev-tooling.sh'

# 6. Repo + env
ssh eric@sailbook-dev 'gh auth login'    # interactive
ssh eric@sailbook-dev 'gh repo clone mobiustripper42/sailbook'
scp .env.local eric@sailbook-dev:~/sailbook/.env.local
# Swap NEXT_PUBLIC_SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY values to match
# the new box's `supabase status -o env` output (publishable keys are
# deterministic across local supabase instances; if you've customized
# config.toml, they may not be)

# 7. First run
ssh eric@sailbook-dev 'cd sailbook && supabase start && npm install && npx playwright install'
```

## Troubleshooting

- **CPX41 unavailable**: it was retired in 2025. Use ccx23 in ash (current pick), or check `hcloud server-type list` for current options.
- **Hetzner placement fails**: capacity fluctuates. Retry the same command; if it fails 2–3 times, switch location (`hil` or `hel1`).
- **`ssh sailbook-dev` works but VS Code can't see the host**: Notepad on Windows saves files as `config.txt`. Check `Get-ChildItem $HOME\.ssh\` — if there's both `config` (empty) and `config.txt`, run `Move-Item $HOME\.ssh\config.txt $HOME\.ssh\config -Force`.
- **`node` / `supabase` not found over plain SSH**: non-interactive SSH doesn't source `.bashrc`. The tooling script symlinks these into `/usr/local/bin`. If missing, re-run `scripts/hetzner-dev-tooling.sh`.
- **Next dev server can't read env vars**: Next reads `.env.local` at startup. After scp'ing or editing the file, Ctrl+C and re-run `npm run dev`.
- **Public SSH still open**: check `hcloud firewall describe sailbook-dev-fw` — should only show ICMP. If port 22 is listed, run `hcloud firewall replace-rules sailbook-dev-fw` with the locked rules.
- **All `onClick` handlers dead on phone, but native `<select>`, links, and form-submit work**: hydration is failing because Next's dev-origin check is rejecting requests from your phone's hostname. Add the hostname/IP to `allowedDevOrigins` and `experimental.serverActions.allowedOrigins` in `next.config.ts`, then **restart `npm run dev`** (config changes do not HMR). Symptom is sneaky: HTML renders fine, browser-native interactions work, only React event handlers are dead — easy to misdiagnose as a Radix or component bug. The Tailscale hostname `sailbook-dev` and the Tailscale IP (`100.118.147.49`) are already in the list; any new device or rename needs to be added.
