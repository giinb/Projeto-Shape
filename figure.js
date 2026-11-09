/* Projeto Shape — ilustração do músculo trabalhado (silhueta frente/costas com destaque). */
(function (root) {
  'use strict';
  const mirror = x => 120 - x;
  const ln = (x1, y1, x2, y2, w, cls) =>
    '<line class="' + cls + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  const lnM = (x1, y1, x2, y2, w, cls) => ln(x1, y1, x2, y2, w, cls) + ln(mirror(x1), y1, mirror(x2), y2, w, cls);
  const ell = (cx, cy, rx, ry, cls) => '<ellipse class="' + cls + '" cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"/>';
  const ellM = (cx, cy, rx, ry, cls) => ell(cx, cy, rx, ry, cls) + ell(mirror(cx), cy, rx, ry, cls);

  function base() {
    return '<circle class="fb" cx="60" cy="17" r="11"/>' +
      ln(60, 28, 60, 38, 8, 'fs') +
      '<path class="fb" d="M32 42 Q60 34 88 42 L82 100 Q60 108 38 100 Z"/>' +
      '<path class="fb" d="M38 98 Q60 104 82 98 L85 126 Q60 136 35 126 Z"/>' +
      lnM(30, 48, 22, 88, 13, 'fs') + lnM(22, 88, 17, 124, 10, 'fs') +
      lnM(47, 128, 44, 166, 19, 'fs') + lnM(44, 166, 44, 206, 13, 'fs');
  }

  const ZONES = {
    quadriceps: () => lnM(47, 132, 45, 164, 16, 'fz'),
    peito: () => ellM(47, 58, 13, 9, 'fz'),
    ombros: () => '<circle class="fz" cx="31" cy="48" r="8"/><circle class="fz" cx="89" cy="48" r="8"/>',
    biceps: () => lnM(28, 54, 23, 82, 9, 'fz'),
    abdomen: () => '<rect class="fz" x="48" y="72" width="24" height="32" rx="10"/>',
    costas: () => '<path class="fz" d="M38 46 Q60 40 82 46 L74 98 Q60 102 46 98 Z"/>',
    triceps: () => lnM(28, 54, 23, 82, 9, 'fz'),
    'deltoide-post': () => '<circle class="fz" cx="31" cy="48" r="8"/><circle class="fz" cx="89" cy="48" r="8"/>',
    gluteos: () => ellM(50, 118, 12, 10, 'fz'),
    posterior: () => lnM(47, 136, 45, 164, 16, 'fz'),
    panturrilha: () => lnM(44, 172, 44, 200, 10, 'fz')
  };

  function svg(group, label) {
    const z = ZONES[group];
    return '<svg class="figure" viewBox="0 0 120 220" role="img" aria-label="' + (label || 'Músculo trabalhado') + '">' +
      base() + (z ? z() : '') + '</svg>';
  }

  root.ShapeFigure = { svg };
})(typeof self !== 'undefined' ? self : this);
