"""Checks the ad-hoc signatures in a NestPatcher Mac export, without a Mac.

    python tests/macsign_check.py NestExports/TiTS_..._macOS-arm64.zip

It unpacks the zip and, for every Mach-O program and library, re-reads the
code signature and checks: the page hashes, the Info.plist / requirements /
CodeResources hashes, that the signature is the last thing in the file. For
every .app and .framework it checks that _CodeSignature/CodeResources lists
each file with the right hash and each nested bundle with its cdhash.
On a real Mac, `codesign --verify --deep --strict` is the final word; this is
the same idea for Linux, Windows and Android.
"""
import hashlib
import os
import plistlib
import re
import struct
import sys
import tempfile
import zipfile

failures = []


def fail(message):
    failures.append(message)
    print("FAIL " + message)


def unpack(zip_path, dest):
    with zipfile.ZipFile(zip_path) as archive:
        for info in archive.infolist():
            path = os.path.join(dest, *info.filename.rstrip("/").split("/"))
            mode = info.external_attr >> 16
            if info.filename.endswith("/"):
                os.makedirs(path, exist_ok=True)
            elif (mode & 0o170000) == 0o120000:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                os.symlink(archive.read(info).decode(), path)
            else:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, "wb") as handle:
                    handle.write(archive.read(info))


def signature_of(data):
    """(dataoff, datasize, codedirectory bytes, {slot: hash}, code hashes, fields) of a thin Mach-O."""
    if len(data) < 32:
        return None
    magic, _c, _s, filetype, ncmds, _size, _f, _r = struct.unpack_from("<IiiIIIII", data)
    if magic != 0xFEEDFACF:
        return None
    pos, sig, linkedit = 32, None, None
    for _ in range(ncmds):
        cmd, size = struct.unpack_from("<II", data, pos)
        if cmd == 0x1D:
            sig = struct.unpack_from("<II", data, pos + 8)
        elif cmd == 0x19 and data[pos + 8:pos + 24].rstrip(b"\0") == b"__LINKEDIT":
            linkedit = struct.unpack_from("<QQQQ", data, pos + 24)
        pos += size
    if not sig:
        return "unsigned"
    off, size = sig
    _m, _length, count = struct.unpack_from(">III", data, off)
    blobs = {}
    for index in range(count):
        kind, where = struct.unpack_from(">II", data, off + 12 + 8 * index)
        blob_len = struct.unpack_from(">I", data, off + where + 4)[0]
        blobs[kind] = data[off + where:off + where + blob_len]
    cd = blobs[0]
    (_magic, length, version, flags, hash_off, ident_off, n_special, n_code, code_limit,
     hash_size, hash_type, _p, page_shift) = struct.unpack_from(">IIIIIIIIIBBBB", cd)
    ident = cd[ident_off:cd.index(b"\0", ident_off)].decode()
    special = {k: cd[hash_off - 32 * k:hash_off - 32 * (k - 1)] for k in range(1, n_special + 1)}
    code = [cd[hash_off + 32 * i:hash_off + 32 * (i + 1)] for i in range(n_code)]
    fields = dict(version=version, flags=flags, code_limit=code_limit, hash_size=hash_size,
                  hash_type=hash_type, page_shift=page_shift, ident=ident, filetype=filetype,
                  linkedit=linkedit, requirements=blobs.get(2))
    return off, size, cd, special, code, fields


def check_macho(path, rel, info_data=None, resources=None):
    with open(path, "rb") as handle:
        data = handle.read()
    found = signature_of(data)
    if found is None:
        return None
    if found == "unsigned":
        fail(rel + ": no signature")
        return None
    off, size, cd, special, code, fields = found
    if off + size != len(data):
        fail(rel + ": signature is not at the end of the file")
    le = fields["linkedit"]
    if not le or le[2] + le[3] != len(data) or le[1] < le[3]:
        fail(rel + ": __LINKEDIT does not cover the signature")
    if fields["flags"] & 0x2 == 0 or fields["flags"] & 0x20000:
        fail(rel + ": not an ad-hoc signature (flags %x)" % fields["flags"])
    if fields["code_limit"] != off or fields["hash_type"] != 2 or fields["page_shift"] != 12:
        fail(rel + ": code limit / hash type / page size wrong")
    pages = [hashlib.sha256(data[i:min(i + 4096, off)]).digest() for i in range(0, off, 4096)]
    if pages != code:
        fail(rel + ": page hashes do not match")
    if fields["requirements"] is None or special.get(2) != hashlib.sha256(fields["requirements"]).digest():
        fail(rel + ": requirements hash wrong")
    if info_data is not None and special.get(1) != hashlib.sha256(info_data).digest():
        fail(rel + ": Info.plist hash wrong")
    if resources is not None and special.get(3) != hashlib.sha256(resources).digest():
        fail(rel + ": CodeResources hash wrong")
    return hashlib.sha256(cd).digest()[:20]


def walk(top):
    for dirpath, dirnames, filenames in os.walk(top):
        for name in dirnames + filenames:
            path = os.path.join(dirpath, name)
            yield os.path.relpath(path, top).replace(os.sep, "/"), path


def main(argv):
    zip_path = argv[0]
    root = tempfile.mkdtemp(prefix="nest-macsign-")
    unpack(zip_path, root)
    apps = [os.path.join(dirpath, d) for dirpath, dirs, _ in os.walk(root) for d in dirs if d.endswith(".app")]
    app = sorted(apps, key=len)[0]
    print("Checking " + os.path.relpath(app, root))
    bundles = sorted({os.path.join(dirpath, d) for dirpath, dirs, _ in os.walk(app) for d in dirs
                      if d.endswith(".app") or d.endswith(".framework")} | {app}, key=lambda p: -p.count(os.sep))
    cdhash = {}
    checked = 0
    for bundle in bundles:
        framework = bundle.endswith(".framework")
        base = os.path.realpath(os.path.join(bundle, "Versions", "Current")) if framework else os.path.join(bundle, "Contents")
        info_path = os.path.join(base, "Resources", "Info.plist") if framework else os.path.join(base, "Info.plist")
        with open(info_path, "rb") as handle:
            info_data = handle.read()
        info = plistlib.loads(info_data)
        exe = info.get("CFBundleExecutable") or os.path.basename(bundle).rsplit(".", 1)[0]
        main_exe = os.path.join(base, exe) if framework else \
            os.path.join(base, "MacOS", exe)
        cr_path = os.path.join(base, "_CodeSignature", "CodeResources")
        if not os.path.isfile(cr_path):
            fail(os.path.relpath(bundle, root) + ": no CodeResources")
            continue
        with open(cr_path, "rb") as handle:
            resources = handle.read()
        seal = plistlib.loads(resources)["files2"]
        inner = [b for b in bundles if b != bundle and b.startswith(base + os.sep)]
        listed = set()
        for rel, path in walk(base):
            if rel.startswith("_CodeSignature") or path == main_exe:
                continue
            if any(path == b or path.startswith(b + os.sep) for b in inner):
                if path in inner and not any(path.startswith(o + os.sep) for o in inner):
                    listed.add(rel)
                    entry = seal.get(rel)
                    if not entry or entry.get("cdhash") != cdhash.get(path):
                        fail(os.path.relpath(path, root) + ": nested cdhash missing or wrong")
                continue
            if os.path.isdir(path) and not os.path.islink(path):
                continue
            if re.search(r"^Info\.plist$|^PkgInfo$", rel):
                continue
            listed.add(rel)
            entry = seal.get(rel)
            if entry is None:
                fail(os.path.relpath(path, root) + ": not sealed in CodeResources")
                continue
            if os.path.islink(path):
                if entry.get("symlink") != os.readlink(path):
                    fail(os.path.relpath(path, root) + ": symlink seal wrong")
                continue
            own = check_macho(path, os.path.relpath(path, root))
            if own:
                checked += 1
                cdhash[path] = own
            if "cdhash" in entry:
                if entry["cdhash"] != own:
                    fail(os.path.relpath(path, root) + ": nested cdhash wrong")
            else:
                with open(path, "rb") as handle:
                    if entry.get("hash2") != hashlib.sha256(handle.read()).digest():
                        fail(os.path.relpath(path, root) + ": file hash wrong")
        extra = set(seal) - listed
        if extra:
            fail(os.path.relpath(bundle, root) + ": CodeResources lists missing files: " + ", ".join(sorted(extra)[:5]))
        own = check_macho(main_exe, os.path.relpath(main_exe, root), info_data, resources)
        if own:
            checked += 1
            cdhash[bundle] = own
            if signature_of(open(main_exe, "rb").read())[5]["ident"] != info.get("CFBundleIdentifier"):
                fail(os.path.relpath(main_exe, root) + ": identifier is not the bundle id")
    print("Checked %d signed programs and libraries in %d bundles." % (checked, len(bundles)))
    print("ALL PASSED" if not failures else "%d FAILED" % len(failures))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
