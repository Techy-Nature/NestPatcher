#!/usr/bin/env bash
# Shows the NestPatcher menu. Run from a terminal:  ./nestpatcher_linux_v1.3.sh
# Keep it in the same folder as NestPatcher_TiTS_Linux_v1.3.py and nestmods.
cd "$(dirname "$(readlink -f "$0")")" || exit 1
exec python3 NestPatcher_TiTS_Linux_v1.3.py --menu "$@"
