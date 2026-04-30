#!/usr/bin/env bash
# hetzner-bootstrap.sh — idempotent server hardening for sailbook-dev
# Run as root on a fresh Hetzner Ubuntu 24.04 box. Safe to re-run.
#
#   scp scripts/hetzner-bootstrap.sh root@<ip>:/root/
#   ssh root@<ip> 'bash /root/hetzner-bootstrap.sh eric'
#
# After this finishes, log back in as the new sudo user and run:
#   sudo tailscale up --ssh
# then re-run this script with TAILSCALE_UP=1 to lock down sshd_config.

set -euo pipefail

DEV_USER="${1:-eric}"
SWAP_SIZE_GB="${SWAP_SIZE_GB:-4}"
TAILSCALE_UP="${TAILSCALE_UP:-0}"

if [[ $EUID -ne 0 ]]; then
  echo "Must run as root." >&2
  exit 1
fi

echo "=== [1/7] apt update + upgrade ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

echo "=== [2/7] sudo user: $DEV_USER ==="
if ! id -u "$DEV_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEV_USER"
fi
usermod -aG sudo "$DEV_USER"
# Passwordless sudo for the dev user (single-tenant dev box, key-only auth)
echo "$DEV_USER ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/90-$DEV_USER"
chmod 440 "/etc/sudoers.d/90-$DEV_USER"

# Copy root's authorized_keys to the dev user (only if not already populated)
USER_SSH="/home/$DEV_USER/.ssh"
mkdir -p "$USER_SSH"
chmod 700 "$USER_SSH"
if [[ ! -s "$USER_SSH/authorized_keys" ]] && [[ -s /root/.ssh/authorized_keys ]]; then
  cp /root/.ssh/authorized_keys "$USER_SSH/authorized_keys"
fi
chmod 600 "$USER_SSH/authorized_keys"
chown -R "$DEV_USER:$DEV_USER" "$USER_SSH"

echo "=== [3/7] base packages ==="
apt-get install -y -qq ufw fail2ban unattended-upgrades curl ca-certificates gnupg lsb-release

echo "=== [4/7] swap (${SWAP_SIZE_GB}G) ==="
if [[ ! -f /swapfile ]]; then
  fallocate -l "${SWAP_SIZE_GB}G" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
fi
if ! grep -q '^/swapfile' /etc/fstab; then
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
sysctl -w vm.swappiness=10 >/dev/null
grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf

echo "=== [5/7] unattended-upgrades + fail2ban ==="
dpkg-reconfigure -f noninteractive unattended-upgrades >/dev/null
systemctl enable --now unattended-upgrades >/dev/null
# Minimal fail2ban sshd jail (defaults are sane on Ubuntu 24.04)
cat > /etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable --now fail2ban >/dev/null
systemctl restart fail2ban

echo "=== [6/7] ufw ==="
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow OpenSSH >/dev/null
ufw --force enable >/dev/null

echo "=== [7/7] tailscale ==="
if ! command -v tailscale >/dev/null 2>&1; then
  curl -fsSL https://tailscale.com/install.sh | sh
fi

if [[ "$TAILSCALE_UP" == "1" ]]; then
  if ! tailscale status >/dev/null 2>&1; then
    echo "Tailscale not connected yet. Run: sudo tailscale up --ssh" >&2
    exit 1
  fi
  echo "--- locking down sshd (Tailscale active) ---"
  # Disable root login + password auth in a drop-in (don't fight Ubuntu's defaults)
  cat > /etc/ssh/sshd_config.d/99-sailbook-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
KbdInteractiveAuthentication no
EOF
  sshd -t
  systemctl reload ssh
  echo "sshd hardened. Public SSH still allowed on the OS firewall;"
  echo "remove the 0.0.0.0/0 rule from the Hetzner Cloud Firewall to close port 22 publicly."
else
  echo "Tailscale installed but not connected. Next steps:"
  echo "  1) sudo tailscale up --ssh   # auth in browser"
  echo "  2) re-run this script with TAILSCALE_UP=1 to harden sshd"
fi

echo
echo "=== bootstrap pass complete ==="
