#!/usr/bin/env bash

set -e

get_target() {
  local platform=$(uname -s | tr '[:upper:]' '[:lower:]')
  local arch=$(uname -m)
  
  # Normalize architecture
  case "$arch" in
    x86_64) arch="x64" ;;
    aarch64) arch="arm64" ;;
  esac
  
  # Normalize platform
  case "$platform" in
    mingw* | msys* | cygwin*) platform="win32" ;;
  esac
  
  echo "${platform}-${arch}"
}

get_version() {
  local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$script_dir/../package.json" | head -n 1
}

download_binary() {
  local target="$1"
  local version="$2"
  local url="https://github.com/maastrich/moonx/releases/download/v${version}/${target}"
  local dest="$(pwd)/bin/moonx"
  
  mkdir -p "$(dirname "$dest")"
  
  if curl -L -f -o "$dest" "$url"; then
    chmod 755 "$dest"
    echo "Binary downloaded and installed successfully"
  else
    echo "Failed to download binary from: $url" >&2
    echo "See: https://github.com/maastrich/moonx/releases" >&2
    exit 1
  fi
}

# Skip installation in development workspace
if [ -n "$INIT_CWD" ] && [ "$INIT_CWD" = "$(pwd)" ]; then
  echo "Skipping binary download in workspace install"
  exit 0
fi

# Main
TARGET=$(get_target)
VERSION=$(get_version)

echo "Downloading binary for ${TARGET} v${VERSION}..."
download_binary "$TARGET" "$VERSION"
