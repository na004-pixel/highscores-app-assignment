#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
OUT="${2:-highscores-project.txt}"

cd "$ROOT"
: > "$OUT"

serialize_file() {
  local f="$1"
  echo "#---------/${f}/-----------" >> "$OUT"
  cat "$f" >> "$OUT"
  printf "\n\n" >> "$OUT"
}

# Generic extension mode:
#   ./Save\ project\ into\ a\ file.sh . serialized.txt tsx
if [[ "${3:-}" != "" ]]; then
  EXT="$3"
  find . -type f -name "*.${EXT}" \
    ! -path './node_modules/*' \
    ! -path './frontend/node_modules/*' \
    ! -path './admin/node_modules/*' \
    ! -path './dist/*' \
    ! -path './frontend/dist/*' \
    ! -path './admin/dist/*' \
    ! -path './__pycache__/*' \
    ! -path './app/__pycache__/*' \
    ! -name '*.pyc' \
    | sort | while read -r f; do
      serialize_file "${f#./}"
    done

  echo "Serialized into $OUT"
  exit 0
fi

# Project-specific serialization for this repo.
find . -type f \
  ! -path './.git/*' \
  ! -path './node_modules/*' \
  ! -path './frontend/node_modules/*' \
  ! -path './admin/node_modules/*' \
  ! -path './dist/*' \
  ! -path './frontend/dist/*' \
  ! -path './admin/dist/*' \
  ! -path './__pycache__/*' \
  ! -path './app/__pycache__/*' \
  ! -path './.pytest_cache/*' \
  ! -name '*.pyc' \
  ! -name '*.pyo' \
  ! -name '*.log' \
  ! -name '.env' \
  ! -name '.env.*' \
  ! -name 'package-lock.json' \
  ! -path './public/base scaffold.md' \
  ! -path './public/extension v1.md' \
  | sort | while read -r f; do
    case "$f" in
      ./README.md|\
      ./.dockerignore|\
      ./docker-compose.yml|\
      ./Dockerfile.app|\
      ./requirements.txt|\
      ./app/*|\
      ./frontend/package.json|\
      ./frontend/tsconfig.json|\
      ./frontend/vite.config.ts|\
      ./frontend/Dockerfile|\
      ./frontend/index.html|\
      ./frontend/src/*|\
      ./admin/package.json|\
      ./admin/tsconfig.json|\
      ./admin/vite.config.ts|\
      ./admin/Dockerfile|\
      ./admin/index.html|\
      ./admin/src/*|\
      ./public/Save\ project\ into\ a\ file.sh)
        serialize_file "${f#./}"
        ;;
    esac
  done

echo "Serialized into $OUT"
