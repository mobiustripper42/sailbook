#!/usr/bin/env bash
# hetzner-dev-tooling.sh — idempotent dev tooling install for sailbook-dev
# Run as the dev user (NOT root). Re-runnable.
#
#   scp scripts/hetzner-dev-tooling.sh eric@sailbook-dev:~/
#   ssh eric@sailbook-dev 'bash ~/hetzner-dev-tooling.sh'
#
# Installs:
#   - fnm + Node 22 (default)
#   - Docker Engine + Compose plugin (adds user to docker group)
#   - Supabase CLI (~/.local/bin/supabase)
#   - GitHub CLI (gh)
#   - Playwright system deps + browser binaries

set -euo pipefail

if [[ $EUID -eq 0 ]]; then
  echo "Don't run as root. Run as the dev user." >&2
  exit 1
fi

NODE_VERSION="${NODE_VERSION:-22}"
SUPABASE_VERSION="${SUPABASE_VERSION:-2.90.0}"

mkdir -p "$HOME/.local/bin"

echo "=== [0/5] prereq apt packages ==="
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  unzip git build-essential pkg-config

# Ensure ~/.local/bin is on PATH for this session and future shells
export PATH="$HOME/.local/bin:$PATH"
if ! grep -q '\.local/bin' "$HOME/.bashrc"; then
  printf '\n# Local user binaries\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$HOME/.bashrc"
fi

echo "=== [1/5] fnm + Node $NODE_VERSION ==="
if ! command -v fnm >/dev/null 2>&1; then
  curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell
fi
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env --shell bash)"

if ! grep -q 'fnm env' "$HOME/.bashrc"; then
  cat >> "$HOME/.bashrc" <<'EOF'

# fnm (Node version manager)
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env --shell bash --use-on-cd)"
EOF
fi

fnm install "$NODE_VERSION"
fnm default "$NODE_VERSION"
fnm use "$NODE_VERSION"
node --version
npm --version

# Symlink node/npm/npx/corepack into /usr/local/bin so non-interactive SSH
# (which doesn't source .bashrc/.profile) and VS Code Remote-SSH find them.
# fnm rewrites the 'default' alias target when default changes, so these stay valid.
FNM_DEFAULT_BIN="$HOME/.local/share/fnm/aliases/default/bin"
for tool in node npm npx corepack; do
  if [[ -e "$FNM_DEFAULT_BIN/$tool" ]]; then
    sudo ln -sf "$FNM_DEFAULT_BIN/$tool" "/usr/local/bin/$tool"
  fi
done

echo "=== [2/5] Docker + Compose ==="
if ! command -v docker >/dev/null 2>&1; then
  # Official Docker repo (better than get.docker.com for long-term upgrades)
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
sudo systemctl enable --now docker
if ! id -nG "$USER" | grep -qw docker; then
  sudo usermod -aG docker "$USER"
  DOCKER_GROUP_ADDED=1
fi
sudo docker version --format '{{.Server.Version}}' || true

echo "=== [3/5] Supabase CLI ==="
if ! command -v supabase >/dev/null 2>&1 || [[ "$(supabase --version 2>/dev/null | head -1)" != "$SUPABASE_VERSION" ]]; then
  TMP=$(mktemp -d)
  curl -fsSL "https://github.com/supabase/cli/releases/download/v${SUPABASE_VERSION}/supabase_linux_amd64.tar.gz" -o "$TMP/supabase.tar.gz"
  tar -xzf "$TMP/supabase.tar.gz" -C "$TMP" supabase
  mv "$TMP/supabase" "$HOME/.local/bin/supabase"
  chmod +x "$HOME/.local/bin/supabase"
  rm -rf "$TMP"
fi
# Symlink into /usr/local/bin for non-interactive SSH access
sudo ln -sf "$HOME/.local/bin/supabase" /usr/local/bin/supabase
supabase --version

echo "=== [4/5] GitHub CLI ==="
if ! command -v gh >/dev/null 2>&1; then
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | \
    sudo gpg --dearmor --yes -o /etc/apt/keyrings/githubcli-archive-keyring.gpg
  sudo chmod a+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | \
    sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq gh
fi
gh --version | head -1

echo "=== [5/5] Playwright deps + browsers ==="
# install-deps needs root; the browser binaries themselves install per-user.
# sudo strips PATH, so resolve npx + node absolute paths and pass them through.
NPX_BIN="$(command -v npx)"
NODE_BIN="$(command -v node)"
NODE_DIR="$(dirname "$NODE_BIN")"
sudo env "PATH=$NODE_DIR:/usr/sbin:/usr/bin:/sbin:/bin" "$NPX_BIN" --yes playwright@latest install-deps
npx --yes playwright@latest install

echo
echo "=== dev tooling install complete ==="
if [[ "${DOCKER_GROUP_ADDED:-0}" == "1" ]]; then
  echo "NOTE: you were added to the 'docker' group. Log out + back in (or run 'newgrp docker')"
  echo "      for docker commands to work without sudo."
fi
