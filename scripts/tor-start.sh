#!/usr/bin/env bash
# Start Tor SOCKS for AgentRouter (VIGIL pattern). Idempotent.
set -euo pipefail
SOCKS="${AGENTROUTER_TOR_SOCKS:-socks5h://127.0.0.1:9050}"
PORT="${SOCKS##*:}"
RUNDIR="${TMPDIR:-/tmp}/bell-tor-run"
mkdir -p "$RUNDIR"
if ss -ltn 2>/dev/null | grep -q ":${PORT} "; then
  echo "Tor already listening on ${PORT}"
  exit 0
fi
if ! command -v tor >/dev/null 2>&1; then
  echo "tor not installed — sudo apt-get install -y tor" >&2
  exit 1
fi
cat >"$RUNDIR/torrc" <<EOF
SocksPort 9050
DataDirectory $RUNDIR/data
Log notice file $RUNDIR/tor.log
EOF
mkdir -p "$RUNDIR/data"
tor -f "$RUNDIR/torrc" &
echo $! >"$RUNDIR/tor.pid"
# Wait for bootstrap
for i in $(seq 1 60); do
  if grep -q "Bootstrapped 100%" "$RUNDIR/tor.log" 2>/dev/null; then
    echo "Tor ready socks5h://127.0.0.1:9050"
    exit 0
  fi
  sleep 1
done
echo "Tor bootstrap timeout — see $RUNDIR/tor.log" >&2
exit 1
