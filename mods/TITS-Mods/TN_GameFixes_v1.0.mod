# TN_GameFixes v1.0 - NestPatcher mod
# Fixes bugs in the base game (TiTS 0.9.168) itself, not in any mod.
# Each block below fixes one bug. @@x@@ is a NestPatcher wildcard for short names.
# DESKTOP ONLY FOR NOW (Windows, Linux, Mac). The Android build's code is written
# differently at all nine spots, so every block misses there and the Android patcher
# stops the whole run. Leave this mod off on Android (keep the # in enabled.txt).
# Needs NestPatcher 1.4+ or GUI 0.5+.

# ---------------------------------------------------------------------------
# 1. Shop hotkeys crash.
# The "Select Shop Mode Buy" and "Select Shop Mode Sell" key bindings call
# window.shopSelectType(), which doesn't exist (the real one is setShopBuySell).
# Pressing either key threw "window.shopSelectType is not a function".
# ---------------------------------------------------------------------------
Rep [main.js]:
function(){return window.shopSelectType("buy")},function(){return window.shopSelectType("sell")}
W:
function(){return window.setShopBuySell("buy")},function(){return window.setShopBuySell("sell")}

# ---------------------------------------------------------------------------
# 2. Crackle Jelly ignores locked skin colour.
# Every other TF checks skinToneUnlocked() first, so Gel Body (goo) and plant
# skin keep their colour. Crackle Jelly's "palette" result recoloured them anyway,
# and its locked-skin message could never show.
# ---------------------------------------------------------------------------
Rep [main.js]:
!1===this.paleColors.includes(@@pc@@.skinTone)&&(@@pc@@.skinTone=@@col@@,output(" Each jolt turns your body a little more "+@@col@@.split(" ").pop()),@@chg@@=!0)
W:
!1===this.paleColors.includes(@@pc@@.skinTone)&&(@@pc@@.skinToneUnlocked(@@col@@)?(@@pc@@.skinTone=@@col@@,output(" Each jolt turns your body a little more "+@@col@@.split(" ").pop()),@@chg@@=!0):output(" "+@@pc@@.skinToneLockedMessage()))

Rep [main.js]:
(@@chg@@=!0)||@@pc@@.skinToneLockedMessage()}},{key:"eyeChange"
W:
@@chg@@=!0}},{key:"eyeChange"

# ---------------------------------------------------------------------------
# 3. Pregnancy handler warning could never fire.
# "null === !handler.handlesType" is always false, so a pregnancy handler with no
# type was never reported. Logging only; gameplay is unchanged.
# ---------------------------------------------------------------------------
Rep [main.js]:
null===!@@h@@.handlesType&&
W:
null==@@h@@.handlesType&&

# ---------------------------------------------------------------------------
# 4. Ceria's salon shows "You already have undefined".
# For a hairstyle you already have, the greyed-out button's tooltip should say
# "You already have <style>." 24 of the 31 styles have no second description, so
# the tooltip read "You already have undefined", and it never had a full stop.
# ---------------------------------------------------------------------------
Rep [content_tavros.js]:
null!==(@@t@@="You already have "+@@s@@.hairDescB)&&void 0!==@@t@@?@@t@@:@@s@@.hairDescA+"."
W:
"You already have "+(null!=@@s@@.hairDescB?@@s@@.hairDescB:@@s@@.hairDescA)+"."

# ---------------------------------------------------------------------------
# 5. Lund (Uveto) drains lust twice as fast as meant.
# After one of the submission scenes the game lowers lust in steps of 10 until it
# is 40 or less, stopping early if it can't go lower. The check called
# pc.lust(-10) twice per step, so each step took 20 off and lust could end as low
# as 21 instead of 31 to 40.
# ---------------------------------------------------------------------------
Rep [content_uveto.js]:
if(pc.lust(-10)===pc.lust(-10))break
W:
var tnLustBefore=pc.lust();if(pc.lust(-10)===tnLustBefore)break

# ---------------------------------------------------------------------------
# 6. Phaedra behemoth fight leaves a leftover global.
# The fight stores the two behemoths as window.beheA and window.beheB, but the
# clean-up deletes window.behaB (typo), so beheB was never cleared.
# The same typo is in three places, so this block is repeated three times.
# ---------------------------------------------------------------------------
Rep [content_phaedra.js]:
delete window.beheA,delete window.behaB
W:
delete window.beheA,delete window.beheB

Rep [content_phaedra.js]:
delete window.beheA,delete window.behaB
W:
delete window.beheA,delete window.beheB

Rep [content_phaedra.js]:
delete window.beheA,delete window.behaB
W:
delete window.beheA,delete window.beheB
