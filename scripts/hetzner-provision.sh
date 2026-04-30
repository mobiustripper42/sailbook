#!/usr/bin/env bash
# hetzner-provision.sh — provision a new sailbook-dev server.
# Assumes hcloud is configured (~/.config/hcloud/cli.toml has an active context).
# Idempotent for the SSH key + firewall (skipped if they exist); not for the server.
#
# Usage:
#   scripts/hetzner-provision.sh
#
# After this runs, follow scripts/hetzner-bootstrap.sh on the new server.

set -euo pipefail

SERVER_NAME="${SERVER_NAME:-sailbook-dev}"
SERVER_TYPE="${SERVER_TYPE:-ccx23}"
LOCATION="${LOCATION:-ash}"
IMAGE="${IMAGE:-ubuntu-24.04}"
SSH_KEY_NAME="${SSH_KEY_NAME:-sailbook-laptop}"
SSH_KEY_FILE="${SSH_KEY_FILE:-$HOME/.ssh/sailbook_hetzner.pub}"
FIREWALL_NAME="${FIREWALL_NAME:-sailbook-dev-fw}"

if ! command -v hcloud >/dev/null 2>&1; then
  echo "hcloud CLI not found. Install: https://github.com/hetznercloud/cli/releases" >&2
  exit 1
fi

echo "=== ssh key ==="
if ! hcloud ssh-key list -o noheader -o columns=name | grep -qx "$SSH_KEY_NAME"; then
  if [[ ! -f "$SSH_KEY_FILE" ]]; then
    echo "Public key $SSH_KEY_FILE not found. Generate with:" >&2
    echo "  ssh-keygen -t ed25519 -f ~/.ssh/sailbook_hetzner -N '' -C 'sailbook-hetzner-$(date +%Y-%m-%d)'" >&2
    exit 1
  fi
  hcloud ssh-key create --name "$SSH_KEY_NAME" --public-key-from-file "$SSH_KEY_FILE"
else
  echo "$SSH_KEY_NAME already registered"
fi

echo "=== firewall ==="
if ! hcloud firewall list -o noheader -o columns=name | grep -qx "$FIREWALL_NAME"; then
  # Initial rules: SSH from anywhere (so we can bootstrap) + ICMP.
  # hetzner-bootstrap.sh stage 2 calls firewall-locked.json to drop the SSH rule.
  hcloud firewall create --name "$FIREWALL_NAME" --rules-file /dev/stdin <<'EOF'
[
  {
    "direction": "in",
    "protocol": "tcp",
    "port": "22",
    "source_ips": ["0.0.0.0/0", "::/0"],
    "description": "SSH (close after Tailscale is up)"
  },
  {
    "direction": "in",
    "protocol": "icmp",
    "source_ips": ["0.0.0.0/0", "::/0"],
    "description": "ICMP ping"
  }
]
EOF
else
  echo "$FIREWALL_NAME already exists"
fi

echo "=== server ==="
if hcloud server list -o noheader -o columns=name | grep -qx "$SERVER_NAME"; then
  echo "$SERVER_NAME already exists. Delete with 'hcloud server delete $SERVER_NAME' to re-provision." >&2
  exit 1
fi

# Hetzner placement is flaky — retry up to 3x before giving up
for attempt in 1 2 3; do
  if hcloud server create \
      --name "$SERVER_NAME" \
      --type "$SERVER_TYPE" \
      --location "$LOCATION" \
      --image "$IMAGE" \
      --ssh-key "$SSH_KEY_NAME" \
      --firewall "$FIREWALL_NAME"; then
    break
  fi
  echo "Placement failed (attempt $attempt/3). Retrying in 30s..." >&2
  sleep 30
  [[ $attempt -eq 3 ]] && { echo "Placement failed 3x. Try a different LOCATION or SERVER_TYPE." >&2; exit 1; }
done

echo
echo "=== done ==="
hcloud server describe "$SERVER_NAME" | grep -E "^(Name|Status|Server Type|Location|Public Net)" -A 2 | head -20
echo
echo "Next steps:"
echo "  scp scripts/hetzner-bootstrap.sh root@<ip>:/root/"
echo "  ssh root@<ip> 'bash /root/hetzner-bootstrap.sh \$USER'"
