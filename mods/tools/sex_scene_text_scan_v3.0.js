#!/usr/bin/env node
"use strict";
/*
 * sex_scene_text_scan_v3.0.js  -  makes TN_SexGalleryText_v3.0.js, the optional full-text
 * add-on for the Sex Scene Gallery (TN_SexGallery_v2.9.js).
 *
 * What it does
 *   Runs the gallery scanner (sex_scene_scan_v2.9.js, which must sit next to this file) to
 *   find every sex scene, then goes back to each scene's game function and copies out its
 *   whole text: every output(...) in order, the pages before it that lead in with a single
 *   "Next" button, and the pages after it the same way.
 *
 *   The game picks parts of a scene's text with if/else checks (pc.hasCock(), flags.X > 2,
 *   penny.isCrew() ...). Those checks are kept as small expression trees, so when you read a
 *   scene in the gallery it is shown for your Steele as they are now. A check the gallery
 *   can't work out on its own (it uses the game's hidden helper functions) shows every
 *   version of that bit, marked as one-of-these.
 *
 *   Nothing in the add-on runs game code: the gallery reads the trees with its own small
 *   reader, which only looks things up and calls read-only methods (names that change the
 *   game, like setX / removeX / orgasm, are left out here).
 *
 *   The text is packed with deflate into chunks of about 60 scenes, so the game keeps a few
 *   megabytes of packed text in memory and only unpacks the chunk you open.
 *
 * Usage
 *   node sex_scene_text_scan_v3.0.js --game DIR --acorn FILE --mods DIR [--backup DIR|none]
 *                                    [--out NAME] [--dry-run] [--check]
 *   Uses the same folders as sex_scene_scan_v2.9.js when it has saved them
 *   (sex_scene_scan.settings.json next to the scanner).
 *   --check  prints a few scenes as plain text so you can see what the gallery will show.
 *   If node runs out of memory:  node --max-old-space-size=4096 sex_scene_text_scan_v3.0.js
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const VERSION = "3.0";
const DEFAULT_OUT = "TN_SexGalleryText_v3.0.js";
const CHUNK_SCENES = 60;
const MAX_PAGES_AFTER = 4;
const MAX_PAGES_BEFORE = 3;
const MAX_INLINE_DEPTH = 3;

const scan = require(path.join(__dirname, "sex_scene_scan_v2.9.js"));

// ---------------------------------------------------------------- options
const opts = { given: {}, out: null, dryRun: false, check: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--dry-run") opts.dryRun = true;
  else if (a === "--check") opts.check = true;
  else if (a === "--out") opts.out = argv[++i];
  else if (/^--(game|acorn|mods|backup)$/.test(a)) opts.given[a.slice(2)] = argv[++i];
  else if (a === "-h" || a === "--help") { console.log(fs.readFileSync(__filename, "utf8").split("*/")[0]); process.exit(0); }
  else { console.error("Unknown option: " + a); process.exit(1); }
}
let saved = {};
try { saved = JSON.parse(fs.readFileSync(path.join(__dirname, "sex_scene_scan.settings.json"), "utf8")) || {}; } catch (e) { /* none */ }
const pick = (k) => opts.given[k] !== undefined ? path.resolve(opts.given[k]) : saved[k];
const APP = pick("game"), MODS = pick("mods"), ACORN = pick("acorn");
let BACKUP = opts.given.backup !== undefined ? (opts.given.backup === "none" ? null : path.resolve(opts.given.backup)) : (saved.backup === "none" ? null : saved.backup);
if (!APP || !MODS || !ACORN) {
  console.error("Give --game DIR --acorn FILE --mods DIR (or run sex_scene_scan_v2.9.js once so it saves them).");
  process.exit(1);
}
if (BACKUP && !fs.existsSync(BACKUP)) BACKUP = null;
const acorn = require(ACORN);
scan.setAcorn(acorn);

// ---------------------------------------------------------------- helpers
const FUNC = new Set(["FunctionExpression", "ArrowFunctionExpression", "FunctionDeclaration"]);
const NEXT_LABEL = /^(next|continue|\.\.\.|onward|keep going|more)$/i;
// What the gallery may call while it works out a check. Anything else is "can't tell".
//   - never: names that change the game (setX, removeX, cockChange, orgasm, ...)
//   - methods: any read with no arguments (pc.hasCock(), penny.isCrew(), kiro.trust()), and
//     reads that take arguments only when the name says it is a read (hasStatusEffect("X"),
//     mf("he","she"), cockDescript(0)). Stat methods like libido(5) / trust(2) change the
//     stat when given an argument, so those are left out.
//   - plain functions: only known reads (rand, isSillyModeEnabled, InShipInterior, ...)
const NEVER_CALL = /(Change|Changes)$|^(set|add|remove|create|lose|gain|take|give|load|orgasm|increment|decrement|destroy|apply|impregnate|free|consume|bimbofy|unbimbofy|knock|clear|show|hide|process|equip|unequip|drain|boost|grow|shrink|modify|mod|kill|delete|reset|unlock|lock|buy|sell|award|earn|spend|deduct|move|push|pop|splice|shift|unshift|sort|reverse|fill|start|begin|end|finish|enter|leave|exit|record|save|output|author|update|insert|register|toggle|mark|trigger|fire|play|cuff|tf|transform|tick|advance|use|eat|drink|put|store|stash|swap|stretch|lay|birth|lactate|sleep|wake|heal|damage|teleport|travel|fuck|sex|breed|rape|feed|empty|inflate|deflate|clean|wash|dress|undress|wear|install|uninstall|recruit|dismiss|fireCrew|addiction)([A-Z_]|$)/;
const READ_WITH_ARGS = /^(has|is|can|get|in[A-Z]|biggest|smallest|longest|shortest|wettest|driest|tightest|gapest|puffiest|highest|lowest|thickest|total|num|mfn?$|rawmfn?$|statusEffectv\d|perkv\d|keyItemv\d|cLength|cockThatFits|cuntThatFits|cockVolume|analCapacity|vaginalCapacity|looseness|wetness|includes|indexOf|toLowerCase|toUpperCase|toFixed|toLocaleString|replace|charAt|slice|substr|substring|floor|ceil|round|abs|min|max|cumQ|girlCumQ|cumQuality|race|raceShort|raceCute|legOrLegs|each[A-Z]|one[A-Z]|find[A-Z]|matched|cockAndVagina|cockXorVagina|fluid|scrotum|skin|sack|breastCup|breastRating|buttRating|hipRating|lipRating|thighRating|bellyRating|bRows|bRating|nippleLength|genitalLocation|blockedVaginas|pluggedVaginas|vaginasMatch|attachedMimbranes|addiction$|addictedTo|immuneTo|submissiveTo|steeleName|angelOrMaster|catDog|stripRace|isHoleTight|isAssTight|korgiTranslate|blockHeader|RandomInCollection|rand$|ParseText|String|Number|isNaN|parseInt|parseFloat)|(Descript|Noun|NounComplex|Desc|Adj|Color|Colour|Type|Rating|Capacity|Index|Index2|Length|Volume|Count|Total|Diameter|Size|Thickness|Wetness|Looseness|Puffiness|TypeUnlocked|TypeLockedMessage|Flag|Flags|Doses|Dose|Level|Score)$/;
const GLOBAL_READS = /^(rand|RandomInCollection|isSillyModeEnabled|isAprilFools|isDebugEnabled|isDhaalMode|inCombat|InShipInterior|InPCShipInterior|InPublicSpace|InRoomWithPhones|getPlanetName|getCurrentLocation|ParseText|korgiTranslate|blockHeader|stripRace|isNaN|String|Number|parseInt|parseFloat|num2Text|num2Text2|num2Ordinal|indefiniteArticle|plural|possessive|upperCase|lowerCase|capitalA|getCrewSleepWith|hasCrewSleepWith|geneSubmissionLevel|isGeneSubmissionLevelMaxed|crew)$/;
function callAllowed(name, isMethod, argc) {
  if (!name || NEVER_CALL.test(name)) return false;
  if (!isMethod) return GLOBAL_READS.test(name);
  return argc === 0 || READ_WITH_ARGS.test(name);
}

function walkKids(n, fn) {
  for (const k in n) {
    if (k === "type" || k === "start" || k === "end") continue;
    const v = n[k];
    if (!v || typeof v !== "object") continue;
    if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === "string") fn(c); }
    else if (typeof v.type === "string") fn(v);
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
  if (c.type === "SequenceExpression" && c.expressions.length) return calleeName(c.expressions[c.expressions.length - 1]);
  return "";
}
function patternNames(p, out) {
  if (!p) return;
  if (p.type === "Identifier") out.push(p.name);
  else if (p.type === "AssignmentPattern") patternNames(p.left, out);
  else if (p.type === "RestElement") patternNames(p.argument, out);
  else if (p.type === "ArrayPattern") for (const e of p.elements) patternNames(e, out);
  else if (p.type === "ObjectPattern") for (const q of p.properties) patternNames(q.value || q.argument, out);
}

// One pass over a file's AST: parent function of each function, the names each function
// scope declares, which function a local name means, and window.X = function ... globals.
function indexFile(ast, globals) {
  const parent = new Map();       // fn node -> parent fn node (or Program)
  const decls = new Map();        // scope node -> Set(names)
  const fnDecls = new Map();      // scope node -> Map(name -> fn node)
  const byStart = new Map();      // start offset -> fn node
  const inits = new Map();        // scope node -> Map(name -> init expression), for var x = <expr>
  const assigned = new Map();     // scope node -> Set(names assigned after their declaration)
  const declare = (scope, name) => { let s = decls.get(scope); if (!s) decls.set(scope, s = new Set()); s.add(name); };
  const declareFn = (scope, name, fn) => { let m = fnDecls.get(scope); if (!m) fnDecls.set(scope, m = new Map()); if (!m.has(name)) m.set(name, fn); };
  const stack = [[ast, ast]];
  while (stack.length) {
    const [n, scope] = stack.pop();
    let inner = scope;
    if (FUNC.has(n.type)) {
      parent.set(n, scope);
      byStart.set(n.start, n);
      if (n.type === "FunctionDeclaration" && n.id) { declare(scope, n.id.name); declareFn(scope, n.id.name, n); }
      inner = n;
      const names = [];
      for (const p of n.params) patternNames(p, names);
      if (n.type === "FunctionExpression" && n.id) names.push(n.id.name);
      for (const nm of names) declare(n, nm);
      declare(n, "arguments");
    } else if (n.type === "VariableDeclarator") {
      const names = [];
      patternNames(n.id, names);
      for (const nm of names) declare(scope, nm);
      if (n.id.type === "Identifier" && n.init && FUNC.has(n.init.type)) declareFn(scope, n.id.name, n.init);
      else if (n.id.type === "Identifier") {
        let m = inits.get(scope); if (!m) inits.set(scope, m = new Map());
        if (m.has(n.id.name) || !n.init) { m.set(n.id.name, null); } else m.set(n.id.name, n.init);
      }
    } else if ((n.type === "AssignmentExpression" && n.left.type === "Identifier") || (n.type === "UpdateExpression" && n.argument.type === "Identifier")) {
      const nm = n.type === "UpdateExpression" ? n.argument.name : n.left.name;
      let a = assigned.get(scope); if (!a) assigned.set(scope, a = new Set());
      a.add(nm);
      if (n.type === "AssignmentExpression" && n.right && FUNC.has(n.right.type)) { /* x = function: not a value */ }
    } else if (n.type === "ClassDeclaration" && n.id) declare(scope, n.id.name);
    else if (n.type === "CatchClause" && n.param) { const names = []; patternNames(n.param, names); for (const nm of names) declare(scope, nm); }
    else if (n.type === "AssignmentExpression" && n.right && FUNC.has(n.right.type) && n.left.type === "MemberExpression" &&
             !n.left.computed && n.left.object.type === "Identifier" && n.left.object.name === "window") {
      globals.set(n.left.property.name, n.right);
    }
    walkKids(n, (c) => stack.push([c, inner]));
  }
  function scopeChain(fn) {
    const out = [];
    for (let s = fn; s; s = parent.get(s)) { out.push(s); if (s === ast) break; }
    return out;
  }
  function isLocal(chain, name) {
    for (const s of chain) { const d = decls.get(s); if (d && d.has(name)) return true; }
    return false;
  }
  function resolveFn(chain, name) {
    for (const s of chain) { const m = fnDecls.get(s); if (m && m.has(name)) return m.get(name); const d = decls.get(s); if (d && d.has(name)) return null; }
    return globals.get(name) || null;
  }
  // var x = pc.hasCock() (declared once, never assigned again): checks on x mean that expression
  function constInit(chain, name) {
    for (let i = 0; i < chain.length; i++) {
      const s = chain[i];
      const d = decls.get(s);
      if (!d || !d.has(name)) continue;
      const m = inits.get(s);
      const init = m && m.get(name);
      if (!init || s === chain[chain.length - 1]) return null;   // not module-level ones
      for (let j = 0; j <= i; j++) { const a = assigned.get(chain[j]); if (a && a.has(name)) return null; }
      // a random roll stored once (var r = rand(3)) can't be rolled again at every check
      let random = false;
      const st = [init];
      while (st.length && !random) { const x = st.pop(); if (x.type === "CallExpression" && /^(rand|RandomInCollection|random)$/.test(calleeName(x.callee))) random = true; walkKids(x, (c) => st.push(c)); }
      if (random) return null;
      return { init, chain: chain.slice(i) };
    }
    return null;
  }
  return { parent, byStart, scopeChain, isLocal, resolveFn, constInit };
}

// ------------------------------------------------- expressions -> small trees
// The gallery's reader understands exactly these shapes; anything else becomes null ("can't tell").
function exprTree(n, ctx, depth) {
  const bad = { v: false };
  const t = conv(n);
  return bad.v ? null : t;
  function conv(e) {
    if (bad.v || !e) { bad.v = true; return null; }
    switch (e.type) {
      case "Literal":
        if (e.regex) { bad.v = true; return null; }
        return ["l", e.value];
      case "Identifier":
        if (e.name === "undefined") return ["l", null];
        if (ctx.isLocal(ctx.chain, e.name)) {
          const c = ctx.constInit && (depth || 0) < 4 ? ctx.constInit(ctx.chain, e.name) : null;
          const sub = c ? exprTree(c.init, Object.assign({}, ctx, { chain: c.chain }), (depth || 0) + 1) : null;
          if (!sub) { bad.v = true; return null; }
          return sub;
        }
        return ["i", e.name];
      case "MemberExpression":
        if (e.object.type === "Super") { bad.v = true; return null; }
        if (!e.computed) return ["m", conv(e.object), e.property.name];
        return ["M", conv(e.object), conv(e.property)];
      case "CallExpression": {
        const name = calleeName(e.callee);
        if (e.callee.type !== "MemberExpression" && e.callee.type !== "Identifier") { bad.v = true; return null; }
        if (!callAllowed(name, e.callee.type === "MemberExpression", e.arguments.length)) { bad.v = true; return null; }
        if (e.arguments.some((a) => a.type === "SpreadElement")) { bad.v = true; return null; }
        return ["c", conv(e.callee), e.arguments.map(conv)];
      }
      case "UnaryExpression":
        if (e.operator === "delete") { bad.v = true; return null; }
        return ["u", e.operator, conv(e.argument)];
      case "BinaryExpression": return ["b", e.operator, conv(e.left), conv(e.right)];
      case "LogicalExpression": return ["L", e.operator, conv(e.left), conv(e.right)];
      case "ConditionalExpression": return ["?", conv(e.test), conv(e.consequent), conv(e.alternate)];
      case "TemplateLiteral": return ["t", e.quasis.map((q) => q.value.cooked), e.expressions.map(conv)];
      case "SequenceExpression": return conv(e.expressions[e.expressions.length - 1]);
      case "ArrayExpression": return ["a", e.elements.map(conv)];
      default: bad.v = true; return null;
    }
  }
}

// ------------------------------------------------- function bodies -> programs
// A program is an array of items:
//   "text"                   scene text (parser tags kept, the gallery parses it)
//   [0, expr]                a bit of text worked out from an expression (expr null = can't tell)
//   [1, cond, [..], [..]]    if cond then the first list else the second (cond null = show both)
//   [2]                      page break (the player pressed Next)
function compileFn(fn, ctx, tag, depth, seen) {
  const out = [];
  const nexts = [];
  const chain = ctx.scopeChain(fn);
  const ectx = { isLocal: ctx.isLocal, constInit: ctx.constInit, chain };
  const body = fn.body.type === "BlockStatement" ? fn.body.body : [fn.body];
  if (tag) {
    // switch (which) { case "tag": ... } : only that case, up to its break
    const sw = findSwitch(fn.body, tag);
    if (sw) { stmts(sw, out); return { prog: out, nexts }; }
  }
  stmts(body, out);
  return { prog: out, nexts };

  function findSwitch(root, tg) {
    const st = [root];
    while (st.length) {
      const n = st.pop();
      if (n !== root && FUNC.has(n.type)) continue;
      if (n.type === "SwitchStatement") {
        const i = n.cases.findIndex((c) => c.test && strArg(c.test) === tg);
        if (i >= 0) {
          const list = [];
          for (let j = i; j < n.cases.length; j++) {
            let stop = false;
            for (const s of n.cases[j].consequent) { if (s.type === "BreakStatement") { stop = true; break; } list.push(s); }
            if (stop) break;
          }
          return list;
        }
      }
      walkKids(n, (c) => st.push(c));
    }
    return null;
  }
  function stmts(list, into) { for (const s of list) stmt(s, into); }
  function stmt(s, into) {
    if (!s) return;
    switch (s.type) {
      case "ExpressionStatement": return expr(s.expression, into);
      case "BlockStatement": return stmts(s.body, into);
      case "IfStatement": return branch(s.test, (a) => stmt(s.consequent, a), (b) => stmt(s.alternate, b), into);
      case "ReturnStatement": return s.argument ? expr(s.argument, into) : undefined;
      case "VariableDeclaration": for (const d of s.declarations) if (d.init) expr(d.init, into); return;
      case "SwitchStatement": {
        // a switch on something: each case as "one of these" when we can't tell which
        const cases = s.cases.map((c) => { const a = []; stmts(c.consequent.filter((x) => x.type !== "BreakStatement"), a); return a; });
        const withText = cases.filter((a) => a.length);
        if (!withText.length) return;
        if (withText.length === 1) { into.push([1, null, withText[0], []]); return; }
        let acc = withText[withText.length - 1];
        for (let i = withText.length - 2; i >= 0; i--) acc = [[1, null, withText[i], acc]];
        into.push(...acc);
        return;
      }
      case "TryStatement": stmt(s.block, into); return;
      case "LabeledStatement": return stmt(s.body, into);
      default: return;
    }
  }
  function branch(test, a, b, into) {
    const t = [], f = [];
    a(t); b(f);
    if (!t.length && !f.length) { expr(test, into); return; }
    into.push([1, exprTree(test, ectx), t, f]);
  }
  function expr(e, into) {
    if (!e) return;
    switch (e.type) {
      case "SequenceExpression": for (const x of e.expressions) expr(x, into); return;
      case "ConditionalExpression": return branch(e.test, (a) => expr(e.consequent, a), (b) => expr(e.alternate, b), into);
      case "LogicalExpression":
        if (e.operator === "&&") return branch(e.left, (a) => expr(e.right, a), () => {}, into);
        if (e.operator === "||") return branch(e.left, () => {}, (b) => expr(e.right, b), into);
        return;
      case "UnaryExpression": return expr(e.argument, into);
      case "AssignmentExpression": return expr(e.right, into);
      case "CallExpression": return call(e, into);
      default: return;
    }
  }
  function call(e, into) {
    const name = calleeName(e.callee);
    if (name === "output" && e.callee.type !== "MemberExpression" || (name === "output" && e.callee.type === "MemberExpression" && e.callee.object.type === "Identifier" && /^(ui|window)$/.test(e.callee.object.name))) {
      text(e.arguments[0], into);
      return;
    }
    if (name === "clearOutput") { if (into.length || out.length) into.push([2]); return; }
    if (/^add(Ghost|Item|Override)?Button$/.test(name)) {
      const label = strArg(e.arguments[1]);
      const tgt = e.arguments[2];
      if (label && NEXT_LABEL.test(label.trim()) && tgt) {
        let target = null;
        if (FUNC.has(tgt.type)) target = tgt;
        else if (tgt.type === "Identifier") target = ctx.resolveFn(chain, tgt.name);
        else if (tgt.type === "MemberExpression" && !tgt.computed && tgt.object.type === "Identifier" && tgt.object.name === "window") target = ctx.globals.get(tgt.property.name) || null;
        nexts.push(target);
      } else if (label) nexts.push("other");
      return;
    }
    // a small local helper that prints text: copy its text in here
    for (const a of e.arguments) if (a && (a.type === "SequenceExpression" || a.type === "ConditionalExpression" || a.type === "CallExpression")) expr(a, into);
    if (depth >= MAX_INLINE_DEPTH) return;
    let target = null;
    if (e.callee.type === "Identifier") target = ctx.resolveFn(chain, e.callee.name);
    else if (e.callee.type === "MemberExpression" && !e.callee.computed && e.callee.object.type === "Identifier" && e.callee.object.name === "window") target = ctx.globals.get(e.callee.property.name) || null;
    else if (e.callee.type === "SequenceExpression") return;
    if (!target || seen.has(target) || ctx.sceneFns.has(target) && target !== fn) return;
    if (!ctx.hasText(target) || ctx.clears(target)) return;
    seen.add(target);
    const r = compileFn(target, ctx, "", depth + 1, seen);
    seen.delete(target);
    into.push(...r.prog);
  }
  function text(a, into) {
    if (!a) return;
    const s = strArg(a);
    if (s !== null) { if (s) into.push(s); return; }
    if (a.type === "BinaryExpression" && a.operator === "+") { text(a.left, into); text(a.right, into); return; }
    if (a.type === "TemplateLiteral") {
      a.quasis.forEach((q, i) => { if (q.value.cooked) into.push(q.value.cooked); if (i < a.expressions.length) text(a.expressions[i], into); });
      return;
    }
    if (a.type === "ConditionalExpression") { const t = [], f = []; text(a.consequent, t); text(a.alternate, f); into.push([1, exprTree(a.test, ectx), t, f]); return; }
    if (a.type === "LogicalExpression" && a.operator === "&&") { const t = []; text(a.right, t); into.push([1, exprTree(a.left, ectx), t, []]); return; }
    if (a.type === "CallExpression" && calleeName(a.callee) === "concat") { if (a.callee.type === "MemberExpression") text(a.callee.object, into); for (const x of a.arguments) text(x, into); return; }
    into.push([0, exprTree(a, ectx)]);
  }
}

// merge neighbouring strings, drop empty branches
function tidy(prog) {
  const out = [];
  for (const it of prog) {
    if (typeof it === "string") {
      if (typeof out[out.length - 1] === "string") out[out.length - 1] += it; else out.push(it);
    } else if (it[0] === 1) {
      const t = tidy(it[2]), f = tidy(it[3]);
      if (!t.length && !f.length) continue;
      out.push([1, it[1], t, f]);
    } else if (it[0] === 2) {
      if (out.length && !(Array.isArray(out[out.length - 1]) && out[out.length - 1][0] === 2)) out.push(it);
    } else out.push(it);
  }
  while (out.length && Array.isArray(out[out.length - 1]) && out[out.length - 1][0] === 2) out.pop();
  while (out.length && Array.isArray(out[0]) && out[0][0] === 2) out.shift();
  return out;
}
function progChars(p) {
  let n = 0;
  for (const it of p) { if (typeof it === "string") n += it.length; else if (it[0] === 1) n += progChars(it[2]) + progChars(it[3]); }
  return n;
}

// ---------------------------------------------------------------- main
function main() {
  const t0 = Date.now();
  const files = scan.gameFiles(APP, BACKUP);
  const version = scan.gameVersion(files);
  console.log("TiTS " + (version || "?") + ": scanning " + files.length + " files for scenes...");
  const ctxScan = { globals: new Map() };
  const allFns = [];
  const literalCount = new Map();
  for (const f of files) {
    const src = fs.readFileSync(f.path, "utf8");
    let fns;
    try { fns = scan.scanFile(f, src, ctxScan); } catch (e) { console.log("  skip " + f.name + ": " + e.message); continue; }
    for (const r of fns) {
      for (const t of r.texts) literalCount.set(t.s, (literalCount.get(t.s) || 0) + 1);
      if (!r.texts.length && !r.orgasm && !r.calls.length) continue;
      allFns.push(r);
    }
  }
  const catalog = scan.buildCatalog(allFns, literalCount);
  allFns.length = 0;
  literalCount.clear();
  console.log("Scene list: " + catalog.scenes.length + " scenes. Copying their text...");

  // window.X = function globals, from every file (cheap regex pass; nodes come per file)
  const byFile = new Map();
  for (const s of catalog.scenes) {
    if (!byFile.has(s.src.file)) byFile.set(s.src.file, []);
    byFile.get(s.src.file).push(s);
  }
  const texts = new Map();   // id -> program
  let unknownConds = 0, knownConds = 0, pagesBefore = 0, pagesAfter = 0;
  for (const f of files) {
    const list = byFile.get(f.name);
    if (!list) continue;
    const src = fs.readFileSync(f.path, "utf8");
    let ast;
    try { ast = acorn.parse(src, { ecmaVersion: "latest", allowHashBang: true, allowReturnOutsideFunction: true }); }
    catch (e) { ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "module" }); }
    const globals = new Map();
    const ix = indexFile(ast, globals);
    // per function: has output text, starts a new page, its buttons
    const textMemo = new Map(), clearMemo = new Map();
    function own(fn, pred) {
      const st = [fn.body];
      while (st.length) {
        const n = st.pop();
        if (FUNC.has(n.type)) continue;
        if (n.type === "CallExpression" && pred(calleeName(n.callee))) return true;
        walkKids(n, (c) => st.push(c));
      }
      return false;
    }
    const hasText = (fn) => { if (!textMemo.has(fn)) textMemo.set(fn, own(fn, (n) => n === "output")); return textMemo.get(fn); };
    const clears = (fn) => { if (!clearMemo.has(fn)) clearMemo.set(fn, own(fn, (n) => n === "clearOutput")); return clearMemo.get(fn); };
    const sceneFns = new Set();
    for (const s of list) { const fn = ix.byStart.get(s.src.start); if (fn) sceneFns.add(fn); }
    const ctx = { scopeChain: ix.scopeChain, isLocal: ix.isLocal, resolveFn: ix.resolveFn, constInit: ix.constInit, globals, hasText, clears, sceneFns };

    // "Next" links between pages: target fn -> the pages that lead only to it
    const leadsTo = new Map();
    const compiled = new Map();
    const compileOnce = (fn) => {
      if (!compiled.has(fn)) compiled.set(fn, compileFn(fn, ctx, "", 0, new Set([fn])));
      return compiled.get(fn);
    };
    const leadIns = (target) => {
      if (leadsTo.has(target)) return leadsTo.get(target);
      leadsTo.set(target, []);
      return leadsTo.get(target);
    };
    // find lead-in pages: functions whose only button is a Next to the scene
    {
      const st = [ast];
      while (st.length) {
        const n = st.pop();
        if (FUNC.has(n.type) && hasText(n) && clears(n)) {
          // quick look at its buttons without compiling everything
          const btns = [];
          const s2 = [n.body];
          while (s2.length) {
            const m = s2.pop();
            if (FUNC.has(m.type)) continue;
            if (m.type === "CallExpression" && /^add(Ghost|Item|Override)?Button$/.test(calleeName(m.callee))) btns.push(m);
            walkKids(m, (c) => s2.push(c));
          }
          if (btns.length === 1) {
            const b = btns[0];
            const label = strArg(b.arguments[1]);
            const tgt = b.arguments[2];
            if (label && NEXT_LABEL.test(label.trim()) && tgt && tgt.type === "Identifier") {
              const target = ix.resolveFn(ix.scopeChain(n), tgt.name);
              if (target) leadIns(target).push(n);
            }
          }
        }
        walkKids(n, (c) => st.push(c));
      }
    }

    for (const s of list) {
      const fn = ix.byStart.get(s.src.start);
      if (!fn) continue;
      const main = compileFn(fn, ctx, s.src.tag, 0, new Set([fn]));
      let prog = main.prog.slice();
      // pages before: one clear single lead-in each step
      if (!s.src.tag) {
        let cur = fn;
        const used = new Set([fn]);
        for (let i = 0; i < MAX_PAGES_BEFORE; i++) {
          const ins = (leadsTo.get(cur) || []).filter((x) => !used.has(x) && !sceneFns.has(x));
          if (ins.length !== 1) break;
          const p = compileOnce(ins[0]).prog;
          prog = p.concat([[2]], prog);
          used.add(ins[0]);
          cur = ins[0];
          pagesBefore++;
        }
      }
      // pages after: follow a lone Next to a page of text
      let nexts = main.nexts;
      const used = new Set([fn]);
      for (let i = 0; i < MAX_PAGES_AFTER; i++) {
        const real = [...new Set(nexts)];
        if (real.length !== 1 || !real[0] || real[0] === "other") break;
        const nx = real[0];
        if (used.has(nx) || sceneFns.has(nx) || !hasText(nx)) break;
        used.add(nx);
        const r = compileOnce(nx);
        prog = prog.concat([[2]], r.prog);
        nexts = r.nexts;
        pagesAfter++;
      }
      prog = tidy(prog);
      (function count(p) { for (const it of p) if (Array.isArray(it) && it[0] === 1) { if (it[1]) knownConds++; else unknownConds++; count(it[2]); count(it[3]); } })(prog);
      if (progChars(prog) > 0) texts.set(s.id, prog);
    }
    console.log("  " + f.name + ": " + list.length + " scenes");
  }

  // pack: chunks of CHUNK_SCENES scenes in scene-list order, each deflated and Base64'd
  const ids = catalog.scenes.map((s) => s.id).filter((id) => texts.has(id));
  const chunks = [];
  const index = {};
  let rawTotal = 0, chars = 0;
  for (let i = 0; i < ids.length; i += CHUNK_SCENES) {
    const part = {};
    for (const id of ids.slice(i, i + CHUNK_SCENES)) { part[id] = texts.get(id); index[id] = chunks.length; chars += progChars(texts.get(id)); }
    const json = JSON.stringify(part);
    rawTotal += Buffer.byteLength(json);
    chunks.push(zlib.deflateRawSync(Buffer.from(json, "utf8"), { level: 9 }).toString("base64"));
  }
  const packed = chunks.reduce((a, c) => a + c.length, 0);
  console.log("\n" + ids.length + " of " + catalog.scenes.length + " scenes have text: " + Math.round(chars / 1e6 * 10) / 10 + " million characters (" +
    Math.round(rawTotal / 1048576) + " MB as data, " + Math.round(packed / 1048576 * 10) / 10 + " MB packed, " + chunks.length + " chunks).");
  console.log(pagesBefore + " lead-in pages and " + pagesAfter + " follow-on pages added. Checks: " + knownConds + " the gallery can work out, " + unknownConds + " shown as one-of-these.");

  if (opts.check) {
    for (const id of ids.filter((_, i) => i % Math.max(1, Math.floor(ids.length / 4)) === 0).slice(0, 4)) {
      console.log("\n==== " + id + "\n" + JSON.stringify(texts.get(id)).slice(0, 1500));
    }
  }
  if (opts.dryRun) { console.log("Dry run: nothing written."); return; }
  const outName = opts.out || DEFAULT_OUT;
  const body = "/* TN Sex Scene Gallery: full scene text add-on (Modv" + VERSION + ")\n" +
    "   Made by mods/tools/sex_scene_text_scan_v" + VERSION + ".js from TiTS " + (version || "?") + " on " + new Date().toISOString().slice(0, 10) + ".\n" +
    "   " + ids.length + " scenes, packed. Needs TN_SexGallery_v2.9.js and TN_SexGalleryScenes_v2.9.js made from the same game version.\n" +
    "   Leave this file out of enabled.txt for the lite pack (summaries and openings only). */\n" +
    "window.TN_SEX_GALLERY_TEXT = {format:1,game:" + JSON.stringify(version) + ",count:" + ids.length + ",index:" + JSON.stringify(index) +
    ",chunks:[\n" + chunks.map((c) => JSON.stringify(c)).join(",\n") + "]};\n" +
    "if (typeof window.tnSexGalleryTextReady === \"function\") window.tnSexGalleryTextReady();\n";
  fs.writeFileSync(path.join(MODS, outName), body, "utf8");
  console.log("Wrote " + path.join(MODS, outName) + " (" + Math.round(body.length / 1048576 * 10) / 10 + " MB) in " + Math.round((Date.now() - t0) / 1000) + "s.");
}

main();
