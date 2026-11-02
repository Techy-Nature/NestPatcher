Name: Feruze Crew
Author: Techy-Nest
# v2.8 (2026-11-02): puts Feruze in the Crash Landing bar room on Dhaal (button slot 6) once the
#   Farrow quest is done. Needs TN_FeruzeCrew_v2.8.js. Needle has no minified names, so it
#   should match on PC and Android builds of 0.9.168.

Replace [content_dhaal.js]:
window.barWatchTVButton("dhaal",10),!1},window.crashLandingDanceRoomBonus=function(){
With:
window.barWatchTVButton("dhaal",10),window.tnFeruzeBar&&window.tnFeruzeBar(),!1},window.crashLandingDanceRoomBonus=function(){
