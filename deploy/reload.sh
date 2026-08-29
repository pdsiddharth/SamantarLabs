#!/usr/bin/env bash
#
# Apply a routing change without dropping connections.
#
# A script rather than a remembered command because of the first step. Caddy
# keeps serving its old configuration when a reload fails to parse — but a
# reload that fails is still a change you believe you made and did not, and the
# gap between those two beliefs is where an outage hides. Validating first turns
# that into an error message.
set -euo pipefail

cd "$(dirname "$0")/.."

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

say "Validating"
# Run in a throwaway container with the same mounts, so a broken file never
# reaches the running proxy. --adapter caddyfile because validate defaults to
# JSON.
docker compose run --rm --no-deps caddy \
	caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile

say "Reloading"
# A reload, not a restart: existing connections are kept, and the certificates
# already in memory are not re-loaded from disk.
docker compose exec caddy \
	caddy reload --adapter caddyfile --config /etc/caddy/Caddyfile

say "Done"
echo "Live config: $(git log -1 --format='%h %s' 2>/dev/null || echo 'not a git checkout')"
