Name: Offline Guard
Author: Neston
# TN_OfflineGuard - NestPatcher mod (TiTS 0.9.168), Modv2.9
# Keeps a modded game from talking to the game's servers about your game:
#   - Error reporting is always off. The game's "Automatic Error Reporting" option (Disabled /
#     Automatic / Prompt) can't be switched on: Automatic and Prompt just stay Disabled, the
#     error screen's "Submit Error" button never shows, and the reporter (Sentry) is never
#     started, even if an older options file had it on.
#   - Online cloud saves (Fenoxo account save slots) are off. The cloud toggle in Save/Load
#     does nothing, and the cloud save code can't log in, upload, download or delete. Normal
#     save slots and Save To File / Load From File work as always.
# No switch: this is always on while the mod is installed.
# In-game author: Neston.

Replace [main.js]:
case 3:if(this._sentryState!==this.errorReportingMode){@@g@@.next=7;break}return @@g@@.abrupt("return");case 7:return @@g@@.next=9,this.teardownSentry();case 9:if(this.errorReportingMode!==@@r@@.@@xj@@.Disabled)
With:
case 3:if(this.errorReportingMode=@@r@@.@@xj@@.Disabled,this._sentryState!==this.errorReportingMode){@@g@@.next=7;break}return @@g@@.abrupt("return");case 7:return @@g@@.next=9,this.teardownSentry();case 9:if(this.errorReportingMode!==@@r@@.@@xj@@.Disabled)

Replace [main.js]:
setState({errorReportingMode:@@r@@.@@xj@@.Automatic})
With:
setState({errorReportingMode:@@r@@.@@xj@@.Disabled})

Replace [main.js]:
setState({errorReportingMode:@@r@@.@@xj@@.Prompt})
With:
setState({errorReportingMode:@@r@@.@@xj@@.Disabled})

Replace [main.js]:
getGameOptions().errorReportingMode===@@r@@.@@xj@@.Prompt&&this.addButton(1,"Submit Error"
With:
!1&&this.addButton(1,"Submit Error"

Replace [main.js]:
var @@e@@=getGameOptions();@@e@@.cloudSaves=!@@e@@.cloudSaves,this.updateSaveLoad()
With:
var @@e@@=getGameOptions();@@e@@.cloudSaves=!1,this.updateSaveLoad()

Add Javascript:
(function () {
    "use strict";
    if (window.__tnOfflineGuard) return;
    window.__tnOfflineGuard = true;

    // Backup for anything the patches above don't reach: keep the options off and the cloud
    // save code offline. Runs every few seconds; it only ever turns things off.
    var disabled = null;
    function registry() {
        try {
            var chunks = window.webpackChunktits_html, req = null;
            if (!chunks || typeof chunks.push !== "function") return null;
            chunks.push([["tn-offline-guard-" + Date.now()], {}, function (r) { req = r; }]);
            return req ? req(54014).yq.RegisteredClasses : null;
        } catch (err) { return null; }
    }
    function disabledValue() {
        if (disabled !== null) return disabled;
        try { var R = registry(); if (R && R.GameOptions) disabled = new R.GameOptions().errorReportingMode; } catch (err) {}
        return disabled;
    }
    function guardOptions() {
        var o = null;
        try { o = typeof getGameOptions === "function" ? getGameOptions() : null; } catch (err) {}
        if (!o) return;
        if (o.cloudSaves) o.cloudSaves = false;
        var d = disabledValue();
        if (d === null || d === undefined) return;
        if (o.errorReportingMode !== d) o.errorReportingMode = d;
        if (o._sentryState !== d && typeof o.teardownSentry === "function") { try { o.teardownSentry(); } catch (err) {} }
    }
    function guardCloud() {
        var C = window.CloudSaves;
        if (!C || C.__tnOffline) return;
        var no = function () { return Promise.resolve(false); };
        ["isCloudSaveAvailableAsync", "CanAccessCloudSaves", "GetSlots", "GetSlot", "SetSlot", "DeleteSlot",
            "GetNewWPToken", "ValidateWPToken", "LoadSavedWPToken"].forEach(function (k) { try { C[k] = no; } catch (err) {} });
        try { C.isCloudSaveAvailable = function (cb) { if (typeof cb === "function") cb(false); }; } catch (err) {}
        try { C.tryGetNewWPToken = function (u, p, cb) { if (typeof cb === "function") cb(false); }; } catch (err) {}
        try { C.getSlotSummary = function (cb) { var e = []; for (var i = 0; i < 14; i++) e[i] = { idx: i, charName: "", charGender: "", charClass: "", saveDays: 0, saveTime: "00:00", saveNote: null, savePlanet: "", isEmpty: true, avatar: null, version: 0 }; if (typeof cb === "function") cb(e); }; } catch (err) {}
        try { C.wpToken = null; C.isValidated = false; C.isUsingToken = false; C.cachedIsCloudSaveAvailable = false; } catch (err) {}
        C.__tnOffline = true;
    }
    var ticks = 0;
    (function tick() {
        ticks++;
        try { guardCloud(); } catch (err) {}
        try { guardOptions(); } catch (err) {}
        setTimeout(tick, ticks < 40 ? 250 : 3000);
    })();
})();
