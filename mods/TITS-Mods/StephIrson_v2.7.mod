Name: Steph Irson on Tavros
Author: Kitty
# Needles updated for TiTS 0.9.168 (2026-11-01: ED->ND, Bj->Ej, vj->Ij); needs StephIrson_v2.7.js.
# First meeting is automatic on MERCHANT'S THOROUGHFARE2, the tile east of the Merchant Deck lift. Sex scenes are added when the scene writer finishes.

Replace [content_tavros.js]:
v.runOnEnter=function(){return output(textify(ND||(ND=(0,Gt.Z)(["The busy merchant’s deck sprawls out before you.
With:
v.runOnEnter=function(){if((!window.tnStephEnabled||window.tnStephEnabled())&&window.tnStephAuto&&window.tnStephAuto())return!0;return output(textify(ND||(ND=(0,Gt.Z)(["The busy merchant’s deck sprawls out before you.

Replace [content_tavros.js]:
))),!!Ej()||tavrosMerchantEncounters()},o.addRoom(v);var I=new Ij.du;I.index="SHEAR BEAUTY"
With:
))),!!Ej()||tavrosMerchantEncounters(),(!window.tnStephEnabled||window.tnStephEnabled())&&window.tnStephDeckButton&&window.tnStephDeckButton()},o.addRoom(v);var I=new Ij.du;I.index="SHEAR BEAUTY"

Add Javascript:
(function () {
    window.tnStephEnabled = function () {
        return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled("tn.steph-irson");
    };
    function register() {
        if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return false;
        window.registerModMenu({
            id: "tn.steph-irson",
            name: "Steph Irson",
            author: "Kitty",
            description: "Steph's Tavros merchant encounter and deck option. Disabling hides the encounter hook; existing save progress remains.",
            supportsToggle: true
        });
        return true;
    }
    if (!register()) {
        var tries = 0;
        var timer = setInterval(function () {
            if (register() || ++tries >= 150) clearInterval(timer);
        }, 200);
    }
})();
