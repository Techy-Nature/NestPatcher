#!/usr/bin/env bash
# Installs what NestPatcher needs: Python 3 and Node.js.
# Works on Debian, Ubuntu, Mint, Pop!_OS (apt), Fedora and Nobara (dnf),
# Arch/SteamOS-likes (pacman) and openSUSE (zypper). Asks for your password.
set -e
if command -v apt-get >/dev/null; then
  echo "Debian/Ubuntu family: sudo apt install python3 nodejs"
  sudo apt-get update && sudo apt-get install -y python3 nodejs
elif command -v dnf >/dev/null; then
  echo "Fedora/Nobara family: sudo dnf install python3 nodejs"
  sudo dnf install -y python3 nodejs
elif command -v pacman >/dev/null; then
  echo "Arch family: sudo pacman -S python nodejs"
  sudo pacman -S --needed --noconfirm python nodejs
elif command -v zypper >/dev/null; then
  echo "openSUSE: sudo zypper install python3 nodejs"
  sudo zypper install -y python3 nodejs
else
  echo "Unknown package manager. Install python3 and nodejs yourself."
  exit 1
fi
echo
python3 --version
node --version
echo "All set. Now run ./nestpatcher_linux_v1.9.sh"
