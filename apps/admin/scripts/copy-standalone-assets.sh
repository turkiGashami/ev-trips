#!/bin/sh
# Next.js standalone output deliberately excludes .next/static and public —
# Vercel serves them via CDN, the project's Dockerfile copies them in
# manually. On platforms that just run `pnpm build && pnpm start` (CranL),
# nothing copies them and every JS chunk 404s with text/html, so the
# admin renders blank.
#
# Run this immediately after `next build` so the standalone tree carries
# its own assets. Idempotent and tolerant of varying monorepo layouts.

set -u

copy_pair() {
  src="$1"
  dst="$2"
  if [ -d "$src" ]; then
    mkdir -p "$(dirname "$dst")"
    rm -rf "$dst"
    cp -R "$src" "$dst"
    echo "[copy-standalone-assets] $src -> $dst"
  fi
}

# Locate the standalone output (workspace-root build vs package-root build).
if   [ -d ".next/standalone" ];            then STANDALONE=".next/standalone"
elif [ -d "apps/admin/.next/standalone" ]; then STANDALONE="apps/admin/.next/standalone"
else
  echo "[copy-standalone-assets] no standalone output found, skipping" >&2
  exit 0
fi

# And the source assets (same two-layout possibility).
if   [ -d ".next/static" ]; then BASE="."
elif [ -d "apps/admin/.next/static" ]; then BASE="apps/admin"
else
  echo "[copy-standalone-assets] no .next/static found at . or apps/admin, skipping" >&2
  exit 0
fi

# In a monorepo standalone, server.js sits at <STANDALONE>/apps/admin/server.js
# and looks for assets relative to that. In a package-root standalone it sits
# at <STANDALONE>/server.js. Cover both.
if [ -f "${STANDALONE}/apps/admin/server.js" ]; then
  TARGET_DIR="${STANDALONE}/apps/admin"
else
  TARGET_DIR="${STANDALONE}"
fi

copy_pair "${BASE}/.next/static" "${TARGET_DIR}/.next/static"
copy_pair "${BASE}/public"       "${TARGET_DIR}/public"
