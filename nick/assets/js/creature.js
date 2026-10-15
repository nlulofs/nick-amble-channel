/* The amble — one renderer for every surface (channel page, new tab).
 *
 * Canonical copy: channel/assets/creature.js. render_to_site() copies it
 * into the site checkout's js/; the extension carries a byte-identical
 * copy (test-enforced). Edit here, nowhere else.
 *
 * The creature is a pure function of a state JSON (schema amble-creature/1):
 * body from a per-install seed, size from growth stage, mood computed
 * client-side from last_activity — never stored, so a frozen page drifts
 * asleep honestly. Accessories render from earned latitude; the trophy
 * shelf renders only when the state carries it (local tier).
 */
(function () {
  "use strict";

  // ── Seeded PRNG (mulberry32) — same seed, same critter, forever ────
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length) % arr.length]; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ── Mood: now − last_activity vs thresholds. Computed, never stored ─
  function mood(state, now) {
    var last = state.last_activity;
    if (!last) return "asleep";
    var then = new Date(last.replace(" ", "T")).getTime();
    if (isNaN(then)) return "asleep";
    var h = ((now || Date.now()) - then) / 3600000;
    var th = state.mood_thresholds_h || {};
    if (h < (th.awake || 6)) return "awake";
    if (h < (th.drowsy || 24)) return "drowsy";
    return "asleep";
  }

  // ── Traits: everything seeded, nothing "the mascot" ────────────────
  // Art direction (Nick + Amble, 2026-07-28 live): smug, not sleek.
  // Slightly wrong beats slightly cute — the wrongness lives in the
  // silhouette (angles, a jittered outline, one ear that sits wrong on
  // purpose), the face has opinions (heavy lids, a mouth that knows
  // something, no blush), and the blink is sacred.
  function traits(seed) {
    var r = rng(seed);
    var t = {
      hue: Math.floor(r() * 360),
      sat: Math.floor(lerp(38, 62, r())),
      lit: Math.floor(lerp(58, 72, r())),
      ear: pick(r, ["nub", "leaf", "tall", "antenna"]),
      tail: pick(r, ["curl", "tuft", "stub", "whip"]),
      marking: pick(r, ["none", "patch", "speckles", "sock"]),
      eye: lerp(0.85, 1.2, r()),
      accent: Math.floor(r() * 360),
      squish: lerp(0.9, 1.08, r()),
      wrongEar: r() < 0.5 ? -1 : 1,          // which ear sits wrong
      wrongTilt: Math.round(lerp(9, 17, r())), // how wrong it sits
      cut1: r() < 0.5 ? 1 : 7,               // hard cut: a shoulder
      cut2: r() < 0.5 ? 3 : 5,               // hard cut: a hip
      jag: []                                  // gentle silhouette drift
    };
    for (var i = 0; i < 9; i++) t.jag.push(lerp(-0.05, 0.05, r()));
    return t;
  }

  // Lean silhouette, mostly smooth, with one or two seeded HARD CUTS —
  // angular means sharper intent, not more geometry. The wrongness needs
  // a focal point; uniform facets read as pet rock (Amble, 2026-07-28).
  function bodyPath(t, rx, ry) {
    var N = 8, pts = [];
    for (var i = 0; i < N; i++) {
      var a = (i / N) * Math.PI * 2 - Math.PI / 2;   // i=0 is the top
      var wob = 1 + t.jag[i];
      if (i === t.cut1 || i === t.cut2) wob -= 0.13; // the cuts bite in
      pts.push([Math.cos(a) * rx * wob, Math.sin(a) * ry * wob]);
    }
    function mid(i, j) {
      return ((pts[i][0] + pts[j][0]) / 2).toFixed(1) + ","
           + ((pts[i][1] + pts[j][1]) / 2).toFixed(1);
    }
    function pt(i) { return pts[i][0].toFixed(1) + "," + pts[i][1].toFixed(1); }
    var d = "M" + mid(N - 1, 0);
    for (var k = 0; k < N; k++) {
      // smooth through most anchors; the cut anchors stay sharp corners
      d += (k === t.cut1 || k === t.cut2)
        ? " L" + pt(k) + " L" + mid(k, (k + 1) % N)
        : " Q" + pt(k) + " " + mid(k, (k + 1) % N);
    }
    return d + " Z";
  }

  function hsl(h, s, l) { return "hsl(" + ((h % 360) + 360) % 360 + "," + s + "%," + l + "%)"; }

  // Stage: overall scale + which features have grown in yet.
  var STAGE = {
    1: { scale: 0.62, ears: "nub", tail: false, feet: false, elder: false },
    2: { scale: 0.78, ears: "real", tail: "stub", feet: false, elder: false },
    3: { scale: 0.92, ears: "real", tail: "full", feet: true, elder: false },
    4: { scale: 1.05, ears: "real", tail: "full", feet: true, elder: true }
  };

  var svgNS = "http://www.w3.org/2000/svg";
  var captureMarkup = false;
  function escapeMarkup(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&apos;"}[c];
    });
  }
  function markupNode(name) {
    return {name:name, attrs:{}, children:[], textContent:"",
      setAttribute:function (key,value) { this.attrs[key]=String(value); },
      appendChild:function (node) { this.children.push(node); return node; }};
  }
  function serializeNode(node) {
    var attrs = Object.keys(node.attrs).map(function (key) {
      return " " + key + '="' + escapeMarkup(node.attrs[key]) + '"';
    }).join("");
    return "<" + node.name + attrs + ">" + (node.textContent
      ? escapeMarkup(node.textContent) : node.children.map(serializeNode).join(""))
      + "</" + node.name + ">";
  }
  function capture(draw) {
    var previous = captureMarkup;
    captureMarkup = true;
    try { var root = el("g", {}); draw(root); return serializeNode(root); }
    finally { captureMarkup = previous; }
  }
  function el(name, attrs, parent) {
    var n = captureMarkup ? markupNode(name) : document.createElementNS(svgNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // Ears stay SOFT against the harder body — the tension in the shape
  // lives in that contrast. Anchored at ±26 so they root in the leaner
  // silhouette instead of floating beside it.
  function drawEar(g, t, st, side, bodyC, lineC) {
    var x = side * 26, style = st.ears === "nub" ? "nub" : t.ear;
    if (style === "nub") {
      el("circle", { cx: x, cy: -56, r: 10, fill: bodyC, stroke: lineC, "stroke-width": 2.5 }, g);
    } else if (style === "leaf") {
      el("path", { d: "M" + x + ",-50 q" + (side * 14) + ",-30 2,-38 q" + (side * -16) + ",10 -8,38 z",
                   fill: bodyC, stroke: lineC, "stroke-width": 2.5, "stroke-linejoin": "round" }, g);
    } else if (style === "tall") {
      el("path", { d: "M" + (x - 8) + ",-48 q" + (side * 6) + ",-38 12,-40 q" + (side * 10) + ",18 -1,42 z",
                   fill: bodyC, stroke: lineC, "stroke-width": 2.5, "stroke-linejoin": "round" }, g);
    } else { // antenna
      el("path", { d: "M" + x + ",-54 q" + (side * 10) + ",-22 " + (side * 16) + ",-28",
                   fill: "none", stroke: lineC, "stroke-width": 2.5, "stroke-linecap": "round" }, g);
      el("circle", { cx: x + side * 16, cy: -82, r: 5,
                     fill: hsl(t.accent, 70, 65), stroke: lineC, "stroke-width": 2 }, g);
    }
  }

  // Every appendage makes CONTACT — tails root at the body edge, the
  // tuft ball sits on the end of its own visible tail, nothing orbits.
  function drawTail(g, t, st, bodyC, lineC) {
    if (!st.tail) return;
    if (st.tail === "stub" || t.tail === "stub") {
      el("circle", { cx: -44, cy: 22, r: 9, fill: bodyC, stroke: lineC, "stroke-width": 2.5 }, g);
    } else if (t.tail === "curl") {
      el("path", { d: "M-42,16 q-24,-2 -22,-19 q2,-12 13,-10 q8,2 5,9",
                   fill: "none", stroke: lineC, "stroke-width": 6, "stroke-linecap": "round" }, g);
    } else if (t.tail === "tuft") {
      el("path", { d: "M-40,18 q-14,2 -19,-7", fill: "none", stroke: lineC,
                   "stroke-width": 5, "stroke-linecap": "round" }, g);
      el("circle", { cx: -61, cy: 9, r: 7, fill: hsl(t.accent, 60, 70), stroke: lineC, "stroke-width": 2 }, g);
    } else { // whip
      el("path", { d: "M-42,18 q-26,8 -30,-14", fill: "none", stroke: lineC,
                   "stroke-width": 5, "stroke-linecap": "round" }, g);
    }
  }

  function drawMarking(g, t, lineC, markColor) {
    var mk = markColor || hsl(t.hue + 24, t.sat, t.lit - 14);
    if (t.marking === "patch") {
      el("ellipse", { cx: 20, cy: -18, rx: 16, ry: 12, fill: mk, opacity: 0.5 }, g);
    } else if (t.marking === "speckles") {
      [[-16, -26], [6, -34], [24, -22]].forEach(function (p) {
        el("circle", { cx: p[0], cy: p[1], r: 3.2, fill: mk, opacity: 0.55 }, g);
      });
    } else if (t.marking === "sock") {
      el("path", { d: "M-28,38 a9,7 0 0 0 18,0 z", fill: mk, opacity: 0.5 }, g);
    }
  }

  function drawEyes(g, t, m, bodyColor) {
    var ey = -14, ex = 17, r0 = 6.5 * t.eye;
    var bodyC = bodyColor || hsl(t.hue, t.sat, t.lit);
    [-1, 1].forEach(function (s) {
      var eg = el("g", { "class": "amble-eye", style: "transform-origin:" + (s * ex) + "px " + ey + "px" }, g);
      if (m === "asleep") {
        el("path", { d: "M" + (s * ex - 6) + "," + ey + " q6,5 12,0",
                     fill: "none", stroke: "#26202b", "stroke-width": 2.6, "stroke-linecap": "round" }, eg);
      } else {
        el("circle", { cx: s * ex, cy: ey, r: r0, fill: "#26202b" }, eg);
        // the glint sits low and small — scheming, not sparkling
        el("circle", { cx: s * ex + 1.5, cy: ey + 1, r: r0 * 0.18, fill: "#fff", opacity: 0.7 }, eg);
        // lids are ALWAYS heavy — awake is half-mast, drowsy most of the
        // way shut — and the lid edge is drawn, so the cut reads at any
        // size. These eyes have opinions.
        var chord = m === "drowsy" ? ey + r0 * 0.65 : ey - r0 * 0.05;
        el("path", { d: "M" + (s * ex - r0 - 1) + "," + chord
                      + " a" + (r0 + 1) + "," + (r0 + 1) + " 0 0 1 " + (2 * r0 + 2) + ",0"
                      + " l0,-" + (r0 + 3) + " l-" + (2 * r0 + 2) + ",0 z",
                     fill: bodyC, "class": "amble-lid" }, eg);
        el("line", { x1: s * ex - r0 - 1, y1: chord, x2: s * ex + r0 + 1, y2: chord,
                     stroke: "#26202b", "stroke-width": 1.6, "stroke-linecap": "round",
                     "class": "amble-lid" }, eg);
      }
      // three days awake, in a good way
      el("path", { d: "M" + (s * ex - 4) + "," + (ey + r0 + 3) + " q" + (s * 4) + ",1.6 " + (s * 8) + ",0.6",
                   fill: "none", stroke: "#26202b", "stroke-width": 1.5,
                   "stroke-linecap": "round", opacity: 0.3 }, g);
    });
    // the mouth knows something; asleep gets a tiny o
    if (m === "asleep") {
      el("circle", { cx: 0, cy: 2, r: 2.4, fill: "#26202b", opacity: 0.75 }, g);
    } else if (m === "drowsy") {
      el("path", { d: "M-5,2 q4,1.6 9,0.3", fill: "none", stroke: "#26202b",
                   "stroke-width": 2.2, "stroke-linecap": "round" }, g);
    } else {
      el("path", { d: "M-6,2.5 q4,2.8 9,0.6 q2.4,-1.1 3.6,-3", fill: "none", stroke: "#26202b",
                   "stroke-width": 2.2, "stroke-linecap": "round" }, g);
    }
  }

  // ── Accessories — the drip, worn only where latitude was granted ───
  // The rule (Amble, 2026-07-28): every accessory either TOUCHES the
  // body or hangs from a VISIBLE STRING, and if you can't name it in
  // half a second it doesn't ship. One legible object doing one legible
  // thing beats four ambiguous ones. The fish hat obeys pretend gravity.
  function drawItem(g, t, item, lineC) {
    var hue = (typeof item.hue === "number") ? item.hue : t.accent;
    var fill = hsl(hue, 62, 60), v = (item.variant || 0);
    var ig = el("g", { "class": "amble-item amble-item-" + item.kind }, g);
    switch (item.kind) {
      case "hat": // sits ON the head, obeying pretend gravity
        if (v % 2) { // pointy
          el("path", { d: "M-14,-54 L0,-86 L14,-54 z", fill: fill, stroke: lineC, "stroke-width": 2 }, ig);
        } else {     // brimmed
          el("rect", { x: -12, y: -72, width: 24, height: 16, rx: 4, fill: fill, stroke: lineC, "stroke-width": 2 }, ig);
          el("rect", { x: -20, y: -58, width: 40, height: 5, rx: 2.5, fill: fill, stroke: lineC, "stroke-width": 2 }, ig);
        }
        break;
      case "scarf": // wraps ALL the way — commits, with a knot and a tail
        el("path", { d: "M-44,6 Q0,22 44,6 L41,17 Q0,32 -41,17 Z",
                     fill: fill, stroke: lineC, "stroke-width": 2, "stroke-linejoin": "round" }, ig);
        el("circle", { cx: 30, cy: 19, r: 4.5, fill: fill, stroke: lineC, "stroke-width": 2 }, ig);
        el("path", { d: "M27,22 l9,3 l-4," + (15 + 4 * (v % 3)) + " l-9,-3 z",
                     fill: fill, stroke: lineC, "stroke-width": 2, "stroke-linejoin": "round" }, ig);
        break;
      case "flag": case "pennant": // the staff leans against the body
        el("line", { x1: 30, y1: 40, x2: 60, y2: -44, stroke: lineC, "stroke-width": 3, "stroke-linecap": "round" }, ig);
        el("path", { d: item.kind === "flag" ? "M60,-44 h28 v17 h-28 z" : "M60,-44 l30,8 l-30,8 z",
                     fill: fill, stroke: lineC, "stroke-width": 2, "stroke-linejoin": "round" }, ig);
        break;
      case "balloon": // the string ends AT the paw — it's held, it's mine
        el("path", { d: "M46,-42 q-6,26 -12,50", fill: "none", stroke: lineC, "stroke-width": 1.6 }, ig);
        el("ellipse", { cx: 48, cy: -58, rx: 13, ry: 16, fill: fill, stroke: lineC, "stroke-width": 2 }, ig);
        el("path", { d: "M45,-43 l6,0 l-3,4 z", fill: fill, stroke: lineC, "stroke-width": 1.2 }, ig);
        break;
      case "sprout": // grows out of the head
        el("path", { d: "M0,-58 q-2,-10 -1,-14", fill: "none", stroke: "#4a7c46", "stroke-width": 2.6, "stroke-linecap": "round" }, ig);
        el("path", { d: "M-1,-72 q-11,-3 -13,-12 q11,0 13,8 q3,-9 13,-9 q-2,10 -13,13 z", fill: fill, stroke: "#4a7c46", "stroke-width": 1.6 }, ig);
        break;
      case "lantern": // hangs from a visible arm off the shoulder
        el("path", { d: "M-38,-30 q-10,6 -12,16", fill: "none", stroke: lineC, "stroke-width": 2.4, "stroke-linecap": "round" }, ig);
        el("rect", { x: -57, y: -14, width: 14, height: 18, rx: 4, fill: fill, stroke: lineC, "stroke-width": 2, "class": "amble-lantern" }, ig);
        break;
      case "bell": // on a collar strap, at the throat
        el("path", { d: "M-9,26 q9,7 18,0", fill: "none", stroke: lineC, "stroke-width": 2 }, ig);
        el("circle", { cx: 0, cy: 33, r: 5.5, fill: fill, stroke: lineC, "stroke-width": 2 }, ig);
        break;
    }
    if (item.named) {
      var tag = el("text", { x: 0, y: 78, "text-anchor": "middle", "class": "amble-nameplate" }, g);
      tag.textContent = item.named;
    }
  }

  // Expedition: packed and waiting at the door — never "running". The
  // bindle stick LEANS on the shoulder (contact, pretend gravity) with
  // the bundle hanging off the top end and a visible tie.
  function drawBindle(g, lineC) {
    var bg = el("g", { "class": "amble-bindle" }, g);
    el("line", { x1: 34, y1: 30, x2: 74, y2: -18, stroke: lineC, "stroke-width": 3, "stroke-linecap": "round" }, bg);
    el("path", { d: "M74,-18 q2,6 0,8", fill: "none", stroke: lineC, "stroke-width": 2 }, bg);
    el("circle", { cx: 74, cy: -4, r: 9, fill: hsl(14, 60, 62), stroke: lineC, "stroke-width": 2 }, bg);
    el("circle", { cx: 71, cy: -7, r: 1.5, fill: "#fff", opacity: 0.85 }, bg);
    el("circle", { cx: 77, cy: -2, r: 1.5, fill: "#fff", opacity: 0.85 }, bg);
  }

  // ── Trophy shelf — local tier only, one seeded glyph per trophy ────
  function drawShelf(svg, collectibles, lineC, cy) {
    var shelf = el("g", { "class": "amble-shelf" }, svg);
    var n = collectibles.length, gap = 26, x0 = 120 - ((n - 1) * gap) / 2;
    collectibles.forEach(function (c, i) {
      var seed = c.icon_seed >>> 0, r = rng(seed), x = x0 + i * gap;
      var g = el("g", { transform: "translate(" + x + "," + cy + ") rotate(" + Math.floor(lerp(-8, 8, r())) + ")" }, shelf);
      // shape straight from the seed's low bits, hue from higher bits —
      // decorrelated, so neighboring trophies rarely twin
      var hue = (seed >>> 3) % 360, fill = hsl(hue, 55, 62);
      var shape = seed % 6;
      if (shape === 0) {        // cup
        el("path", { d: "M-6,-6 h12 v7 a6,6 0 0 1 -12,0 z M-6,-4 h-3 a4,4 0 0 0 3,6 M6,-4 h3 a4,4 0 0 1 -3,6",
                     fill: fill, stroke: lineC, "stroke-width": 1.5 }, g);
      } else if (shape === 1) { // star
        el("path", { d: "M0,-8 L2.4,-2.4 L8,-2 L3.6,1.8 L5,8 L0,4.4 L-5,8 L-3.6,1.8 L-8,-2 L-2.4,-2.4 z",
                     fill: fill, stroke: lineC, "stroke-width": 1.2, "stroke-linejoin": "round" }, g);
      } else if (shape === 2) { // gem
        el("path", { d: "M-6,-3 L0,-8 L6,-3 L0,8 z", fill: fill, stroke: lineC, "stroke-width": 1.5, "stroke-linejoin": "round" }, g);
      } else if (shape === 3) { // shell
        el("path", { d: "M0,7 Q-9,4 -7,-4 Q0,-9 7,-4 Q9,4 0,7 M0,7 L0,-7 M0,7 L-5,-5 M0,7 L5,-5",
                     fill: fill, stroke: lineC, "stroke-width": 1.3 }, g);
      } else if (shape === 4) { // key
        el("circle", { cx: 0, cy: -4, r: 3.6, fill: "none", stroke: lineC, "stroke-width": 2.2 }, g);
        el("path", { d: "M0,-0.5 L0,8 M0,5 L3,5 M0,8 L3.4,8", fill: "none", stroke: lineC, "stroke-width": 2.2, "stroke-linecap": "round" }, g);
        el("circle", { cx: 0, cy: -4, r: 3.6, fill: fill, opacity: 0.35 }, g);
      } else {                  // acorn
        el("path", { d: "M-5,-2 a5,6 0 0 0 10,0 z", fill: hsl(28, 45, 45) }, g);
        el("ellipse", { cx: 0, cy: 1, rx: 4.6, ry: 5.4, fill: fill, stroke: lineC, "stroke-width": 1.3 }, g);
      }
      // sheen: handled trophies glint; dull is rare and honest
      if ((c.sheen || 0) > 3) {
        el("circle", { cx: -3, cy: -5, r: 1.4, fill: "#fff", opacity: Math.min(0.9, 0.3 + c.sheen * 0.05), "class": "amble-glint" }, g);
      }
      var title = el("title", {}, g);
      title.textContent = (c.label || "trophy") + (c.awarded ? " · " + c.awarded : "");
    });
  }

  // ── The whole scene ────────────────────────────────────────────────
  function renderLegacy(mountEl, captionEl, state, now) {
    if (!mountEl || !state || String(state.schema || "").indexOf("amble-creature/1") !== 0) return;
    var t = traits(state.body_seed >>> 0 || 1);
    var st = STAGE[state.stage] || STAGE[1];
    var m = mood(state, now);
    var hasShelf = state.collectibles && state.collectibles.length > 0;
    var lineC = "#3a3140";
    var bodyC = hsl(t.hue, t.sat, t.lit);
    var bellyC = hsl(t.hue, t.sat - 10, t.lit + 12);

    mountEl.innerHTML = "";
    mountEl.className = "amble-mount amble-mood-" + m + " amble-stage-" + state.stage;
    var H = hasShelf ? 236 : 196;
    var svg = el("svg", { viewBox: "0 0 240 " + H, role: "img",
                          "aria-label": "the amble — " + m + ", stage " + state.stage });
    mountEl.appendChild(svg);

    // The transform attribute is the reduced-motion truth; the CSS mood
    // animations re-state it via --amble-scale (an animated CSS transform
    // fully replaces the attribute, so the scale must ride the variable).
    // Drowsy gets a static slouch too — the sleepy one must not be a
    // twin of the awake one holding its balloon slightly higher.
    var slouch = m === "drowsy" ? " rotate(-4)" : "";
    var root = el("g", { transform: "translate(120," + (m === "drowsy" ? 111 : 108)
                                    + ") scale(" + st.scale + ")" + slouch,
                         style: "--amble-scale:" + st.scale,
                         "class": "amble-body-group" }, svg);
    // shadow
    el("ellipse", { cx: 0, cy: 58, rx: 46, ry: 8, fill: "#000", opacity: 0.12 }, root);

    drawTail(root, t, st, bodyC, lineC);
    [-1, 1].forEach(function (s) {
      // one ear sits wrong on purpose — the wrongness is load-bearing
      var wrap = (s === t.wrongEar)
        ? el("g", { transform: "rotate(" + (t.wrongTilt * s) + " " + (s * 26) + " -50)" }, root)
        : root;
      drawEar(wrap, t, st, s, bodyC, lineC);
    });

    // body — lean, elongated; asleep squashes a little (curled, not broken)
    var squash = m === "asleep" ? 0.88 : 1;
    el("path", { d: bodyPath(t, 46, 57 * t.squish * squash),
                 fill: bodyC, stroke: lineC, "stroke-width": 3,
                 "stroke-linejoin": "round" }, root);
    el("ellipse", { cx: 0, cy: 18, rx: 26, ry: 21 * squash, fill: bellyC }, root);
    drawMarking(root, t, lineC);

    if (st.feet) {
      [-1, 1].forEach(function (s) {
        el("ellipse", { cx: s * 20, cy: 53, rx: 10, ry: 6.5, fill: bodyC, stroke: lineC, "stroke-width": 2.5 }, root);
      });
    }
    if (st.elder) { // a quiet ruff — age worn visibly, seeded accent
      el("path", { d: "M-36,28 q0,15 11,19 M36,28 q0,15 -11,19",
                   fill: "none", stroke: hsl(t.accent, 40, 60), "stroke-width": 4,
                   "stroke-linecap": "round", opacity: 0.7 }, root);
    }
    drawEyes(root, t, m);

    (state.custom && state.custom.items || []).forEach(function (item) {
      drawItem(root, t, item, lineC);
    });

    var exp = state.expedition || {};
    if (exp.queued > 0) drawBindle(root, lineC);

    if (m === "asleep") {
      var zg = el("g", { "class": "amble-zzz" }, svg);
      [[168, 62, 13], [182, 44, 10], [193, 30, 8]].forEach(function (z, i) {
        var zt = el("text", { x: z[0], y: z[1], "font-size": z[2],
                              "class": "amble-z amble-z-" + i, fill: lineC, opacity: 0.6 }, zg);
        zt.textContent = "z";
      });
    }

    if (hasShelf) {
      el("line", { x1: 34, y1: 208, x2: 206, y2: 208, stroke: lineC, "stroke-width": 2, opacity: 0.35 }, svg);
      drawShelf(svg, state.collectibles, lineC, 196);
    }

    if (captionEl) {
      var bits = [m, "stage " + state.stage + " " + (state.stage_name || "")];
      if (exp.queued > 0) bits.push(exp.queued + " packed at the door");
      captionEl.textContent = bits.join(" · ");
    }
    // the amble's own words, if the surface has a lore line (textContent
    // only — the profile is amble-authored but never trusted as markup)
    var loreEl = document.getElementById("amble-creature-lore");
    if (loreEl && state.profile && state.profile.length) {
      loreEl.textContent = state.profile[state.profile.length - 1].text || "";
    }
  }

  // Appearance is a presentation projection. It never creates authority,
  // changes a birth seed, or accepts a stored mood as evidence of presence.
  var SHAPES = ["lofl","amble","rabbit","cat","dog","gecko","manta","crab"];
  var SAFE_COLOR = /^#[0-9a-f]{6}$/i;
  function safeColor(value, fallback) { return SAFE_COLOR.test(value || "") ? value : fallback; }
  function project(state, options) {
    state = state || {}; options = options || {};
    var a = state.appearance || {}, pc = a.palette && a.palette.colors || {};
    var custom = a.colors || {}, presence = mood(state, options.now);
    var seed = Number.isInteger(a.variation) && a.variation >= 0 && a.variation <= 4294967295
      ? a.variation : state.body_seed >>> 0 || 1;
    var family = a.shape === "lofl" && window.CreatureLofl ? window.CreatureLofl.coat(seed) : null;
    var coat = {
      base: safeColor(custom.base, family ? family.base : safeColor(pc.accent, "#e8a84c")),
      mark: safeColor(custom.mark, family ? family.mark : safeColor(pc.surface, "#1f190f")),
      muzzle: safeColor(custom.muzzle, family ? family.muzzle : safeColor(pc.accent2, "#b8d78b")),
      accent: safeColor(custom.accent, family ? family.accent : safeColor(pc.gold, "#f3c973"))
    };
    var pose = ["awake","curious","sleepy"].indexOf(options.pose) >= 0
      ? options.pose : presence === "awake" ? "awake" : "sleepy";
    var shape = SHAPES.indexOf(a.shape) >= 0 ? a.shape : "amble";
    var layers = [];
    function layer(record, role) {
      if (!record || record.visible === false) return;
      var word = typeof record.word === "string" ? Array.from(record.word).slice(0,24).join("") : "";
      if (!word.trim()) return;
      var colors = Array.isArray(record.bead_colors)
        ? record.bead_colors.filter(function (value) { return SAFE_COLOR.test(value); }).slice(0,8) : [];
      layers.push({word:word, role:role,
        beads:["inherit","mono","candy","pond"].indexOf(record.beads) >= 0 ? record.beads : "inherit",
        bead_colors:colors.length >= 2 ? colors : null});
    }
    layer(a.collar, "collar");
    (Array.isArray(a.received) ? a.received : []).filter(function (record) {return record && record.visible !== false;}).slice(0,2).forEach(function (record) { layer(record,"received"); });
    return {agent:{shape:shape, pattern:["solid","spots","stripes"].indexOf(a.pattern) >= 0 ? a.pattern : "solid",
      pose:pose, seed:seed,
      aura:["off","quiet","radiant"].indexOf(a.aura) >= 0 ? a.aura : "off",
      legacy_items:safeItems(state)},
      coat:coat,layers:layers,presence:presence,
      lift:typeof options.lift === "number" && isFinite(options.lift)
        ? Math.max(0,Math.min(1,options.lift)) : presence === "awake" ? 1 : presence === "drowsy" ? .35 : 0,
      style:shape === "amble" && (!state.appearance || a.style === "classic") ? "classic" : "modern"};
  }
  function safeItems(state) {
    var kinds=["hat","scarf","flag","pennant","balloon","sprout","lantern","bell"];
    return (state.custom && Array.isArray(state.custom.items) ? state.custom.items : []).slice(0,12)
      .filter(function (item) { return item && kinds.indexOf(item.kind) >= 0; })
      .map(function (item) { return {kind:item.kind,
        hue:typeof item.hue === "number" && isFinite(item.hue) ? item.hue : undefined,
        variant:typeof item.variant === "number" && isFinite(item.variant) ? Math.floor(item.variant) : 0,
        named:typeof item.named === "string" ? item.named.slice(0,80) : ""}; });
  }
  function legacyArtwork(state, p) {
    var items=safeItems(state), t=traits(p.agent.seed);
    if (!items.length) return "";
    var tops={lofl:135,amble:106,rabbit:119,cat:108,dog:105,gecko:128,manta:145,crab:166};
    var anchor=window.CreatureFlatBodies.build(p.agent.shape,p.coat,p.agent.pattern,p.agent.pose,p.lift,p.agent.seed).anchor;
    return capture(function (root) {
      items.forEach(function (item) {
        var head=item.kind === "hat" || item.kind === "sprout";
        var scale=head ? 1 : anchor.width/88;
        var y=head ? tops[p.agent.shape]+54*scale : anchor.y-20*scale;
        if(item.kind === "scarf") y=anchor.y-8*scale;
        if(item.kind === "bell") y=anchor.y-23*scale;
        var group=el("g", {transform:"translate("+anchor.x+","+y+") scale("+scale+")",
          "data-legacy-accessory":item.kind}, root);
        drawItem(group,t,item,"#292638");
      });
    });
  }
  var FLAT_MOTION = '<style>.creature-eye{transform-box:view-box}.amble-mood-awake .creature-eye,.amble-mood-awake .amble-eye{animation:creature-blink 6.5s infinite}@keyframes creature-blink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}@media(prefers-reduced-motion:reduce){.creature-eye,.amble-eye{animation:none!important}}</style>';
  function classicFlat(state,p) {
    var t=traits(p.agent.seed), st=STAGE[state.stage] || STAGE[1], scale=1.3*st.scale;
    var body = capture(function (outer) {
      var root=el("g", {transform:"translate(160,184) scale("+scale+")"},outer);
      drawTail(root,t,st,p.coat.base,"#292638");
      [-1,1].forEach(function (side) {
        var group=side === t.wrongEar ? el("g", {transform:"rotate("+(t.wrongTilt*side)+" "+(side*26)+" -50)"},root) : root;
        drawEar(group,t,st,side,p.coat.base,"#292638");
      });
      el("path", {d:bodyPath(t,46,57*t.squish*(p.presence === "asleep" ? .88 : 1)),fill:p.coat.base,stroke:"#292638","stroke-width":3,"stroke-linejoin":"round"},root);
      el("ellipse", {cx:0,cy:18,rx:26,ry:21,fill:p.coat.muzzle},root);
      drawMarking(root,t,"#292638",p.coat.mark);
      if(st.feet) [-1,1].forEach(function (side) {el("ellipse", {cx:side*20,cy:53,rx:10,ry:6.5,fill:p.coat.base,stroke:"#292638","stroke-width":2.5},root);});
      drawEyes(root,t,p.agent.pose === "sleepy" ? "asleep" : p.presence === "drowsy" ? "drowsy" : "awake",p.coat.base);
      safeItems(state).forEach(function (item) {drawItem(root,t,item,"#292638");});
      if(state.expedition && state.expedition.queued > 0) drawBindle(root,"#292638");
    });
    var outfit=window.CreatureWardrobe ? window.CreatureWardrobe.flat(p.layers,{x:160,y:184+20*scale,width:88*scale},p.coat) : "";
    var aura=p.agent.aura === "off" ? "" : '<circle cx="160" cy="184" r="'+(p.agent.aura === "quiet" ? 104 : 124)+'" fill="'+p.coat.accent+'" opacity=".12"/><circle cx="160" cy="184" r="'+(p.agent.aura === "quiet" ? 104 : 124)+'" fill="none" stroke="'+p.coat.accent+'" opacity=".4" stroke-dasharray="2 7"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="Amble, '+p.presence+'">'+aura+body+outfit+'</svg>';
  }
  function renderFlat(state,options) {
    state=state || {}; var p=project(state,options), modern=p.style === "modern" && window.CreatureFlat && window.CreatureFlatBodies;
    var svg=modern ? window.CreatureFlat.render(p.agent,p.coat,p.layers,p.lift,legacyArtwork(state,p)) : classicFlat(state,p);
    var extras="";
    if(p.presence === "asleep" && p.agent.pose === "sleepy") extras='<text x="237" y="99" font-size="16" fill="'+p.coat.muzzle+'" aria-label="asleep">z z</text>';
    if(state.collectibles && state.collectibles.length) extras+=capture(function (root) {
      var group=el("g", {transform:"translate(40,109)"},root);drawShelf(group,state.collectibles,"#292638",196);
    });
    svg=svg.replace('<svg ', '<svg class="amble-creature-art amble-mood-'+p.presence+'" data-shape="'+p.agent.shape+'" ')
      .replace('</svg>',FLAT_MOTION+extras+'</svg>');
    return svg;
  }
  function render(mountEl,captionEl,state,now) {
    if(!mountEl || !state || String(state.schema || "").indexOf("amble-creature/1") !== 0)return;
    if(!state.appearance || !window.CreatureFlat || !window.CreatureWardrobe) return renderLegacy(mountEl,captionEl,state,now);
    var p=project(state,{now:now});
    mountEl.className="amble-mount amble-mood-"+p.presence+" amble-stage-"+(Number(state.stage)||1);
    mountEl.innerHTML=renderFlat(state,{now:now});
    if(captionEl)captionEl.textContent=p.presence+" · stage "+(Number(state.stage)||1)+" "+(state.stage_name || "");
    var lore=document.getElementById("amble-creature-lore");
    if(lore)lore.textContent=state.profile && state.profile.length ? state.profile[state.profile.length-1].text || "" : "";
  }
  function renderVolume(canvas,state,options) {
    if(!canvas || !window.CreatureScene)return null;
    options=options || {}; var scene=null, fallback=null, frame=null, stopped=false, latestState=state,latestOptions=options, last=0;
    var reduced=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    var controller={mode:"volume",reason:"",update:update,front:function(){if(scene)scene.front();},zoom:function(n){if(scene)scene.zoom(n);},destroy:function(){
      stopped=true;if(frame!==null)cancelAnimationFrame(frame);if(scene)scene.destroy();if(fallback)fallback.remove();canvas.hidden=false;
    }};
    function paint(lift) {
      if(stopped)return;var p=project(latestState,latestOptions);
      if(scene)scene.render(p.agent,p.coat,p.layers,typeof lift === "number" ? lift : p.lift);
    }
    function update(next,nextOptions) {
      latestState=next || {};latestOptions=nextOptions || {};var items=safeItems(latestState);
      if(items.length && !window.CreatureScene.supportsLegacyItems){
        controller.mode="flat-compatibility";controller.reason="Existing accessories are preserved in 2D while their 3D forms are being modernized.";
        if(!fallback){fallback=document.createElement("div");fallback.className="creature-volume-fallback";canvas.insertAdjacentElement("afterend",fallback);}
        fallback.innerHTML=renderFlat(latestState,latestOptions);fallback.setAttribute("aria-label",controller.reason);canvas.hidden=true;
      }else{
        if(fallback){fallback.remove();fallback=null;}canvas.hidden=false;
        if(!scene){try{scene=window.CreatureScene.create(canvas);}catch(error){scene=null;}}
        controller.mode=scene?"volume":"unavailable";controller.reason=scene?(items.length?"Existing accessories use simple 3D forms; their original artwork remains in 2D.":""):"3D is unavailable in this browser. The 2D representation remains available.";
        paint();
      }
      return controller;
    }
    function tick(now) {
      if(stopped)return;
      if(!document.hidden && !canvas.hidden && scene && latestOptions.animate && !(reduced && reduced.matches) && now-last>32){
        var p=project(latestState,latestOptions);paint(p.presence === "awake" ? (1-Math.cos(now/1100))/2 : p.lift);last=now;
      }
      frame=requestAnimationFrame(tick);
    }
    update(state,options);if(typeof requestAnimationFrame === "function")frame=requestAnimationFrame(tick);
    return controller;
  }

  // Page boot renders only the public snapshot and advances its time-based
  // mood. Owner shells supply fresh state through render(): the extension's
  // newtab.js owns its beacon; Studio owns its authenticated snapshot stream.
  // This shared renderer never selects or contacts a private endpoint.
  function boot() {
    var tag = document.getElementById("amble-creature-state");
    var mountEl = document.getElementById("amble-creature-mount");
    if (!tag || !mountEl) return;
    var captionEl = document.getElementById("amble-creature-caption");
    var state;
    try { state = JSON.parse(tag.textContent); } catch (e) { return; }
    render(mountEl, captionEl, state);

    // mood re-tick: pure client-side time math, no polling
    setInterval(function () { render(mountEl, captionEl, state); }, 60000);
  }

  window.AmbleCreature = { render:render, mood:mood, boot:boot,
    renderFlat:renderFlat, renderVolume:renderVolume, project:project };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
