#!/usr/bin/env bash

set -e

binary_path="$(pwd)/bin/moonx"

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

download_checksum() {
  local target="$1"
  local version="$2"
  local url="https://github.com/maastrich/moonx/releases/download/v${version}/checksum-${target}.txt"
  local dest="$(pwd)/bin/checksum.txt"

  if curl -L -f -o "$dest" "$url"; then
    echo "Checksum downloaded successfully"
    return 0
  else
    echo "Warning: Failed to download checksum from: $url" >&2
    return 1
  fi
}

verify_checksum() {
  local checksum_file="$(pwd)/bin/checksum.txt"

  if [ ! -f "$checksum_file" ]; then
    echo "Warning: Checksum file not found, skipping verification" >&2
    return 0
  fi

  local expected_checksum=$(cat "$checksum_file" | tr -d '[:space:]')

  if [ -z "$expected_checksum" ]; then
    echo "Warning: Empty checksum file, skipping verification" >&2
    return 0
  fi

  local actual_checksum
  if command -v sha256sum >/dev/null 2>&1; then
    actual_checksum=$(sha256sum "$binary_path" | awk '{print $1}')
  elif command -v shasum >/dev/null 2>&1; then
    actual_checksum=$(shasum -a 256 "$binary_path" | awk '{print $1}')
  else
    echo "Warning: No SHA256 tool found, skipping verification" >&2
    return 0
  fi

  if [ "$expected_checksum" = "$actual_checksum" ]; then
    echo "Checksum verification passed"
    return 0
  else
    echo "Error: Checksum verification failed!" >&2
    echo "Expected: $expected_checksum" >&2
    echo "Got:      $actual_checksum" >&2
    return 1
  fi
}

download_binary() {
  local target="$1"
  local version="$2"
  local url="https://github.com/maastrich/moonx/releases/download/v${version}/${target}"

  mkdir -p "$(dirname "$binary_path")"

  if curl -L -f -o "$binary_path" "$url"; then
    chmod +x "$binary_path"
    echo "Binary downloaded successfully"

    # Download and verify checksum
    if download_checksum "$target" "$version"; then
      if verify_checksum; then
        echo "Binary installed successfully"
        rm -f "$(pwd)/bin/${checksum-target}.txt"
        return 0
      else
        rm -f "$dest"
        rm -f "$(pwd)/bin/${checksum-target}.txt"
        exit 1
      fi
    else
      echo "Warning: Proceeding without checksum verification"
      echo "Binary installed successfully"
      return 0
    fi
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
