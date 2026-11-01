Name: Stella D'Amore
Author: Kitty
# Recruit from her beach menu. While she is crew, To The Beach skips her. Ship sex reuses her scenes.
# Updated for TiTS 0.9.168 (content_tavros.91bfa1c2.js). The game's internal names moved again:
#   beach RN, bust kN, menu CN, pregnant check IN, look _N, talk HN, pussy MN, ass FN,
#   pregnant sex tx, breed KN, blowjob/get licked WN, walk JN.
#   (0.9.167 had xN, bN, ON, vN, CN, zN, HN, jN, ex, VN, GN, ZN.)

Replace [content_tavros.js]:
function RN(){clearOutput(),kN(),author("Wsan"),void 0===flags.MET_STELLA?
With:
function RN(){if(((window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function")||window.isTnModEnabled("tn.stella"))&&1===flags.TN_STELLA_CREW&&window.tnStellaBeachEmpty)return window.tnStellaBeachEmpty();clearOutput(),kN(),author("Wsan"),void 0===flags.MET_STELLA?

Replace [content_tavros.js]:
function CN(){clearMenu();var e=IN();addButton(0,"Appearance",_N),
With:
function tnStellaExport(){window.tnStellaPussy=MN,window.tnStellaAss=FN,window.tnStellaPreg=tx,window.tnStellaBreed=KN,window.tnStellaBlow=WN,window.tnStellaWalk=JN,window.tnStellaTalk=HN,window.tnStellaLook=_N,window.tnStellaMenu=CN,window.tnStellaPregnant=IN;}tnStellaExport();function CN(){tnStellaExport(),clearMenu();var e=IN();((window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function")||window.isTnModEnabled("tn.stella"))&&1!==flags.TN_STELLA_CREW&&addButton(2,"Recruit",window.tnStellaRecruit,"Recruit","Ask Stella to come live on your ship."),addButton(0,"Appearance",_N),
