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

# Next.js standalone output does NOT include .next/static or public —
# Vercel/Dockerfile copy them in manually. On platforms that just run
# `pnpm start` (CranL), the static chunks 404 and the page renders blank.
# Wire the assets into the standalone tree before launching.
sync_assets() {
  standalone_dir="$1"
  base_dir="$2"  # where .next/static and public live
  if [ -d "${base_dir}/.next/static" ]; then
    mkdir -p "${standalone_dir}/.next"
    rm -rf "${standalone_dir}/.next/static"
    cp -R "${base_dir}/.next/static" "${standalone_dir}/.next/static"
  fi
  if [ -d "${base_dir}/public" ]; then
    rm -rf "${standalone_dir}/public"
    cp -R "${base_dir}/public" "${standalone_dir}/public"
  fi
}

CANDIDATES="
.next/standalone/server.js
.next/standalone/apps/admin/server.js
apps/admin/.next/standalone/server.js
apps/admin/.next/standalone/apps/admin/server.js
"

for path in $CANDIDATES; do
  if [ -f "$path" ]; then
    case "$path" in
      .next/standalone/server.js)
        sync_assets ".next/standalone" "."
        ;;
      .next/standalone/apps/admin/server.js)
        sync_assets ".next/standalone/apps/admin" "."
        ;;
      apps/admin/.next/standalone/server.js)
        sync_assets "apps/admin/.next/standalone" "apps/admin"
        ;;
      apps/admin/.next/standalone/apps/admin/server.js)
        sync_assets "apps/admin/.next/standalone/apps/admin" "apps/admin"
        ;;
    esac
    echo "[admin/start] launching $path on ${HOSTNAME}:${PORT}"
    exec node "$path"
  fi
done

echo "[admin/start] FATAL: could not locate Next.js standalone server.js" >&2
echo "[admin/start] cwd=$(pwd)" >&2
echo "[admin/start] looked for:" >&2
for path in $CANDIDATES; do echo "  - $path" >&2; done
exit 1
