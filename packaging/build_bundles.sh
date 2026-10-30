#!/usr/bin/env bash
# Builds the ready-made NestPatcher GUI bundles into dist/:
#   NestPatcher_GUI_v<ver>-x86_64.AppImage   (Linux: bundled Python + Node.js)
#   NestPatcher_GUI_v<ver>_Windows.zip       (Windows: launcher .exe + bundled Python + Node.js)
# Runs on Linux. Needs: python3, curl, mksquashfs (squashfs-tools),
# x86_64-w64-mingw32-gcc and -windres (gcc-mingw-w64-x86-64), zip, tar, xz.
set -euo pipefail
cd "$(dirname "$(readlink -f "$0")")/.."
ROOT=$PWD

# Pinned downloads, checked against these SHA-256 sums.
PBS_TAG=20241016
PY_VER=3.12.7
NODE_VER=22.11.0
PY_LINUX="cpython-${PY_VER}+${PBS_TAG}-x86_64-unknown-linux-gnu-install_only_stripped.tar.gz"
PY_LINUX_SHA=3a4d53a7ba3916c0c1f35cbbe57068e2571b138389f29cf5c35367fec8f4c617
PY_WIN="cpython-${PY_VER}+${PBS_TAG}-x86_64-pc-windows-msvc-install_only_stripped.tar.gz"
PY_WIN_SHA=fa8ac308a7cd1774d599ad9a29f1e374fbdc11453b12a8c50cc4afdb5c4bfd1a
NODE_LINUX="node-v${NODE_VER}-linux-x64.tar.xz"
NODE_LINUX_SHA=83bf07dd343002a26211cf1fcd46a9d9534219aad42ee02847816940bf610a72
NODE_WIN="node-v${NODE_VER}-win-x64.zip"
NODE_WIN_SHA=905373a059aecaf7f48c1ce10ffbd5334457ca00f678747f19db5ea7d256c236
# The AppImage runtime has no versioned releases; this is the "continuous" build.
RUNTIME_URL=https://github.com/AppImage/type2-runtime/releases/download/continuous/runtime-x86_64

GUI_VER=$(python3 -c "import re;print(re.search(r'GUI_VERSION = \"([^\"]+)\"', open('src/build.py').read()).group(1))")
GUI_PY="NestPatcher_TiTS_GUI_v${GUI_VER}.py"
NAME="NestPatcher_GUI_v${GUI_VER}"
WORK=$ROOT/build/bundles
DL=$ROOT/build/downloads
DIST=$ROOT/dist
mkdir -p "$WORK" "$DL" "$DIST"

fetch() {  # fetch URL FILE SHA256
  if [ ! -f "$DL/$2" ]; then curl -fsSL -o "$DL/$2.part" "$1" && mv "$DL/$2.part" "$DL/$2"; fi
  if [ -n "$3" ]; then echo "$3  $DL/$2" | sha256sum -c --quiet - || { echo "Checksum mismatch: $2"; rm -f "$DL/$2"; exit 1; }; fi
}
PBS=https://github.com/astral-sh/python-build-standalone/releases/download/$PBS_TAG
fetch "$PBS/$PY_LINUX" "$PY_LINUX" "$PY_LINUX_SHA"
fetch "$PBS/$PY_WIN" "$PY_WIN" "$PY_WIN_SHA"
fetch "https://nodejs.org/dist/v$NODE_VER/$NODE_LINUX" "$NODE_LINUX" "$NODE_LINUX_SHA"
fetch "https://nodejs.org/dist/v$NODE_VER/$NODE_WIN" "$NODE_WIN" "$NODE_WIN_SHA"
fetch "$RUNTIME_URL" runtime-x86_64 ""

python3 src/build.py "$WORK/gen" >/dev/null

trim_python() {  # drop parts of Python the GUI never uses
  local lib=$1
  rm -rf "$lib"/test "$lib"/idlelib "$lib"/ensurepip "$lib"/lib2to3 "$lib"/turtledemo "$lib"/site-packages/pip*
  find "$lib" -name __pycache__ -prune -exec rm -rf {} +
}

# ---------- Linux AppImage ----------
APPDIR=$WORK/AppDir
rm -rf "$APPDIR" && mkdir -p "$APPDIR/usr/share/nestpatcher" "$APPDIR/usr/node/bin"
tar xzf "$DL/$PY_LINUX" -C "$WORK" && rm -rf "$APPDIR/usr/python" && mv "$WORK/python" "$APPDIR/usr/python"
trim_python "$APPDIR/usr/python/lib/python3.12"
rm -rf "$APPDIR/usr/python/include" "$APPDIR/usr/python/share"
tar xJf "$DL/$NODE_LINUX" -C "$WORK" "node-v$NODE_VER-linux-x64/bin/node" "node-v$NODE_VER-linux-x64/LICENSE"
mv "$WORK/node-v$NODE_VER-linux-x64/bin/node" "$APPDIR/usr/node/bin/node"
mv "$WORK/node-v$NODE_VER-linux-x64/LICENSE" "$APPDIR/usr/node/LICENSE"
cp "$WORK/gen/$GUI_PY" "$APPDIR/usr/share/nestpatcher/"
cp src/launcher/nestpatcher-icon.svg "$APPDIR/nestpatcher.svg"
ln -sf nestpatcher.svg "$APPDIR/.DirIcon"
cat > "$APPDIR/nestpatcher.desktop" <<DESK
[Desktop Entry]
Type=Application
Name=NestPatcher
Comment=Patch Trials in Tainted Space with mods (not KittyPatcher)
Exec=AppRun
Icon=nestpatcher
Terminal=true
Categories=Game;
DESK
cat > "$APPDIR/AppRun" <<RUN
#!/bin/sh
# NestPatcher GUI v$GUI_VER: bundled Python runs the GUI script, with bundled Node.js
# for mod checking. Mods (nestmods/) and settings live next to the .AppImage file.
HERE="\$(dirname "\$(readlink -f "\$0")")"
export NESTPATCHER_NODE="\$HERE/usr/node/bin/node"
exec "\$HERE/usr/python/bin/python3" -I "\$HERE/usr/share/nestpatcher/$GUI_PY" "\$@"
RUN
chmod +x "$APPDIR/AppRun"
rm -f "$WORK/app.squashfs"
mksquashfs "$APPDIR" "$WORK/app.squashfs" -root-owned -noappend -comp gzip -quiet >/dev/null
cat "$DL/runtime-x86_64" "$WORK/app.squashfs" > "$DIST/$NAME-x86_64.AppImage"
chmod +x "$DIST/$NAME-x86_64.AppImage"

# ---------- Windows zip ----------
WIN=$WORK/win/${NAME}_Windows
rm -rf "$WORK/win" && mkdir -p "$WIN/runtime/app" "$WIN/runtime/node" "$WIN/nestmods"
tar xzf "$DL/$PY_WIN" -C "$WORK/win" && cp -r "$WORK/win/python/." "$WIN/runtime/" && rm -rf "$WORK/win/python"
trim_python "$WIN/runtime/Lib"
rm -rf "$WIN/runtime/include" "$WIN/runtime/Scripts" "$WIN/runtime/libs"
unzip -q -o -j "$DL/$NODE_WIN" "node-v$NODE_VER-win-x64/node.exe" "node-v$NODE_VER-win-x64/LICENSE" -d "$WIN/runtime/node"
cp "$WORK/gen/$GUI_PY" "$WIN/runtime/app/"
VERCOMMA=$(echo "$GUI_VER" | tr . ,)
sed "s/@VERCOMMA@/$VERCOMMA/g; s/@VER@/$GUI_VER/g" src/launcher/res.rc.in > "$WORK/res.rc"
cp src/launcher/nestpatcher.ico "$WORK/"
x86_64-w64-mingw32-windres "$WORK/res.rc" -O coff -o "$WORK/res.o"
x86_64-w64-mingw32-gcc -municode -O2 -s "-DSCRIPT=L\"$GUI_PY\"" -o "$WIN/$NAME.exe" src/launcher/nestpatcher_launcher.c "$WORK/res.o"
printf 'Put your mods here: enabled.txt plus your .mod and .js files.\r\n(If you used KittyPatcher before, NestPatcher can also rename an old kitty-mods folder that sits next to it.)\r\n' > "$WIN/nestmods/PUT-YOUR-MODS-HERE.txt"
sed "s/@VER@/$GUI_VER/g; s/@NAME@/$NAME/g" packaging/READ-ME-FIRST.txt.in | sed 's/$/\r/' > "$WIN/READ-ME-FIRST.txt"
rm -f "$DIST/${NAME}_Windows.zip"
(cd "$WORK/win" && zip -qr9 "$DIST/${NAME}_Windows.zip" "${NAME}_Windows")

ls -la "$DIST"
