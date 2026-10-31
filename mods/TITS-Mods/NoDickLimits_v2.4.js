/* No Dick Limits
 * Player cock-fit gates treat every cock as able to fit. Hole checks on the player do the same.
 * penisRouter no longer marks a cock TOO BIG, TOO SMALL, TOO LONG, TOO SHORT, TOO THICK, or TOO THIN.
 * Length wording in scenes is unchanged. A check that reads longestCockLength or biggestCockLength still applies.
 */
(function () {
    var patchedProto = null;
    var MOD_ID = "tn.noDickLimits";
    function enabled() {
        return (window.tnModMenuActive!==true||typeof window.isTnModEnabled!=="function") || window.isTnModEnabled(MOD_ID);
    }
    function register() {
        if ((window.tnModMenuActive!==true||typeof window.registerModMenu!=="function")) return;
        window.registerModMenu({ id: MOD_ID, name: "No Dick Limits", author: "Kitty",
            description: "Ignore player size-fit restrictions and loosen penisRouter limits.",
            supportsToggle: true });
    }


    function isPlayer(creature) {
        return !!(creature && typeof creature.isPlayer === "function" && creature.isPlayer());
    }

    function installProto(proto) {
        if (!proto || proto.__tnNoDickLimits || typeof proto.cocksThatFit !== "function") return;
        proto.__tnNoDickLimits = true;
        var origFit = proto.cocksThatFit;
        proto.cocksThatFit = function () {
            var list = origFit.apply(this, arguments);
            if (!enabled()) return list;
            if (!this.cocks || !this.cocks.length) return list || [];
            list = list ? list.slice() : [];
            var have = {};
            var i;
            for (i = 0; i < list.length; i++) have[list[i]] = true;
            var extra = [];
            for (i = 0; i < this.cocks.length; i++) if (!have[i]) extra.push(i);
            var self = this;
            extra.sort(function (a, b) {
                return self.cockVolume(a, true) - self.cockVolume(b, true);
            });
            return list.concat(extra);
        };
        if (typeof proto.cuntThatFits === "function") {
            var origCunt = proto.cuntThatFits;
            proto.cuntThatFits = function () {
                var idx = origCunt.apply(this, arguments);
                if (!enabled() || idx >= 0 || !isPlayer(this) || !this.vaginas || !this.vaginas.length) return idx;
                var best = 0;
                for (var v = 1; v < this.vaginas.length; v++) {
                    if (this.vaginalCapacity(v) > this.vaginalCapacity(best)) best = v;
                }
                return best;
            };
        }
        if (typeof proto.smallestCockVolume === "function") {
            var origSmall = proto.smallestCockVolume;
            proto.smallestCockVolume = function () {
                var real = origSmall.apply(this, arguments);
                if (!enabled() || !isPlayer(this) || !(real > 1)) return real;
                return 1;
            };
        }
    }

    function findProto(obj) {
        var p = Object.getPrototypeOf(obj);
        while (p && p !== Object.prototype) {
            if (Object.prototype.hasOwnProperty.call(p, "cocksThatFit")) return p;
            p = Object.getPrototypeOf(p);
        }
        return null;
    }

    function rebind(obj) {
        if (!obj || !patchedProto || obj.__tnNoDickBound) return;
        if (typeof obj.cocksThatFit !== "function") return;
        obj.__tnNoDickBound = true;
        obj.cocksThatFit = patchedProto.cocksThatFit.bind(obj);
        if (isPlayer(obj)) {
            if (patchedProto.cuntThatFits) obj.cuntThatFits = patchedProto.cuntThatFits.bind(obj);
            if (patchedProto.smallestCockVolume) obj.smallestCockVolume = patchedProto.smallestCockVolume.bind(obj);
        }
    }

    function loosenRouter() {
        if (typeof window.penisRouter === "function" && !window.penisRouter.__tnNoDick) {
            var orig = window.penisRouter;
            var wrapped = function (scene, maxVolume, straponAllowed) {
                if (!enabled()) return orig.apply(this, arguments);
                if (arguments.length > 4) return orig.call(this, scene, Infinity, straponAllowed, 0, arguments[4]);
                return orig.call(this, scene, Infinity, straponAllowed, 0);
            };
            wrapped.__tnNoDick = true;
            window.penisRouter = wrapped;
        }
        if (typeof window.penisRouterObj === "function" && !window.penisRouterObj.__tnNoDick) {
            var origObj = window.penisRouterObj;
            var wrappedObj = function (opts) {
                if (!enabled()) return origObj.apply(this, arguments);
                if (opts) {
                    var owner = opts.cockOwner || window.pc;
                    if (!opts.cockOwner || isPlayer(owner)) {
                        opts = Object.assign({}, opts);
                        opts.maxVolume = Infinity;
                        opts.minVolume = 0;
                        opts.maxLength = Infinity;
                        opts.minLength = 0;
                        opts.maxThickness = Infinity;
                        opts.minThickness = 0;
                    }
                }
                return origObj.call(this, opts);
            };
            wrappedObj.__tnNoDick = true;
            window.penisRouterObj = wrappedObj;
        }
    }

    function tick() {
        try {
            register();
            if (typeof pc === "undefined" || !pc || typeof pc.cocksThatFit !== "function") return;
            if (!patchedProto) {
                var proto = findProto(pc);
                if (!proto) return;
                installProto(proto);
                patchedProto = proto;
                if (typeof window.autobind === "function" && !window.autobind.__tnNoDick) {
                    var origAuto = window.autobind;
                    var wrappedAuto = function (creature) {
                        var result = origAuto.apply(this, arguments);
                        try { rebind(creature); } catch (err) {}
                        return result;
                    };
                    wrappedAuto.__tnNoDick = true;
                    window.autobind = wrappedAuto;
                }
            }
            loosenRouter();
            rebind(pc);
            if (typeof chars !== "undefined" && chars) {
                for (var id in chars) rebind(chars[id]);
            }
            if (typeof enemy !== "undefined" && enemy) rebind(enemy);
        } catch (err) {}
    }

    setInterval(tick, 1000);
    tick();
})();
