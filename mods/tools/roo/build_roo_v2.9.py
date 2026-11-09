#!/usr/bin/env python3
"""Build mods/TITS-Mods/TN_RooCrew_v2.9.js from William's doc data and the part files.

Usage: python3 build_roo_v2.9.py [roo_doc_data_v2.9.js]
  roo_doc_data.js comes from roo_doc_convert_v2.9.py (William's Google Doc, exported as Markdown).
The parts are concatenated inside one function so they share helpers (sloppy mode on purpose:
roo_2 reassigns txt()).
"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "TITS-Mods", "TN_RooCrew_v2.9.js")
PARTS = ["roo_1_engine.js", "roo_2_keys.js", "roo_3_recruit.js", "roo_4_crew_talk.js", "roo_5_orders.js",
         "roo_6_affection.js", "roo_7_sex.js", "roo_8_events.js", "roo_9_boot.js"]

HEADER = """/* TN Roo Crew v2.9 (Techy-Nest, 2026-11-09)
   Roo, the bunny-eared kaithrit blackjack dealer on Zheng Shi, as a crew member.
   Text: William's "(16.1) TiTS - Roo, Crew Member Expansion" doc (ported as written).
   The Sex menu, the relief requests, the taur travel blurb, the Up To You choice and the
   Fetina B Cowgirl and Trib scenes were left "to be written"; Techy-Nest wrote them, with
   taur and naga versions.

   Needs TN_RooCrew_v2.9.mod (casino floor, crew list, Roo's crew button, travel, sleep,
   ship-return events, Fly menu and Anno hooks). Codex > Extra > Roo uses the hook from
   TN_DaneCrew_v2.8.mod.
   Unlock: 250,000 credits won overall at her table (flags.ROO_CREDIT_OVERALL) plus her panties.
   Price: 50,000. Both are constants at the top (UNLOCK_CREDITS, PRICE).
   Flags all start with TN_ROO_. TN_ROO_STATE: 1 at Plutus' office, 2 aboard, 3 Tavros apartment,
   4 sold to someone else, 5 stayed with her family.
   Built by mods/tools/roo/build_roo_v2.9.py; edit the parts there, not this file. */
(function () {
"""

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "roo_doc_data_v2.9.js")
    data = open(src, encoding="utf-8").read().strip()
    body = [HEADER, "    " + data.replace("\n", "\n    ") + "\n"]
    for p in PARTS:
        body.append("\n" + open(os.path.join(HERE, p), encoding="utf-8").read().rstrip() + "\n")
    body.append("})();\n")
    out = "".join(body)
    open(OUT, "w", encoding="utf-8").write(out)
    print("wrote", os.path.normpath(OUT), len(out), "bytes")

if __name__ == "__main__":
    main()
