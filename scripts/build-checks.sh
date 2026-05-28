#!/usr/bin/env bash
# DOVA-2026-PROD-001 build checks: voice + disclosure filter.
# Run from the repo root: bash scripts/build-checks.sh
# Exits non-zero on the first failure so it can gate a pre-commit hook.

set -e
FAIL=0
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Production HTML only (exclude prototypes, cost-savings redirect, git internals)
mapfile -t PAGES < <(find . -type f -name "*.html" -not -path "./prototype*" -not -path "./.git/*" -not -path "./cost-savings/*")

# --- Filter 1: em-dash (U+2014) and en-dash (U+2013) ---
# Use Python rather than grep so multi-byte chars are matched reliably.
echo "[1/3] em-dash and en-dash filter..."
python3 - "${PAGES[@]}" << 'PY'
import sys
fail = False
for p in sys.argv[1:]:
    try:
        with open(p) as f:
            s = f.read()
    except Exception:
        continue
    em = s.count("—")
    en = s.count("–")
    if em or en:
        print(f"  FAIL {p}: em-dash={em}, en-dash={en}")
        # show 3 sample lines
        for i, line in enumerate(s.splitlines(), 1):
            if "—" in line or "–" in line:
                print(f"    line {i}: {line.strip()[:120]}")
                fail = True
sys.exit(1 if fail else 0)
PY
RC=$?
[ "$RC" -ne 0 ] && FAIL=1 || echo "  OK"

# --- Filter 2: banned vocabulary ---
echo "[2/3] banned-vocabulary filter..."
BANNED='leverage|synergy|empower|game-changing|unlock value|at scale|deep dive|ecosystem|journey|in essence|let'\''s dive in|that'\''s where|it'\''s not just'
LOCAL_FAIL=0
for f in "${PAGES[@]}"; do
  HITS=$(grep -niE "$BANNED" "$f" || true)
  if [ -n "$HITS" ]; then
    echo "  FAIL banned vocab in $f:"
    echo "$HITS" | head -3
    LOCAL_FAIL=1
  fi
done
[ "$LOCAL_FAIL" = "0" ] && echo "  OK" || FAIL=1

# --- Filter 3: disclosure boundary ---
echo "[3/3] disclosure filter..."
DISCLOSED='Nano Cube|Pinnacle Strategic|Claim [1-9]|FTO finding|prior art search|Compton'
LOCAL_FAIL=0
for f in "${PAGES[@]}"; do
  HITS=$(grep -nE "$DISCLOSED" "$f" || true)
  if [ -n "$HITS" ]; then
    echo "  FAIL disclosure leak in $f:"
    echo "$HITS" | head -3
    LOCAL_FAIL=1
  fi
done
[ "$LOCAL_FAIL" = "0" ] && echo "  OK" || FAIL=1

echo ""
if [ "$FAIL" = "0" ]; then
  echo "build-checks: all filters pass."
  exit 0
else
  echo "build-checks: one or more filters failed. Fix before commit."
  exit 1
fi
