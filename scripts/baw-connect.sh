#!/usr/bin/env bash
# Start Binance Agentic Wallet pairing. Usage: bash scripts/baw-connect.sh
set -euo pipefail
export PATH="${HOME}/.local/bin:${PATH}"
if ! command -v baw >/dev/null 2>&1; then
  echo "Installing @binance/agentic-wallet@1.10.0 to ~/.local ..."
  npm install -g @binance/agentic-wallet@1.10.0 --prefix "${HOME}/.local"
fi
echo "Current status:"
baw wallet status --json || true
echo
echo "Starting sign-in..."
baw auth signin --json | tee /tmp/baw-signin.json
QR=$(python3 -c "import json;print(json.load(open('/tmp/baw-signin.json'))['data']['qrCodeId'])")
CODE=$(python3 -c "import json;print(json.load(open('/tmp/baw-signin.json'))['data']['pairingCode'])")
URL=$(python3 -c "import json;print(json.load(open('/tmp/baw-signin.json'))['data']['urlForWeb'])")
echo
echo "=========================================="
echo "  Open this URL on your phone/browser:"
echo "  $URL"
echo "  Pairing code (must match app): $CODE"
echo "=========================================="
echo
echo "Waiting for Binance app confirmation (up to 5 min)..."
baw auth verify --qrCodeId "$QR" --json | tee /tmp/baw-verify.json
echo
baw wallet status --json | tee /tmp/baw-status.json
baw wallet address --json | tee /tmp/baw-address.json || true
