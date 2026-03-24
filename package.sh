#!/bin/sh
# Rebuild the Chrome Web Store distribution ZIP.
# Usage: ./package.sh

set -e

VERSION=$(node -pe "require('./manifest.json').version")
OUT="store-assets/metvuwplus-${VERSION}.zip"

rm -f "$OUT"
zip -r "$OUT" manifest.json content/ popup/ icons/ --exclude "*.DS_Store"
echo "Built $OUT"
