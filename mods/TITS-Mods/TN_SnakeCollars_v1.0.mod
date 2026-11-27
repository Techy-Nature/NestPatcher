# TN_SnakeCollars v1.0 - NestPatcher mod (TiTS 0.9.169), Modv3.1. Desktop and Android.
# Collar the Blue Viper (the blue slyveren in the wall at Cherry's Tap-Hall on Zheng Shi)
# with Urbolg's slave collar, and keep the slavebreaker's own collar scene working when
# the Blue Viper got the collar first.
#   - Urbolg (hangar): "Viper Collar" buys the slave collar sitting on his workstation.
#     He moves its registration from him to your codex (100,000 credits).
#   - Once that one is gone: "Another Collar" has him build another slave collar just
#     like it (ready in 10 hours, 150,000 credits).
#   - The Blue Viper: "Collar Her" whenever you carry one of his slave collars. She calls
#     you Master from then on, stays in Cherry's wall, can't hypnotize you any more and
#     serves you for free.
#   - The slavebreaker: her own "Collar Her" scene is the game's. It takes Urbolg's slave
#     collars too, so she can have the next one if the Blue Viper got the first.
#   - Stats: the Blue Viper's line says when she wears your collar.
# Needs TN_SnakeCollars_v1.0.js (the scenes, the menus and the collar count).
# @@x@@ is a NestPatcher wildcard, so each block matches the PC and Android builds.
# Written by Claude at TechyNest's behest. Checked against the 0.9.169 desktop files.

# SnakeCollars part 1 of 7: the Blue Viper's booth, once she wears your collar
Rep [content_zhengshi.js]:
addButton(@@e@@++,"Blue Viper",(function(){clearOutput(),
W:
addButton(@@e@@++,"Blue Viper",(function(){if(window.tnSnakeCollar&&window.tnSnakeCollar.viperCollared())return window.tnSnakeCollar.viperBooth();clearOutput(),

# SnakeCollars part 2 of 7: "Collar Her" in the Blue Viper's menu
Rep [content_zhengshi.js]:
}addButton(14,"Leave",@@a@@,"Leave",@@e@@)}),"Blue Viper"
W:
}window.tnSnakeCollar&&window.tnSnakeCollar.viperButton(2),addButton(14,"Leave",@@a@@,"Leave",@@e@@)}),"Blue Viper"

# SnakeCollars part 3 of 7: Urbolg's "Viper Collar" / "Another Collar" button
Rep [content_zhengshi.js]:
it’s probably not ready yet.")),addButton(14,"Leave",mainGameMenu)}
W:
it’s probably not ready yet.")),window.tnSnakeCollar&&window.tnSnakeCollar.urbolgButton(10),addButton(14,"Leave",mainGameMenu)}

# SnakeCollars part 4 of 7: his workstation collar is gone for a while after he hands it over
Rep [content_zhengshi.js]:
void 0!==flags.URBY_COLLAR_FUN?addButton(5,"Slave Collar",
W:
window.tnSnakeCollar&&window.tnSnakeCollar.workbenchGone()?window.tnSnakeCollar.workbenchGoneButton(5):void 0!==flags.URBY_COLLAR_FUN?addButton(5,"Slave Collar",

# SnakeCollars part 5 of 7: the slavebreaker's "Collar Her" counts the collars you carry
Rep [content_zhengshi.js]:
!flags.SLYV_COLLAR_TS&&flags.SLAVEBREAKER_COLLAR_BOUGHT&&(window.fullCrew()
W:
!flags.SLYV_COLLAR_TS&&(window.tnSnakeCollar&&window.tnSnakeCollar.on()?window.tnSnakeCollar.slavebreakerHas():flags.SLAVEBREAKER_COLLAR_BOUGHT)&&(window.fullCrew()

# SnakeCollars part 6 of 7: using a collar on the slavebreaker takes it from your gear
Rep [content_zhengshi.js]:
window.slaveBreakerUseCollar=function(){
W:
window.slaveBreakerUseCollar=function(){window.tnSnakeCollar&&window.tnSnakeCollar.slavebreakerUse();

# SnakeCollars part 7 of 7: Stats > Blue Viper
Rep [main.js]:
,@@bS@@("Blue Viper",@@Ii@@)}
W:
,window.tnSnakeCollar&&(@@Ii@@=window.tnSnakeCollar.statsLine(@@Ii@@)),@@bS@@("Blue Viper",@@Ii@@)}
