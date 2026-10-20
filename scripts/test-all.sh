#!/usr/bin/env bash
set -Eeuo pipefail

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECTS_DIR="$(cd "$FRONTEND_DIR/.." && pwd)"

run() {
  echo
  echo "==> $*"
  "$@"
}

run npm test --prefix "$FRONTEND_DIR"
run npm test --prefix "$PROJECTS_DIR/LoxecutivoAuth"
run npm test --prefix "$PROJECTS_DIR/LoxecutivoExport"
echo
echo "==> Core Maven tests"
(cd "$PROJECTS_DIR/LoxecutivoCore" && sh ./mvnw -q -DskipTests=false test)

echo
echo "All Loxecutivo tests passed."
