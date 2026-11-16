// Fixes for playing on phones (iPhone home-screen app, mobile Safari, Android).
// Loaded after html5game/RetroBowl.js and before the game starts.
(function () {
  // 0) Remember whether this really is a phone/tablet. The touch fix below makes the game think
  //    it is on a Mac, and the game normally gives the free "full" web version to desktop
  //    browsers only, so it uses this flag to keep phones on the normal free version.
  var ua = navigator.userAgent || "";
  window.__rbRealPhone = /iPhone|iPad|iPod|Android/i.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  // 1) Taps did nothing on iOS/Android. When the game sees a phone OS it switches to the
  //    native app's touch-button mode, which does not work in this web build. Report a
  //    desktop OS instead: touches still arrive as pointer input, exactly like the mouse,
  //    so every button and the gameplay controls work.
  if (typeof __u4 === "function" && __u4.prototype && typeof __u4.prototype._OU === "function") {
    var osType = __u4.prototype._OU;
    __u4.prototype._OU = function () {
      var v = osType.apply(this, arguments);
      return v === 3 || v === 4 ? 1 : v; // os_ios / os_android -> os_macosx
    };
  }

  // 1b) On a desktop a click sends both pointer events and mouse events, and the game
  //     listens to both: its "tap to continue" prompts (end of a play, INCOMPLETE, first
  //     down...) react to the mouse release. A finger only sends pointer events, so plays
  //     could be thrown but never finished. Give the game the matching mouse press, move
  //     and release for the primary finger, exactly like a desktop mouse.
  function asMouse(e) {
    return { button: 0, which: 1, pageX: e.pageX, pageY: e.pageY, clientX: e.clientX, clientY: e.clientY,
      target: e.target, preventDefault: function () {}, stopPropagation: function () {} };
  }
  var fingerDown = false;
  window.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "touch" || !e.isPrimary || e.target.id !== "canvas") return;
    var c = e.target;
    fingerDown = true;
    if (c.onmousemove) c.onmousemove(asMouse(e));
    if (c.onmousedown) c.onmousedown(asMouse(e));
  });
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "touch" || !e.isPrimary || !fingerDown) return;
    var c = document.getElementById("canvas");
    if (c && c.onmousemove) c.onmousemove(asMouse(e));
  });
  function fingerUp(e) {
    if (e.pointerType !== "touch" || !e.isPrimary || !fingerDown) return;
    fingerDown = false;
    var c = document.getElementById("canvas");
    if (c && c.onmousemove) c.onmousemove(asMouse(e));
    if (window.onmouseup) window.onmouseup(asMouse(e));
  }
  window.addEventListener("pointerup", fingerUp);
  window.addEventListener("pointercancel", fingerUp);

  // 1c) Diagnostics: record WebGL shader compile / link failures and the GPU, so problems
  //     that only happen on a real phone (e.g. players not being drawn) can be reported
  //     from the mod menu (NFL > SHOW DIAGNOSTICS).
  var glReport = { errors: [], renderer: "", version: "", players: 0 };
  window.__rbDiagnostics = glReport;
  var getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type) {
    var gl = getContext.apply(this, arguments);
    if (gl && /webgl/i.test(String(type)) && !gl.__rbHooked) {
      gl.__rbHooked = true;
      try {
        var dbg = gl.getExtension("WEBGL_debug_renderer_info");
        glReport.renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        glReport.version = gl.getParameter(gl.VERSION);
        var hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        glReport.fragHighp = hp ? hp.precision : 0;
      } catch (e) {}
      var compile = gl.compileShader, link = gl.linkProgram;
      gl.compileShader = function (sh) {
        compile.call(gl, sh);
        try {
          if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
            glReport.errors.push("compile: " + (gl.getShaderInfoLog(sh) || "?").slice(0, 300));
        } catch (e) {}
      };
      gl.linkProgram = function (pr) {
        link.call(gl, pr);
        try {
          if (!gl.getProgramParameter(pr, gl.LINK_STATUS))
            glReport.errors.push("link: " + (gl.getProgramInfoLog(pr) || "?").slice(0, 300));
        } catch (e) {}
      };
    }
    return gl;
  };

  // 1d) Sharp picture on phones and Retina screens. The game sizes its canvas in CSS pixels
  //     (693x390 on an iPhone in landscape) and then renders no larger than that, so on a 3x
  //     screen the pixel art was first shrunk below its real 853x480 size (dropping rows and
  //     columns of pixels) and then stretched 3x by the phone (blurry). Give the canvas the
  //     screen's real pixel count instead, keep it the same size on screen, and translate taps
  //     and clicks to match. The game then renders at its full 853x480 and scales up cleanly.
  var DPR = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
  if (DPR > 1 && typeof window._PX === "function") {
    var setCanvasSize = window._PX;   // the runtime's window_set_size
    window._PX = function (w, h) {
      w = Math.round(Number(w)); h = Math.round(Number(h));
      setCanvasSize(Math.round(w * DPR), Math.round(h * DPR));
      var c = document.getElementById("canvas");
      if (c) { c.style.width = w + "px"; c.style.height = h + "px"; }
    };
    // Taps and clicks: convert the screen position to the bigger canvas before the game sees it.
    var scaleXY = function (x, y) {
      var c = document.getElementById("canvas");
      if (!c || !c.clientWidth) return [x, y];
      var r = c.getBoundingClientRect(), sx = window.scrollX || 0, sy = window.scrollY || 0;
      var L = r.left + sx, T = r.top + sy;
      return [L + (x - L) * (c.width / r.width), T + (y - T) * (c.height / r.height)];
    };
    var asScaled = function (e) {
      var p = scaleXY(e.pageX, e.pageY);
      return { type: e.type, pageX: p[0], pageY: p[1], clientX: p[0], clientY: p[1], button: e.button, buttons: e.buttons,
        which: e.which, pointerId: e.pointerId, pointerType: e.pointerType, isPrimary: e.isPrimary, target: e.target,
        detail: e.detail, wheelDelta: e.wheelDelta,
        preventDefault: function () { if (e.preventDefault) e.preventDefault(); },
        stopPropagation: function () { if (e.stopPropagation) e.stopPropagation(); } };
    };
    var asScaledTouch = function (e) {
      var list = [];
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i], p = scaleXY(t.pageX, t.pageY);
        list.push({ identifier: t.identifier, pageX: p[0], pageY: p[1], clientX: p[0], clientY: p[1] });
      }
      return { type: e.type, changedTouches: list, touches: e.touches, target: e.target,
        preventDefault: function () { e.preventDefault(); }, stopPropagation: function () { e.stopPropagation(); } };
    };
    // the runtime's input handlers: pointer, touch, mouse move / down / up
    [["_hp2", asScaled], ["_0p2", asScaledTouch], ["_HN4", asScaled], ["_JN4", asScaled], ["_EN4", asScaled]].forEach(function (h) {
      var fn = window[h[0]];
      if (typeof fn !== "function") return;
      window[h[0]] = function (e) { return fn.call(this, e && (e.changedTouches || e.pageX != null) ? h[1](e) : e); };
    });
  }

  // 2) Wide phones: the game is drawn at 16:9 and centred, with plain black bars at the sides.
  document.documentElement.style.background = "#000";

  // 3) The game sizes itself once, at startup. If it starts in portrait and the phone is
  //    then turned sideways, it stays tiny. Reload once when that happens.
  function portrait() { return window.innerHeight > window.innerWidth; }
  var startedPortrait = portrait();
  function checkRotation() {
    if (startedPortrait && !portrait()) {
      startedPortrait = false;
      setTimeout(function () { location.reload(); }, 300);
    }
  }
  window.addEventListener("orientationchange", function () { setTimeout(checkRotation, 300); });
  window.addEventListener("resize", checkRotation);

  // Ask the player to turn the phone while it is in portrait.
  var tip = document.createElement("div");
  tip.id = "rotate-tip";
  tip.textContent = "TURN YOUR PHONE SIDEWAYS TO PLAY";
  tip.style.cssText = "position:fixed;inset:0;z-index:20000;display:none;align-items:center;justify-content:center;" +
    "padding:24px;text-align:center;background:#000;color:#fff;font:14px/1.8 'Press Start 2P',monospace";
  document.body.appendChild(tip);
  function updateTip() {
    var touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    tip.style.display = touch && portrait() ? "flex" : "none";
  }
  window.addEventListener("resize", updateTip);
  window.addEventListener("orientationchange", function () { setTimeout(updateTip, 300); });
  updateTip();
})();
