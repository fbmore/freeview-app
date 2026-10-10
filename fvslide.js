/* FreeView custom slides: the cover and text slides, drawn the same way in the app and on the web.
 *
 * FV.render(element, spec) fills `element` with the slide. `spec` is fully resolved (no lookups):
 *   kind: 'cover' | 'text'
 *   title, subtitle, body (Markdown; rendered with marked + DOMPurify when present)
 *   background: image URL (cover), images: [URL] (text slide, up to 4)
 *   logo: URL, person: { name, role, photo: URL }, contacts: [{ label, value, href }]
 *   qr: false to turn off the QR code made from the first web address in the text
 *   theme: { mode, background, foreground, accent, font, align, titleScale, bodyScale, radius }
 * Sizes use container units, so a slide scales with whatever box it's drawn in.
 */
(function () {
  const FONTS = {
    system: '-apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    rounded: 'ui-rounded, "SF Pro Rounded", -apple-system, system-ui, sans-serif',
    serif: 'ui-serif, "New York", Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    avenir: '"Avenir Next", Avenir, "Helvetica Neue", Helvetica, sans-serif',
  };

  const CSS = `
  .fv { position: absolute; inset: 0; container-type: size; overflow: hidden; background: var(--fv-bg); color: var(--fv-fg);
    font-family: var(--fv-font); -webkit-font-smoothing: antialiased; text-align: var(--fv-align); display: flex; flex-direction: column;
    padding: 6cqmin 7cqmin; box-sizing: border-box; }
  .fv * { box-sizing: border-box; }
  .fv .bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
  .fv .scrim { position: absolute; inset: 0; background: linear-gradient(to top, var(--fv-scrim) 0%, transparent 65%), linear-gradient(to bottom, var(--fv-scrim-top) 0%, transparent 30%); }
  .fv header, .fv main, .fv footer, .fv .cols { position: relative; }
  .fv header { display: flex; justify-content: var(--fv-justify); min-height: 6cqmin; }
  .fv .logo { height: 7cqmin; max-width: 28cqmin; object-fit: contain; }
  .fv.text .logo { height: 5cqmin; }
  .fv main { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: var(--fv-items); }
  .fv h1 { margin: 0; font-size: calc(8.4cqmin * var(--fv-title)); line-height: 1.04; font-weight: 700; letter-spacing: -0.02em; text-wrap: balance; max-width: 22ch; }
  .fv h2 { margin: 0 0 3cqmin; font-size: calc(6cqmin * var(--fv-title)); line-height: 1.08; font-weight: 700; letter-spacing: -0.015em; text-wrap: balance; }
  .fv .sub { margin: 2.4cqmin 0 0; font-size: calc(3.4cqmin * var(--fv-body)); line-height: 1.3; opacity: .8; text-wrap: pretty; max-width: 40ch; }
  .fv .accent { width: 8cqmin; height: .7cqmin; background: var(--fv-accent); border-radius: 1cqmin; margin: 0 0 3cqmin; }
  .fv.center .accent { margin-left: auto; margin-right: auto; }
  .fv footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 4cqmin; min-height: 4cqmin; }
  .fv.center footer { justify-content: center; }
  .fv .who { display: flex; align-items: center; gap: 2.6cqmin; text-align: left; }
  .fv .photo { width: 11cqmin; height: 11cqmin; border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 .3cqmin var(--fv-accent); }
  .fv .name { font-size: calc(3cqmin * var(--fv-body)); font-weight: 650; line-height: 1.2; }
  .fv .role { font-size: calc(2.3cqmin * var(--fv-body)); opacity: .75; }
  .fv .contacts { display: flex; flex-wrap: wrap; gap: .4cqmin 2.4cqmin; margin-top: .8cqmin; font-size: calc(2.1cqmin * var(--fv-body)); opacity: .85; }
  .fv .contacts a { color: inherit; text-decoration: none; }
  .fv .contacts b { font-weight: 600; color: var(--fv-accent); margin-right: .6cqmin; }
  .fv .qr { flex: none; display: flex; flex-direction: column; align-items: center; gap: 1cqmin; }
  .fv .qr .code { width: 17cqmin; height: 17cqmin; padding: 1.4cqmin; border-radius: calc(var(--fv-radius) * 0.6cqmin + 1cqmin); background: var(--fv-qr-bg); }
  .fv .qr .code svg { display: block; width: 100%; height: 100%; }
  .fv .qr span { font-size: calc(1.8cqmin * var(--fv-body)); opacity: .75; max-width: 22cqmin; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .fv .cols { flex: 1; display: grid; grid-template-columns: 1fr; gap: 5cqmin; align-items: center; min-height: 0; }
  .fv .cols.media-on { grid-template-columns: 1fr 1fr; }
  .fv .copy { min-width: 0; }
  .fv .body { font-size: calc(3cqmin * var(--fv-body)); line-height: 1.45; text-wrap: pretty; }
  .fv .body p { margin: 0 0 1.6cqmin; } .fv .body ul, .fv .body ol { margin: 0 0 1.6cqmin; padding-left: 1.2em; }
  .fv .body li { margin: 0 0 .8cqmin; } .fv .body li::marker { color: var(--fv-accent); }
  .fv .body a { color: var(--fv-accent); } .fv .body code { font-family: ${FONTS.mono}; font-size: .9em; }
  .fv .body strong { font-weight: 650; }
  .fv.center .body ul, .fv.center .body ol { display: inline-block; text-align: left; }
  .fv .media { display: grid; gap: 2cqmin; height: 100%; max-height: 70cqh; }
  .fv .media.n2 { grid-template-columns: 1fr 1fr; } .fv .media.n3, .fv .media.n4 { grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; }
  .fv .media img { width: 100%; height: 100%; object-fit: cover; border-radius: calc(var(--fv-radius) * 1cqmin); min-height: 0; }
  .fv .media.n1 img { object-fit: contain; }
  .fv .media.n3 img:first-child { grid-row: span 2; }
  @container (max-aspect-ratio: 1/1) {
    .fv .cols.media-on { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    .fv h1 { font-size: calc(10cqmin * var(--fv-title)); }
    .fv footer { flex-direction: column; align-items: stretch; }
    .fv .qr { align-self: flex-end; }
  }`;

  // The first web address written in the text: a full URL, www., or a bare domain like freeview.app.
  const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"')\]]+|[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.(?:app|com|io|dev|org|net|co|me|ai|design|studio|xyz|link|page|site|tv)(?:\/[^\s<>"')\]]*)?)/i;
  function firstURL(...texts) {
    for (const t of texts) {
      const m = (t || '').replace(/\]\(([^)]+)\)/g, ' $1 ').match(URL_RE);
      if (m) { let u = m[1].replace(/[.,;:!?]+$/, ''); if (!/^https?:\/\//i.test(u)) u = 'https://' + u; return u; }
    }
    return null;
  }

  function qrSVG(text, color) {
    if (typeof qrcode !== 'function') return '';
    const q = qrcode(0, 'M'); q.addData(text); q.make();
    const n = q.getModuleCount(); let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c},${r}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-hidden="true"><path d="${d}" fill="${color}"/></svg>`;
  }

  function luminance(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 0;
    const v = parseInt(m[1], 16), ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }

  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function markdown(text) {
    if (!text) return '';
    if (window.marked && window.DOMPurify) return DOMPurify.sanitize(marked.parse(text));
    return text.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  }

  function installCSS() {
    if (document.getElementById('fv-css')) return;
    const s = document.createElement('style'); s.id = 'fv-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  function render(el, spec) {
    installCSS();
    const t = Object.assign({ mode: 'dark', background: '#0b0b0c', foreground: '#ffffff', accent: '#ffffff', font: 'system', align: 'left', titleScale: 1, bodyScale: 1, radius: 2 }, spec.theme || {});
    const center = t.align === 'center';
    const light = luminance(t.background) > 0.5;
    const cover = spec.kind === 'cover';
    const hasBg = cover && spec.background;

    const root = document.createElement('div');
    root.className = `fv ${cover ? 'cover' : 'text'}${center ? ' center' : ''}`;
    const vars = {
      '--fv-bg': t.background, '--fv-fg': hasBg ? '#ffffff' : t.foreground, '--fv-accent': t.accent, '--fv-font': FONTS[t.font] || FONTS.system,
      '--fv-align': center ? 'center' : 'left', '--fv-justify': center ? 'center' : 'flex-start', '--fv-items': center ? 'center' : 'flex-start',
      '--fv-title': t.titleScale, '--fv-body': t.bodyScale, '--fv-radius': t.radius,
      '--fv-scrim': 'rgba(0,0,0,.72)', '--fv-scrim-top': 'rgba(0,0,0,.35)',
      '--fv-qr-bg': hasBg ? 'rgba(255,255,255,.96)' : (light ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.96)'),
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);

    const url = spec.qr === false ? null : firstURL(spec.title, spec.subtitle, spec.body);
    const qrColor = hasBg || !light ? '#000000' : t.foreground;
    const qr = url ? `<div class="qr"><div class="code">${qrSVG(url, qrColor)}</div><span>${esc(url.replace(/^https?:\/\//i, '').replace(/\/$/, ''))}</span></div>` : '';

    const person = spec.person || {};
    const contacts = (spec.contacts || []).filter((c) => c && c.value);
    const whoInner = (person.name || contacts.length)
      ? `<div>${person.name ? `<div class="name">${esc(person.name)}</div>` : ''}${person.role ? `<div class="role">${esc(person.role)}</div>` : ''}
         ${contacts.length ? `<div class="contacts">${contacts.map((c) => `<span>${c.label ? `<b>${esc(c.label)}</b>` : ''}${c.href ? `<a href="${esc(c.href)}" target="_blank" rel="noopener">${esc(c.value)}</a>` : esc(c.value)}</span>`).join('')}</div>` : ''}</div>` : '';
    const who = (person.photo || whoInner) ? `<div class="who">${person.photo ? `<img class="photo" src="${esc(person.photo)}" alt="">` : ''}${whoInner}</div>` : '<div></div>';
    const logo = spec.logo ? `<img class="logo" src="${esc(spec.logo)}" alt="">` : '';

    if (cover) {
      root.innerHTML = `${hasBg ? `<div class="bg" style="background-image:url('${esc(spec.background)}')"></div><div class="scrim"></div>` : ''}
        <header>${logo}</header>
        <main>${hasBg ? '' : '<div class="accent"></div>'}<h1>${esc(spec.title || '')}</h1>${spec.subtitle ? `<p class="sub">${esc(spec.subtitle)}</p>` : ''}</main>
        <footer>${who}${qr}</footer>`;
    } else {
      const images = (spec.images || []).filter(Boolean).slice(0, 4);
      root.innerHTML = `<header>${logo}</header>
        <div class="cols${images.length ? ' media-on' : ''}">
          <div class="copy">${spec.title ? `<h2>${esc(spec.title)}</h2>` : ''}<div class="body">${markdown(spec.body)}</div></div>
          ${images.length ? `<div class="media n${images.length}">${images.map((u) => `<img src="${esc(u)}" alt="">`).join('')}</div>` : ''}
        </div>
        ${(who !== '<div></div>' || qr) ? `<footer>${who}${qr}</footer>` : ''}`;
    }
    root.querySelectorAll('.body a').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
    el.innerHTML = '';
    el.appendChild(root);
    return root;
  }

  window.FV = { render, firstURL, fonts: FONTS };
})();
