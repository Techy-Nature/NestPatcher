Name: Offline Guard
Author: Neston
# TN_OfflineGuard - NestPatcher mod (TiTS 0.9.168), Modv2.9
# Keeps a modded game from talking to the game's servers about your game:
#   - Error reporting is always off. The game's "Automatic Error Reporting" option (Disabled /
#     Automatic / Prompt) can't be switched on: Automatic and Prompt just stay Disabled, the
#     reporter (Sentry) is never started, even if an older options file had it on.
#   - The error screen's "Submit Error" button is now "Report Error": it copies the error
#     message to your clipboard and opens the NestPatcher Error Reports channel on Neston's
#     Stoat server (https://stt.gg/Fqfsc3bR). Nothing is sent by itself; you paste it there.
#     The crash text's "create a bug report on the forums here" (Fenoxo's forum) now says to
#     report it in that channel, and "here" links there too. (The text shows up twice in the
#     game file, so that patch is listed twice.)
#   - Online cloud saves (Fenoxo account save slots) are off. The cloud toggle in Save/Load
#     does nothing, and the cloud save code can't log in, upload, download or delete. Normal
#     save slots and Save To File / Load From File work as always.
#   - The game's update checker is off: it never asks Fenoxo's site for the newest version, the
#     first-run "UPDATE NOTIFICATIONS" question is skipped, and "Automatic Update Checking" stays
#     off. News about new mod packs comes from our own Changelog (changelog.md) instead.
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
getGameOptions().errorReportingMode===@@r@@.@@xj@@.Prompt&&this.addButton(1,"Submit Error",(function(){@@s@@.@@tb@@(@@e@@),@@o@@.setButtonDisabled(1)}),"Submit Error","Submit an error to our internal error reporting system. This will provide the error message to us automatically and allow us to better keep track of this issue!")
With:
this.addButton(1,"Report Error",(function(){window.tnReportError?window.tnReportError():window.open("https://stt.gg/Fqfsc3bR","_blank")}),"Report Error","Copies the error message and opens the NestPatcher Error Reports channel on Neston’s Stoat server, where the mods can actually get fixed. Nothing is sent automatically: paste the error there and say what you did before it happened.")

Replace [main.js]:
var @@e@@=getGameOptions();@@e@@.cloudSaves=!@@e@@.cloudSaves,this.updateSaveLoad()
With:
var @@e@@=getGameOptions();@@e@@.cloudSaves=!1,this.updateSaveLoad()

Replace [main.js]:
if(!1!==getGameOptions().updateChecking){if(!@@t@@&&this.lastUpdateCheckTime)
With:
if(!1){if(!@@t@@&&this.lastUpdateCheckTime)

Replace [main.js]:
!1===@@t@@.hasPromptedForUpdateCheck&&(@@t@@.hasPromptedForUpdateCheck=!0,window.showDialog(
With:
!1===(@@t@@.updateChecking=!1,@@t@@.hasPromptedForUpdateCheck=!0,!0)&&(@@t@@.hasPromptedForUpdateCheck=!0,window.showDialog(

Replace [main.js]:
A critical error has occurred. Please create a bug report on the forums
With:
A critical error has occurred. This game is modded, so please report it in the NestPatcher Error Reports channel on Neston’s Stoat server

Replace [main.js]:
A critical error has occurred. Please create a bug report on the forums
With:
A critical error has occurred. This game is modded, so please report it in the NestPatcher Error Reports channel on Neston’s Stoat server

Replace [main.js]:
textHyperlink("here","https://forum.fenoxo.com/forums/titsbugs/")
With:
textHyperlink("here","https://stt.gg/Fqfsc3bR")

Add Javascript:
(function () {
    "use strict";
    if (window.__tnOfflineGuard) return;
    window.__tnOfflineGuard = true;

    // Backup for anything the patches above don't reach: keep the options off (error reports,
    // cloud saves, update checks) and the cloud save code offline. Runs every few seconds; it only ever turns things off.
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
        if (o.updateChecking) { o.updateChecking = false; try { window.game.initUpdateChecks(false); } catch (err) {} }
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
    // "Report Error" on the game's error screen: copy the error, then open our Stoat channel.
    var REPORT_URL = "https://stt.gg/Fqfsc3bR";
    function copyText(text) {
        try {
            var ta = document.createElement("textarea");
            ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;";
            document.body.appendChild(ta); ta.select();
            var ok = document.execCommand && document.execCommand("copy");
            ta.remove();
            if (ok) return true;
        } catch (err) {}
        try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text); return true; } } catch (err) {}
        return false;
    }
    function openLink(url) {
        try { if (window.cordova && window.cordova.InAppBrowser && typeof window.cordova.InAppBrowser.open === "function") { window.cordova.InAppBrowser.open(url, "_system"); return; } } catch (err) {}
        try {
            // Same kind of link the game's own text uses (target=_blank opens the system browser).
            var a = document.createElement("a");
            a.href = url; a.target = "_blank"; a.rel = "noopener";
            a.style.display = "none"; document.body.appendChild(a); a.click(); a.remove();
            return;
        } catch (err) {}
        try { window.open(url, "_blank"); } catch (err) {}
    }
    window.tnReportError = function () {
        var text = "";
        try { text = String((window.ui && ui.state && ui.state.preText) || ""); } catch (err) {}
        text = text.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
        var copied = text ? copyText(text) : false;
        openLink(REPORT_URL);
        try {
            if (typeof output === "function") output("\n\n<b>" + (copied ? "The error message is copied. " : "") + "Opening the NestPatcher Error Reports channel on Neston’s Stoat server. Paste the error there and say what you did right before it happened.</b> If nothing opened, go to " + REPORT_URL);
        } catch (err) {}
    };
    window.tnReportErrorUrl = REPORT_URL;

    var ticks = 0;
    (function tick() {
        ticks++;
        try { guardCloud(); } catch (err) {}
        try { guardOptions(); } catch (err) {}
        setTimeout(tick, ticks < 40 ? 250 : 3000);
    })();
})();
