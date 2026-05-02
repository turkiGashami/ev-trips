#!/bin/sh
# Start the Next.js standalone admin server, locating server.js across the
# possible monorepo layouts produced by `next build` + `output: 'standalone'`.
# The exact path depends on whether Next traces files from the package dir
# or from the workspace root, which in turn depends on the platform's
# build context (CranL's "Build Path" setting, etc.).

set -e

# Force bind on 0.0.0.0. Container runtimes (CranL among them) inject
# HOSTNAME with the container's short hostname (e.g. "2ab59856aaf6"),
# which makes Next.js bind only to that interface. The platform health
# check then can't reach us and SIGTERMs the process. Always override.
export HOSTNAME="0.0.0.0"
export PORT="${PORT:-3002}"

CANDIDATES="
.next/standalone/server.js
.next/standalone/apps/admin/server.js
apps/admin/.next/standalone/server.js
apps/admin/.next/standalone/apps/admin/server.js
"

# Sync .next/static and public into the standalone tree before launching.
# Next.js standalone deliberately omits these — Vercel/Dockerfile copy them
# in manually. CranL skips npm lifecycle hooks (postbuild, prestart never
# fired), so we have to do it here. Wrapped in `set +e` so a partial failure
# never blocks the server from starting.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "${SCRIPT_DIR}/copy-standalone-assets.sh" ]; then
  set +e
  sh "${SCRIPT_DIR}/copy-standalone-assets.sh"
  set -e
fi

for path in $CANDIDATES; do
  if [ -f "$path" ]; then
    echo "[admin/start] launching $path on ${HOSTNAME}:${PORT}"
    exec node "$path"
  fi
done

echo "[admin/start] FATAL: could not locate Next.js standalone server.js" >&2
echo "[admin/start] cwd=$(pwd)" >&2
echo "[admin/start] looked for:" >&2
for path in $CANDIDATES; do echo "  - $path" >&2; done
exit 1
