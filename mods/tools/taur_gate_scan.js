#!/usr/bin/env node
"use strict";
/*
 * taur_gate_scan.js  -  companion to taur_naga_bypass.mod for KittyPatcher.
 *
 * What it does
 *   Reads the same clean game scripts the patcher uses (the backup folder first,
 *   then the live files), parses them, and finds menu buttons that are switched
 *   off for taur / naga / non-biped bodies, for example
 *
 *       pc.isTaur()||pc.isNaga() ? addDisabledButton(...) : addButton(...)
 *       2 !== pc.legCount        ? addDisabledButton(...) : addButton(...)
 *
 *   For each one it writes an exact-text Replace block into the output .mod
 *   that makes ONLY THAT TEST treat a 1-leg or 4-leg player as a biped while
 *   the Mod Menu switch is on.
 *
 * What it deliberately does NOT touch
 *   - scene text:   [pc.isTaur|...|...], "..."+(pc.isTaur()?"a":"b")
 *   - scenes that already support taurs through their own buttons, e.g.
 *       pc.isTaur() ? addButton(taur version) : addButton(biped version)
 *   - taur-only / naga-only options (the change would switch them OFF for taurs)
 *   - anything it cannot classify with certainty (listed in the log instead)
 *
 * Where things are
 *   The first time you run it, it asks where each thing lives (acorn.js, the
 *   game's www folder, the clean backup folder, the mods folder, the logs
 *   folder) and what to call the output .mod. Answers are saved in
 *   taur_gate_scan.settings.json next to this script and reused on later runs.
 *   Press Enter at a question to keep the value shown in [brackets].
 *
 * Usage
 *   node taur_gate_scan.js                 scan, using the saved folders
 *   node taur_gate_scan.js --setup         ask for every folder again
 *   node taur_gate_scan.js --dry-run       only report, write nothing
 *   node taur_gate_scan.js --list          also print every gate it will change
 *   node taur_gate_scan.js --skip "regex"  leave out gates whose button name,
 *                                          tooltip or test text matches (repeatable)
 *   node taur_gate_scan.js --out NAME      output .mod name (saved for next time)
 *   node taur_gate_scan.js --settings FILE use a different settings file
 *   node taur_gate_scan.js --project DIR   suggest DIR/extracted/apk/assets/www,
 *                                          DIR/mods, ... as the answers
 *   Then run the patcher as usual.
 *   If node runs out of memory on the biggest file:
 *   node --max-old-space-size=3072 taur_gate_scan.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

let acorn;   // loaded once we know where acorn.js is

// ---------------------------------------------------------------- options
function usage() {
  console.log("Usage: node taur_gate_scan.js [--setup] [--dry-run] [--list] [--skip REGEX]... [--out NAME] [--settings FILE] [--project DIR] [--timing]");
}
const opts = { dryRun: false, timing: false, list: false, setup: false, out: null, project: null, settings: null, skip: [] };
const argv = require.main === module ? process.argv.slice(2) : [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--dry-run") opts.dryRun = true;
  else if (a === "--list") opts.list = true;
  else if (a === "--timing") opts.timing = true;
  else if (a === "--setup") opts.setup = true;
  else if (a === "--out") opts.out = argv[++i];
  else if (a === "--project") opts.project = argv[++i];
  else if (a === "--settings") opts.settings = argv[++i];
  else if (a === "--skip") opts.skip.push(new RegExp(argv[++i], "i"));
  else if (a === "-h" || a === "--help") { usage(); process.exit(0); }
  else { console.error("Unknown option: " + a); usage(); process.exit(1); }
}
for (const k of ["out", "project", "settings"]) {
  if (opts[k] === undefined) { console.error("--" + k + " needs a value"); usage(); process.exit(1); }
}

// ------------------------------------------------------- folders and settings
const SETTINGS_FILE = opts.settings ? path.resolve(opts.settings) : path.join(__dirname, "taur_gate_scan.settings.json");
let APP, MODS, BACKUP, LOGS, OUT_NAME;

// Turns what the user typed (or pasted, or dragged in) into a full path.
function cleanPath(s) {
  s = String(s || "").trim().replace(/^["']|["']$/g, "");
  if (!s) return "";
  if (s === "~" || s.startsWith("~/")) s = path.join(os.homedir(), s.slice(1));
  return path.resolve(s);
}
function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch (e) { return false; } }
function isFile(p) { try { return fs.statSync(p).isFile(); } catch (e) { return false; } }

function loadSettings() {
  if (!isFile(SETTINGS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8")) || {}; }
  catch (e) { console.error("Could not read " + SETTINGS_FILE + " (" + e.message + "); asking again."); return {}; }
}
function saveSettings(s) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2) + "\n", "utf8");
}

// One question per thing the scanner needs. check() returns an error message, or "" if fine.
const QUESTIONS = [
  {
    key: "acorn", what: "acorn.js (the file, or the folder it is in)",
    guess: (p) => path.join(__dirname, "acorn.js"),
    fix: (v) => isDir(v) ? path.join(v, "acorn.js") : v,
    check: (v) => {
      if (!isFile(v)) return "No file at " + v;
      try { require(v).parse("1", { ecmaVersion: "latest" }); return ""; }
      catch (e) { return "That file is not a working acorn.js (" + e.message + ")"; }
    },
  },
  {
    key: "game", what: "the game's www folder (holds main.<hash>.js)",
    guess: (p) => path.join(p, "extracted", "apk", "assets", "www"),
    check: (v) => {
      if (!isDir(v)) return "No folder at " + v;
      if (!fs.readdirSync(v).some((n) => n.endsWith(".js"))) return "No .js files in " + v;
      return "";
    },
  },
  {
    key: "backup", what: "the clean backup folder (type none if you have no backups)",
    guess: (p) => path.join(p, "mods", "backup"),
    fix: (v, raw) => /^none$/i.test(String(raw).trim()) ? "none" : v,
    check: (v) => v === "none" || isDir(v) ? "" : "No folder at " + v + " (type none to scan the live files)",
  },
  {
    key: "mods", what: "the mods folder (the .mod is written here)",
    guess: (p) => path.join(p, "mods"),
    check: (v) => isDir(v) ? "" : "No folder at " + v,
  },
  {
    key: "logs", what: "the logs folder (GateScan.txt is written here)",
    guess: (p) => path.join(p, "mods", "logs"),
    check: (v) => isDir(v) || isDir(path.dirname(v)) ? "" : "No folder at " + v + " or above it",
  },
];

const OUT_QUESTION = { key: "out", what: "the output .mod name (as listed in enabled.txt)" };

// Asks one question until the answer passes its check. Enter keeps def.
async function askUntilValid(ask, q, def) {
  for (;;) {
    const raw = await ask("Where is " + q.what + "?\n  [" + def + "]: ");
    let v = cleanPath(raw) || def;
    if (q.fix) v = q.fix(v, raw);
    const err = q.check(v);
    if (!err) return v;
    console.log("  " + err + ". Try again.");
  }
}
async function askOutName(ask, current) {
  const def = current || "TN_taur-naga_gates.mod";
  const raw = (await ask("What should the output .mod be called (the name in enabled.txt)?\n  [" + def + "]: ")).trim();
  let name = path.basename(raw || def);
  if (!/\.mod$/i.test(name)) name += ".mod";
  return name;
}

function makeAsker() {
  if (!process.stdin.isTTY) return null;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));
  ask.close = () => rl.close();
  return ask;
}

async function setup() {
  const saved = loadSettings();
  const base = opts.project ? path.resolve(opts.project) : path.dirname(__dirname);
  const asker = { fn: null };
  const getAsk = () => {
    if (!asker.fn) asker.fn = makeAsker();
    if (!asker.fn) {
      console.error("The scanner needs to ask where your files are, but it is not running in a terminal.");
      console.error("Run it once in Termux, or fill in " + SETTINGS_FILE + " by hand.");
      process.exit(1);
    }
    return asker.fn;
  };
  const result = {};
  let changed = false;

  if (opts.setup) console.log("Setup: press Enter to keep the value in [brackets].\n");
  for (const q of QUESTIONS) {
    let value = saved[q.key];
    // A saved answer is reused as long as it still checks out.
    if (value && !opts.setup && !q.check(value)) { result[q.key] = value; continue; }
    if (value && !opts.setup) console.log("Saved location for " + q.what + " no longer works: " + q.check(value));
    const ask = getAsk();
    result[q.key] = await askUntilValid(ask, q, value || q.guess(base));
    changed = true;
  }

  // The output name is remembered too, so the file keeps matching enabled.txt.
  let outName = opts.out || saved.out;
  if (!outName || opts.setup) {
    outName = await askOutName(getAsk(), outName);
  }
  if (outName !== saved.out) changed = true;
  result.out = outName;

  if (asker.fn) asker.fn.close();
  if (changed) {
    saveSettings(result);
    console.log("\nSaved to " + SETTINGS_FILE + " (run with --setup to change).\n");
  }

  acorn = require(result.acorn);
  APP = result.game;
  BACKUP = result.backup === "none" ? null : result.backup;
  MODS = result.mods;
  LOGS = result.logs;
  OUT_NAME = path.basename(result.out);
  console.log("Game:   " + APP);
  console.log("Backup: " + (BACKUP || "(none, scanning live files)"));
  console.log("Output: " + path.join(MODS, OUT_NAME));
  console.log("Log:    " + path.join(LOGS, "GateScan.txt") + "\n");
}


// ------------------------------------------------- what counts as a body check
const PRED_BYPASS = { isTaur: false, isNaga: false, isBiped: true };   // value while bypassing
const FUNC = new Set(["FunctionExpression", "ArrowFunctionExpression", "FunctionDeclaration"]);
const DIS_RE = /^addDisabled/;
const EN_RE = /^add\w*Button/;

function isPc(n) { return !!n && n.type === "Identifier" && n.name === "pc"; }

function predicateKind(n) {
  if (n.type !== "CallExpression" || n.arguments.length !== 0) return null;
  const c = n.callee;
  if (c.type !== "MemberExpression" || c.computed || !isPc(c.object) || c.property.type !== "Identifier") return null;
  return Object.prototype.hasOwnProperty.call(PRED_BYPASS, c.property.name) ? c.property.name : null;
}
function isLegCountMember(n) {
  return !!n && n.type === "MemberExpression" && !n.computed && isPc(n.object) &&
         n.property.type === "Identifier" && n.property.name === "legCount";
}
const CMP = {
  "==": (a, b) => a == b, "===": (a, b) => a === b, "!=": (a, b) => a != b, "!==": (a, b) => a !== b,
  "<": (a, b) => a < b, "<=": (a, b) => a <= b, ">": (a, b) => a > b, ">=": (a, b) => a >= b,
};
// pc.legCount compared with a number. b = what the comparison gives for a biped (2 legs).
function legCountCompare(n) {
  if (n.type !== "BinaryExpression" || !CMP[n.operator]) return null;
  const num = (x) => x.type === "Literal" && typeof x.value === "number";
  if (isLegCountMember(n.left) && num(n.right)) return { member: n.left, b: CMP[n.operator](2, n.right.value) };
  if (isLegCountMember(n.right) && num(n.left)) return { member: n.right, b: CMP[n.operator](n.left.value, 2) };
  return null;
}

function pushChildren(n, stack) {
  for (const k in n) {
    if (k === "type" || k === "start" || k === "end") continue;
    const v = n[k];
    if (v === null || typeof v !== "object") continue;
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) { const c = v[i]; if (c && typeof c.type === "string") stack.push(c); }
    } else if (typeof v.type === "string") stack.push(v);
  }
}
function walkAll(root, visit) {
  const stack = [root];
  while (stack.length) { const n = stack.pop(); visit(n); pushChildren(n, stack); }
}
function containsPredicate(root) {
  const stack = [root];
  while (stack.length) {
    const n = stack.pop();
    if (predicateKind(n) || isLegCountMember(n)) return true;
    pushChildren(n, stack);
  }
  return false;
}
function calleeName(call) {
  const c = call.callee;
  if (c.type === "Identifier") return c.name;
  if (c.type === "MemberExpression" && !c.computed && c.property.type === "Identifier") return c.property.name;
  return null;
}
// Disabled / enabled button calls in a branch, ignoring nested functions (those run later).
function analyze(root) {
  let dis = 0, en = 0;
  if (!root) return { dis, en };
  const stack = [root];
  while (stack.length) {
    const n = stack.pop();
    if (FUNC.has(n.type)) continue;
    if (n.type === "CallExpression") {
      const nm = calleeName(n);
      if (nm) { if (DIS_RE.test(nm)) dis++; else if (EN_RE.test(nm)) en++; }
    }
    pushChildren(n, stack);
  }
  return { dis, en };
}
function strVal(n) { return n && n.type === "Literal" && typeof n.value === "string" ? n.value : null; }
function disabledInfo(branch) {
  if (!branch) return { label: "", tip: "" };
  const stack = [branch];
  let best = null;
  while (stack.length) {
    const n = stack.pop();
    if (FUNC.has(n.type)) continue;
    if (n.type === "CallExpression") {
      const nm = calleeName(n);
      if (nm && DIS_RE.test(nm) && (!best || n.start < best.start)) best = n;
    }
    pushChildren(n, stack);
  }
  if (!best) return { label: "", tip: "" };
  const a = best.arguments;
  return { label: strVal(a[1]) || strVal(a[2]) || "", tip: strVal(a[3]) || "" };
}

// ------------------------------------------------- reading a test expression
class Unsupported extends Error {}

// Collect the body checks in value position of a test, with their polarity:
// parity +1 = the test can only get truer when the check gets truer, -1 = the opposite.
function collectAtoms(n, parity, out) {
  switch (n.type) {
    case "LogicalExpression":
      if (n.operator === "??") { if (containsPredicate(n)) throw new Unsupported("body check next to ??"); return; }
      collectAtoms(n.left, parity, out); collectAtoms(n.right, parity, out); return;
    case "UnaryExpression":
      if (n.operator === "!") { collectAtoms(n.argument, -parity, out); return; }
      if (containsPredicate(n)) throw new Unsupported("body check under unary " + n.operator);
      return;
    case "SequenceExpression":
      collectAtoms(n.expressions[n.expressions.length - 1], parity, out); return;
    case "ConditionalExpression":
      if (containsPredicate(n.test)) throw new Unsupported("body check decides a nested ?: inside the test");
      collectAtoms(n.consequent, parity, out); collectAtoms(n.alternate, parity, out); return;
    case "CallExpression": {
      const k = predicateKind(n);
      if (k) { out.push({ type: "call", kind: k, start: n.start, end: n.end, b: PRED_BYPASS[k], parity }); return; }
      if (containsPredicate(n)) throw new Unsupported("body check passed into a function call");
      return;
    }
    case "BinaryExpression": {
      const lc = legCountCompare(n);
      if (lc) { out.push({ type: "leg", kind: "legCount", start: lc.member.start, end: lc.member.end, b: lc.b, parity }); return; }
      if (containsPredicate(n)) throw new Unsupported("leg count used in a way other than comparing with a number");
      return;
    }
    default:
      if (containsPredicate(n)) throw new Unsupported("body check inside a " + n.type);
      return;
  }
}
// Moving every check to its "biped" value must only ever move the test AWAY from the blocked branch.
function polarityOk(atoms, blockedWhenTrue) {
  const need = blockedWhenTrue ? -1 : 1;
  return atoms.every((a) => (a.b ? 1 : -1) * a.parity === need);
}
function editText(a, src) {
  const orig = src.slice(a.start, a.end);
  if (a.type === "call") return "(window.tnBB&&window.tnBB(pc)?" + (a.b ? "!0" : "!1") + ":" + orig + ")";
  return "(window.tnBB&&window.tnBB(pc)?2:" + orig + ")";
}
function applyEdits(src, from, to, edits) {
  let out = "", at = from;
  for (const e of edits) { out += src.slice(at, e.start) + editText(e, src); at = e.end; }
  return out + src.slice(at, to);
}

// ------------------------------------------------------------ scan one file
function clip(s, n) { s = String(s).replace(/\s+/g, " "); return s.length > n ? s.slice(0, n - 1) + "…" : s; }

function scanFile(name, src) {
  const ast = parseJS(src);
  const sites = [], skipped = [];
  let predicateTotal = 0;

  function consider(testNode, blockedWhenTrue, blockedBranch, what, extra) {
    const info = extra || disabledInfo(blockedBranch);
    const testSrc = src.slice(testNode.start, testNode.end);
    const note = (reason) => skipped.push({ file: name, reason, label: info.label, tip: info.tip, test: clip(testSrc, 140) });
    const atoms = [];
    try { collectAtoms(testNode, 1, atoms); }
    catch (e) { if (e instanceof Unsupported) return note("unsupported test: " + e.message); throw e; }
    if (!atoms.length) return note("body check is only in the side-effect part of the test");
    if (!polarityOk(atoms, blockedWhenTrue)) return note("taur-only/naga-only style option (changing it would close it for taurs)");
    atoms.sort((x, y) => x.start - y.start);
    sites.push({
      file: name, what, label: info.label, tip: info.tip, testSrc,
      edits: atoms, spanStart: atoms[0].start, spanEnd: atoms[atoms.length - 1].end,
    });
  }

  walkAll(ast, (n) => {
    if (predicateKind(n)) predicateTotal++;
    if (n.type === "ConditionalExpression" || n.type === "IfStatement") {
      if (!containsPredicate(n.test)) return;
      const c = analyze(n.consequent), a = analyze(n.alternate);
      if (c.dis > 0 && c.en === 0 && a.en > 0) consider(n.test, true, n.consequent, "gate");
      else if (a.dis > 0 && a.en === 0 && c.en > 0) consider(n.test, false, n.alternate, "gate");
      else if ((c.dis > 0 && c.en === 0 && a.dis === 0 && a.en === 0) ||
               (a.dis > 0 && a.en === 0 && c.dis === 0 && c.en === 0)) {
        // one side is a disabled button and the other side offers nothing to switch to
        const di = disabledInfo(c.dis > 0 ? n.consequent : n.alternate);
        skipped.push({ file: name, reason: "disabled button without an enabled alternative to switch to", label: di.label, tip: di.tip, test: clip(src.slice(n.test.start, n.test.end), 140) });
      }
      return;
    }
    if (n.type === "CallExpression" && calleeName(n) === "addGatedButtonObj" &&
        n.arguments[0] && n.arguments[0].type === "ObjectExpression") {
      const props = n.arguments[0].properties;
      const prop = (k) => props.find((p) => p.type === "Property" && !p.computed &&
        ((p.key.type === "Identifier" && p.key.name === k) || (p.key.type === "Literal" && p.key.value === k)));
      const tp = prop("test");
      if (!tp) return;
      const fn = tp.value;
      let expr = null;
      if (fn.type === "ArrowFunctionExpression" && fn.expression) expr = fn.body;
      else if ((fn.type === "FunctionExpression" || fn.type === "ArrowFunctionExpression") &&
               fn.body.type === "BlockStatement" && fn.body.body.length === 1 &&
               fn.body.body[0].type === "ReturnStatement") expr = fn.body.body[0].argument;
      if (!expr || !containsPredicate(expr)) return;
      const tx = prop("text"), tt = prop("ttB");
      consider(expr, false, null, "gated button",
        { label: strVal(tx && tx.value) || "", tip: strVal(tt && tt.value) || "" });
    }
  });
  return { sites, skipped, predicateTotal };
}

function parseJS(src) {
  const base = { ecmaVersion: "latest", allowReturnOutsideFunction: true, allowHashBang: true };
  try { return acorn.parse(src, Object.assign({ sourceType: "script" }, base)); }
  catch (e) { return acorn.parse(src, Object.assign({ sourceType: "module" }, base)); }
}

// ------------------------------------------- turning sites into Replace blocks
const PYWS = /^[\s\x1c-\x1f\x85]|[\s\x1c-\x1f\x85]$/;       // what Python's strip() would eat
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const HEADER = /^(Add Javascript|Add Content|Add Boot|Add Item|Item JS|Replace|Add JS|Rep|Add C|Add B)(?:\s+\[[^\]]*\])?\s*:?\s*(?:#.*)?$/;
const WITH_LINE = /^\s*(?:With:|W:)\s*$/;
function goodText(t) {
  return t.length > 0 && !/[\r\n]/.test(t) && !PYWS.test(t) && !LONE_SURROGATE.test(t) &&
         !t.startsWith("#") && !HEADER.test(t) && !WITH_LINE.test(t);
}
// Every needle starts at one of these tokens, so only these spots need to be compared.
// They are indexed by their first KEY characters so a lookup touches only a handful of spots.
const TOKEN_RE = /pc\.(?:isTaur|isNaga|isBiped|legCount)/g;
const KEY = 24;
function tokenIndex(src) {
  const idx = new Map();
  TOKEN_RE.lastIndex = 0;
  for (let m = TOKEN_RE.exec(src); m; m = TOKEN_RE.exec(src)) {
    TOKEN_RE.lastIndex = m.index + 1;
    const k = src.substr(m.index, KEY);
    const list = idx.get(k);
    if (list) list.push(m.index); else idx.set(k, [m.index]);
  }
  return idx;
}
function occurrences(src, needle, idx) {               // start offsets, stops after 13
  const out = [];
  for (const p of idx.get(needle.substr(0, KEY)) || []) {
    if (src.startsWith(needle, p)) { out.push(p); if (out.length > 12) break; }
  }
  return out;
}
const CTX = [16, 24, 40, 64, 96, 140, 200, 280];   // every needle is at least KEY+ characters long

function buildBlocks(src, sites, tokens) {
  const byPos = new Map(sites.map((s) => [s.spanStart, s]));
  const used = new Set(), blocks = [], dropped = [];
  for (const s of sites) {
    if (used.has(s)) continue;
    const baseOld = src.slice(s.spanStart, s.spanEnd);
    const baseNew = applyEdits(src, s.spanStart, s.spanEnd, s.edits);
    let chosen = null;
    for (const ctx of CTX) {
      const tail = src.slice(s.spanEnd, s.spanEnd + ctx);
      const oldT = baseOld + tail, newT = baseNew + tail;
      if (!goodText(oldT) || !goodText(newT)) continue;
      const occ = occurrences(src, oldT, tokens);
      if (occ.length === 1) { chosen = { oldT, newT, count: 1, sites: [s] }; break; }
      if (occ.length <= 8) {
        const grp = occ.map((p) => byPos.get(p));
        if (grp.every((g) => g && !used.has(g) &&
            applyEdits(src, g.spanStart, g.spanEnd, g.edits) + src.slice(g.spanEnd, g.spanEnd + ctx) === newT)) {
          chosen = { oldT, newT, count: occ.length, sites: grp }; break;
        }
      }
    }
    if (!chosen) { dropped.push({ site: s, reason: "could not build a needle that matches only this spot" }); used.add(s); continue; }
    chosen.sites.forEach((g) => used.add(g));
    blocks.push(chosen);
  }
  return { blocks, dropped };
}

// Re-enact what KittyPatcher does (first match, in order) and compare with the intended result.
function countAfter(buf, needle, from) {               // matches at or after `from`, like Python str.count
  let n = 0;
  for (let i = buf.indexOf(needle, from); i !== -1; i = buf.indexOf(needle, i + needle.length)) n++;
  return n;
}
function verify(src, sites, blocks) {
  let expected = "", at = 0;
  for (const s of sites) { expected += src.slice(at, s.spanStart) + applyEdits(src, s.spanStart, s.spanEnd, s.edits); at = s.spanEnd; }
  expected += src.slice(at);
  let cur = Buffer.from(src, "utf8");
  const bad = new Set();
  for (const b of blocks) {
    const oldB = Buffer.from(b.oldT, "utf8"), newB = Buffer.from(b.newT, "utf8");
    for (let i = 0; i < b.count; i++) {
      const first = cur.indexOf(oldB);
      if (first === -1) { b.sites.forEach((x) => bad.add(x)); continue; }
      const total = countAfter(cur, oldB, first);
      if (total !== b.count - i || total > 8) b.sites.forEach((x) => bad.add(x));
      cur = Buffer.concat([cur.subarray(0, first), newB, cur.subarray(first + oldB.length)]);
    }
  }
  const same = Buffer.from(expected, "utf8").equals(cur);
  return { ok: bad.size === 0 && same, bad, expected };
}

function sanitize(s, n) { return clip(s, n).replace(/#/g, "＃"); }

// ------------------------------------------------------------------ main
function loadGameFiles() {
  if (!fs.existsSync(APP)) { console.error("Game folder not found: " + APP); process.exit(1); }
  const found = [];
  for (const name of fs.readdirSync(APP).sort()) {
    if (!name.endsWith(".js")) continue;
    const backup = BACKUP ? path.join(BACKUP, name) : null;
    const useBackup = !!backup && isFile(backup);
    const text = fs.readFileSync(useBackup ? backup : path.join(APP, name), "utf8").replace(/\r\n?/g, "\n");
    found.push({ name, text, backup: useBackup });
  }
  return found;
}
function targetName(name) {
  const m = /^(.+)\.[a-fA-F0-9]{8,}\.(js|css)$/.exec(name);
  return m ? m[1] + "." + m[2] : name;
}

let lastTick = Date.now();
function tick(what) {
  if (!opts.timing) return;
  const now = Date.now();
  console.log("    [" + ((now - lastTick) / 1000).toFixed(1) + "s] " + what);
  lastTick = now;
}

function main() {
  const files = loadGameFiles();
  console.log("Scanning " + files.length + " game scripts in " + APP);
  const perFile = [], allSkipped = [], allDropped = [];
  let totalPredicates = 0;

  for (const f of files) {
    if (!/pc\.(isTaur|isNaga|isBiped|legCount)/.test(f.text)) continue;
    let res;
    try { res = scanFile(f.name, f.text); }
    catch (e) {
      console.error("  " + f.name + ": could not parse (" + e.message + "); skipped");
      continue;
    }
    tick(f.name + ": parsed and scanned");
    totalPredicates += res.predicateTotal;
    let sites = res.sites.filter((s) => {
      const hay = s.label + " | " + s.tip + " | " + s.testSrc;
      if (opts.skip.some((r) => r.test(hay))) { allDropped.push({ site: s, reason: "excluded by --skip" }); return false; }
      return true;
    });
    sites.sort((a, b) => a.spanStart - b.spanStart);
    // Gates that overlap each other can't both be edited safely.
    const clean = [];
    for (const s of sites) {
      const prev = clean[clean.length - 1];
      if (prev && s.spanStart < prev.spanEnd) allDropped.push({ site: s, reason: "overlaps another gate" });
      else clean.push(s);
    }
    sites = clean;

    const tokens = tokenIndex(f.text);
    let blocks = [], verified = null;
    for (let pass = 0; pass < 6; pass++) {
      const built = buildBlocks(f.text, sites, tokens);
      built.dropped.forEach((d) => allDropped.push(d));
      sites = sites.filter((s) => !built.dropped.some((d) => d.site === s));
      blocks = built.blocks;
      if (!blocks.length) break;
      tick(f.name + ": needles built (" + blocks.length + ")");
      const v = verify(f.text, sites, blocks);
      tick(f.name + ": simulated the patcher");
      if (v.ok) { verified = v; break; }
      if (v.bad.size === 0) { allDropped.push(...sites.map((s) => ({ site: s, reason: "verification mismatch" }))); sites = []; blocks = []; break; }
      sites.forEach((s) => { if (v.bad.has(s)) allDropped.push({ site: s, reason: "verification: patcher would edit the wrong spot" }); });
      sites = sites.filter((s) => !v.bad.has(s));
      blocks = [];
    }
    if (!verified) { blocks = []; sites = []; }
    // Make sure the edited script is still valid JavaScript.
    if (verified) {
      try { parseJS(verified.expected); }
      catch (e) { console.error("  " + f.name + ": patched copy does not parse (" + e.message + "); file left out"); blocks = []; sites = []; }
      tick(f.name + ": patched copy parses");
    }
    res.skipped.forEach((s) => allSkipped.push(s));
    perFile.push({ file: f, blocks, sites });
    console.log("  " + f.name + (f.backup ? " [clean backup]" : "") + ": " + sites.length + " gate(s)");
  }

  const gateTotal = perFile.reduce((n, p) => n + p.sites.length, 0);
  const edited = perFile.reduce((n, p) => n + p.sites.reduce((m, s) => m + s.edits.length, 0), 0);

  // -------- the .mod file
  const out = [];
  out.push("# Generated by taur_gate_scan.js on " + new Date().toISOString().slice(0, 10) + ". Do not edit by hand; re-run the scanner instead.");
  out.push("# Each block below opens ONE button that the game greys out for taur / naga / non-biped bodies.");
  out.push("# Scene text and taur-aware scenes are not touched. The switch lives in the Mod Menu (taur_naga_bypass.mod).");
  out.push("# To keep one gate closed, delete its block (or re-run with --skip \"part of its tooltip\").");
  out.push("");
  for (const p of perFile) {
    if (!p.blocks.length) continue;
    const target = targetName(p.file.name);
    out.push("# ===== " + target + " (" + p.sites.length + " gates) =====");
    for (const b of p.blocks) {
      const s = b.sites[0];
      out.push("# " + sanitize(s.label || "(button)", 60) + " - " + sanitize(s.tip || s.testSrc, 110) + (b.count > 1 ? "  [x" + b.count + "]" : ""));
      for (let i = 0; i < b.count; i++) {
        out.push("Replace [" + target + "]");
        out.push(b.oldT);
        out.push("With:");
        out.push(b.newT);
        out.push("");
      }
    }
  }
  out.push("Add Javascript");
  out.push("window.tnTaurNagaGateCount = " + gateTotal + ";");
  out.push("");

  // -------- the log
  const bySkip = {};
  allSkipped.forEach((s) => { bySkip[s.reason] = (bySkip[s.reason] || 0) + 1; });
  const log = [];
  log.push("taur_gate_scan report");
  log.push("gates changed: " + gateTotal + "   body checks rewritten: " + edited);
  log.push("other pc.isTaur/isNaga/isBiped calls left untouched (scene text, taur-aware scenes, ...): " + (totalPredicates - perFile.reduce((n, p) => n + p.sites.reduce((m, s) => m + s.edits.filter((e) => e.type === "call").length, 0), 0)));
  log.push("");
  log.push("== CHANGED ==");
  for (const p of perFile) for (const s of p.sites) log.push("[" + targetName(p.file.name) + "] " + (s.label || "(no label)") + " | " + clip(s.tip, 120) + " | test: " + clip(s.testSrc, 120));
  log.push("");
  log.push("== LEFT ALONE: looked like a body check near a button, but not safe to change ==");
  for (const [r, n] of Object.entries(bySkip)) log.push("  " + n + " x " + r);
  for (const s of allSkipped) log.push("[" + targetName(s.file) + "] " + (s.label || "(no label)") + " | " + clip(s.tip, 100) + " | test: " + s.test + "  -> " + s.reason);
  log.push("");
  log.push("== DROPPED ==");
  for (const d of allDropped) log.push("[" + targetName(d.site.file) + "] " + (d.site.label || "(no label)") + " | " + clip(d.site.tip, 100) + "  -> " + d.reason);

  // -------- console summary
  console.log("");
  console.log("Gates opened up: " + gateTotal + " (" + edited + " body checks rewritten)");
  console.log("Left alone, not safe to change: " + allSkipped.length + (allSkipped.length ? "  (see the log)" : ""));
  if (allDropped.length) console.log("Dropped: " + allDropped.length + "  (see the log)");
  if (opts.list) { console.log(""); perFile.forEach((p) => p.sites.forEach((s) => console.log("  [" + targetName(p.file.name) + "] " + (s.label || "(no label)") + " | " + clip(s.tip, 90)))); }

  if (opts.dryRun) { console.log("\nDry run: nothing written."); return; }
  fs.mkdirSync(MODS, { recursive: true });
  fs.mkdirSync(LOGS, { recursive: true });
  fs.writeFileSync(path.join(MODS, OUT_NAME), out.join("\n"), "utf8");
  fs.writeFileSync(path.join(LOGS, "GateScan.txt"), log.join("\n") + "\n", "utf8");
  console.log("\nWrote " + path.join(MODS, OUT_NAME));
  console.log("Wrote " + path.join(LOGS, "GateScan.txt") + "  (every gate changed, and everything left alone, with reasons)");
  console.log("Next: run KittyPatcher as usual.");
}

if (require.main === module) {
  setup().then(main).catch((e) => { console.error(e && e.stack || e); process.exit(1); });
} else {
  // taur_gate_folders.js uses these to show and change the saved folders.
  module.exports = { QUESTIONS, OUT_QUESTION, SETTINGS_FILE, loadSettings, saveSettings, askUntilValid, askOutName, makeAsker };
}
