/* Projeto Shape — gráficos em SVG (linha e barras), sem dependências. */
(function (root) {
  'use strict';
  let uidN = 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  function empty(msg) {
    return '<div class="chart-empty">' + esc(msg || 'Ainda não há dados para o gráfico.') + '</div>';
  }

  function xLabels(items, xs, H, pb, max) {
    const n = items.length;
    const idx = [];
    if (n <= max) for (let i = 0; i < n; i++) idx.push(i);
    else for (let k = 0; k < max; k++) idx.push(Math.round((k * (n - 1)) / (max - 1)));
    return idx.map(i => '<text class="c-txt" x="' + xs[i].toFixed(1) + '" y="' + (H - pb + 15) + '" text-anchor="middle">' + esc(items[i].label) + '</text>').join('');
  }

  /** points: [{label, y, tip?}] */
  function lineChart(o) {
    const pts = o.points || [];
    if (!pts.length) return empty(o.empty);
    const W = 320, H = o.height || 170, pl = 38, pr = 14, pt = 14, pb = 26;
    const ys = pts.map(p => p.y);
    let min = Math.min.apply(null, ys), max = Math.max.apply(null, ys);
    if (min === max) { min -= 1; max += 1; }
    const span = max - min;
    min = Math.max(0, min - span * 0.18); max = max + span * 0.18;
    const X = i => pts.length === 1 ? (pl + (W - pl - pr) / 2) : pl + (i * (W - pl - pr)) / (pts.length - 1);
    const Y = v => pt + (1 - (v - min) / (max - min)) * (H - pt - pb);
    const xs = pts.map((_, i) => X(i));
    const id = 'g' + (++uidN);
    let grid = '';
    for (let t = 0; t <= 3; t++) {
      const v = min + ((max - min) * t) / 3, y = Y(v);
      grid += '<line class="c-grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
        '<text class="c-txt" x="' + (pl - 6) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end">' + fmt(v) + '</text>';
    }
    const line = pts.map((p, i) => (i ? 'L' : 'M') + xs[i].toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ');
    const area = line + ' L' + xs[pts.length - 1].toFixed(1) + ' ' + (H - pb) + ' L' + xs[0].toFixed(1) + ' ' + (H - pb) + ' Z';
    const dots = pts.map((p, i) => {
      const tip = esc(p.tip || (p.label + ' · ' + fmt(p.y) + (o.unit ? ' ' + o.unit : '')));
      return '<g data-tip="' + tip + '"><circle class="c-hit" cx="' + xs[i].toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="14"/><circle class="c-dot" cx="' + xs[i].toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="3.6"/></g>';
    }).join('');
    const last = pts[pts.length - 1];
    const cap = esc(last.tip || (last.label + ' · ' + fmt(last.y) + (o.unit ? ' ' + o.unit : '')));
    return '<div class="chart"><div class="chart-cap" aria-live="polite">' + cap + '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Gráfico de linha') + '">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="c-stop1"/><stop offset="1" class="c-stop2"/></linearGradient></defs>' +
      grid + (pts.length > 1 ? '<path d="' + area + '" fill="url(#' + id + ')"/><path class="c-line" d="' + line + '"/>' : '') +
      dots + xLabels(pts, xs, H, pb, 5) + '</svg></div>';
  }

  /** bars: [{label, value, tip?}] */
  function barChart(o) {
    const bars = o.bars || [];
    if (!bars.length) return empty(o.empty);
    const W = 320, H = o.height || 160, pl = 30, pr = 8, pt = 12, pb = 26;
    let m = Math.max.apply(null, bars.map(b => b.value));
    let max = m > 20 ? Math.ceil(m / 10) * 10 : Math.max(4, Math.ceil(m));
    if (max % 2) max += 1;
    const Y = v => pt + (1 - v / max) * (H - pt - pb);
    const slot = (W - pl - pr) / bars.length, bw = Math.min(22, slot * 0.62);
    const xs = bars.map((_, i) => pl + slot * i + slot / 2);
    let grid = '';
    for (let t = 0; t <= 2; t++) {
      const v = (max * t) / 2, y = Y(v);
      grid += '<line class="c-grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>' +
        '<text class="c-txt" x="' + (pl - 6) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end">' + fmt(v) + '</text>';
    }
    const rects = bars.map((b, i) => {
      const y = Y(b.value), h = Math.max(b.value > 0 ? 3 : 0, H - pb - y);
      const tip = esc(b.tip || (b.label + ' · ' + fmt(b.value) + (o.unit ? ' ' + o.unit : '')));
      return '<g data-tip="' + tip + '"><rect class="c-hit" x="' + (xs[i] - slot / 2).toFixed(1) + '" y="' + pt + '" width="' + slot.toFixed(1) + '" height="' + (H - pt - pb) + '"/>' +
        '<rect class="c-bar' + (i === bars.length - 1 ? ' is-last' : '') + '" x="' + (xs[i] - bw / 2).toFixed(1) + '" y="' + (H - pb - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="5"/></g>';
    }).join('');
    const last = bars[bars.length - 1];
    const cap = esc(last.tip || (last.label + ' · ' + fmt(last.value) + (o.unit ? ' ' + o.unit : '')));
    return '<div class="chart"><div class="chart-cap" aria-live="polite">' + cap + '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Gráfico de barras') + '">' +
      grid + rects + xLabels(bars, xs, H, pb, 6) + '</svg></div>';
  }

  root.ShapeCharts = { lineChart, barChart, empty };
})(typeof self !== 'undefined' ? self : this);
