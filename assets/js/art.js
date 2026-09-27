/* ==========================================================================
   Souls by Zamani — product illustrations
   Draws a stylised side-profile of each style in the chosen colour. Used
   whenever a product has no photos of its own.
   ========================================================================== */

(function () {
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
  }
  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  }
  function shade(hex, amt) {
    const [r, g, b] = hexToRgb(hex);
    if (amt < 0) return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
    return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  }
  function lum(hex) {
    const [r, g, b] = hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  function palette(hex) {
    const light = lum(hex) > 0.62;
    return {
      c: hex,
      d: shade(hex, light ? -0.28 : -0.38),
      dd: shade(hex, light ? -0.5 : -0.6),
      l: shade(hex, 0.22),
      st: light ? "rgba(60,40,25,.35)" : "rgba(255,245,230,.38)",
      line: light ? "rgba(60,40,25,.45)" : "rgba(0,0,0,.35)",
      gold: "#c9a24a",
      jute: "#cdb283",
      crepe: "#c8a067",
      rubber: light ? "#2a2826" : "#f1ede6"
    };
  }

  const stitch = (d, k, w) => `<path d="${d}" fill="none" stroke="${k.st}" stroke-width="${w || 1.4}" stroke-dasharray="3 3" stroke-linecap="round"/>`;
  const line = (d, color, w) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w || 1.6}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const shine = (d) => `<path d="${d}" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="3" stroke-linecap="round"/>`;

  /* Shared parts ---------------------------------------------------------- */
  const soleHeel = k => `<path d="M24 112 H218 C221 118 216 123 208 123 H72 V128 H30 C26 128 24 124 24 120 Z" fill="${k.dd}"/>`;
  const soleFlat = (k, col) => `<path d="M26 112 H218 C220 118 214 121 206 121 H34 C28 121 25 117 26 112 Z" fill="${col || k.dd}"/>`;
  const soleCrepe = k => `<path d="M24 112 H218 C221 119 216 126 208 126 H32 C26 126 24 122 24 118 Z" fill="${k.crepe}"/>`;
  const soleLug = k => `<path d="M22 110 H220 C224 118 218 126 208 126 H200 V130 H186 V126 H150 V130 H136 V126 H100 V130 H86 V126 H52 V130 H38 V126 H32 C24 126 21 118 22 110 Z" fill="#23201e"/>`;
  const soleJute = k => `<path d="M24 110 H218 C222 118 216 128 206 128 H34 C26 128 22 120 24 110 Z" fill="${k.jute}"/>` +
    [40, 60, 80, 100, 120, 140, 160, 180, 200].map(x => `<path d="M${x} 112 v14" stroke="rgba(120,90,50,.35)" stroke-width="1.2"/>`).join("");

  const pumpUpper = "M34 44 C32 58 36 66 46 70 C80 84 116 104 148 114 L206 116 C216 116 219 108 210 101 C194 90 170 84 150 84 C136 80 120 76 108 70 C92 62 74 48 56 44 Z";
  const pumpSole = k => `<path d="M46 70 C80 84 116 104 148 114 L206 116 C214 116 217 120 210 122.5 L148 121 C114 112 80 92 44 76 Z" fill="${k.dd}"/>`;
  const stiletto = k => `<path d="M40 72 L52 77 L47.5 128 L43.5 128 Z" fill="${k.dd}"/>`;
  const blockHeel = k => `<path d="M36 70 L60 79 L57 128 L40 128 Z" fill="${k.dd}"/>`;

  const SHOES = {
    oxford(k) {
      return soleHeel(k) +
        `<path d="M32 112 C29 96 34 84 50 80 L98 74 C106 64 122 60 136 66 C158 74 186 85 204 91 C217 95 221 106 215 112 Z" fill="${k.c}"/>` +
        `<path d="M98 74 C106 64 122 60 136 66 L130 82 C118 81 106 80 98 74 Z" fill="${k.d}"/>` +
        line("M104 70 L128 79 M110 66 L132 75 M104 76 L124 82", k.l, 1.6) +
        line("M50 80 C62 92 84 90 98 76", k.line) +
        stitch("M40 104 H210", k) +
        line("M182 87 C173 95 175 106 183 112", k.line) +
        shine("M150 76 C170 82 188 88 200 94");
    },
    brogue(k) {
      return SHOES.oxford(k) +
        `<path d="M182 87 C150 92 140 102 146 112" fill="none" stroke="${k.st}" stroke-width="2" stroke-dasharray="0.1 5" stroke-linecap="round"/>` +
        `<path d="M186 93 C176 99 177 106 184 111" fill="none" stroke="${k.st}" stroke-width="2" stroke-dasharray="0.1 5" stroke-linecap="round"/>` +
        `<circle cx="198" cy="102" r="1.3" fill="${k.st}"/><circle cx="204" cy="100" r="1.3" fill="${k.st}"/><circle cx="201" cy="106" r="1.3" fill="${k.st}"/>`;
    },
    monk(k) {
      return soleHeel(k) +
        `<path d="M32 112 C29 96 34 84 50 80 L98 74 C106 66 122 62 136 66 C158 74 186 85 204 91 C217 95 221 106 215 112 Z" fill="${k.c}"/>` +
        `<path d="M100 70 L140 88 L136 97 L96 80 Z" fill="${k.d}"/>` +
        `<path d="M108 76 L142 94 L138 103 L104 86 Z" fill="${k.d}"/>` +
        `<rect x="92" y="75" width="10" height="7" rx="1.5" fill="none" stroke="${k.gold}" stroke-width="2" transform="rotate(24 97 78)"/>` +
        `<rect x="100" y="82" width="10" height="7" rx="1.5" fill="none" stroke="${k.gold}" stroke-width="2" transform="rotate(24 105 85)"/>` +
        line("M50 80 C62 92 84 90 98 76", k.line) +
        stitch("M40 104 H210", k) + shine("M150 78 C170 84 188 88 200 94");
    },
    loafer(k) {
      return soleHeel(k) +
        `<path d="M32 112 C29 98 34 88 48 86 L112 84 C142 82 182 90 204 96 C217 100 221 106 215 112 Z" fill="${k.c}"/>` +
        stitch("M112 86 C140 80 176 88 200 99", k, 1.6) +
        `<path d="M116 86 C124 98 150 99 166 90 L164 86 C150 93 128 93 120 84 Z" fill="${k.d}"/>` +
        `<ellipse cx="141" cy="91" rx="7" ry="2.2" fill="${k.dd}"/>` +
        stitch("M40 104 H210", k) + shine("M156 88 C176 92 190 96 202 100");
    },
    driver(k) {
      return soleFlat(k) +
        `<path d="M32 112 C29 98 34 88 48 86 L112 84 C142 82 182 90 204 96 C217 100 221 106 215 112 Z" fill="${k.c}"/>` +
        stitch("M112 86 C140 80 176 88 200 99", k, 1.6) +
        `<path d="M118 86 C126 94 150 95 162 88" fill="none" stroke="${k.d}" stroke-width="4" stroke-linecap="round"/>` +
        [36, 48, 60].map(x => `<circle cx="${x}" cy="118" r="3.2" fill="${k.dd}"/>`).join("") +
        `<path d="M28 108 C24 100 28 94 34 92" fill="none" stroke="${k.dd}" stroke-width="5" stroke-linecap="round"/>` +
        shine("M156 88 C176 92 190 96 202 100");
    },
    espadrille(k) {
      return soleJute(k) +
        `<path d="M32 110 C29 98 34 90 48 88 L112 86 C142 84 182 90 204 96 C217 100 221 104 215 110 Z" fill="${k.c}"/>` +
        stitch("M44 104 H206", k) + shine("M156 90 C176 93 190 96 202 100");
    },
    chelsea(k) {
      return soleHeel(k) +
        `<path d="M42 112 C40 88 42 60 46 28 L96 28 C98 54 102 70 116 78 C144 86 184 92 204 97 C217 101 221 106 215 112 Z" fill="${k.c}"/>` +
        `<path d="M60 30 L69 76 L86 30 Z" fill="${k.dd}" opacity=".85"/>` +
        `<path d="M47 29 L47 15 C47 13 49 11 51 11 L57 11 L59 29 Z" fill="${k.d}"/>` +
        stitch("M46 104 H210", k) + stitch("M58 30 L67 78 M88 30 L71 78", k, 1.2) +
        shine("M150 84 C172 90 190 94 202 98") + shine("M52 40 C50 60 50 80 52 96");
    },
    chukka(k) {
      return soleCrepe(k) +
        `<path d="M42 112 C40 92 42 72 46 48 L98 48 C102 64 108 74 120 80 C146 88 184 93 204 97 C217 101 221 106 215 112 Z" fill="${k.c}"/>` +
        `<path d="M98 48 C102 64 108 74 120 80 L112 86 C100 78 94 64 90 50 Z" fill="${k.d}"/>` +
        line("M94 56 L104 58 M98 66 L108 68", k.l, 2) +
        `<circle cx="95" cy="56" r="1.8" fill="${k.gold}"/><circle cx="99" cy="66" r="1.8" fill="${k.gold}"/>` +
        stitch("M46 106 H210", k) + shine("M150 86 C172 91 190 95 202 99");
    },
    combat(k) {
      return soleLug(k) +
        `<path d="M42 110 C40 84 42 50 46 14 L98 14 C100 48 104 68 120 78 C146 86 184 92 204 97 C217 101 222 106 216 110 Z" fill="${k.c}"/>` +
        `<path d="M98 14 C100 48 104 68 120 78 L112 84 C98 74 92 48 90 16 Z" fill="${k.d}"/>` +
        [22, 32, 42, 52, 62, 72].map((y, i) => line(`M${90 + i * 1.5} ${y} L${102 + i * 2} ${y + 3}`, k.l, 2)).join("") +
        `<path d="M40 96 H214" stroke="${k.dd}" stroke-width="6"/>` +
        stitch("M50 88 H200", k) + shine("M150 84 C172 90 190 94 202 98");
    },
    sneaker(k) {
      const sole = k.rubber;
      const accent = k.c === "#f3f0ea" || k.c === "#e8dcc5" ? "#9a5528" : k.l;
      return `<path d="M22 108 H220 C223 116 217 125 206 125 H34 C26 125 21 118 22 108 Z" fill="${sole}" stroke="rgba(0,0,0,.08)"/>` +
        line("M30 116 H212", "rgba(0,0,0,.12)", 1.2) +
        `<path d="M28 108 C25 90 32 76 48 70 L92 62 C104 56 118 56 126 64 C150 76 186 86 206 94 C218 98 222 104 218 108 Z" fill="${k.c}" stroke="rgba(0,0,0,.06)"/>` +
        `<path d="M92 62 C104 56 118 56 126 64 L122 76 C110 72 100 70 92 66 Z" fill="${k.d}"/>` +
        line("M98 64 L118 72 M102 60 L122 68 M96 68 L114 75", k.line, 1.6) +
        `<path d="M72 102 C98 86 140 80 176 92" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M28 108 C26 96 30 86 38 80 L50 80 C46 90 46 100 48 108 Z" fill="${k.d}"/>` +
        stitch("M40 100 C80 98 150 98 206 102", k);
    },
    sandal(k) {
      return soleFlat(k, k.dd) +
        `<path d="M26 108 H216 C220 108 221 112 218 112 H26 Z" fill="${k.l}"/>` +
        `<path d="M56 110 C58 88 88 82 100 110" fill="none" stroke="${k.c}" stroke-width="9" stroke-linecap="round"/>` +
        `<path d="M128 110 C134 86 174 86 184 110" fill="none" stroke="${k.c}" stroke-width="9" stroke-linecap="round"/>` +
        `<path d="M36 110 C30 86 52 70 74 84" fill="none" stroke="${k.c}" stroke-width="7" stroke-linecap="round"/>` +
        `<rect x="40" y="80" width="8" height="8" rx="1.5" fill="none" stroke="${k.gold}" stroke-width="2"/>`;
    },
    slide(k) {
      return `<path d="M24 106 H216 C224 106 226 122 212 124 H32 C20 124 18 108 24 106 Z" fill="${k.dd}"/>` +
        `<path d="M26 104 H214 C218 104 219 108 216 108 H26 Z" fill="${k.l}"/>` +
        `<path d="M108 106 C110 74 190 72 198 106 Z" fill="${k.c}"/>` +
        stitch("M116 102 C120 82 186 80 192 102", k) + shine("M128 88 C146 80 170 80 184 88");
    },
    palm(k) {
      return `<path d="M24 106 H216 C224 106 226 122 212 124 H32 C20 124 18 108 24 106 Z" fill="${k.dd}"/>` +
        `<path d="M26 104 H214 C218 104 219 108 216 108 H26 Z" fill="${k.l}"/>` +
        `<path d="M100 106 C112 80 160 72 176 78 L186 86 C164 84 128 92 116 106 Z" fill="${k.c}"/>` +
        `<path d="M136 106 C130 84 158 72 190 78 C200 82 204 94 202 106 Z" fill="${k.d}"/>` +
        stitch("M112 102 C122 88 150 80 176 82", k) + shine("M150 84 C168 78 186 80 196 88");
    },
    mule(k) {
      return soleFlat(k) +
        `<path d="M92 112 C96 86 128 78 160 82 C186 86 208 96 215 104 C219 108 218 112 214 112 Z" fill="${k.c}"/>` +
        `<path d="M26 112 H92 C92 110 92 108 94 106 H30 C26 106 25 110 26 112 Z" fill="${k.l}"/>` +
        stitch("M100 106 C110 90 150 84 190 94", k) + shine("M140 86 C164 86 188 92 204 100");
    },

    /* --- women's --- */
    pump(k) {
      return stiletto(k) + pumpSole(k) + `<path d="${pumpUpper}" fill="${k.c}"/>` +
        shine("M120 94 C150 104 180 106 204 110") + line("M56 44 C80 56 110 74 150 84", k.line, 1.2);
    },
    block(k) {
      return blockHeel(k) + pumpSole(k) + `<path d="${pumpUpper}" fill="${k.c}"/>` +
        `<path d="M150 84 C170 84 196 92 210 101 C219 108 216 116 206 116 L188 115 C194 106 190 92 150 84 Z" fill="${k.d}" opacity=".35"/>` +
        shine("M120 94 C150 104 180 106 204 110");
    },
    kitten(k) {
      return `<path d="M42 100 L54 103 L49 128 L45 128 Z" fill="${k.dd}"/>` +
        `<path d="M46 96 C80 104 120 112 150 117 L206 118 C214 118 216 121 210 123 L150 123 C118 118 80 108 44 102 Z" fill="${k.dd}"/>` +
        `<path d="M34 72 C32 84 36 92 46 96 C80 104 120 112 150 116 L206 117 C216 117 219 110 210 104 C194 96 170 92 150 92 C130 90 112 86 98 80 C86 74 72 70 56 70 Z" fill="${k.c}"/>` +
        shine("M120 106 C150 112 180 112 204 113");
    },
    slingback(k) {
      return stiletto(k) + pumpSole(k) +
        `<path d="M46 70 C80 84 116 104 148 114 L150 110 C118 100 84 80 48 66 Z" fill="${k.l}"/>` +
        `<path d="M110 88 C124 98 136 106 148 114 L206 116 C216 116 219 108 210 101 C194 90 170 84 150 84 C136 84 122 85 110 88 Z" fill="${k.c}"/>` +
        `<path d="M178 88 C196 92 212 98 212 106 C212 114 208 116 200 116 C204 108 196 96 178 88 Z" fill="${k.dd}"/>` +
        `<path d="M50 46 C38 50 36 62 48 68" fill="none" stroke="${k.c}" stroke-width="5" stroke-linecap="round"/>` +
        `<rect x="45" y="42" width="7" height="6" rx="1" fill="none" stroke="${k.gold}" stroke-width="1.6"/>`;
    },
    heelsandal(k) {
      return stiletto(k) + pumpSole(k) +
        `<path d="M46 70 C80 84 116 104 148 114 L206 116 L206 113 L148 110 C116 100 80 80 48 66 Z" fill="${k.l}"/>` +
        `<path d="M160 114 C166 96 198 96 208 112" fill="none" stroke="${k.c}" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M96 96 C100 76 124 78 130 106" fill="none" stroke="${k.c}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M44 68 C38 58 38 48 44 42" fill="none" stroke="${k.c}" stroke-width="5" stroke-linecap="round"/>` +
        `<ellipse cx="54" cy="42" rx="14" ry="4" fill="none" stroke="${k.c}" stroke-width="4"/>` +
        `<rect x="62" y="38" width="6" height="7" rx="1" fill="none" stroke="${k.gold}" stroke-width="1.6"/>`;
    },
    wedge(k) {
      return `<path d="M44 68 C80 84 116 104 150 116 L208 116 C216 116 218 122 210 128 L40 128 L38 72 Z" fill="${k.jute}"/>` +
        [60, 80, 100, 120, 140].map(x => `<path d="M${x} ${86 + (x - 60) * 0.3} V126" stroke="rgba(120,90,50,.3)" stroke-width="1.2"/>`).join("") +
        `<path d="M44 68 C80 84 116 104 150 114 L208 114 L208 116 L150 116 C116 106 80 86 42 72 Z" fill="${k.dd}"/>` +
        `<path d="M120 104 C128 86 188 84 208 112" fill="none" stroke="${k.c}" stroke-width="9" stroke-linecap="round"/>` +
        `<path d="M44 66 C38 56 38 48 44 42" fill="none" stroke="${k.c}" stroke-width="5" stroke-linecap="round"/>` +
        `<ellipse cx="54" cy="42" rx="14" ry="4" fill="none" stroke="${k.c}" stroke-width="4"/>` +
        `<path d="M70 44 C84 60 100 76 118 100" fill="none" stroke="${k.c}" stroke-width="4" stroke-linecap="round"/>`;
    },
    flat(k) {
      return `<path d="M26 112 H216 C218 118 212 120 206 120 H32 C26 120 24 116 26 112 Z" fill="${k.dd}"/>` +
        `<path d="M30 112 C28 102 34 96 46 96 L80 100 C110 92 160 90 196 98 C214 102 220 108 214 112 Z" fill="${k.c}"/>` +
        line("M46 96 C62 104 80 102 94 96", k.line, 1.2) +
        `<path d="M92 98 C90 92 96 90 100 95 C104 90 110 92 108 98 C104 100 96 100 92 98 Z" fill="${k.d}"/>` +
        shine("M140 96 C170 96 196 100 208 106");
    },
    maryjane(k) {
      return SHOES.flat(k) +
        `<path d="M64 98 C68 82 96 80 104 94" fill="none" stroke="${k.d}" stroke-width="5" stroke-linecap="round"/>` +
        `<circle cx="70" cy="88" r="2.6" fill="${k.gold}"/>`;
    },
    heelmule(k) {
      return blockHeel(k) + pumpSole(k) +
        `<path d="M46 70 C80 84 116 104 148 114 L150 110 C118 100 84 80 48 66 Z" fill="${k.l}"/>` +
        `<path d="M104 86 C120 90 136 102 148 114 L206 116 C216 116 219 108 210 101 C194 90 168 82 150 80 C132 78 116 80 104 86 Z" fill="${k.c}"/>` +
        shine("M150 90 C176 96 196 102 206 108");
    },
    ankleboot(k) {
      return blockHeel(k) + pumpSole(k) +
        `<path d="M34 8 L84 8 C86 40 98 64 122 82 C150 92 190 96 208 104 C218 110 214 116 206 116 L148 114 C116 104 80 84 46 70 C38 66 34 58 34 50 Z" fill="${k.c}"/>` +
        `<path d="M70 10 L72 60" stroke="${k.dd}" stroke-width="1.6"/>` +
        stitch("M72 10 L74 60", k, 1) +
        shine("M42 16 C40 32 40 46 44 60") + shine("M140 96 C170 102 196 106 206 110");
    },
    kneeboot(k) {
      return `<g transform="translate(30 46) scale(.7)">` +
        `<path d="M36 70 L60 79 L57 128 L40 128 Z" fill="${k.dd}"/>` + pumpSole(k) +
        `<path d="M30 -60 L88 -60 C88 -10 88 40 100 60 C110 72 118 78 124 82 C150 92 190 96 208 104 C218 110 214 116 206 116 L148 114 C116 104 80 84 46 70 C38 66 34 58 34 50 C32 20 30 -20 30 -60 Z" fill="${k.c}"/>` +
        `<path d="M30 -60 L88 -60 L88 -52 L30 -52 Z" fill="${k.d}"/>` +
        shine("M40 -44 C38 -10 38 20 42 50") + shine("M140 96 C170 102 196 106 206 110") +
        `</g>`;
    }
  };

  /* Bags & accessories (viewBox 0 0 200 200) ------------------------------- */
  const BAGS = {
    tote(k) {
      return `<path d="M66 72 C66 26 134 26 134 72" fill="none" stroke="${k.d}" stroke-width="8" stroke-linecap="round"/>` +
        `<path d="M40 70 H160 L172 176 H28 Z" fill="${k.c}"/>` +
        `<path d="M40 70 H160 L161 80 H39 Z" fill="${k.d}"/>` +
        stitch("M44 86 H156 M34 166 H166", k) +
        `<rect x="60" y="74" width="8" height="14" rx="2" fill="${k.gold}"/><rect x="132" y="74" width="8" height="14" rx="2" fill="${k.gold}"/>` +
        shine("M54 100 L48 156");
    },
    handbag(k) {
      return `<path d="M72 86 C72 46 128 46 128 86" fill="none" stroke="${k.d}" stroke-width="8" stroke-linecap="round"/>` +
        `<rect x="26" y="84" width="148" height="94" rx="12" fill="${k.c}"/>` +
        `<path d="M26 96 C26 89 31 84 38 84 H162 C169 84 174 89 174 96 V122 C140 134 60 134 26 122 Z" fill="${k.d}"/>` +
        `<rect x="92" y="120" width="16" height="14" rx="3" fill="${k.gold}"/>` +
        stitch("M34 170 H166", k) + shine("M40 140 L40 166");
    },
    shoulder(k) {
      return `<path d="M46 84 C60 20 140 20 154 84" fill="none" stroke="${k.d}" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M36 82 C36 150 60 176 100 176 C140 176 164 150 164 82 C140 94 60 94 36 82 Z" fill="${k.c}"/>` +
        stitch("M46 94 C70 102 130 102 154 94", k) + shine("M54 110 C54 140 64 156 80 164");
    },
    crossbody(k) {
      return `<path d="M52 104 C36 60 60 16 100 14 C140 16 164 60 148 104" fill="none" stroke="${k.d}" stroke-width="5" stroke-linecap="round"/>` +
        `<rect x="44" y="98" width="112" height="76" rx="10" fill="${k.c}"/>` +
        `<path d="M44 108 C44 102 48 98 54 98 H146 C152 98 156 102 156 108 V132 H44 Z" fill="${k.d}"/>` +
        `<rect x="94" y="126" width="12" height="12" rx="2" fill="${k.gold}"/>` +
        stitch("M52 166 H148", k) + shine("M56 144 V162");
    },
    clutch(k) {
      return `<rect x="22" y="66" width="156" height="86" rx="6" fill="${k.c}"/>` +
        `<path d="M22 72 C22 68 25 66 28 66 H172 C175 66 178 68 178 72 L100 120 Z" fill="${k.d}"/>` +
        `<circle cx="100" cy="116" r="6" fill="${k.gold}"/>` +
        stitch("M30 144 H170", k) + shine("M34 96 L34 136");
    },
    mini(k) {
      return `<g transform="translate(30 30) scale(.7)">` + BAGS.handbag(k) + `</g>`;
    },
    bucket(k) {
      return `<path d="M62 64 C50 20 150 20 138 64" fill="none" stroke="${k.d}" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M50 62 H150 L158 162 C158 172 140 178 100 178 C60 178 42 172 42 162 Z" fill="${k.c}"/>` +
        `<ellipse cx="100" cy="62" rx="50" ry="8" fill="${k.d}"/>` +
        `<path d="M86 64 C80 84 76 96 72 104 M114 64 C120 84 124 96 128 104" fill="none" stroke="${k.dd}" stroke-width="3" stroke-linecap="round"/>` +
        `<circle cx="72" cy="106" r="3" fill="${k.gold}"/><circle cx="128" cy="106" r="3" fill="${k.gold}"/>` +
        shine("M60 90 L54 150");
    },
    backpack(k) {
      return `<path d="M82 30 C82 12 118 12 118 30" fill="none" stroke="${k.d}" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M50 52 C50 36 64 28 100 28 C136 28 150 36 150 52 V168 C150 174 146 178 140 178 H60 C54 178 50 174 50 168 Z" fill="${k.c}"/>` +
        `<path d="M50 52 C50 36 64 28 100 28 C136 28 150 36 150 52 V100 C130 108 70 108 50 100 Z" fill="${k.d}"/>` +
        `<rect x="92" y="100" width="16" height="12" rx="2" fill="${k.gold}"/>` +
        `<rect x="66" y="130" width="68" height="36" rx="6" fill="none" stroke="${k.st}" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    },
    belt(k) {
      return `<path d="M100 56 C150 56 180 76 180 100 C180 124 150 144 100 144 C50 144 20 124 20 100 C20 76 50 56 100 56 Z" fill="none" stroke="${k.c}" stroke-width="18"/>` +
        stitch("M100 50 C154 50 186 72 186 100 C186 128 154 150 100 150 C46 150 14 128 14 100 C14 72 46 50 100 50 Z", k, 1.2) +
        `<rect x="84" y="128" width="32" height="32" rx="4" fill="none" stroke="${k.gold}" stroke-width="5"/>` +
        `<path d="M100 132 V156" stroke="${k.gold}" stroke-width="3"/>`;
    },
    wallet(k) {
      return `<rect x="30" y="56" width="140" height="92" rx="8" fill="${k.c}"/>` +
        `<path d="M30 64 C30 60 34 56 38 56 H162 C166 56 170 60 170 64 V88 H30 Z" fill="${k.d}"/>` +
        `<rect x="92" y="80" width="16" height="16" rx="3" fill="${k.gold}"/>` +
        stitch("M38 140 H162 M38 64 V140 M162 64 V140", k);
    },
    cardholder(k) {
      return `<rect x="48" y="60" width="104" height="76" rx="8" fill="${k.c}"/>` +
        `<path d="M48 84 C80 96 120 96 152 84" fill="none" stroke="${k.dd}" stroke-width="2"/>` +
        `<path d="M48 104 C80 116 120 116 152 104" fill="none" stroke="${k.dd}" stroke-width="2"/>` +
        stitch("M54 130 H146 M54 66 H146", k) + shine("M58 118 V126");
    },
    charm(k) {
      return `<circle cx="100" cy="42" r="18" fill="none" stroke="${k.gold}" stroke-width="5"/>` +
        `<rect x="92" y="58" width="16" height="22" rx="3" fill="${k.gold}"/>` +
        `<path d="M86 80 H114 L108 96 H92 Z" fill="${k.d}"/>` +
        Array.from({ length: 9 }, (_, i) => `<path d="M${88 + i * 3} 96 C${86 + i * 3.5} 130 ${82 + i * 4.5} 150 ${80 + i * 5} 170" fill="none" stroke="${k.c}" stroke-width="3" stroke-linecap="round"/>`).join("");
    },
    pouch(k) {
      return `<path d="M30 70 H170 C176 70 178 74 178 80 L172 156 C172 162 168 166 162 166 H38 C32 166 28 162 28 156 L22 80 C22 74 24 70 30 70 Z" fill="${k.c}"/>` +
        `<path d="M26 74 H174" stroke="${k.dd}" stroke-width="3" stroke-dasharray="2 2"/>` +
        `<path d="M160 74 L170 96" stroke="${k.gold}" stroke-width="3" stroke-linecap="round"/>` +
        `<rect x="164" y="94" width="10" height="14" rx="2" fill="${k.d}"/>` + shine("M44 96 V148");
    },
    strap(k) {
      return `<rect x="84" y="14" width="32" height="74" rx="6" fill="${k.c}"/>` +
        `<rect x="84" y="112" width="32" height="76" rx="6" fill="${k.c}"/>` +
        `<rect x="80" y="86" width="40" height="28" rx="6" fill="#e9e5de" stroke="#9c958b" stroke-width="2"/>` +
        [132, 146, 160, 174].map(y => `<circle cx="100" cy="${y}" r="2.6" fill="${k.dd}"/>`).join("") +
        `<rect x="88" y="18" width="24" height="12" rx="2" fill="none" stroke="${k.gold}" stroke-width="3"/>` +
        stitch("M89 36 V84 M111 36 V84 M89 116 V184 M111 116 V184", k, 1);
    }
  };

  window.ART = {
    colourHex(key) { return (window.COLOURS[key] || { hex: "#999" }).hex; },
    svg(artKey, colourKey, opts) {
      opts = opts || {};
      const k = palette(this.colourHex(colourKey));
      const isShoe = !!SHOES[artKey];
      const fn = SHOES[artKey] || BAGS[artKey] || SHOES.oxford;
      const vb = opts.zoom ? (isShoe ? "110 50 120 75" : "40 50 120 120") : (isShoe ? "0 0 240 150" : "0 0 200 200");
      const shadow = isShoe
        ? `<ellipse cx="122" cy="131" rx="104" ry="6" fill="rgba(40,25,15,.12)"/>`
        : `<ellipse cx="100" cy="184" rx="78" ry="7" fill="rgba(40,25,15,.12)"/>`;
      return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.label || ""}" preserveAspectRatio="xMidYMid meet">${shadow}${fn(k)}</svg>`;
    }
  };
})();
