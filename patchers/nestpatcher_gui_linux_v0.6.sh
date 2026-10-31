#!/usr/bin/env bash
# Opens the NestPatcher control panel in your web browser.
# Keep the terminal open while you use it.
cd "$(dirname "$(readlink -f "$0")")" || exit 1
exec python3 NestPatcher_TiTS_GUI_v0.6.py "$@"
