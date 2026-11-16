// Championship cutscenes: plays after your team wins its conference (AFC / NFC champions)
// and after it wins the Super Bowl. Loaded last, after mod-menu.js.
//
// Swappable art:
//   img/trophy.png                  - the trophy (any size, transparent background)
//   html5game/RetroBowl_texture_2.png - team badges (rebuild with tools/nfl/build_logos.py)
(function () {
  var W = 480, H = 270; // logical pixel size of the cutscene

  // uid -> [primary, secondary]  (index == team uid in html5game/Teams.txt)
  var COLORS = [
    ["#00338d", "#c60c30"], ["#008e97", "#fc4c02"], ["#002244", "#c60c30"], ["#125740", "#ffffff"],
    ["#fb4f14", "#002244"], ["#e31837", "#ffb81c"], ["#0080c6", "#ffc20e"], ["#000000", "#a5acaf"],
    ["#241773", "#9e7c0c"], ["#fb4f14", "#000000"], ["#311d00", "#ff3c00"], ["#101820", "#ffb612"],
    ["#03202f", "#a71930"], ["#002c5f", "#ffffff"], ["#006778", "#d7a22a"], ["#0c2340", "#4b92db"],
    ["#003594", "#869397"], ["#0b2265", "#a71930"], ["#004c54", "#a5acaf"], ["#5a1414", "#ffb612"],
    ["#97233f", "#ffb612"], ["#003594", "#ffd100"], ["#aa0000", "#b3995d"], ["#002244", "#69be28"],
    ["#0b162a", "#c83803"], ["#0076b6", "#b0b7bc"], ["#203731", "#ffb612"], ["#4f2683", "#ffc62f"],
    ["#a71930", "#000000"], ["#0085ca", "#101820"], ["#101820", "#d3bc8d"], ["#d50a0a", "#34302b"]
  ];
  var NAMES = ["Buffalo Bills", "Miami Dolphins", "New England Patriots", "New York Jets",
    "Denver Broncos", "Kansas City Chiefs", "Los Angeles Chargers", "Las Vegas Raiders",
    "Baltimore Ravens", "Cincinnati Bengals", "Cleveland Browns", "Pittsburgh Steelers",
    "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Tennessee Titans",
    "Dallas Cowboys", "New York Giants", "Philadelphia Eagles", "Washington Commanders",
    "Arizona Cardinals", "Los Angeles Rams", "San Francisco 49ers", "Seattle Seahawks",
    "Chicago Bears", "Detroit Lions", "Green Bay Packers", "Minnesota Vikings",
    "Atlanta Falcons", "Carolina Panthers", "New Orleans Saints", "Tampa Bay Buccaneers"];

  var ABBR = ["BUF","MIA","NE","NYJ","DEN","KC","LAC","LV","BAL","CIN","CLE","PIT","HOU","IND","JAX","TEN",
    "DAL","NYG","PHI","WAS","ARI","LAR","SF","SEA","CHI","DET","GB","MIN","ATL","CAR","NO","TB"];
  var FONT = "'Press Start 2P', monospace";
  var KEY = "rb_cutscenes_on";

  function enabled() {
    try { return localStorage.getItem(KEY) !== "0"; } catch (e) { return true; }
  }
  function setEnabled(on) {
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
  }

  // ---------- art ----------
  var trophyImg = new Image();
  trophyImg.src = "img/trophy.png";
  var badgeSheet = new Image();
  badgeSheet.src = "html5game/RetroBowl_texture_2.png";

  function badge(ctx, uid, cx, cy, size) {
    if (!badgeSheet.complete || !badgeSheet.naturalWidth) return;
    ctx.drawImage(badgeSheet, (uid % 8) * 64, Math.floor(uid / 8) * 64, 64, 64,
      Math.round(cx - size / 2), Math.round(cy - size / 2), size, size);
  }

  function hexRgb(h) {
    h = h.replace("#", "");
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function shade(h, f) {
    var c = hexRgb(h);
    return "rgb(" + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v * f))); }).join(",") + ")";
  }
  // make sure a team colour shows up against a dark background
  function bright(h) {
    var c = hexRgb(h), l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    return l < 60 ? shade(h, 60 / Math.max(l, 8)) : h;
  }

  function rnd(seed) { // small deterministic random so crowds don't flicker
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  function text(ctx, str, x, y, size, color, align) {
    ctx.font = size + "px " + FONT;
    ctx.textAlign = align || "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    for (var dx = -2; dx <= 2; dx += 2)
      for (var dy = -2; dy <= 2; dy += 2) if (dx || dy) ctx.fillText(str, x + dx, y + dy);
    ctx.fillText(str, x + 2, y + 3);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function sky(ctx, t, night) {
    var g = ctx.createLinearGradient(0, 0, 0, 150);
    if (night) { g.addColorStop(0, "#050816"); g.addColorStop(1, "#1b2350"); }
    else { g.addColorStop(0, "#1e3c8c"); g.addColorStop(1, "#f08a4b"); }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 150);
    if (night) {
      for (var i = 0; i < 60; i++) {
        var on = Math.sin(t * 3 + i * 7) > -0.6;
        if (!on) continue;
        ctx.fillStyle = i % 5 ? "#9fb0ff" : "#ffffff";
        ctx.fillRect(Math.floor(rnd(i) * W), Math.floor(rnd(i + 99) * 70), 1, 1);
      }
    }
  }

  function stadium(ctx, t, prim, sec, flashes) {
    // light towers
    [40, 440].forEach(function (x) {
      ctx.fillStyle = "#2a2f45"; ctx.fillRect(x - 2, 30, 4, 70);
      ctx.fillStyle = "#fffbe0"; ctx.fillRect(x - 12, 24, 24, 8);
      ctx.fillStyle = "rgba(255,250,210,0.08)";
      ctx.beginPath(); ctx.moveTo(x - 12, 32); ctx.lineTo(x + 12, 32); ctx.lineTo(x + 90, 160); ctx.lineTo(x - 90, 160); ctx.fill();
    });
    // stands
    ctx.fillStyle = "#1a1d2b";
    ctx.fillRect(0, 92, W, 58);
    var cols = [prim, sec, "#d9d9d9", "#8a6f5a", "#c99a7a", prim];
    for (var row = 0; row < 12; row++) {
      var y = 96 + row * 4;
      for (var x = (row % 2) * 2; x < W; x += 4) {
        var s = row * 1000 + x;
        var bob = Math.sin(t * 9 + s) > 0.3 ? -1 : 0;
        ctx.fillStyle = cols[Math.floor(rnd(s) * cols.length)];
        ctx.fillRect(x, y + bob, 2, 2);
        if (flashes && rnd(s + Math.floor(t * 12)) > 0.993) {
          ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 1, y - 1, 4, 4);
        }
      }
    }
    // wall with team colour band
    ctx.fillStyle = prim; ctx.fillRect(0, 144, W, 6);
    ctx.fillStyle = sec; ctx.fillRect(0, 146, W, 2);
  }

  function field(ctx) {
    for (var y = 150; y < H; y += 10) {
      ctx.fillStyle = (y / 10) % 2 ? "#2f8a34" : "#287a2e";
      ctx.fillRect(0, y, W, 10);
    }
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (var i = 0; i < 9; i++) {
      var yy = 150 + i * i * 1.6 + i * 2;
      if (yy < H) ctx.fillRect(0, Math.round(yy), W, 1);
    }
  }

  function scoreboard(ctx, line1, line2) {
    ctx.fillStyle = "#111"; ctx.fillRect(170, 18, 140, 46);
    ctx.fillStyle = "#333"; ctx.fillRect(172, 20, 136, 42);
    ctx.fillStyle = "#555"; ctx.fillRect(236, 64, 8, 28);
    text(ctx, line1, 240, 32, 10, "#ffcc33");
    text(ctx, line2, 240, 50, 8, "#ffffff");
  }

  // simple original pixel footballer, s = pixel scale
  function player(ctx, x, y, s, prim, sec, phase, armsUp, facing) {
    var jump = Math.max(0, Math.sin(phase)) * 6 * s;
    y = Math.round(y - jump);
    function p(px, py, w, h, c) {
      ctx.fillStyle = c;
      var xx = facing < 0 ? x - (px + w) * s : x + px * s;
      ctx.fillRect(Math.round(xx), y + py * s, w * s, h * s);
    }
    // legs / pants / socks
    var kick = Math.sin(phase * 2) > 0 ? 1 : 0;
    p(-3, 12, 2, 4, "#e6e6e6"); p(1, 12, 2, 4, "#e6e6e6");
    p(-3, 16, 2, 2 + kick, prim); p(1, 16, 2, 3 - kick, prim);
    p(-3, 18 + kick, 2, 1, "#111"); p(1, 19 - kick, 2, 1, "#111");
    // jersey
    p(-4, 5, 8, 7, prim);
    p(-4, 8, 8, 1, sec);
    p(-5, 5, 1, 3, prim); p(4, 5, 1, 3, prim); // shoulder pads
    // arms
    if (armsUp) { p(-6, 0, 2, 5, prim); p(4, 0, 2, 5, prim); p(-6, -1, 2, 1, "#c99a7a"); p(4, -1, 2, 1, "#c99a7a"); }
    else { p(-6, 6, 2, 5, prim); p(4, 6, 2, 5, prim); p(-6, 11, 2, 1, "#c99a7a"); p(4, 11, 2, 1, "#c99a7a"); }
    // helmet
    p(-3, 0, 6, 5, prim);
    p(-1, 0, 1, 5, sec);
    p(2, 2, 2, 2, "#cfcfcf"); // face mask
  }

  // ---------- particles ----------
  function Confetti(colors) {
    var bits = [];
    return {
      add: function (n) {
        for (var i = 0; i < n; i++) bits.push({
          x: Math.random() * W, y: -10 - Math.random() * 60, vx: (Math.random() - 0.5) * 30,
          vy: 25 + Math.random() * 35, c: colors[i % colors.length], w: Math.random() * 6
        });
      },
      step: function (ctx, dt, t) {
        for (var i = bits.length - 1; i >= 0; i--) {
          var b = bits[i];
          b.x += (b.vx + Math.sin(t * 4 + b.w) * 12) * dt; b.y += b.vy * dt;
          if (b.y > H + 4) { bits.splice(i, 1); continue; }
          ctx.fillStyle = b.c;
          ctx.fillRect(Math.round(b.x), Math.round(b.y), Math.sin(t * 8 + b.w) > 0 ? 3 : 1, 2);
        }
      }
    };
  }
  function Fireworks(colors) {
    var sparks = [];
    return {
      burst: function (x, y, c) {
        for (var i = 0; i < 40; i++) {
          var a = (i / 40) * Math.PI * 2, sp = 40 + Math.random() * 40;
          sparks.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.4, c: c || colors[i % colors.length] });
        }
      },
      step: function (ctx, dt) {
        for (var i = sparks.length - 1; i >= 0; i--) {
          var s = sparks[i];
          s.life -= dt; if (s.life <= 0) { sparks.splice(i, 1); continue; }
          s.vy += 30 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.98; s.vy *= 0.98;
          ctx.globalAlpha = Math.min(1, s.life);
          ctx.fillStyle = s.c;
          ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
        }
        ctx.globalAlpha = 1;
      }
    };
  }

  function rays(ctx, cx, cy, t, c1, c2) {
    for (var i = 0; i < 16; i++) {
      var a = t * 0.4 + (i / 16) * Math.PI * 2;
      ctx.fillStyle = i % 2 ? c1 : c2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 400, cy + Math.sin(a) * 400);
      ctx.lineTo(cx + Math.cos(a + 0.2) * 400, cy + Math.sin(a + 0.2) * 400);
      ctx.fill();
    }
  }

  // trophy with a moving shine, clipped to the trophy's shape
  var shineCanvas = document.createElement("canvas");
  function trophy(ctx, cx, bottom, scale, t) {
    var img = customTrophy("super_bowl") || trophyImg;
    if (img !== trophyImg && window.RBCustom && window.RBCustom.native) img = window.RBCustom.native(img);
    if (!(img.naturalWidth || img.width)) return;
    // any size works: fit into a 120x150 box (default cup: 96x128); pixel art scales by whole numbers
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    var fs = img === trophyImg ? scale : Math.min(60 * scale / iw, 75 * scale / ih);
    if (img !== trophyImg && img.pixelArt && fs >= 1) fs = Math.floor(fs);
    var w = Math.round(iw * fs), h = Math.round(ih * fs);
    shineCanvas.width = w; shineCanvas.height = h;
    var s = shineCanvas.getContext("2d");
    s.imageSmoothingEnabled = fs < 1; s.imageSmoothingQuality = "high";
    s.drawImage(img, 0, 0, w, h);
    s.globalCompositeOperation = "source-atop";
    var sx = ((t * 0.7) % 1.6 - 0.3) * (w + h);
    s.fillStyle = "rgba(255,255,255,0.75)";
    s.beginPath(); s.moveTo(sx, 0); s.lineTo(sx + 8 * scale, 0); s.lineTo(sx + 8 * scale - h, h); s.lineTo(sx - h, h); s.fill();
    ctx.drawImage(shineCanvas, Math.round(cx - w / 2), Math.round(bottom - h));
    // twinkles
    for (var i = 0; i < 3; i++) {
      var k = (t * 1.3 + i * 0.37) % 1;
      if (k > 0.25) continue;
      var tx = cx + (rnd(i + Math.floor(t * 1.3)) - 0.5) * w * 0.8, ty = bottom - h + rnd(i + 7 + Math.floor(t * 1.3)) * h * 0.5;
      var r = Math.round((0.25 - Math.abs(k - 0.125)) * 24);
      ctx.fillStyle = "#fff";
      ctx.fillRect(Math.round(tx - r), Math.round(ty), r * 2 + 1, 1);
      ctx.fillRect(Math.round(tx), Math.round(ty - r), 1, r * 2 + 1);
    }
  }

  function ease(x) { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); }

  // ---------- postgame broadcast shot ----------
  // a person who isn't a player (reporters, camera crew). y = top of head, s = pixel scale
  function person(ctx, x, y, s, o, t) {
    var f = o.facing || 1;
    function p(px, py, w, h, c) {
      ctx.fillStyle = c;
      var xx = f < 0 ? x - (px + w) * s : x + px * s;
      ctx.fillRect(Math.round(xx), Math.round(y + py * s), w * s, h * s);
    }
    p(-2, 0, 4, 1, o.hair); p(-2, 1, 4, 3, o.skin); p(-2, 1, 1, 2, o.hair);   // head
    p(-3, 4, 6, 7, o.shirt);                                                // body
    p(-3, 11, 2, 6, o.pants); p(1, 11, 2, 6, o.pants);                      // legs
    p(-3, 17, 2, 1, "#111"); p(1, 17, 2, 1, "#111");                        // shoes
    if (o.pose === "mic") {           // arm out holding a microphone toward the player
      var bob = Math.sin(t * 3) > 0 ? 0 : 1;
      p(3, 5 + bob, 4, 2, o.shirt); p(7, 5 + bob, 1, 2, o.skin);
      p(8, 4 + bob, 1, 3, "#222"); p(8, 3 + bob, 2, 2, "#555");
      if (o.flag) p(8, 5 + bob, 2, 1, o.flag);                             // mic flag in station colour
    } else if (o.pose === "camera") { // shoulder camera with blinking red light
      p(-1, 1, 7, 4, "#3b3f4a"); p(6, 2, 2, 2, "#11141a"); p(-2, 1, 2, 2, "#2a2d36");
      if (Math.floor(t * 2) % 2) p(1, 0, 1, 1, "#ff2b2b");
      p(3, 5, 2, 3, o.shirt);
    } else if (o.pose === "photo") {  // photographer, camera up to the face
      p(1, 1, 3, 3, "#222"); p(4, 2, 1, 1, "#666");
      p(2, 4, 2, 2, o.shirt);
    } else if (o.pose === "boom") {   // boom mic on a pole over the interview
      p(2, 3, 1, 2, o.skin);
      for (var i = 0; i < 9; i++) p(3 + i, 2 - i, 1, 1, "#9aa0a6");
      p(12, -9, 4, 2, "#555");
    } else {
      p(-4, 5, 1, 5, o.shirt); p(3, 5, 1, 5, o.shirt);
    }
  }

  function crowdBand(ctx, x0, x1, y0, y1, t, cols) {
    ctx.fillStyle = "#1a1d2b"; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (var y = y0 + 2, row = 0; y < y1 - 2; y += 4, row++) {
      for (var x = x0 + (row % 2) * 2; x < x1; x += 4) {
        var sd = row * 1000 + x;
        ctx.fillStyle = cols[Math.floor(rnd(sd) * cols.length)];
        ctx.fillRect(x, y + (Math.sin(t * 9 + sd) > 0.3 ? -1 : 0), 2, 2);
        if (rnd(sd + Math.floor(t * 12)) > 0.994) { ctx.fillStyle = "#fff"; ctx.fillRect(x - 1, y - 1, 4, 4); }
      }
    }
  }

  function broadcastShotDrawn(info, prim, sec) {
    var WW = 680; // world is wider than the screen so the camera can pan
    var conf = Confetti([prim, sec, "#ffffff", "#ffd54a"]);
    var flashes = [];
    var suits = [
      { skin: "#e0b48c", hair: "#3b2a1a", shirt: "#2c3e66", pants: "#1c2233" },
      { skin: "#8d5a3b", hair: "#1a1310", shirt: "#7a1f2b", pants: "#222" },
      { skin: "#f1c9a5", hair: "#c9a050", shirt: "#4a4f57", pants: "#2a2d33" },
      { skin: "#b07a52", hair: "#222", shirt: "#1f5f4a", pants: "#1b1b1b" }
    ];
    var crew = { skin: "#d9a982", hair: "#222", shirt: "#222831", pants: "#2c2c2c" };
    var crew2 = { skin: "#9c6644", hair: "#111", shirt: "#30343c", pants: "#222" };

    return function (ctx, t, dt) {
      // camera: slow pan left to right, then push in on the trophy
      var pan = ease(t / 6.2) * 0.5 + Math.min(1, t / 6.2) * 0.5;
      var camX = pan * (WW - W) * 0.78;
      var zoom = 1 + ease((t - 4.8) / 2.4) * 0.45;
      var focusX = 360 - camX, focusY = 170;
      ctx.save();
      ctx.translate(focusX, focusY); ctx.scale(zoom, zoom); ctx.translate(-focusX, -focusY);
      ctx.translate(-Math.round(camX), 0);

      // stands + wall
      crowdBand(ctx, 0, WW, 0, 40, t, [prim, sec, "#d9d9d9", "#8a6f5a", "#c99a7a", prim]);
      ctx.fillStyle = prim; ctx.fillRect(0, 40, WW, 6);
      ctx.fillStyle = sec; ctx.fillRect(0, 42, WW, 2);
      // field (sideline camera: yard lines run up the screen)
      for (var y = 46; y < H + 40; y += 12) { ctx.fillStyle = ((y - 46) / 12) % 2 ? "#2f8a34" : "#287a2e"; ctx.fillRect(0, y, WW, 12); }
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (var lx = 20; lx < WW; lx += 64) {
        for (var yy = 46; yy < H + 40; yy++) ctx.fillRect(Math.round(lx + (yy - 46) * 0.12), yy, 1, 1);
      }
      ctx.fillRect(0, 50, WW, 1); ctx.fillRect(0, H + 30, WW, 1);
      // midfield badge painted on the grass
      ctx.globalAlpha = 0.4;
      if (badgeSheet.complete && badgeSheet.naturalWidth)   // squashed so it reads as paint on the grass
        ctx.drawImage(badgeSheet, (info.uid % 8) * 64, Math.floor(info.uid / 8) * 64, 64, 64, 334, 84, 80, 44);
      ctx.globalAlpha = 1;
      // yard numbers
      ctx.font = "8px " + FONT; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.75)";
      ["20", "30", "40", "50", "40", "30", "20", "10"].forEach(function (n, i) { ctx.fillText(n, 84 + 64 * i + 22, 250); });

      // ---- everyone on the field, drawn back-to-front ----
      var things = [];
      function add(y, fn) { things.push({ y: y, fn: fn }); }

      // trophy group: the cup gets passed around and hoisted
      var holders = [0, 2, 4, 1, 3];
      var holder = holders[Math.floor(t / 1.6) % holders.length];
      var groupX = 360, groupY = 150;
      var spots = [[-34, 8], [-16, -6], [0, 10], [18, -4], [34, 10]];
      spots.forEach(function (sp, i) {
        var px = groupX + sp[0], py = groupY + sp[1];
        add(py + 40, function () {
          var holding = i === holder;
          player(ctx, px, py, 2, prim, sec, holding ? 0 : t * 7 + i * 1.7, true, i < 2 ? 1 : -1);
          if (holding) {
            var lift = Math.abs(Math.sin(t * 3)) * 4;
            if (trophyImg.complete && trophyImg.naturalWidth)
              ctx.drawImage(trophyImg, Math.round(px - 11), Math.round(py - 30 - lift), 22, 29);
          }
        });
      });

      // interview 1 (left): player, reporter with mic, camera operator, boom mic
      add(196 + 36, function () { player(ctx, 140, 196, 2, prim, sec, 0, false, 1); });
      add(197 + 36, function () { person(ctx, 168, 197, 2, Object.assign({ pose: "mic", facing: -1, flag: "#d33" }, suits[0]), t); });
      add(190 + 36, function () { person(ctx, 196, 190, 2, Object.assign({ pose: "camera", facing: -1 }, crew), t); });
      add(186 + 36, function () { person(ctx, 120, 186, 2, Object.assign({ pose: "boom", facing: 1 }, crew2), t); });

      // interview 2 (right): player + two reporters + a photographer
      add(108 + 36, function () { player(ctx, 520, 108, 2, prim, sec, 0, false, -1); });
      add(110 + 36, function () { person(ctx, 494, 110, 2, Object.assign({ pose: "mic", facing: 1, flag: "#2a6bd1" }, suits[1]), t); });
      add(116 + 36, function () { person(ctx, 544, 116, 2, Object.assign({ pose: "mic", facing: -1, flag: "#f0b400" }, suits[2]), t); });
      add(100 + 36, function () { person(ctx, 470, 100, 2, Object.assign({ pose: "photo", facing: 1 }, suits[3]), t); });
      add(122 + 36, function () { person(ctx, 562, 122, 2, Object.assign({ pose: "camera", facing: -1 }, crew), t); });

      // teammates hugging, waving to the crowd, running around
      add(212 + 36, function () { player(ctx, 600, 212, 2, prim, sec, t * 4, Math.sin(t * 4) > 0, 1); player(ctx, 612, 212, 2, prim, sec, t * 4 + 1, Math.sin(t * 4) <= 0, -1); });
      add(70 + 36, function () { player(ctx, 80, 70, 2, prim, sec, t * 6, true, 1); });
      add(78 + 36, function () { player(ctx, 250, 78, 2, prim, sec, t * 6 + 2, Math.floor(t * 3) % 2 === 0, -1); });
      var rx = 260 + ((t * 40) % 220);
      add(220 + 36, function () { player(ctx, rx, 220, 2, prim, sec, t * 14, false, 1); });
      add(60 + 36, function () { player(ctx, 640, 60, 2, prim, sec, t * 6 + 3, true, -1); });

      things.sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.fn(); });

      // photo flashes around the interviews and the trophy
      if (Math.random() < dt * 6) {
        var spotsF = [[478, 104], [200, 192], [360, 130], [566, 126]];
        var f = spotsF[Math.floor(Math.random() * spotsF.length)];
        flashes.push({ x: f[0] + (Math.random() - 0.5) * 30, y: f[1] + (Math.random() - 0.5) * 20, life: 0.12 });
      }
      for (var i = flashes.length - 1; i >= 0; i--) {
        var fl = flashes[i]; fl.life -= dt;
        if (fl.life <= 0) { flashes.splice(i, 1); continue; }
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(Math.round(fl.x) - 3, Math.round(fl.y), 7, 1); ctx.fillRect(Math.round(fl.x), Math.round(fl.y) - 3, 1, 7);
        ctx.fillRect(Math.round(fl.x) - 1, Math.round(fl.y) - 1, 3, 3);
      }
      ctx.restore();

      // confetti falls in screen space
      if (Math.random() < 0.9) conf.add(2);
      conf.step(ctx, dt, t);

      // ---- TV graphics ----
      ctx.fillStyle = "#c81e1e"; ctx.fillRect(10, 10, 46, 16);
      ctx.fillStyle = "#fff"; if (Math.floor(t * 2) % 2) ctx.fillRect(16, 16, 4, 4);
      ctx.font = "8px " + FONT; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("LIVE", 24, 19);
      ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(W - 120, 10, 110, 16);
      ctx.fillStyle = info.prim; ctx.fillRect(W - 120, 10, 6, 16);
      ctx.fillStyle = "#fff"; ctx.fillText(info.abbr + " WIN", W - 108, 19);
      ctx.fillStyle = "#ffd54a"; ctx.textAlign = "right"; ctx.fillText("FINAL", W - 14, 19);
      var slide = ease((t - 0.6) / 0.6);
      if (t > 0.6) {
        var lx0 = Math.round(-W + slide * W);
        ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(lx0, 232, W, 30);
        ctx.fillStyle = info.prim; ctx.fillRect(lx0, 232, W, 3);
        ctx.fillStyle = info.sec; ctx.fillRect(lx0, 235, W, 1);
        ctx.fillStyle = "#ffd54a"; ctx.fillRect(lx0 + 10, 241, 70, 14);
        ctx.fillStyle = "#000"; ctx.textAlign = "center"; ctx.font = "6px " + FONT; ctx.fillText("POSTGAME", lx0 + 45, 248);
        ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.font = "8px " + FONT;
        ctx.fillText(info.name.toUpperCase() + " - SUPER BOWL CHAMPIONS", lx0 + 90, 248);
      }
    };
  }


  // ---------- postgame broadcast built from the game's own sprites ----------
  // Uses the field, crowd, player, coach and camera-crew sprites already in the game's texture
  // pages, recoloured into your team's uniform the same way the game's kit shader does.
  var GS = null;
  function gameSprites() {
    if (GS !== null) return GS;
    GS = false;
    try {
      var list = window._Te2 && window._Te2._e1;
      if (!list || !list.length) return GS;
      var by = {};
      list.forEach(function (sp) { if (sp && sp._51) by[sp._51] = sp; });
      if (!by.spr_field || !by.spr_celebrate || !by.spr_field._Ud2[0]._0e2) return GS;
      GS = { by: by, cache: {} };
    } catch (e) { GS = false; }
    return GS;
  }
  // placeholder colours the game's kit shader swaps out
  var KEYS = { helmet: [255, 0, 0], logo: [128, 0, 0], shirt: [128, 128, 255], sleeve: [128, 128, 128],
    pants: [255, 0, 255], pants_b: [128, 0, 128], stripe: [0, 0, 128], socks: [0, 255, 0],
    socks_b: [0, 128, 0], skin: [0, 0, 255], cleats: [255, 255, 0], jacket: [0, 255, 255] };
  var SKINS = [[241, 194, 155], [198, 134, 94], [141, 85, 54], [96, 60, 40], [224, 172, 128]];
  function rgbOf(v, fallback) {
    var h = String(v == null ? "" : v).replace("$", "").replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return fallback;
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function dark(c, f) { return c.map(function (v) { return Math.round(v * f); }); }
  function teamKit(uid) {
    var c = COLORS[uid] || COLORS[5];
    var helmet = hexRgb(c[0]), shirt = hexRgb(c[0]), pants = [235, 235, 235], tert = hexRgb(c[1]);
    try {
      var o = coachObj(), m = o && window._fg2 && window._fg2._Ue2(window._zi(o._Ej, uid));
      var g = function (k) { var v = m && m[k]; return v && v.Object !== undefined ? v.Object : v; };
      if (m) {
        helmet = rgbOf(g("colhelmet"), helmet); shirt = rgbOf(g("colshirt"), shirt);
        pants = rgbOf(g("colpants"), pants); tert = rgbOf(g("coltertiary"), tert);
      }
    } catch (e) {}
    return { helmet: helmet, logo: [255, 255, 255], shirt: shirt, sleeve: shirt, pants: pants, pants_b: dark(pants, 0.75),
      stripe: tert, socks: shirt, socks_b: dark(shirt, 0.7), skin: SKINS[0], cleats: [24, 24, 24], jacket: helmet };
  }
  // one sprite frame, recoloured, cached
  function frame(name, fi, kit, kitId, skin, cropRect) {
    var G = gameSprites(); if (!G) return null;
    var key = name + "|" + fi + "|" + kitId + "|" + skin + "|" + (cropRect ? cropRect.join(",") : "");
    if (G.cache[key]) return G.cache[key];
    var sp = G.by[name]; if (!sp) return null;
    var nf = sp._Ud2.length; fi = ((Math.floor(fi) || 0) % nf + nf) % nf;
    var f = sp._Ud2[fi];
    var cv = document.createElement("canvas"); cv.width = sp.width; cv.height = sp.height;
    var x = cv.getContext("2d");
    x.drawImage(f._0e2, f.x, f.y, f._a2, f._b2, f._gh, f._hh, f._a2, f._b2);
    var d = x.getImageData(0, 0, cv.width, cv.height), p = d.data;
    var k2 = kit ? Object.assign({}, kit, { skin: SKINS[skin % SKINS.length] }) : null;
    for (var i = 0; i < p.length; i += 4) {
      if (p[i + 3] === 0) continue;
      if (cropRect && cropRect.grass) {   // cut the camera crew out of their grass background
        var r = p[i], gg = p[i + 1], b = p[i + 2];
        if ((gg > r + 20 && gg > b + 20 && gg < 200) || (r === 210 && gg === 226 && b === 199)) { p[i + 3] = 0; continue; }
      }
      if (!k2) continue;
      for (var kk in KEYS) {
        var kc = KEYS[kk];
        if (Math.abs(p[i] - kc[0]) < 3 && Math.abs(p[i + 1] - kc[1]) < 3 && Math.abs(p[i + 2] - kc[2]) < 3) {
          var rc = k2[kk]; p[i] = rc[0]; p[i + 1] = rc[1]; p[i + 2] = rc[2]; break;
        }
      }
    }
    x.putImageData(d, 0, 0);
    var out = cv;
    if (cropRect) {
      out = document.createElement("canvas"); out.width = cropRect[2]; out.height = cropRect[3];
      out.getContext("2d").drawImage(cv, -cropRect[0], -cropRect[1]);
    }
    out.ox = cropRect ? Math.round(cropRect[2] / 2) : sp._G1;
    out.oy = cropRect ? cropRect[3] - 1 : sp._H1;
    G.cache[key] = out;
    return out;
  }
  function put(ctx, img, x, y, flip) {
    if (!img) return;
    x = Math.round(x); y = Math.round(y);
    if (flip) { ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1); ctx.drawImage(img, -img.ox, y - img.oy); ctx.restore(); }
    else ctx.drawImage(img, x - img.ox, y - img.oy);
  }

  // custom/trophies/<name>.png (super_bowl, afc, nfc) if present, see custom-assets.js
  function customTrophy(name) {
    var C = window.RBCustom;
    return (name && C && C.trophies[name]) || null;
  }
  var silverCanvas = null;
  function silverCup() {
    if (silverCanvas) return silverCanvas;
    if (!trophyImg.complete || !trophyImg.naturalWidth) return null;
    var c = document.createElement("canvas"); c.width = trophyImg.naturalWidth; c.height = trophyImg.naturalHeight;
    var x = c.getContext("2d"); x.drawImage(trophyImg, 0, 0);
    var d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    for (var i = 0; i < p.length; i += 4) {
      var l = 0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2];
      p[i] = Math.min(255, l * 0.95 + 20); p[i + 1] = Math.min(255, l * 0.98 + 24); p[i + 2] = Math.min(255, l + 34);
    }
    x.putImageData(d, 0, 0);
    silverCanvas = c;
    return c;
  }
  // copy of the field with the 4 "RB" marks covered by grass and custom/field/super_bowl_field.png
  function superBowlFieldCanvas(src) {
    var C = window.RBCustom; if (!C || !C.marks) return src;
    var c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
    var x = c.getContext("2d"); x.drawImage(src, 0, 0);
    var em = C.emblem || trophyImg;
    C.marks.forEach(function (m) {
      x.drawImage(src, m.x + m.from, m.y, m.w, m.h, m.x, m.y, m.w, m.h);
      if (em && (em.naturalWidth || em.width)) {
        var nem = C.native ? C.native(em) : em;
        var fz = C.fitSize ? C.fitSize(em, 96, 72) : { w: 48, h: 36 };
        var w = Math.max(1, Math.round(fz.w / 2)), h = Math.max(1, Math.round(fz.h / 2));
        x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
        x.drawImage(nem, Math.round(m.x + m.w / 2 - w / 2), Math.round(m.y + m.h / 2 - h / 2), w, h);
      }
    });
    c.ox = src.ox; c.oy = src.oy;
    return c;
  }
  function broadcastShot(info, prim, sec, opts) {
    opts = opts || {};
    if (!gameSprites()) return broadcastShotDrawn(info, prim, sec);
    function cupImg() { return customTrophy(opts.trophy) || (opts.silver ? silverCup() : (trophyImg.complete && trophyImg.naturalWidth ? trophyImg : null)); }
    var G = gameSprites();
    var kit = teamKit(info.uid), kitId = "t" + info.uid;
    var suitKit = { helmet: [40, 40, 48], logo: [40, 40, 48], shirt: [52, 62, 92], sleeve: [52, 62, 92], pants: [40, 40, 48],
      pants_b: [30, 30, 36], stripe: [200, 200, 200], socks: [52, 62, 92], socks_b: [20, 20, 24], skin: SKINS[0], cleats: [15, 15, 15], jacket: [44, 54, 84] };
    var oppKit = teamKit(info.opp == null ? 18 : info.opp), oppId = "o" + info.opp;
    var coachKit = Object.assign({}, kit, { pants: [60, 60, 66], pants_b: [45, 45, 50] });
    var crowdKit = Object.assign({}, kit, { pants: [240, 240, 240], socks: kit.shirt, socks_b: kit.helmet });
    var crewL = [14, 13, 14, 27], crewR = [69, 19, 17, 21]; crewL.grass = crewR.grass = true;
    var conf = Confetti([prim, sec, "#ffffff", "#ffd54a"]);
    var flashes = [];
    var fieldSp = G.by.spr_field, fansSp = G.by.spr_fieldfans;
    var fansImg = null, fieldImg = null;
    // losing team spread over the empty parts of the field: [x, y, pose 0 walk/1 sit/2 knees, walk speed]
    var LOSERS = [[150, 110, 0, 2], [182, 228, 1, 0], [214, 120, 2, 0], [128, 200, 0, -1.5], [404, 214, 1, 0], [430, 176, 2, 0],
      [452, 232, 0, 3], [470, 150, 0, -2], [492, 204, 1, 0], [384, 104, 2, 0], [516, 120, 0, 2.5], [240, 238, 2, 0],
      [356, 236, 0, -2.5], [498, 236, 2, 0], [136, 150, 1, 0], [420, 120, 0, 1.5]];
    // crowd around the stage: rings of players, none standing on the stage itself
    var CROWD = [];
    for (var n = 0, tries = 0; n < 45 && tries < 2000; tries++) {
      var ang = rnd(tries * 3.1) * Math.PI * 2, rr = 0.45 + rnd(tries * 7.7) * 0.75;
      var cx = Math.cos(ang) * 78 * rr, cy = Math.sin(ang) * 36 * rr + 4;
      if (Math.abs(cx) < 27 && cy > -16 && cy < 6) continue;          // keep the stage clear
      if (CROWD.some(function (c) { return Math.abs(c[0] - cx) < 7 && Math.abs(c[1] - cy) < 5; })) continue;
      CROWD.push([Math.round(cx), Math.round(cy), n % 5 === 0 ? 2 : n % 3 === 0 ? 0 : 1]);
      n++;
    }
    // confetti that has landed on the grass, appears over time
    var GROUND = [], gcols = [prim, sec, "#ffffff", "#ffd54a"];
    for (var gi = 0; gi < 700; gi++)
      GROUND.push([120 + rnd(gi * 1.7) * 380, 40 + rnd(gi * 2.9) * 210, gcols[gi % 4], rnd(gi * 5.3) * 6.5, rnd(gi * 9.1) > 0.5 ? 2 : 1]);

    function fieldBG(ctx, camX) {
      if (!fieldImg) {
        fieldImg = frame("spr_field", 0, crowdKit, "field" + info.uid, 1);  // sideline in your colours
        if (fieldImg && opts.superBowlField) fieldImg = superBowlFieldCanvas(fieldImg);
      }
      if (fieldImg) ctx.drawImage(fieldImg, -Math.round(camX), 33);
      if (!fansImg) fansImg = frame("spr_fieldfans", 0, crowdKit, "crowd" + info.uid, 0);
      if (fansImg) ctx.drawImage(fansImg, -Math.round(camX), 0);
    }

    return function (ctx, t, dt) {
      var camX = 360 + ease(t / 6.6) * 150;          // slow pan along the field
      var zoom = 1 + ease((t - 5) / 2.2) * 0.35;      // push in on the trophy at the end
      ctx.save();
      var fx = 300 - (camX - 360), fy = 170;
      ctx.translate(fx, fy); ctx.scale(zoom, zoom); ctx.translate(-fx, -fy);
      fieldBG(ctx, camX);
      ctx.translate(-(camX - 360), 0);
      for (var g = 0; g < GROUND.length; g++) {
        var gp = GROUND[g]; if (gp[3] > t) continue;
        ctx.fillStyle = gp[2]; ctx.fillRect(Math.round(gp[0]), Math.round(gp[1]), gp[4], 1);
      }

      var things = [];
      function add(y, fn) { things.push({ y: y, fn: fn }); }
      var anim = Math.floor(t * 5);

      // trophy stage at midfield: the cup sits still on a podium, the team celebrates around it
      var groupX = 300, groupY = 172;
      add(groupY - 2, function () {
        var sx = groupX - 22, sy = groupY - 12;
        ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(sx + 2, sy + 12, 46, 3);         // shadow
        ctx.fillStyle = "#1b1b22"; ctx.fillRect(sx - 1, sy - 1, 46, 14);                 // outline
        ctx.fillStyle = "#" + kit.helmet.map(function (v) { return ("0" + v.toString(16)).slice(-2); }).join("");
        ctx.fillRect(sx, sy + 4, 44, 8);                                                  // stage front in team colour
        ctx.fillStyle = "#e9e9ee"; ctx.fillRect(sx, sy, 44, 4);                           // stage top
        ctx.fillStyle = "#c8c8d0"; ctx.fillRect(sx, sy + 3, 44, 1);
        ctx.fillStyle = "#fff"; ctx.fillRect(sx, sy + 7, 44, 1);                          // trim stripe
        ctx.fillStyle = "#1b1b22"; ctx.fillRect(groupX - 4, sy - 7, 8, 7);                // pedestal
        ctx.fillStyle = "#3a3a46"; ctx.fillRect(groupX - 3, sy - 6, 6, 6);
        var cup = cupImg();
        if (cup) {
          var C2 = window.RBCustom;
          if (C2 && C2.fit && cup !== trophyImg && cup !== silverCanvas) C2.fit(ctx, cup, groupX - 6, sy - 25, 12, 18, true);
          else ctx.drawImage(cup, groupX - 5, sy - 20, 10, 13);
        }
      });
      // the rest of the 53-man roster crowds the stage (45 here, 8 more around the field)
      for (var ci = 0; ci < CROWD.length; ci++) (function (c, i) {
        var px = groupX + c[0] + Math.sin(t * 1.3 + i) * 0.8, py = groupY + c[1];
        add(py, function () {
          var nm = c[2] === 0 ? "spr_jump" : c[2] === 1 ? "spr_celebrate" : "spr_qb_walk";
          put(ctx, frame(nm, c[2] === 2 ? 0 : anim + i, kit, kitId, i), px, py, px > groupX);
        });
      })(CROWD[ci], ci);

      // the losing team: walking off slowly or standing around
      LOSERS.forEach(function (l, i) {
        var walk = l[2] === 0, px = l[0] + (walk ? t * l[3] : 0), py = l[1] - (walk ? t * 2.5 : 0);
        add(py, function () {
          if (walk) put(ctx, frame("spr_qb_walk", Math.floor(t * 3 + i), oppKit, oppId, i + 1), px, py, l[3] < 0);
          else put(ctx, frame("spr_qb_walk", 0, oppKit, oppId, i + 2), px, py, i % 2);
        });
      });

      // interview 1: player talking to a reporter, camera operator filming
      add(212, function () { put(ctx, frame("spr_qb_walk", 0, kit, kitId, 3), 228, 212, false); });
      add(213, function () {
        var rep = frame("spr_coach", 0, suitKit, "suit", 0);
        put(ctx, rep, 242, 213, true);
        ctx.fillStyle = "#222"; ctx.fillRect(235, 199 + (Math.sin(t * 3) > 0 ? 0 : 1), 1, 3);   // microphone
        ctx.fillStyle = "#555"; ctx.fillRect(234, 197 + (Math.sin(t * 3) > 0 ? 0 : 1), 3, 2);
      });
      add(214, function () { put(ctx, frame("spr_team_celebration", 0, null, "crew", 0, crewR), 262, 214, false); });

      // interview 2: player with two reporters and a photographer
      add(134, function () { put(ctx, frame("spr_qb_walk", 0, kit, kitId, 1), 404, 134, true); });
      add(135, function () { put(ctx, frame("spr_coach", 0, suitKit, "suit", 2), 390, 135, false);
        ctx.fillStyle = "#555"; ctx.fillRect(395, 120, 3, 2); ctx.fillStyle = "#222"; ctx.fillRect(396, 122, 1, 3); });
      add(137, function () { put(ctx, frame("spr_coach", 0, suitKit, "suit", 4), 418, 137, true);
        ctx.fillStyle = "#555"; ctx.fillRect(410, 122, 3, 2); ctx.fillStyle = "#222"; ctx.fillRect(411, 124, 1, 3); });
      add(132, function () { put(ctx, frame("spr_team_celebration", 0, null, "crew", 0, crewL), 376, 132, false); });

      // head coach getting hugs, teammates jumping, one running a lap
      add(150, function () { put(ctx, frame("spr_coach", 0, coachKit, "coach" + info.uid, 1), 196, 150, false); });
      add(151, function () { put(ctx, frame("spr_celebrate", anim, kit, kitId, 2), 186, 151, false); });
      add(124, function () { put(ctx, frame("spr_jump", anim, kit, kitId, 4), 150, 124, false); });
      add(196, function () { put(ctx, frame("spr_celebrate", anim + 1, kit, kitId, 0), 470, 196, true); });
      var rx = 120 + ((t * 45) % 380);
      add(236, function () { put(ctx, frame("spr_run", Math.floor(t * 10), kit, kitId, 1), rx, 236, false); });

      things.sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.fn(); });

      // camera flashes around the interviews and the trophy
      if (Math.random() < dt * 7) {
        var fs = [[264, 196], [378, 112], [300, 140], [420, 118]];
        var f = fs[Math.floor(Math.random() * fs.length)];
        flashes.push({ x: f[0] + (Math.random() - 0.5) * 16, y: f[1] + (Math.random() - 0.5) * 12, life: 0.1 });
      }
      for (var i = flashes.length - 1; i >= 0; i--) {
        var fl = flashes[i]; fl.life -= dt;
        if (fl.life <= 0) { flashes.splice(i, 1); continue; }
        ctx.fillStyle = "#fff";
        ctx.fillRect(Math.round(fl.x) - 2, Math.round(fl.y), 5, 1); ctx.fillRect(Math.round(fl.x), Math.round(fl.y) - 2, 1, 5);
      }
      ctx.restore();

      conf.add(t < 0.3 ? 12 : 5);
      conf.step(ctx, dt, t);

      // TV graphics in the game's style: black score bar on top, lower third at the bottom
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, 14);
      ctx.font = "8px " + FONT; ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.fillStyle = "#fff";
      ctx.fillText(info.abbr + " WIN", 8, 8);
      ctx.textAlign = "center"; ctx.fillText("FINAL", 240, 8);
      ctx.textAlign = "right"; ctx.fillStyle = "#ff3b3b";
      if (Math.floor(t * 2) % 2) ctx.fillRect(W - 44, 5, 5, 5);
      ctx.fillText("LIVE", W - 8, 8);
      var slide = ease((t - 0.6) / 0.6);
      if (t > 0.6) {
        var lx0 = Math.round(-W + slide * W);
        ctx.fillStyle = "#000"; ctx.fillRect(lx0, 246, W, 24);
        ctx.fillStyle = info.prim; ctx.fillRect(lx0, 246, W, 2);
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "8px " + FONT;
        ctx.fillText(info.name.toUpperCase() + "  -  " + (opts.label || "SUPER BOWL CHAMPIONS"), lx0 + 240, 259);
      }
    };
  }

  // ---------- scenes ----------
  function superBowlScene(info) {
    var prim = bright(info.prim), sec = bright(info.sec);
    var confetti = Confetti([prim, sec, "#ffffff", "#ffd54a"]);
    var fw = Fireworks([prim, sec, "#ffffff", "#ffd54a", "#ff5e5e"]);
    var broadcast = broadcastShot(info, prim, sec, { trophy: "super_bowl", superBowlField: true });
    var nextBurst = 2.6, conf = 0;
    var CUT1 = 0, CUT2 = 7.5; // postgame broadcast -> champions card
    return {
      length: 15,
      draw: function (ctx, t, dt) {
        if (t < CUT2) {
          broadcast(ctx, t - CUT1, dt);
          if (t < 0.5) { ctx.fillStyle = "rgba(0,0,0," + (1 - t / 0.5) + ")"; ctx.fillRect(0, 0, W, H); } // fade in from black
          if (t > CUT2 - 0.5) { ctx.fillStyle = "rgba(255,255,255," + ((t - (CUT2 - 0.5)) / 0.5) + ")"; ctx.fillRect(0, 0, W, H); }
        } else {
          var k = t - CUT2;
          ctx.fillStyle = shade(info.prim, 0.35); ctx.fillRect(0, 0, W, H);
          rays(ctx, 240, 150, k, shade(info.prim, 0.55), shade(info.prim, 0.4));
          if (t > nextBurst) { fw.burst(40 + Math.random() * 400, 20 + Math.random() * 80); nextBurst = t + 0.5 + Math.random() * 0.5; }
          fw.step(ctx, dt);
          var rise = ease(k / 1.6);
          trophy(ctx, 240, 300 - rise * 90, 2, k);
          badge(ctx, info.uid, 110, 150, 80);
          badge(ctx, info.uid, 370, 150, 80);
          conf += dt; while (conf > 0.04) { confetti.add(2); conf -= 0.04; }
          confetti.step(ctx, dt, t);
          ctx.fillStyle = "rgba(255,255,255," + Math.max(0, 1 - k / 0.6) + ")"; ctx.fillRect(0, 0, W, H);
          if (k > 1.2) text(ctx, "SUPER BOWL", 240, 26, 20, "#ffd54a");
          if (k > 1.6) text(ctx, "CHAMPIONS", 240, 52, 16, "#ffffff");
          if (k > 2.2) text(ctx, info.name.toUpperCase(), 240, 234, 11, "#ffffff");
          if (k > 2.6) text(ctx, String(info.year), 240, 252, 9, "#ffd54a");
          if (k > 3 && Math.floor(t * 2) % 2) text(ctx, "TAP TO CONTINUE", 470, 262, 6, "#ffffff", "right");
        }
      }
    };
  }

  function conferenceScene(info) {
    var prim = bright(info.prim), sec = bright(info.sec);
    var label = info.conf + " CHAMPIONS";
    var broadcast = broadcastShot(info, prim, sec, { label: label + "  -  ON TO THE SUPER BOWL", silver: true, trophy: info.conf === "NFC" ? "nfc" : "afc" });
    var CUT = 7;
    return {
      length: 12,
      draw: function (ctx, t, dt) {
        if (t < CUT) {
          broadcast(ctx, t, dt);
          if (t < 0.5) { ctx.fillStyle = "rgba(0,0,0," + (1 - t / 0.5) + ")"; ctx.fillRect(0, 0, W, H); }
          if (t > CUT - 0.5) { ctx.fillStyle = "rgba(0,0,0," + ((t - (CUT - 0.5)) / 0.5) + ")"; ctx.fillRect(0, 0, W, H); }
        } else {
          var k = t - CUT;
          ctx.fillStyle = "#05070f"; ctx.fillRect(0, 0, W, H);
          rays(ctx, 240, 120, k, shade(info.prim, 0.35), "#05070f");
          var z = ease(k / 0.8);
          badge(ctx, info.uid, 240, 112, Math.round(24 + z * 72));
          if (k > 0.6) text(ctx, label, 240, 30, 14, "#ffffff");
          if (k > 1.1) text(ctx, "NEXT STOP:", 240, 186, 10, "#ffffff");
          if (k > 1.5) text(ctx, "THE SUPER BOWL", 240, 210, 16, "#ffd54a");
          if (k > 2 && Math.floor(t * 2) % 2) text(ctx, "TAP TO CONTINUE", 470, 262, 6, "#ffffff", "right");
          if (k < 0.4) { ctx.fillStyle = "rgba(0,0,0," + (1 - k / 0.4) + ")"; ctx.fillRect(0, 0, W, H); }
        }
      }
    };
  }

  // ---------- player ----------
  var playing = false;
  function cheer() {
    try {
      var a = new Audio("html5game/snd_audience_fg.ogg");
      a.volume = 0.6;
      var p = a.play(); if (p && p.catch) p.catch(function () {});
      return a;
    } catch (e) { return null; }
  }

  function play(scene) {
    if (playing) return;
    playing = true;
    var wrap = document.createElement("div");
    wrap.id = "rb-cutscene";
    wrap.style.cssText = "position:fixed;inset:0;z-index:30000;background:#000;display:flex;align-items:center;justify-content:center;touch-action:none";
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    cv.style.cssText = "image-rendering:pixelated;image-rendering:crisp-edges";
    wrap.appendChild(cv);
    document.body.appendChild(wrap);
    function fit() {
      var s = Math.min(window.innerWidth / W, window.innerHeight / H);
      cv.style.width = Math.floor(W * s) + "px"; cv.style.height = Math.floor(H * s) + "px";
    }
    fit(); window.addEventListener("resize", fit);
    var ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    var sound = cheer();
    var start = performance.now(), last = start, done = false;
    function close() {
      if (done) return;
      done = true; playing = false;
      window.removeEventListener("resize", fit);
      if (sound) try { sound.pause(); } catch (e) {}
      wrap.remove();
    }
    function skip(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (performance.now() - start > 1000) close();
    }
    wrap.addEventListener("pointerdown", skip, true);
    wrap.addEventListener("mousedown", function (e) { e.stopPropagation(); }, true);
    wrap.addEventListener("mouseup", function (e) { e.stopPropagation(); }, true);
    function frame(now) {
      if (done) return;
      var t = Math.max(0, (now - start) / 1000), dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      ctx.clearRect(0, 0, W, H);
      try { scene.draw(ctx, t, dt); } catch (err) { console.error("cutscene", err); close(); return; }
      if (t > scene.length + 4) { close(); return; } // closes itself if nobody taps
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ---------- reading the game ----------
  function coachObj() {
    try {
      var list = window._si(64);
      for (var k in list) if (Object.prototype.hasOwnProperty.call(list, k)) return list[k];
    } catch (e) {}
    return null;
  }
  // the team you just beat: look up your latest playoff fixture in the game's schedule
  function opponentOf(obj, uid, conf, stage) {
    try {
      var me = obj && obj._Ip != null ? Number(obj._Ip) : uid;
      for (var wk = Number(obj._cn); wk >= Number(obj._cn) - 2; wk--) {
        var m = window._2O(obj, obj, wk);
        if (m == null || m < 0 || !window._Vi(m, 1)) continue;
        var a = Number(window._Ai(m, "away_team")), h = Number(window._Ai(m, "home_team"));
        if (a === me && h >= 0 && h < 32 && h !== uid) return h;
        if (h === me && a >= 0 && a < 32 && a !== uid) return a;
      }
    } catch (e) {}
    if (stage === 4) return conf === 1 ? (uid === 16 ? 18 : 16) : (uid === 0 ? 2 : 0);   // same conference
    return conf === 1 ? 0 : 18;                                                           // other conference
  }
  function teamInfo(obj, stage) {
    var uid = 5, name = null, conf = 0, year = new Date().getFullYear(), abbr = null;
    try {
      if (obj && obj._Gp != null && obj._Gp !== -1) {
        uid = Number(window._Ai(obj._Gp, "uid"));
        name = window._Ai(obj._Gp, "name");
        abbr = window._Ai(obj._Gp, "tla");
      }
      if (obj && obj._Jp != null) conf = Number(obj._Jp);
      if (obj && obj._zK != null && obj._fj != null) year = Number(obj._zK) + Number(obj._fj);
    } catch (e) {}
    if (!(uid >= 0 && uid < 32)) uid = 5;
    var c = COLORS[uid];
    return {
      uid: uid, prim: c[0], sec: c[1], year: year,
      name: NAMES[uid] || String(name || "Your team"),
      abbr: ABBR[uid],
      conf: conf === 1 ? "NFC" : "AFC",
      opp: opponentOf(obj, uid, conf, stage)
    };
  }

  // the game calls s_update_history_finish(stage) as your season ends:
  // stage 4 = won the conference, stage 5 = won the Super Bowl
  function hook() {
    var orig = window._j_;
    if (typeof orig !== "function" || orig.__csHooked) return false;
    window._j_ = function (self, other, stage) {
      var r = orig.apply(this, arguments);
      try {
        if (enabled() && (stage == 4 || stage == 5)) {
          var info = teamInfo(self, Number(stage));
          setTimeout(function () { play(stage == 5 ? superBowlScene(info) : conferenceScene(info)); }, 1200);
        }
      } catch (e) { console.error("cutscene hook", e); }
      return r;
    };
    window._j_.__csHooked = true;
    return true;
  }
  if (!hook()) window.addEventListener("load", hook);

  // ---------- mod menu ----------
  function wireMenu() {
    var sbf = document.getElementById("cs-sb-field");
    try { window.RB_FORCE_SB_FIELD = localStorage.getItem("rb_sb_field_always") === "1"; } catch (e) {}
    if (sbf) { sbf.checked = !!window.RB_FORCE_SB_FIELD; sbf.addEventListener("change", function () {
      window.RB_FORCE_SB_FIELD = sbf.checked; try { localStorage.setItem("rb_sb_field_always", sbf.checked ? "1" : "0"); } catch (e) {} }); }
    var box = document.getElementById("cs-enabled");
    if (box) { box.checked = enabled(); box.addEventListener("change", function () { setEnabled(box.checked); }); }
    function closeMenu() { var x = document.getElementById("jax-x"); if (x) x.click(); }
    var a = document.getElementById("cs-prev-conf"), b = document.getElementById("cs-prev-sb");
    if (a) a.addEventListener("click", function () { closeMenu(); play(conferenceScene(teamInfo(coachObj(), 4))); });
    if (b) b.addEventListener("click", function () { closeMenu(); play(superBowlScene(teamInfo(coachObj(), 5))); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wireMenu); else wireMenu();

  window.RBCutscenes = {
    superBowl: function (uid) { var i = teamInfo(coachObj()); if (uid != null) i = Object.assign(i, { uid: uid, prim: COLORS[uid][0], sec: COLORS[uid][1], name: NAMES[uid], abbr: ABBR[uid], opp: uid < 16 ? 18 : 0 }); play(superBowlScene(i)); },
    conference: function (uid, nfc) { var i = teamInfo(coachObj()); if (uid != null) i = Object.assign(i, { uid: uid, prim: COLORS[uid][0], sec: COLORS[uid][1], name: NAMES[uid], abbr: ABBR[uid], conf: nfc ? "NFC" : "AFC", opp: nfc ? (uid === 16 ? 18 : 16) : (uid === 0 ? 2 : 0) }); play(conferenceScene(i)); }
  };
})();
