// Drop-in custom art. Put PNGs in the custom/ folder and reload the game; no tools needed.
//
//   custom/logos/<ABBR>.png             team logos, e.g. KC.png, NYG.png, SF.png (see custom/README.txt)
//   custom/trophies/super_bowl.png      trophy in the Super Bowl cutscene
//   custom/trophies/afc.png             trophy in the AFC Champions cutscene
//   custom/trophies/nfc.png             trophy in the NFC Champions cutscene
//   custom/field/super_bowl_field.png   replaces the 4 "RB" marks on the field in the Super Bowl
//
// Must load BEFORE html5game/RetroBowl.js. The game must be opened over http(s) (a local server
// or your host), not by double-clicking index.html, or the browser blocks the image edits.
(function () {
  var ABBR = ["BUF","MIA","NE","NYJ","DEN","KC","LAC","LV","BAL","CIN","CLE","PIT","HOU","IND","JAX","TEN",
    "DAL","NYG","PHI","WAS","ARI","LAR","SF","SEA","CHI","DET","GB","MIN","ATL","CAR","NO","TB"];
  // other common spellings, tried if <ABBR>.png isn't there
  var ALIASES = { LAR: ["LA"], WAS: ["WSH"], JAX: ["JAC"], LV: ["OAK"], LAC: ["SD"], NE: ["NWE"], NO: ["NOR"],
    GB: ["GNB"], KC: ["KAN"], SF: ["SFO"], TB: ["TAM"] };
  var BASE = "custom/";

  // where things live on the logo texture page (html5game/RetroBowl_texture_2.png)
  var FRAME = 64;                  // each team logo frame is 64x64, 8 per row, frame number = team uid
  var LOGO_BOX = 60;               // your logo is fitted inside this box, centred in its frame
  var SHEET_W = 512, SHEET_H = 256;   // must stay the same size as the original page
  // Super Bowl field emblem: written into an empty corner of the main page (RetroBowl_texture_0.png)
  var EMBLEM = { x: 1924, y: 1968, w: 96, h: 72 };

  var RB = window.RBCustom = { abbr: ABBR, logos: [], trophies: {}, emblem: null, customLogoCount: 0, sprites: {} };

  function load(src) {
    return new Promise(function (res) {
      var i = new Image();
      i.onload = function () { res(i.naturalWidth ? i : null); };
      i.onerror = function () { res(null); };
      i.src = src;
    });
  }
  function loadFirst(list) {
    return list.reduce(function (p, src) { return p.then(function (r) { return r || load(src); }); }, Promise.resolve(null));
  }
  function withTimeout(p, ms) {
    return Promise.race([p, new Promise(function (res) { setTimeout(function () { res(null); }, ms); })]);
  }

  var logosP = Promise.all(ABBR.map(function (a) {
    var names = [a].concat(ALIASES[a] || []);
    var urls = [];
    names.forEach(function (n) { urls.push(BASE + "logos/" + n + ".png", BASE + "logos/" + n.toLowerCase() + ".png"); });
    return withTimeout(loadFirst(urls), 4000);
  }));
  var emblemP = withTimeout(load(BASE + "field/super_bowl_field.png"), 4000);
  ["super_bowl", "afc", "nfc"].forEach(function (n) {
    load(BASE + "trophies/" + n + ".png").then(function (img) { RB.trophies[n] = img; });
  });

  // Pixel art that was blown up (e.g. a 22x58 sprite saved at 16x as 352x928) is shrunk back to
  // its real pixels first, so every size of the same sprite looks identical and stays sharp.
  var nativeCache = typeof WeakMap === "function" ? new WeakMap() : null;
  function native(img) {
    if (!img) return null;
    if (img.__native) return img.__native;
    if (nativeCache && nativeCache.has(img)) return nativeCache.get(img);
    var W0 = img.naturalWidth || img.width, H0 = img.naturalHeight || img.height, out = img;
    try {
      if (W0 * H0 <= 4000000) {
        var c = document.createElement("canvas"); c.width = W0; c.height = H0;
        var x = c.getContext("2d"); x.drawImage(img, 0, 0);
        var d = x.getImageData(0, 0, W0, H0).data;
        var same = function (i, j) { return d[i] === d[j] && d[i + 1] === d[j + 1] && d[i + 2] === d[j + 2] && d[i + 3] === d[j + 3]; };
        var factors = [64, 48, 40, 32, 24, 20, 16, 12, 10, 8, 6, 5, 4, 3, 2];
        for (var fi = 0; fi < factors.length; fi++) {
          var k = factors[fi];
          if (W0 % k || H0 % k || W0 / k < 4 || H0 / k < 4) continue;
          var ok = true;
          for (var y = 0; y < H0 && ok; y++) {
            var by = y - (y % k);
            for (var xx = 0; xx < W0; xx++) {
              if (!same((y * W0 + xx) * 4, (by * W0 + (xx - (xx % k))) * 4)) { ok = false; break; }
            }
          }
          if (!ok) continue;
          var n = document.createElement("canvas"); n.width = W0 / k; n.height = H0 / k;
          var nx = n.getContext("2d"); nx.imageSmoothingEnabled = false;
          nx.drawImage(img, 0, 0, W0, H0, 0, 0, n.width, n.height);
          n.naturalWidth = n.width; n.naturalHeight = n.height; n.pixelArt = true; n.blowUp = k;
          out = n;
          break;
        }
      }
    } catch (e) { /* can't read pixels (opened as a file): use it as is */ }
    if (out === img && W0 <= 128 && H0 <= 128) img.pixelArt = true;   // small images are treated as pixel art
    if (nativeCache) nativeCache.set(img, out); else img.__native = out;
    return out;
  }
  RB.native = native;

  // How big to draw art inside a box: pixel art gets the largest whole-number scale that fits (sharp
  // pixels); if even 1x is too big, or it's a photo/large image, it is shrunk smoothly to fit.
  function fitSize(img, bw, bh) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    var s = Math.min(bw / w, bh / h);
    if (img.pixelArt && s >= 1) s = Math.floor(s);
    return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)), s: s };
  }
  RB.fitSize = function (img, bw, bh) { return fitSize(native(img), bw, bh); };

  // draw art into a box keeping its shape (centred), sharp for pixel art, smooth when shrinking
  function fit(ctx, img, bx, by, bw, bh, alignBottom) {
    img = native(img);
    var f = fitSize(img, bw, bh);
    var src = img, sw = img.naturalWidth || img.width, sh = img.naturalHeight || img.height;
    if (f.s < 1) {   // shrink big art in halves so it stays clean
      while (sw / 2 >= f.w && sh / 2 >= f.h) {
        var c = document.createElement("canvas"); c.width = Math.round(sw / 2); c.height = Math.round(sh / 2);
        var cx = c.getContext("2d"); cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = "high";
        cx.drawImage(src, 0, 0, c.width, c.height);
        src = c; sw = c.width; sh = c.height;
      }
    }
    ctx.imageSmoothingEnabled = f.s < 1; ctx.imageSmoothingQuality = "high";
    var dy = alignBottom ? by + bh - f.h : by + (bh - f.h) / 2;
    ctx.drawImage(src, 0, 0, sw, sh, Math.round(bx + (bw - f.w) / 2), Math.round(dy), f.w, f.h);
    return f;
  }
  RB.fit = fit;

  function pageBuilder(build) {
    var p = null;
    return function (origUrl, setSrc) {
      if (p) return p;
      p = new Promise(function (res) {
        var orig = new Image();
        orig.onload = function () {
          build(orig).then(function (canvas) {
            if (!canvas) return res(origUrl);
            try {
              canvas.toBlob(function (blob) { res(blob ? URL.createObjectURL(blob) : origUrl); }, "image/png");
            } catch (e) {
              console.warn("custom-assets: can't edit textures here (open the game over http, not as a file)", e);
              res(origUrl);
            }
          }, function () { res(origUrl); });
        };
        orig.onerror = function () { res(origUrl); };
        setSrc.call(orig, origUrl);
      });
      return p;
    };
  }

  // logo page: your logos drawn over the built-in badges, same 512x256 size
  var buildLogos = pageBuilder(function (orig) {
    return logosP.then(function (logos) {
      if (!logos.some(Boolean)) return null;   // nothing to change
      var c = document.createElement("canvas"); c.width = SHEET_W; c.height = SHEET_H;
      var x = c.getContext("2d");
      x.drawImage(orig, 0, 0);
      logos.forEach(function (img, uid) {
        RB.logos[uid] = img;
        if (!img) return;
        RB.customLogoCount++;
        var fx = (uid % 8) * FRAME, fy = Math.floor(uid / 8) * FRAME, pad = (FRAME - LOGO_BOX) / 2;
        x.clearRect(fx, fy, FRAME, FRAME);
        fit(x, img, fx + pad, fy + pad, LOGO_BOX, LOGO_BOX);
      });
      return c;
    });
  });

  // main page: add the Super Bowl field emblem in an empty corner
  var buildMain = pageBuilder(function (orig) {
    return emblemP.then(function (emblem) {
      RB.emblem = emblem;
      if (!emblem) return null;
      var c = document.createElement("canvas"); c.width = orig.naturalWidth; c.height = orig.naturalHeight;
      var x = c.getContext("2d");
      x.drawImage(orig, 0, 0);
      x.clearRect(EMBLEM.x, EMBLEM.y, EMBLEM.w, EMBLEM.h);
      fit(x, emblem, EMBLEM.x, EMBLEM.y, EMBLEM.w, EMBLEM.h);
      RB.emblemReady = true;
      return c;
    });
  });

  // swap texture pages for edited copies before the game uses them
  var desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  Object.defineProperty(HTMLImageElement.prototype, "src", {
    configurable: true, enumerable: desc.enumerable, get: desc.get,
    set: function (v) {
      if (typeof v === "string" && !this.__rbCustom) {
        var b = /RetroBowl_texture_2\.png(\?|$)/.test(v) ? buildLogos : /RetroBowl_texture_0\.png(\?|$)/.test(v) ? buildMain : null;
        if (b) {
          var img = this; img.__rbCustom = true;
          b(v, desc.set).then(function (url) { desc.set.call(img, url); });
          return;
        }
      }
      desc.set.call(this, v);
    }
  });

  // ---------- Super Bowl field ----------
  // field "RB" marks, in field-sprite pixels (the game draws the field at 2x)
  var MARKS = [
    { x: 377, y: 36, w: 48, h: 23, from: 200 },  { x: 377, y: 176, w: 48, h: 23, from: 200 },
    { x: 877, y: 36, w: 48, h: 23, from: -200 }, { x: 877, y: 176, w: 48, h: 23, from: -200 }
  ];
  RB.marks = MARKS;

  // Draw part of a texture page through one of the game's own sprites: point an existing frame at
  // another rectangle just for this one draw call, then put it back. (Adding new sprites to the
  // game's sprite list breaks its logo drawing, so this never adds any.)
  // rect: {x, y, w, h} on the same texture page as the frame. Draws with its top-left at (x, y).
  RB.drawRect = function (drawSprite, sprIndex, frameIndex, rect, x, y, xs, ys, alpha) {
    var list = window._Te2 && window._Te2._e1, sp = list && list[sprIndex];
    if (!sp || !sp._Ud2 || !sp._Ud2.length) return;
    var f = sp._Ud2[((frameIndex % sp._Ud2.length) + sp._Ud2.length) % sp._Ud2.length];
    var keep = { x: f.x, y: f.y, _a2: f._a2, _b2: f._b2, _gh: f._gh, _hh: f._hh, _ih: f._ih, _jh: f._jh };
    try {
      f.x = rect.x; f.y = rect.y; f._a2 = f._ih = rect.w; f._b2 = f._jh = rect.h;
      f._gh = 0; f._hh = 0;
      // the sprite's origin is subtracted when drawing, so add it back to land on (x, y)
      drawSprite(null, sprIndex, frameIndex, x + sp._G1 * xs, y + sp._H1 * ys, xs, ys, 0, 16777215, alpha == null ? 1 : alpha);
    } finally {
      for (var k in keep) f[k] = keep[k];
    }
  };
  RB.EMBLEM = EMBLEM;
})();
