#!/bin/bash
# Real-Mac check of the built-in signing (run by CI on macos-latest).
#   bash tests/mac_real_check.sh
# Exports the fake game with the real Electron for arm64 and x64, keeps
# NestPatcher's own signature (no codesign), and then asks macOS:
#   * codesign --verify --deep --strict accepts both apps,
#   * the arm64 app and its helpers start and keep running,
#   * "Open TiTS.command" clears the quarantine flag and opens the app.
set -u
cd "$(dirname "$0")/.."
REPO="$PWD"
ELECTRON=28.3.3
WORK="$(mktemp -d)"
FAILED=0
pass() { echo "PASS $1"; }
fail() { echo "FAIL $1"; FAILED=1; }

python3 - "$WORK" <<'EOF'
import sys
sys.path.insert(0, "tests")
import smoke_test
smoke_test.build(sys.argv[1], "nestmods")
EOF
cp patchers/NestPatcher_TiTS_Linux_v*.py "$WORK/tool/"
PATCHER="$(ls "$WORK"/tool/NestPatcher_TiTS_Linux_v*.py)"
cd "$WORK/tool"
python3 "$PATCHER" --game ../game >/dev/null || fail "patch the fake game"

for ARCH in arm64 x64; do
  ZIP="$WORK/electron-v$ELECTRON-darwin-$ARCH.zip"
  curl -sSLf -o "$ZIP" "https://github.com/electron/electron/releases/download/v$ELECTRON/electron-v$ELECTRON-darwin-$ARCH.zip" \
    || { fail "download Electron $ARCH"; continue; }
  OUT="$WORK/out-$ARCH"
  NESTPATCHER_NO_CODESIGN=1 python3 "$PATCHER" --export-mac --arch "$ARCH" --electron-zip "$ZIP" --out "$OUT" \
    > "$WORK/export-$ARCH.log" 2>&1
  grep -E "Signed|WARNING|STOP|DONE" "$WORK/export-$ARCH.log"
  grep -q "^Signed " "$WORK/export-$ARCH.log" && pass "built-in signing ran ($ARCH)" || fail "built-in signing ran ($ARCH)"
  python3 "$REPO/tests/macsign_check.py" "$OUT"/*.zip | tail -2
  APP="$(ls -d "$OUT"/TiTS_*_macOS-"$ARCH"/TiTS.app)"
  if codesign --verify --deep --strict --verbose=2 "$APP" > "$WORK/verify-$ARCH.log" 2>&1; then
    pass "codesign --verify --deep --strict accepts NestPatcher's signature ($ARCH)"
  else
    cat "$WORK/verify-$ARCH.log"
    fail "codesign --verify --deep --strict accepts NestPatcher's signature ($ARCH)"
  fi
  codesign -dv "$APP" 2>&1 | grep -E "Identifier|Signature|CodeDirectory" || true
done

ARM_APP="$(ls -d "$WORK"/out-arm64/TiTS_*_macOS-arm64/TiTS.app 2>/dev/null)"
if [ -n "$ARM_APP" ] && [ "$(uname -m)" = "arm64" ]; then
  "$ARM_APP/Contents/MacOS/TiTS" > "$WORK/run.log" 2>&1 &
  PID=$!
  sleep 15
  if kill -0 "$PID" 2>/dev/null; then
    pass "the signed app starts and keeps running"
  else
    wait "$PID"; echo "exit code $?"; tail -20 "$WORK/run.log"
    fail "the signed app starts and keeps running"
  fi
  pgrep -f "TiTS Helper" >/dev/null && pass "its helper programs start too" || fail "its helper programs start too"
  kill "$PID" 2>/dev/null; sleep 2; pkill -f "TiTS.app/Contents" 2>/dev/null

  # The opener: put the quarantine flag on like a download would, then run it.
  FOLDER="$(dirname "$ARM_APP")"
  xattr -w com.apple.quarantine "0081;00000000;Safari;" "$ARM_APP"
  xattr -w com.apple.quarantine "0081;00000000;Safari;" "$ARM_APP/Contents/MacOS/TiTS"
  [ -x "$FOLDER/Open TiTS.command" ] && pass "opener is executable" || fail "opener is executable"
  bash "$FOLDER/Open TiTS.command" > "$WORK/opener.log" 2>&1
  cat "$WORK/opener.log"
  if xattr -r "$ARM_APP" | grep -q com.apple.quarantine; then
    fail "opener clears the quarantine flag"
  else
    pass "opener clears the quarantine flag"
  fi
  sleep 10
  pgrep -f "TiTS.app/Contents/MacOS/TiTS" >/dev/null && pass "opener opens the app" || echo "NOTE could not confirm the app opened (CI may have no desktop session)"
  pkill -f "TiTS.app/Contents" 2>/dev/null
fi

rm -rf "$WORK"
[ "$FAILED" = 0 ] && echo "ALL PASSED" || echo "SOME FAILED"
exit "$FAILED"
