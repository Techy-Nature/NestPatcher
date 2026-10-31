Name: Stella D'Amore
Author: Kitty
# Recruit from her beach menu. While she is crew, To The Beach skips her. Ship sex reuses her scenes.
# Updated for TiTS 0.9.167 (content_tavros.b2e87509.js). The game's internal names moved:
#   beach xN, bust bN, menu ON, pregnant check vN, look CN, talk zN, pussy HN, ass jN,
#   pregnant sex ex, breed VN, blowjob/get licked GN, walk ZN.

Replace [content_tavros.js]:
function xN(){clearOutput(),bN(),author("Wsan"),void 0===flags.MET_STELLA?
With:
function xN(){if(((window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function")||window.isTnModEnabled("tn.stella"))&&1===flags.TN_STELLA_CREW&&window.tnStellaBeachEmpty)return window.tnStellaBeachEmpty();clearOutput(),bN(),author("Wsan"),void 0===flags.MET_STELLA?

Replace [content_tavros.js]:
function ON(){clearMenu();var e=vN();addButton(0,"Appearance",CN),
With:
function tnStellaExport(){window.tnStellaPussy=HN,window.tnStellaAss=jN,window.tnStellaPreg=ex,window.tnStellaBreed=VN,window.tnStellaBlow=GN,window.tnStellaWalk=ZN,window.tnStellaTalk=zN,window.tnStellaLook=CN,window.tnStellaMenu=ON,window.tnStellaPregnant=vN;}tnStellaExport();function ON(){tnStellaExport(),clearMenu();var e=vN();((window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function")||window.isTnModEnabled("tn.stella"))&&1!==flags.TN_STELLA_CREW&&addButton(2,"Recruit",window.tnStellaRecruit,"Recruit","Ask Stella to come live on your ship."),addButton(0,"Appearance",CN),
