#!/bin/sh
# Start the Next.js standalone admin server, locating server.js across the
# possible monorepo layouts produced by `next build` + `output: 'standalone'`.
# The exact path depends on whether Next traces files from the package dir
# or from the workspace root, which in turn depends on the platform's
# build context (CranL's "Build Path" setting, etc.).

set -e

export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3002}"

CANDIDATES="
.next/standalone/server.js
.next/standalone/apps/admin/server.js
apps/admin/.next/standalone/server.js
apps/admin/.next/standalone/apps/admin/server.js
"

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
