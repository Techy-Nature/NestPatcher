#!/usr/bin/env node
"use strict";
/*
 * sex_scene_scan_v2.9.js  -  companion to TN_SexGallery_v2.9.js (the Sex Scene Gallery mod).
 *
 * What it does
 *   Reads the game's clean scripts (the backup folder first, then the live files), parses
 *   them with acorn.js, and finds every sex scene: a scene is a game function that makes
 *   someone orgasm (pc.orgasm(), kiro.orgasm(), ...) and prints scene text with output().
 *   Scenes that reach orgasm through a small helper function count too.
 *
 *   For each scene it works out
 *     - who it is with (showName / showBust / the NPC the scene talks to),
 *     - where it is (the content file: Tavros, Mhen'ga, New Texas, ...),
 *     - the button that starts it and that button's tooltip,
 *     - who wrote it (author("...")),
 *     - what happens in it (tags such as Vaginal, Anal, Oral, Taur),
 *     - a short summary,
 *     - a few unique bits of its text, so the gallery can tell when you have seen it
 *       (scenes whose text is mostly inside if/else branches get up to ten),
 *     - the save flags it sets (flags.X++, IncrementFlag("X")) that nothing else sets, so a
 *       loaded save can unlock scenes played before the gallery was installed.
 *
 *   It writes all of that to TN_SexGalleryScenes_v2.9.js in your mods folder. That file is
 *   the gallery's scene list, so keep it in enabled.txt next to TN_SexGallery_v2.9.js.
 *   The pack already ships one made from TiTS 0.9.168. Run this again after a game update.
 *
 * Where things are
 *   The first time you run it, it asks where each thing lives (acorn.js, the game's www
 *   folder, the clean backup folder, the mods folder, the logs folder). Answers are saved
 *   in sex_scene_scan.settings.json next to this script and reused on later runs.
 *   Press Enter at a question to keep the value shown in [brackets].
 *
 * Usage
 *   node sex_scene_scan_v2.9.js              scan, using the saved folders
 *   node sex_scene_scan_v2.9.js --setup      ask for every folder again
 *   node sex_scene_scan_v2.9.js --dry-run    only report, write nothing
 *   node sex_scene_scan_v2.9.js --list       also print every scene it found
 *   node sex_scene_scan_v2.9.js --out NAME   output file name (saved for next time)
 *   node sex_scene_scan_v2.9.js --project DIR    suggest DIR/extracted/apk/assets/www, DIR/mods, ...
 *   node sex_scene_scan_v2.9.js --settings FILE  use a different settings file
 *   node sex_scene_scan_v2.9.js --game DIR --acorn FILE --mods DIR --logs DIR --backup DIR|none
 *                                            give the folders on the command line (no questions)
 *   If node runs out of memory on the biggest file:
 *   node --max-old-space-size=3072 sex_scene_scan_v2.9.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const crypto = require("crypto");

const SCANNER_VERSION = "2.9";
const DEFAULT_OUT = "TN_SexGalleryScenes_v2.9.js";
let acorn;

// ---------------------------------------------------------------- options
function usage() {
  console.log("Usage: node sex_scene_scan_v2.9.js [--setup] [--dry-run] [--list] [--out NAME] [--settings FILE] [--project DIR]\n" +
              "       [--game DIR] [--acorn FILE] [--mods DIR] [--logs DIR] [--backup DIR|none]");
}
const opts = { dryRun: false, list: false, setup: false, out: null, project: null, settings: null, given: {} };
const argv = require.main === module ? process.argv.slice(2) : [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--dry-run") opts.dryRun = true;
  else if (a === "--list") opts.list = true;
  else if (a === "--setup") opts.setup = true;
  else if (a === "--out") opts.out = argv[++i];
  else if (a === "--project") opts.project = argv[++i];
  else if (a === "--settings") opts.settings = argv[++i];
  else if (/^--(game|acorn|mods|logs|backup)$/.test(a)) opts.given[a.slice(2)] = argv[++i];
  else if (a === "-h" || a === "--help") { usage(); process.exit(0); }
  else { console.error("Unknown option: " + a); usage(); process.exit(1); }
}
for (const k of ["out", "project", "settings"]) {
  if (opts[k] === undefined) { console.error("--" + k + " needs a value"); usage(); process.exit(1); }
}
for (const k in opts.given) {
  if (opts.given[k] === undefined) { console.error("--" + k + " needs a value"); usage(); process.exit(1); }
}

// ------------------------------------------------------- folders and settings
const SETTINGS_FILE = opts.settings ? path.resolve(opts.settings) : path.join(__dirname, "sex_scene_scan.settings.json");
let APP, MODS, BACKUP, LOGS, OUT_NAME;

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
function saveSettings(s) { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2) + "\n", "utf8"); }

const QUESTIONS = [
  {
    key: "acorn", what: "acorn.js (the file, or the folder it is in)",
    guess: () => path.join(__dirname, "acorn.js"),
    fix: (v) => isDir(v) ? (isFile(path.join(v, "acorn.js")) ? path.join(v, "acorn.js") : v) : v,
    check: (v) => {
      if (!isFile(v) && !isDir(v)) return "No file at " + v;
      try { require(v).parse("1", { ecmaVersion: "latest" }); return ""; }
      catch (e) { return "That is not a working acorn.js (" + e.message + ")"; }
    },
  },
  {
    key: "game", what: "the game's www folder (holds main.<hash>.js)",
    guess: (p) => path.join(p, "extracted", "apk", "assets", "www"),
    check: (v) => {
      if (!isDir(v)) return "No folder at " + v;
      if (!fs.readdirSync(v).some((n) => /^main\..*\.js$/.test(n) || n === "main.js")) return "No main.<hash>.js in " + v;
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
    key: "mods", what: "the mods folder (the scene list is written here)",
    guess: (p) => path.join(p, "mods"),
    check: (v) => isDir(v) ? "" : "No folder at " + v,
  },
  {
    key: "logs", what: "the logs folder (SexSceneScan.txt is written here)",
    guess: (p) => path.join(p, "mods", "logs"),
    check: (v) => isDir(v) || isDir(path.dirname(v)) ? "" : "No folder at " + v + " or above it",
  },
];

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
  let ask = null;
  const getAsk = () => {
    if (!ask) ask = makeAsker();
    if (!ask) {
      console.error("The scanner needs to ask where your files are, but it is not running in a terminal.");
      console.error("Run it once in Termux, give the folders with --game/--acorn/--mods/--logs/--backup,");
      console.error("or fill in " + SETTINGS_FILE + " by hand.");
      process.exit(1);
    }
    return ask;
  };
  const result = {};
  let changed = false;
  if (opts.setup) console.log("Setup: press Enter to keep the value in [brackets].\n");
  for (const q of QUESTIONS) {
    if (opts.given[q.key] !== undefined) {
      let v = cleanPath(opts.given[q.key]);
      if (q.fix) v = q.fix(v, opts.given[q.key]);
      const err = q.check(v);
      if (err) { console.error("--" + q.key + ": " + err); process.exit(1); }
      result[q.key] = v;
      if (v !== saved[q.key]) changed = true;
      continue;
    }
    const value = saved[q.key];
    if (value && !opts.setup && !q.check(value)) { result[q.key] = value; continue; }
    if (value && !opts.setup) console.log("Saved location for " + q.what + " no longer works: " + q.check(value));
    result[q.key] = await askUntilValid(getAsk(), q, value || q.guess(base));
    changed = true;
  }
  let outName = path.basename(opts.out || saved.out || DEFAULT_OUT);
  // an older scanner's default name moves up to this version's
  if (!opts.out && /^TN_SexGalleryScenes_v[\d.]+\.js$/.test(outName)) outName = DEFAULT_OUT;
  if (!/\.js$/i.test(outName)) outName += ".js";
  if (outName !== saved.out) changed = true;
  result.out = outName;
  if (ask) ask.close();
  if (changed && !opts.dryRun) {
    saveSettings(result);
    console.log("\nSaved to " + SETTINGS_FILE + " (run with --setup to change).\n");
  }
  acorn = require(result.acorn);
  APP = result.game;
  BACKUP = result.backup === "none" ? null : result.backup;
  MODS = result.mods;
  LOGS = result.logs;
  OUT_NAME = result.out;
  console.log("Game:   " + APP);
  console.log("Backup: " + (BACKUP || "(none, scanning live files)"));
  console.log("Output: " + path.join(MODS, OUT_NAME));
  console.log("Log:    " + path.join(LOGS, "SexSceneScan.txt") + "\n");
}

// ------------------------------------------------------------ which files
// main.<hash>.js and content_<area>.<hash>.js. The backup copy wins, because the live
// files may already carry text from other mods.
const AREA_NAMES = {
  main: "Various", first14: "Tavros (early game)", tavros: "Tavros", mhenga: "Mhen’ga", tarkus: "Tarkus",
  new_texas: "New Texas", myrellion: "Myrellion", zhengshi: "Zheng Shi", uveto: "Uveto", gastigoth: "Gastigoth",
  phaedra: "Phaedra", dhaal: "Dhaal", vesperia: "Vesperia / Canadia", poea: "Poe A", follower: "Crew & followers",
};
function areaOf(file) {
  const m = /^(main|content_([a-z0-9_]+?))(\.[0-9a-f]+)?\.js$/i.exec(file);
  if (!m) return null;
  return m[1] === "main" ? "main" : m[2];
}
function areaLabel(area) {
  if (AREA_NAMES[area]) return AREA_NAMES[area];
  return area.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function gameFiles() {
  const out = [];
  const names = fs.readdirSync(APP).filter((n) => areaOf(n));
  for (const n of names.sort()) {
    let p = path.join(APP, n);
    if (BACKUP && isFile(path.join(BACKUP, n))) p = path.join(BACKUP, n);
    out.push({ name: n, area: areaOf(n), path: p });
  }
  return out;
}
function gameVersion(files) {
  for (const f of files) {
    if (f.area !== "main") continue;
    const s = fs.readFileSync(f.path, "utf8");
    const m = /exports=\{i8:"(\d+\.\d+\.\d+)"\}/.exec(s) || /version\s*[:=]\s*["'](0\.\d+\.\d+)/.exec(s);
    return m ? m[1] : "";
  }
  return "";
}

// ---------------------------------------------------------------- parsing
const FUNC = new Set(["FunctionExpression", "ArrowFunctionExpression", "FunctionDeclaration"]);
const COND = new Set(["ConditionalExpression", "IfStatement", "LogicalExpression", "SwitchCase"]);
const BUTTON_RE = /^add(Ghost|Item|Override)?Button$/;
const NOT_NPC = new Set([
  "pc", "flags", "ui", "parser", "Math", "window", "GLOBAL", "kGAMECLASS", "this", "console", "document", "JSON",
  "Object", "Array", "String", "Number", "chars", "shipLocation", "rooms", "currentLocation", "Reflect", "Boolean",
  "Promise", "Date", "arguments", "self", "pc_ship", "StatTracking", "CodexManager", "MailManager", "ChildManager",
  "inventory", "player", "game", "storage", "location", "navigator", "localStorage", "setTimeout", "util", "utils",
]);
const NPC_METHODS = new Set([
  "orgasm", "loadInCunt", "loadInAss", "loadInMouth", "loadInNipples", "loadInPussy", "show", "showBust", "showAll",
  "cumQ", "hasCock", "hasVagina", "cockVolume", "biggestCockLength", "isPregnant", "lust", "changeLust", "milkQ",
]);

function parse(src) {
  const base = { ecmaVersion: "latest", allowHashBang: true, allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true };
  try { return acorn.parse(src, Object.assign({ sourceType: "script" }, base)); }
  catch (e) { return acorn.parse(src, Object.assign({ sourceType: "module" }, base)); }
}

function childNodes(n, out) {
  for (const k in n) {
    if (k === "type" || k === "start" || k === "end" || k === "loc" || k === "range") continue;
    const v = n[k];
    if (v === null || typeof v !== "object") continue;
    if (Array.isArray(v)) {
      for (let i = v.length - 1; i >= 0; i--) { const c = v[i]; if (c && typeof c.type === "string") out.push(c); }
    } else if (typeof v.type === "string") out.push(v);
  }
}

function strArg(n) {
  if (!n) return null;
  if (n.type === "Literal" && typeof n.value === "string") return n.value;
  if (n.type === "TemplateLiteral" && n.expressions.length === 0) return n.quasis[0].value.cooked;
  return null;
}
function calleeName(c) {
  if (!c) return "";
  if (c.type === "Identifier") return c.name;
  if (c.type === "MemberExpression" && !c.computed && c.property.type === "Identifier") return c.property.name;
  // (0, x.fn)(...) as webpack writes it
  if (c.type === "SequenceExpression" && c.expressions.length) return calleeName(c.expressions[c.expressions.length - 1]);
  return "";
}
// flags.NAME or flags["NAME"]
function flagName(n) {
  if (!n || n.type !== "MemberExpression" || n.object.type !== "Identifier" || n.object.name !== "flags") return "";
  if (!n.computed && n.property.type === "Identifier") return n.property.name;
  if (n.computed) return strArg(n.property) || "";
  return "";
}
function isEmptyValue(n) {
  if (!n) return true;
  if (n.type === "Literal") return n.value === 0 || n.value === false || n.value === null || n.value === "";
  if (n.type === "Identifier") return n.name === "undefined";
  if (n.type === "UnaryExpression") return n.operator === "void" || (n.operator === "!" && n.argument.type === "Literal" && n.argument.value === 1);
  return false;
}
function readableName(name) {
  if (!name || name.length < 4 || /^[a-z]{1,2}\d*$/i.test(name)) return "";
  return name;
}

/*
 * One pass over a file. For every function it records:
 *   texts:    string pieces printed with output() (cond = inside an if/ternary/&&/||)
 *   orgasm:   how many .orgasm(...) calls it makes itself
 *   names, busts, authors, npcRefs, buttons it adds, functions it calls by name
 */
function scanFile(file, src, ctx) {
  const ast = parse(src);
  const fns = [];
  const info = new Map();        // fn node -> record
  const scopeDecls = new Map();  // fn node or Program -> Map(name -> fn node)
  const methods = new Map();     // class method / object key name -> [fn nodes]
  const pendingRefs = [];        // { name, scopes, kind, rec, button }

  function rec(fn) {
    let r = info.get(fn);
    if (!r) {
      r = { fn, file: file.name, area: file.area, start: fn.start, end: fn.end, texts: [], orgasm: 0, names: [], busts: [], allBusts: [],
            authors: [], flags: [], setFlags: [], orgasmTags: new Set(), caseCallers: new Map(), npc: new Map(), calls: [], buttons: [], parent: null, readable: "", triggers: [] };
      info.set(fn, r);
      fns.push(r);
    }
    return r;
  }
  function declare(scope, name, fn) {
    let m = scopeDecls.get(scope);
    if (!m) { m = new Map(); scopeDecls.set(scope, m); }
    if (!m.has(name)) m.set(name, fn);
  }

  // Iterative walk. Each stack entry carries: node, fn stack (array of fn nodes), cond depth, output depth
  const stack = [{ n: ast, fnStack: [ast], cond: 0, out: 0, tag: "" }];
  while (stack.length) {
    const it = stack.pop();
    const n = it.n;
    let fnStack = it.fnStack;
    let cond = it.cond;
    let out = it.out;
    let tag = it.tag;
    const curFn = fnStack[fnStack.length - 1];

    if (FUNC.has(n.type)) {
      const r = rec(n);
      if (curFn !== ast) r.parent = info.get(curFn) || null;
      if (n.type === "FunctionDeclaration" && n.id) declare(curFn, n.id.name, n);
      if (n.id && !r.readable) r.readable = readableName(n.id.name);
      fnStack = fnStack.concat([n]);
      cond = 0;
      out = 0;
      tag = "";
    } else if (n.type === "SwitchStatement" && n.discriminant.type === "Identifier" && curFn !== ast &&
               (curFn.params || []).some((p) => p.type === "Identifier" && p.name === n.discriminant.name) &&
               n.cases.some((c) => c.test && strArg(c.test))) {
      // one function, several scenes: switch (which) { case "ride him": ... case "power bottom": ... }
      stack.push({ n: n.discriminant, fnStack, cond, out, tag });
      for (let i = n.cases.length - 1; i >= 0; i--) {
        const c = n.cases[i];
        const v = c.test ? strArg(c.test) : null;
        const kids = c.consequent.slice().reverse();
        for (const k of kids) stack.push({ n: k, fnStack, cond: v ? cond : cond + 1, out, tag: v ? v : tag });
      }
      continue;
    } else if (n.type === "VariableDeclarator" && n.id && n.id.type === "Identifier" && n.init && FUNC.has(n.init.type)) {
      declare(curFn, n.id.name, n.init);
    } else if (n.type === "Property" || n.type === "MethodDefinition") {
      // babel classes: {key:"name", value:function(){}} ; objects: {name: function(){}}
      const v = n.value;
      const keyName = n.key && (n.key.type === "Identifier" ? n.key.name : (typeof n.key.value === "string" ? n.key.value : ""));
      if (v && FUNC.has(v.type) && keyName && keyName !== "value") {
        const r = rec(v);
        if (!r.readable) r.readable = readableName(keyName);
        if (!methods.has(keyName)) methods.set(keyName, []);
        methods.get(keyName).push(v);
      }
    } else if (n.type === "ObjectExpression" && n.properties.length >= 2) {
      // {key:"fooScene", value:function(){...}}
      let k = null, v = null;
      for (const p of n.properties) {
        if (p.type !== "Property" || !p.key) continue;
        const kn = p.key.type === "Identifier" ? p.key.name : p.key.value;
        if (kn === "key") k = strArg(p.value);
        else if (kn === "value" && p.value && FUNC.has(p.value.type)) v = p.value;
      }
      if (k && v) {
        const r = rec(v);
        if (!r.readable) r.readable = readableName(k);
        if (!methods.has(k)) methods.set(k, []);
        methods.get(k).push(v);
      }
    } else if (n.type === "AssignmentExpression" && n.right && FUNC.has(n.right.type) && n.left.type === "MemberExpression" &&
               !n.left.computed && n.left.property.type === "Identifier") {
      const r = rec(n.right);
      if (!r.readable) r.readable = readableName(n.left.property.name);
      if (n.left.object.type === "Identifier" && n.left.object.name === "window") ctx.globals.set(n.left.property.name, n.right);
    } else if ((n.type === "AssignmentExpression" || n.type === "UpdateExpression") && curFn !== ast &&
               flagName(n.type === "UpdateExpression" ? n.argument : n.left)) {
      // flags.ANNO_SEXED++, flags.X = 1, flags.X += 1: what a scene leaves behind in the save
      // (setting a flag to 0 / false / undefined is a reset, not a sign the scene was played)
      if (!(n.type === "AssignmentExpression" && n.operator === "=" && isEmptyValue(n.right))) {
        rec(curFn).setFlags.push({ s: flagName(n.type === "UpdateExpression" ? n.argument : n.left), tag });
      }
    } else if (COND.has(n.type)) {
      cond++;
    } else if (n.type === "CallExpression") {
      const name = calleeName(n.callee);
      const r = curFn === ast ? null : rec(curFn);
      if (name === "output") {
        // literals inside output(...) are scene text; nested calls (pc.cockDescript()) are not
        if (r) {
          const parts = n.arguments.slice(0, 1);
          const work = parts.map((p) => ({ p, c: cond }));
          while (work.length) {
            const w = work.pop();
            const p = w.p;
            if (!p) continue;
            const s = strArg(p);
            if (s !== null) { r.texts.push({ s, cond: w.c > 0, at: p.start, tag }); continue; }
            if (p.type === "TemplateLiteral") { for (const q of p.quasis) r.texts.push({ s: q.value.cooked || "", cond: w.c > 0, at: q.start, tag }); continue; }
            if (p.type === "BinaryExpression" && p.operator === "+") { work.push({ p: p.right, c: w.c }); work.push({ p: p.left, c: w.c }); continue; }
            if (p.type === "ConditionalExpression") { work.push({ p: p.alternate, c: w.c + 1 }); work.push({ p: p.consequent, c: w.c + 1 }); continue; }
            if (p.type === "LogicalExpression") { work.push({ p: p.right, c: w.c + 1 }); continue; }
            if (p.type === "CallExpression" && /^(concat)$/.test(calleeName(p.callee))) { for (const a of p.arguments) work.push({ p: a, c: w.c }); continue; }
          }
        }
      } else if (name === "orgasm" && n.callee.type === "MemberExpression") {
        if (r) {
          r.orgasm++;
          r.orgasmTags.add(tag);
          const o = n.callee.object;
          if (o.type === "Identifier" && o.name !== "pc" && !NOT_NPC.has(o.name) && o.name.length >= 3) r.npc.set(o.name, (r.npc.get(o.name) || 0) + 3);
          if (o.type === "MemberExpression" && !o.computed && o.object.type === "Identifier" && o.object.name === "chars" && o.property.type === "Identifier") {
            r.npc.set(o.property.name.toLowerCase(), (r.npc.get(o.property.name.toLowerCase()) || 0) + 3);
          }
        }
      } else if (name === "showName" && r) {
        const s = strArg(n.arguments[0]); if (s) r.names.push(s);
      } else if (name === "showBust" && r) {
        const s = strArg(n.arguments[0]); if (s) r.busts.push(s);
        for (const a of n.arguments) { const b = strArg(a); if (b) r.allBusts.push(b); }
      } else if ((name === "IncrementFlag" || name === "incrementFlag") && r) {
        const s = strArg(n.arguments[0]); if (s) { r.flags.push({ s, tag }); r.setFlags.push({ s, tag }); }
      } else if (name === "author" && r) {
        const s = strArg(n.arguments[0]); if (s) r.authors.push(s);
      } else if (BUTTON_RE.test(name) && n.arguments.length >= 3) {
        const label = strArg(n.arguments[1]);
        const target = n.arguments[2];
        const tip = strArg(n.arguments[5]) || "";
        const tipHead = strArg(n.arguments[4]) || "";
        const button = { label: label || "", tip, tipHead, from: r };
        if (label) {
          if (target && FUNC.has(target.type)) { rec(target).triggers.push(button); }
          else if (target && target.type === "Identifier") pendingRefs.push({ name: target.name, scopes: fnStack.slice(), kind: "button", button });
          else if (target && target.type === "MemberExpression" && !target.computed && target.property.type === "Identifier") {
            pendingRefs.push({ name: target.property.name, scopes: null, kind: "button", button, member: true,
                               obj: target.object.type === "Identifier" ? target.object.name : "" });
          }
        }
      }
      if (r && !BUTTON_RE.test(name) && name !== "output") {
        for (const a of n.arguments) {
          if (a && a.type === "Identifier" && a.name.length <= 3) pendingRefs.push({ name: a.name, scopes: fnStack.slice(), kind: "call", rec: r, arg: null, soft: true });
        }
      }
      if (r && n.callee.type === "Identifier" && !BUTTON_RE.test(name)) {
        pendingRefs.push({ name: n.callee.name, scopes: fnStack.slice(), kind: "call", rec: r, arg: strArg(n.arguments[0]) });
      } else if (r && n.callee.type === "MemberExpression" && !n.callee.computed && n.callee.property.type === "Identifier" && !BUTTON_RE.test(name)) {
        const o = n.callee.object;
        const m = n.callee.property.name;
        if (o.type === "Identifier" && !NOT_NPC.has(o.name) && o.name.length >= 3 && NPC_METHODS.has(m)) {
          r.npc.set(o.name, (r.npc.get(o.name) || 0) + 1);
        }
        if (o.type === "ThisExpression" || (o.type === "Identifier" && o.name.length <= 2)) {
          pendingRefs.push({ name: m, scopes: null, kind: "call", rec: r, member: true, arg: strArg(n.arguments[0]) });
        }
      }
    }

    const kids = [];
    childNodes(n, kids);
    for (const c of kids) stack.push({ n: c, fnStack, cond, out, tag });
  }

  // Resolve names now that every declaration is known.
  function resolve(ref) {
    if (ref.member) {
      const list = methods.get(ref.name);
      return list && list.length === 1 ? list[0] : (list && list.length > 1 && ref.kind === "call" ? null : (list ? list[0] : null));
    }
    for (let i = ref.scopes.length - 1; i >= 0; i--) {
      const m = scopeDecls.get(ref.scopes[i]);
      if (m && m.has(ref.name)) return m.get(ref.name);
    }
    return ctx.globals.get(ref.name) || null;
  }
  for (const ref of pendingRefs) {
    const fn = resolve(ref);
    if (!fn) continue;
    const target = info.get(fn) || rec(fn);
    if (ref.kind === "button") target.triggers.push(ref.button);
    else if (ref.kind === "call" && target !== ref.rec) {
      ref.rec.calls.push(target);
      if (ref.arg) {
        if (!target.caseCallers.has(ref.arg)) target.caseCallers.set(ref.arg, []);
        target.caseCallers.get(ref.arg).push(ref.rec);
      }
    }
  }

  // drop the AST, keep the records
  for (const r of fns) r.fn = null;
  return fns;
}

// ------------------------------------------------------------- choosing scenes
function hashId(s) { return crypto.createHash("sha1").update(s).digest("hex").slice(0, 10); }

const TAGS = [
  ["Vaginal", /\b(pussy|cunt|vagina|snatch|slit|labia|clit|womb|\[pc\.vagina|\[pc\.cunt|\[pc\.pussy)/i],
  ["Anal", /\b(anus|asshole|butthole|rectum|tailhole|pucker|\[pc\.asshole|anal)\b/i],
  ["Oral", /\b(blowjob|blow-job|suck(s|ing|ed)? (on )?(your|her|his|its|their|the|my)|cunnilingus|lick(s|ing|ed)? (your|her|his|its|their|at)|deepthroat|throat(ing|s)? (your|her|his)|facefuck|face-fuck|eat(s|ing)? (you|her|him|them) out|lips around)/i],
  ["Titfuck", /\b(titfuck|tit-fuck|titty ?fuck|paizuri|between (your|her|his|their) (breasts|tits|boobs))/i],
  ["Handjob", /\b(handjob|hand-job|jerk(s|ing|ed)? (you|him|her|it) off|stroke(s|ing)? your (cock|dick|\[pc\.cock))/i],
  ["Tentacles", /\btentacle/i],
  ["Toys", /\b(dildo|vibrator|strap-on|strapon|sex toy|hardlight)/i],
  ["Bondage", /\b(bondage|restrain|shackle|handcuff|rope(s|d)? (you|her|him)|tied up|bound (to|and))/i],
  ["Group", /\b(threesome|foursome|orgy|gangbang|gang-bang|both of them|the two of them)\b/i],
  ["Breeding", /\b(breed(ing)?|knock(ed)? (you|her) up|impregnat|fertil)/i],
  ["Lactation", /\b(lactat|milking|milks? (you|her)|\[pc\.milk)/i],
  ["Taur", /\b(isTaur|taur(s)?\b|tauric|hindquarters|horse-half)/i],
  ["Naga", /\b(isNaga|naga|coils)\b/i],
  ["Solo", /\b(masturbat|fap|by yourself|alone with your)/i],
];

function cleanText(s) {
  return String(s || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\[pc\.name\]/gi, "Steele")
    .replace(/\[([a-z0-9_]+)\.([a-zA-Z]+)[^\]]*\]/g, (m, who, what) => who === "pc" ? "your " + what.replace(/([A-Z])/g, " $1").toLowerCase().replace(/ (descript|noun|short|simple|random)$/, "") : "…")
    .replace(/\[[^\]]*\]/g, "…")
    .replace(/\[[^\]]*$/, "…")
    .replace(/\s+/g, " ")
    .trim();
}
function firstSentences(s, max) {
  s = cleanText(s);
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("” "));
  if (stop > max * 0.5) return cut.slice(0, stop + 1);
  return cut.replace(/\s+\S*$/, "") + "…";
}
const TAG_WORDS = {
  Vaginal: "vaginal sex", Anal: "anal", Oral: "oral", Titfuck: "a titfuck", Handjob: "a handjob", Tentacles: "tentacles",
  Toys: "toys", Bondage: "bondage", Group: "more than two people", Breeding: "breeding", Lactation: "milk",
  Taur: "taur bodies", Naga: "naga coils", Solo: "just you",
};
function listWords(a) {
  if (a.length <= 1) return a.join("");
  return a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
}
// "Tooltip text. A scene with Khorgan in Gastigoth: vaginal sex, bondage and breeding."
function describe(npc, area, tags, tip) {
  const place = areaLabel(area);
  const where = area === "main" ? "" : (area === "follower" ? " with your crew" : " in " + place);
  const who = npc ? "with " + npc : "";
  const words = tags.filter((t) => t !== "Taur" && t !== "Naga").map((t) => TAG_WORDS[t]).filter(Boolean);
  let line = "A scene " + (who ? who : "") + (where && !(area === "follower" && who) ? where : "") ;
  line = line.replace(/\s+/g, " ").trim();
  if (line === "A scene") line = "A sex scene";
  line += words.length ? ", with " + listWords(words) + "." : ".";
  if (tags.includes("Taur") || tags.includes("Naga")) line += " Has text for " + listWords(tags.filter((t) => t === "Taur" || t === "Naga").map((t) => t.toLowerCase() + "s")) + ".";
  if (tip) {
    tip = tip.trim();
    if (!/[.!?”…]$/.test(tip)) tip += ".";
    return tip + " " + line;
  }
  return line;
}
function titleCase(name) {
  return name.replace(/^the /i, "").replace(/(^|[\s-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
}
function wordsFromCamel(name) {
  return name.replace(/_/g, " ").replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/\s+/g, " ").trim()
    .replace(/^./, (c) => c.toUpperCase());
}

// A fingerprint is a 34-48 character piece of a scene's own text. Only text pieces that
// appear exactly once in the whole game are used, so a match means that scene.
function pickFingerprints(texts, literalCount, max) {
  const sorted = texts.slice().sort((a, b) => (a.cond - b.cond) || (a.at - b.at));
  const out = [];
  const used = new Set();
  for (const t of sorted) {
    if (out.length >= max) break;
    const s = t.s;
    if (!s || s.length < 34 || used.has(s)) continue;
    if (literalCount.get(s) !== 1) continue;
    used.add(s);
    // longest run without parser tags, html or line breaks
    let best = "";
    for (const run of s.split(/[\[\]<>\n\\]/)) if (run.length > best.length) best = run;
    best = best.trim();
    if (best.length < 34) continue;
    // start on a word, end on a word, about 44 characters from the middle of the run
    let fp = best;
    if (best.length > 48) {
      let a = Math.floor((best.length - 44) / 2);
      const sp = best.indexOf(" ", a);
      if (sp >= 0 && sp < a + 10) a = sp + 1;
      let b = a + 44;
      const sp2 = best.indexOf(" ", b);
      if (sp2 >= 0 && sp2 < b + 10) b = sp2;
      fp = best.slice(a, b);
    }
    fp = fp.trim();
    if (fp.length >= 30) { out.push(fp); if (t.cond) out.cond = (out.cond || 0) + 1; }
  }
  return out;
}

// How often each fingerprint appears in all of the game's output text (fingerprints start
// on a word, so only word starts need checking).
function countInText(fps, literalCount) {
  const KEY = 14;
  const anchors = new Map();
  for (const f of fps) {
    const k = f.slice(0, KEY);
    if (!anchors.has(k)) anchors.set(k, []);
    anchors.get(k).push(f);
  }
  const count = new Map();
  for (const [lit, n] of literalCount) {
    if (lit.length < 30) continue;
    for (let at = 0; at >= 0 && at < lit.length - 29; at = lit.indexOf(" ", at) + 1 || -1) {
      const list = anchors.get(lit.substr(at, KEY));
      if (!list) continue;
      for (const f of list) if (lit.startsWith(f, at)) count.set(f, (count.get(f) || 0) + n);
    }
  }
  return count;
}

function buildCatalog(allFns, literalCount) {
  // 1. functions that orgasm and print text are scenes; helpers (orgasm but no text) pass it to callers
  const isScene = new Set();
  for (const r of allFns) if (r.orgasm > 0 && r.texts.length) isScene.add(r);
  const helpers = new Set(allFns.filter((r) => r.orgasm > 0 && !r.texts.length));
  for (let pass = 0; pass < 3; pass++) {
    // a wrapper with no text that only calls a helper becomes a helper too
    for (const r of allFns) if (!r.texts.length && r.calls.some((c) => helpers.has(c))) helpers.add(r);
  }
  for (const r of allFns) {
    if (isScene.has(r) || !r.texts.length) continue;
    if (r.calls.some((c) => helpers.has(c))) { isScene.add(r); r.orgasmTags.add(""); }
  }

  // who calls / buttons into each function (for names and labels)
  const callers = new Map();
  for (const r of allFns) for (const c of r.calls) {
    if (!callers.has(c)) callers.set(c, []);
    callers.get(c).push(r);
  }

  const BAD_NAME = /^(you|steele|\?\?\?|captain|victory|defeat|bad end|.)$/i;
  function nameFrom(cur) {
    const named = cur.names.filter((n) => n && !BAD_NAME.test(n.trim()));
    if (named.length) return named[named.length - 1].trim();
    // small "show her" helpers: W(!0) -> showName("BRANDT")
    for (const c of cur.calls) {
      if (c.texts.length) continue;
      const n2 = c.names.filter((n) => n && !BAD_NAME.test(n.trim()));
      if (n2.length) return n2[n2.length - 1].trim();
      if (c.busts.length) return c.busts[0].split("_")[0];
    }
    if (cur.busts.length) return cur.busts[0].split("_")[0];
    return "";
  }
  function strongNpc(r) {
    let best = "", bestN = 0;
    for (const [k, v] of r.npc) if (v > bestN && k !== "enemy" && k !== "target") { best = k; bestN = v; }
    return best ? titleCase(best.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()) : "";
  }
  function nameFor(r, starts) {
    const own = nameFrom(r);
    if (own) return titleCase(own.toLowerCase());
    const strong = strongNpc(r);
    if (strong) return strong;
    const seen = new Set();
    const queue = starts.slice();
    while (queue.length) {
      const cur = queue.shift();
      if (!cur || seen.has(cur) || seen.size > 14) continue;
      seen.add(cur);
      const n = nameFrom(cur);
      if (n) return titleCase(n.toLowerCase());
      const sn = cur !== r ? strongNpc(cur) : "";
      if (sn) return sn;
      if (cur.parent && cur.parent.end - cur.parent.start < 40000) queue.push(cur.parent);
      for (const t of cur.triggers) if (t.from && t.from.end - t.from.start < 60000) queue.push(t.from);
      for (const c of (callers.get(cur) || [])) if (c.end - c.start < 60000) queue.push(c);
    }
    if (r.npc.has("enemy")) return "Combat opponent";
    // SEXED_BRANDT, KHORGAN_SEXED, LAH_SEX_RIDE_HIM
    for (const f of r.flags) {
      const m = /^SEXED_([A-Z]+)/.exec(f.s) || /^([A-Z]+)_(SEXED|SEX|FUCKED|TIMES_SEXED)/.exec(f.s);
      if (m && m[1].length > 2) return titleCase(m[1].toLowerCase());
    }
    return "";
  }
  // the busts shown in a scene, or failing that, in what leads to it (for the character gallery link)
  function bustsFor(starts) {
    const seen = new Set();
    const queue = starts.slice();
    let first = true;
    while (queue.length) {
      const cur = queue.shift();
      if (!cur || seen.has(cur) || seen.size > 10) continue;
      seen.add(cur);
      const own = cur.allBusts.slice();
      for (const c of cur.calls) if (!c.texts.length) own.push(...c.allBusts);
      if (own.length) { const list = [...new Set(own)]; list.own = starts.includes(cur); return list; }
      if (!first && cur.texts.length > 40) continue;
      first = false;
      if (cur.parent && cur.parent.end - cur.parent.start < 40000) queue.push(cur.parent);
      for (const t of cur.triggers) if (t.from && t.from.end - t.from.start < 60000) queue.push(t.from);
      for (const c of (callers.get(cur) || [])) if (c.end - c.start < 60000) queue.push(c);
    }
    return [];
  }
  function authorFor(r) {
    for (let cur = r, i = 0; cur && i < 4; cur = cur.parent, i++) if (cur.authors.length) return cur.authors[cur.authors.length - 1];
    for (const t of r.triggers) if (t.from && t.from.authors.length) return t.from.authors[t.from.authors.length - 1];
    for (const c of (callers.get(r) || [])) if (c.authors.length) return c.authors[c.authors.length - 1];
    return "";
  }
  const SKIP_LABEL = /^(next|back|leave|continue|done|\.\.\.|okay|ok|yes|no|nope|fight|run|appearance|talk|sex|cancel|go|stay)$/i;
  function triggersFor(starts) {
    const out = [];
    const seen = new Set();
    const q = starts.slice();
    while (q.length && out.length < 4) {
      const cur = q.shift();
      if (!cur || seen.has(cur) || seen.size > 8) continue;
      seen.add(cur);
      for (const t of cur.triggers) if (t.label && !SKIP_LABEL.test(t.label.trim())) out.push(t);
      if (!out.length && cur.parent && !cur.parent.texts.length && cur.parent.end - cur.parent.start < 20000) q.push(cur.parent);
      if (!out.length) for (const c of (callers.get(cur) || [])) if (c.texts.length < 3) q.push(c);
    }
    return out;
  }

  // 2. one unit per scene; a function with switch (which) { case "ride him": ... } gives one per case
  const units = [];
  for (const r of isScene) {
    const tags = new Set(r.texts.map((t) => t.tag).filter(Boolean));
    if (tags.size >= 2) {
      const all = r.orgasmTags.has("");
      for (const tg of tags) {
        if (!all && !r.orgasmTags.has(tg)) continue;
        units.push({ r, tag: tg, texts: r.texts.filter((t) => t.tag === tg), starts: [r].concat(r.caseCallers.get(tg) || []) });
      }
    } else {
      units.push({ r, tag: "", texts: r.texts, starts: [r] });
    }
  }

  // 3. the save flags each scene sets (flags.ANNO_SEXED++, IncrementFlag("X"), flags.X = 1), so a
  //    save loaded into the gallery can unlock the scenes it has already played. Only a flag that
  //    nothing else in the game sets counts: a counter shared by several scenes can't say which one.
  const flagSetters = new Map();   // flag -> Set of functions that set it
  for (const r of allFns) for (const f of r.setFlags) {
    if (!flagSetters.has(f.s)) flagSetters.set(f.s, new Set());
    flagSetters.get(f.s).add(r);
  }
  function unitFlags(u) {
    const mine = new Set([u.r]);
    const names = new Set();
    for (const f of u.r.setFlags) if (!u.tag || f.tag === u.tag) names.add(f.s);
    // small helpers with no text that only this scene calls (the "after sex" bookkeeping)
    for (const c of u.r.calls) {
      if (c.texts.length || !(callers.get(c) || []).every((x) => x === u.r)) continue;
      mine.add(c);
      for (const f of c.setFlags) names.add(f.s);
    }
    // and buttons with no text of their own that set a flag and then start this scene:
    // addButton(0, "Ride", function () { flags.X_RIDDEN++; rideScene(); })
    if (!u.tag) for (const c of (callers.get(u.r) || [])) {
      if (c.texts.length || c.calls.filter((x) => x.texts.length).some((x) => x !== u.r)) continue;
      mine.add(c);
      for (const f of c.setFlags) names.add(f.s);
    }
    const out = [], shared = [];
    for (const n of names) {
      const setters = flagSetters.get(n);
      if (!setters) continue;
      if ([...setters].every((x) => mine.has(x))) out.push(n);
      else if ([...setters].every((x) => isScene.has(x) || (!x.texts.length && (callers.get(x) || []).every((y) => isScene.has(y))))) shared.push(n);
    }
    out.shared = shared;
    return out;
  }

  const scenes = [];
  const fpOwner = new Map();
  let skipped = 0;
  for (const u of units) {
    const r = u.r;
    // the first five fingerprints make the scene id, so they stay the same as scanner 2.9 picked them;
    // a scene whose text is mostly inside if/else branches gets up to five more, so whichever
    // branch the player sees still has something to match
    let fps = pickFingerprints(u.texts, literalCount, 5);
    if (!fps.length) { skipped++; continue; }
    const fpIdCount = fps.length;
    if (fps.length - (fps.cond || 0) < 3) {
      const more = pickFingerprints(u.texts, literalCount, 10);
      if (more.length > fps.length) fps = more;
    }
    const allText = u.texts.map((t) => t.s).join(" ");
    const npc = nameFor(r, u.starts);
    const trig = triggersFor(u.tag ? (r.caseCallers.get(u.tag) || []) : u.starts);
    let label = "";
    if (u.tag) {
      const hit = trig.find((t) => t.label.toLowerCase() === u.tag.toLowerCase());
      label = hit ? hit.label : titleCase(u.tag.replace(/_/g, " ").toLowerCase());
    } else if (trig.length) {
      const npcLow = (npc || "").toLowerCase();
      const good = trig.find((t) => t.label.toLowerCase() !== npcLow && !npcLow.includes(t.label.toLowerCase()));
      label = good ? good.label : "";
    }
    const named = r.readable ? wordsFromCamel(r.readable) : "";
    let flagTitle = "";
    for (const f of r.flags) {
      if (u.tag && f.tag && f.tag !== u.tag) continue;
      const m = /(?:SEX|SEXED|FUCK|FUCKED)_(.+)$/.exec(f.s);
      if (m && !/^(TIMES|COUNT|DAY|HOUR)/.test(m[1])) { flagTitle = titleCase(m[1].replace(/_/g, " ").toLowerCase()); break; }
    }
    const tags = [];
    for (const [tag, re] of TAGS) {
      const g = new RegExp(re.source, "gi");
      const hits = (allText.match(g) || []).length;
      if (hits >= (tag === "Taur" || tag === "Naga" || tag === "Group" || tag === "Titfuck" ? 1 : 2)) tags.push(tag);
    }
    const lead = u.texts.filter((t) => !t.cond).sort((a, b) => a.at - b.at)[0] || u.texts.slice().sort((a, b) => a.at - b.at)[0];
    let tip = "";
    for (const t of trig) {
      if (u.tag && t.label.toLowerCase() !== u.tag.toLowerCase() && trig.some((x) => x.label.toLowerCase() === u.tag.toLowerCase())) continue;
      if (t.tip && t.tip.length > tip.length) tip = t.tip;
    }
    if (tags.includes("Solo") && npc) tags.splice(tags.indexOf("Solo"), 1);
    const mainTag = tags.find((t) => t !== "Taur" && t !== "Naga" && t !== "Lactation" && t !== "Breeding");
    let title = label || named || flagTitle || (mainTag ? mainTag + " scene" : "");
    if (label && label.length <= 3 && (named || flagTitle)) title = named || flagTitle;
    const opening = firstSentences(lead ? lead.s : "", 240);
    const summary = describe(npc, r.area, tags, tip ? cleanText(tip) : "");
    const id = r.area + "-" + hashId(fps[0]);
    scenes.push({
      id, npc, area: r.area, place: areaLabel(r.area), title: title || (npc ? "Scene" : "Untitled scene"), author: authorFor(r), tags, summary,
      opening, fp: fps, fpId: fps.slice(0, fpIdCount), busts: bustsFor(u.starts), flagsSet: unitFlags(u),
      // where the scene's function is (not written to the scene list; the full-text scanner uses it)
      src: { file: r.file, start: r.start, end: r.end, tag: u.tag },
    });
    for (const f of fps) fpOwner.set(f, (fpOwner.get(f) || 0) + 1);
  }
  // a fingerprint that shows up anywhere else in the game's text can't tell scenes apart
  const occurs = countInText([...fpOwner.keys()], literalCount);
  for (const [f, n] of occurs) if (n > 1) fpOwner.set(f, 99);
  // a fingerprint two scenes share can't tell them apart: drop it, and drop scenes left with none
  const final = [];
  const ids = new Set();
  for (const s of scenes) {
    s.fp = s.fp.filter((f) => fpOwner.get(f) === 1);
    if (!s.fp.length) { skipped++; continue; }
    if (ids.has(s.id)) s.id += "-" + hashId(s.fpId.filter((f) => fpOwner.get(f) === 1).join("|")).slice(0, 4);
    ids.add(s.id);
    final.push(s);
  }
  // a flag two scenes (two cases of one function) both set can't tell them apart either, so it
  // moves to the shared list: a counter that a few scenes (up to 12) bump. Only those scenes
  // set it, so if it's above 0 the save has seen at least one of them. The gallery unlocks
  // them all unless "Unlock shared counters" is turned off.
  const flagClaims = new Map();
  for (const s of final) for (const f of s.flagsSet) flagClaims.set(f, (flagClaims.get(f) || 0) + 1);
  let flagged = 0;
  let sharedOnly = 0;
  const sharedClaims = new Map();
  for (const s of final) for (const f of s.flagsSet.shared.concat(s.flagsSet)) sharedClaims.set(f, (sharedClaims.get(f) || 0) + 1);
  for (const s of final) {
    const shared = s.flagsSet.shared.concat(s.flagsSet.filter((f) => flagClaims.get(f) > 1)).filter((f) => sharedClaims.get(f) <= 12);
    s.flagsSet = s.flagsSet.filter((f) => flagClaims.get(f) === 1);
    s.flagsShared = shared;
    if (s.flagsSet.length) flagged++;
    else if (shared.length) sharedOnly++;
  }
  // number repeated titles for one NPC: "Ride Him", "Ride Him (2)"
  const titleSeen = new Map();
  final.sort((a, b) => (a.place.localeCompare(b.place)) || ((a.npc || "~").localeCompare(b.npc || "~")) || a.title.localeCompare(b.title));
  for (const s of final) {
    const k = s.area + "|" + s.npc + "|" + s.title;
    const n = (titleSeen.get(k) || 0) + 1;
    titleSeen.set(k, n);
    if (n > 1) s.title += " (" + n + ")";
  }
  return { scenes: final, skipped, helpers: helpers.size, flagged, sharedOnly };
}

// ------------------------------------------------------- character gallery link
// The game's own character gallery (main menu > Gallery) lists every character by a display
// name, a gallery name and the bust it shows. The image manifest says which character(s) each
// bust is. Both are read from main.*.js so each scene can name the gallery characters in it.
function unwrapArray(n) {
  while (n && n.type !== "ArrayExpression") {
    if (n.type === "CallExpression") n = n.callee;
    else if (n.type === "MemberExpression") n = n.object;
    else if (n.type === "SequenceExpression") n = n.expressions[n.expressions.length - 1];
    else return null;
  }
  return n;
}
function readGalleryIndex(src) {
  const out = { chars: [], bustChars: new Map() };
  const at = src.indexOf("[{displayName:");
  if (at >= 0) {
    try {
      const arr = unwrapArray(acorn.parseExpressionAt(src, at, { ecmaVersion: "latest" }));
      for (const o of (arr ? arr.elements : [])) {
        if (!o || o.type !== "ObjectExpression") continue;
        const e = {};
        for (const p of o.properties) {
          if (!p.key) continue;
          const k = p.key.name || p.key.value;
          const v = p.value;
          e[k] = v.type === "Literal" ? v.value : (v.type === "MemberExpression" && v.property ? (v.property.name || v.property.value) : null);
        }
        if (e.displayName && e.galleryCharacterName) out.chars.push(e);
      }
    } catch (e) { /* left empty: the gallery link is skipped */ }
  }
  const m = /JSON\.parse\('\[\{"name":"[^"]*","character":/.exec(src);
  if (m) {
    try {
      const call = acorn.parseExpressionAt(src, m.index, { ecmaVersion: "latest" });
      const list = JSON.parse(call.arguments[0].value);
      for (const b of list) {
        if (!b || !b.name || !b.character) continue;
        const k = String(b.name).toLowerCase();
        if (!out.bustChars.has(k)) out.bustChars.set(k, new Set());
        for (const c of String(b.character).split(", ")) out.bustChars.get(k).add(c.trim());
      }
    } catch (e) { /* no manifest: names only */ }
  }
  return out;
}
function normName(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
const NAME_TITLES = /^(queen|king|lady|lord|dr|doctor|mz|ms|mr|mrs|miss|captain|commander|officer|sister|mother|father|madam|chief|princess|prince|the)\s+/;
function linkCharacters(scenes, gallery) {
  // display names are unique; gallery names are not ("Wall" is two characters), so scenes keep display names
  const byDisplay = new Map();
  const byName = new Map();
  const byGallery = new Map();
  const byBust = new Map();
  for (const c of gallery.chars) {
    if (!byGallery.has(c.galleryCharacterName)) byGallery.set(c.galleryCharacterName, []);
    byGallery.get(c.galleryCharacterName).push(c);
  }
  const put = (m, k, c) => { if (k && !m.has(k)) m.set(k, c); };
  for (const c of gallery.chars) {
    const d = normName(c.displayName);
    put(byDisplay, d, c); put(byDisplay, d.replace(/ /g, ""), c);
    put(byName, d, c); put(byName, d.replace(/ /g, ""), c);
  }
  for (const c of gallery.chars) {
    if (byGallery.get(c.galleryCharacterName).length !== 1) continue;
    const g = normName(c.galleryCharacterName);
    put(byName, g, c); put(byName, g.replace(/ /g, ""), c);
  }
  for (const c of gallery.chars) put(byBust, String(c.indexingBust || "").toLowerCase(), c);
  function fromName(raw) {
    let n = normName(raw);
    if (!n) return null;
    for (let i = 0; i < 2; i++) {
      if (byName.has(n)) return byName.get(n);
      if (byName.has(n.replace(/ /g, ""))) return byName.get(n.replace(/ /g, ""));
      if (!NAME_TITLES.test(n)) break;
      n = n.replace(NAME_TITLES, "");
    }
    return null;
  }
  function fromBust(raw) {
    const whole = String(raw || "").toLowerCase();
    let b = whole;
    while (b) {
      if (byBust.has(b)) return [byBust.get(b)];
      const named = gallery.bustChars.get(b);
      if (named) {
        const hits = [];
        for (const nm of named) {
          const list = byGallery.get(nm) || [];
          if (list.length === 1) hits.push(list[0]);
          else if (list.length > 1) {
            // shared gallery name: only the one whose own bust this is
            const own = list.filter((c) => { const ib = String(c.indexingBust || "").toLowerCase(); return ib && (whole.indexOf(ib) === 0 || ib.indexOf(whole) === 0); });
            if (own.length === 1) hits.push(own[0]);
          } else {
            const c = fromName(nm);
            if (c) hits.push(c);
          }
        }
        if (hits.length) return hits;
      }
      const cut = b.lastIndexOf("_");
      if (cut <= 0) break;
      b = b.slice(0, cut);
    }
    return [];
  }
  let linked = 0;
  const used = new Map();
  for (const s of scenes) {
    const found = [];
    const add = (c) => { if (c && !found.includes(c.displayName)) found.push(c.displayName); };
    for (const part of String(s.npc || "").split(/\s*(?:&|,| and )\s*/)) {
      let c = fromName(part);
      // "Steph Irson" -> Steph: one word of a short name that is a whole character name
      const words = normName(part).split(" ").filter(Boolean);
      if (!c && words.length >= 2 && words.length <= 3) {
        for (const w of words) if (w.length >= 3 && byDisplay.has(w)) { c = byDisplay.get(w); break; }
      }
      add(c);
    }
    // busts found only in what leads to the scene may be someone else, so they count only when the name gave nobody
    if (!found.length || (s.busts && s.busts.own)) for (const b of (s.busts || [])) for (const c of fromBust(b)) add(c);
    if (found.length) { s.chars = found; linked++; for (const g of found) used.set(g, (used.get(g) || 0) + 1); }
  }
  const chars = gallery.chars.filter((c) => used.has(c.displayName)).map((c) => {
    const o = { name: c.displayName, gallery: c.galleryCharacterName, bust: c.indexingBust || "", scenes: used.get(c.displayName) };
    if (c.taggedGender) o.gender = c.taggedGender;
    return o;
  });
  chars.sort((a, b) => a.name.localeCompare(b.name));
  return { chars, linked };
}

// -------------------------------------------------------------------- output
function writeCatalog(file, catalog, version) {
  const data = {
    format: 1,
    scanner: SCANNER_VERSION,
    game: version,
    generated: new Date().toISOString().slice(0, 10),
    count: catalog.scenes.length,
    characters: catalog.characters || [],
    scenes: catalog.scenes.map((s) => {
      const o = { id: s.id, npc: s.npc, area: s.area, place: s.place, title: s.title, author: s.author, tags: s.tags, summary: s.summary, fp: s.fp };
      if (s.chars && s.chars.length) o.chars = s.chars;
      if (s.opening) o.opening = s.opening;
      if (s.flagsSet && s.flagsSet.length) o.uf = s.flagsSet;
      else if (s.flagsShared && s.flagsShared.length) o.us = s.flagsShared;
      return o;
    }),
  };
  const body = "/* TN Sex Scene Gallery: scene list (Modv" + SCANNER_VERSION + ")\n" +
    "   Made by mods/tools/sex_scene_scan_v" + SCANNER_VERSION + ".js from TiTS " + (version || "(unknown version)") + " on " + data.generated + ".\n" +
    "   " + data.count + " scenes. Needs TN_SexGallery_v" + SCANNER_VERSION + ".js. Run the scanner again after a game update. */\n" +
    "window.TN_SEX_GALLERY_SCENES = " + JSON.stringify(data) + ";\n" +
    "if (typeof window.tnSexGalleryReload === \"function\") window.tnSexGalleryReload();\n";
  fs.writeFileSync(file, body, "utf8");
  return body.length;
}

async function main() {
  await setup();
  const t0 = Date.now();
  const files = gameFiles();
  if (!files.length) { console.error("No main/content .js files in " + APP); process.exit(1); }
  const version = gameVersion(files);
  const ctx = { globals: new Map() };
  const allFns = [];
  const literalCount = new Map();
  const log = [];
  let gallery = null;
  for (const f of files) {
    const src = fs.readFileSync(f.path, "utf8");
    if (/^main\./.test(f.name) && !gallery) gallery = readGalleryIndex(src);
    process.stdout.write("Scanning " + f.name + " (" + Math.round(src.length / 1048576) + " MB)... ");
    let fns;
    try { fns = scanFile(f, src, ctx); }
    catch (e) { console.log("could not parse (" + e.message + "), skipped"); log.push("SKIP " + f.name + ": " + e.message); continue; }
    let n = 0;
    for (const r of fns) {
      for (const t of r.texts) literalCount.set(t.s, (literalCount.get(t.s) || 0) + 1);
      if (r.orgasm) n++;
      // keep only what scenes need
      if (!r.texts.length && !r.orgasm && !r.calls.length) continue;
      allFns.push(r);
    }
    console.log(n + " functions with an orgasm");
    log.push(f.name + (f.path.indexOf(BACKUP || "\u0000") === 0 ? " (backup)" : "") + ": " + n + " functions with an orgasm");
  }
  const catalog = buildCatalog(allFns, literalCount);
  const link = linkCharacters(catalog.scenes, gallery || { chars: [], bustChars: new Map() });
  catalog.characters = link.chars;
  console.log("Character gallery: " + (gallery ? gallery.chars.length : 0) + " characters, " + link.chars.length + " with scenes; " +
    link.linked + " of " + catalog.scenes.length + " scenes linked to a character.");
  log.push("Character gallery: " + link.chars.length + " characters with scenes, " + link.linked + " scenes linked");
  const byArea = {};
  for (const s of catalog.scenes) byArea[s.place] = (byArea[s.place] || 0) + 1;
  console.log("\nFound " + catalog.scenes.length + " sex scenes (" + catalog.skipped + " left out: no text of their own to recognise them by).");
  console.log(catalog.flagged + " scenes leave a save flag only they set, and " + catalog.sharedOnly + " more share a counter with a few others,\n" +
              "so a loaded save can unlock them even if they were played before the gallery was installed.");
  for (const k of Object.keys(byArea).sort()) console.log("  " + k + ": " + byArea[k]);
  log.push("", "TiTS " + (version || "?") + ": " + catalog.scenes.length + " scenes, " + catalog.skipped + " left out, " + catalog.flagged + " unlock from their own save flag, " + catalog.sharedOnly + " from a shared counter", "");
  for (const s of catalog.scenes) {
    const line = s.id + "  [" + s.place + "] " + (s.npc || "?") + " — " + s.title + (s.tags.length ? "  (" + s.tags.join(", ") + ")" : "") +
      (s.chars ? "  -> " + s.chars.join(", ") : "");
    log.push(line);
    if (opts.list) console.log("  " + line);
  }
  if (opts.dryRun) { console.log("\nDry run: nothing written."); return; }
  const outFile = path.join(MODS, OUT_NAME);
  const size = writeCatalog(outFile, catalog, version);
  console.log("\nWrote " + outFile + " (" + Math.round(size / 1024) + " KB).");
  try {
    if (!isDir(LOGS)) fs.mkdirSync(LOGS, { recursive: true });
    fs.writeFileSync(path.join(LOGS, "SexSceneScan.txt"), log.join("\n") + "\n", "utf8");
    console.log("Wrote " + path.join(LOGS, "SexSceneScan.txt") + ".");
  } catch (e) { console.log("Could not write the log: " + e.message); }
  console.log("Done in " + Math.round((Date.now() - t0) / 1000) + "s. Keep " + OUT_NAME + " and TN_SexGallery_v" + SCANNER_VERSION + ".js in enabled.txt, then patch.");
}

if (require.main === module) {
  main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
}
module.exports = { setAcorn: (a) => { acorn = a; }, gameFiles: (app, backup) => { APP = app; BACKUP = backup; return gameFiles(); }, gameVersion, scanFile, buildCatalog, cleanText, pickFingerprints, readGalleryIndex, linkCharacters };
