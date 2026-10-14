/* FreeView custom slides: the cover and Magic slides, drawn the same way in the app and on the web.
 *
 * FV.render(element, spec) fills `element` with the slide. `spec` is fully resolved (no lookups):
 *   kind: 'cover' | 'text'
 *   title, subtitle, body (Markdown; rendered with marked + DOMPurify when present)
 *   background: image URL (cover), images: [URL] (text slide, up to 4)
 *   logo: URL, person: { name, role, photo: URL }, contacts: [{ label, value, href }]
 *   qr: false to turn off the QR codes made from the web addresses in the text (a cover shows the first;
 *   a Magic slide up to four, side by side)
 *   theme: { mode, background, foreground, accent, font, align, titleScale, bodyScale, radius }
 *   align: 'left' | 'center' to override the theme's alignment for this slide
 * A Magic slide (kind 'text') lays itself out from what it has:
 *   text only → the title is the hero (the text sets smaller when there's a lot of it, and text with
 *   no title reads as a quote); pictures only → the grid takes the whole slide; a title and pictures
 *   → the title above the grid; text and pictures → text beside the pictures (above on a tall screen).
 * Sizes use container units, so a slide scales with whatever box it's drawn in. Drawn full screen, the
 * background bleeds to the edges but the logo, text, person and QR code keep clear of the notch, Dynamic
 * Island and home indicator (the page needs viewport-fit=cover; a box away from the edges has no insets).
 * The app sets --safe-top/right/bottom/left from the screen, where env() reads 0 inside its viewer.
 *   videos: [URL | null] beside images: the video or audio a picture was made from, played when it's opened
 * A Magic slide's pictures can be tapped to see them full screen: in the app, the app shows the item
 * (the `fvPicture` message handler gets the picture's index); on the web, a viewer drawn here
 * (videos and audio play, ← → between pictures, Esc or × closes).
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
    --fv-pad-y: 6cqmin; --fv-pad-x: 7cqmin; box-sizing: border-box;
    padding: max(var(--fv-pad-y), calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 3cqmin)) max(var(--fv-pad-x), calc(var(--safe-right, env(safe-area-inset-right, 0px)) + 3cqmin))
      max(var(--fv-pad-y), calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 3cqmin)) max(var(--fv-pad-x), calc(var(--safe-left, env(safe-area-inset-left, 0px)) + 3cqmin)); }
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
  .fv .qrs { flex: none; display: flex; flex-wrap: wrap; gap: 2.4cqmin; align-items: flex-start; }
  .fv footer .qrs { justify-content: flex-end; }
  .fv .qrs.inline { margin: .4cqmin 0 2cqmin; justify-content: var(--fv-justify); }
  .fv > .qrs.inline, .fv main > .qrs.inline, .fv .copy > .qrs.inline { align-self: var(--fv-items); }
  .fv .qrs.inline .code { width: 14cqmin; height: 14cqmin; padding: 1.2cqmin; }
  .fv .body > .qrs.inline { margin-top: 1.6cqmin; }
  .fv .qrs.inline.many .code { width: 11cqmin; height: 11cqmin; padding: 1cqmin; }
  .fv .qrs.many span { max-width: 15cqmin; }
  .fv .cols { flex: 1; display: grid; grid-template-columns: 1fr; gap: 5cqmin; align-items: center; min-height: 0; }
  .fv .cols.media-on { grid-template-columns: 1fr 1fr; }
  .fv .copy { min-width: 0; }
  .fv .body { font-size: calc(3cqmin * var(--fv-body)); line-height: 1.45; text-wrap: pretty; }
  .fv .body p { margin: 0 0 1.6cqmin; } .fv .body ul, .fv .body ol { margin: 0 0 1.6cqmin; padding-left: 1.2em; }
  .fv .body li { margin: 0 0 .8cqmin; } .fv .body li::marker { color: var(--fv-accent); }
  .fv .body a { color: var(--fv-accent); } .fv .body code { font-family: ${FONTS.mono}; font-size: .9em; }
  .fv .body strong { font-weight: 650; }
  .fv.center .body ul, .fv.center .body ol { display: inline-block; text-align: left; }
  .fv.hero h1 { font-size: calc(11cqmin * var(--fv-title)); line-height: 1.02; letter-spacing: -0.03em; max-width: 16ch; }
  .fv.hero .body { margin-top: 3.4cqmin; font-size: calc(3.8cqmin * var(--fv-body)); line-height: 1.4; max-width: 46ch; }
  .fv.hero.dense h1 { font-size: calc(7cqmin * var(--fv-title)); max-width: 24ch; }
  .fv.hero.dense .body { margin-top: 2.6cqmin; font-size: calc(3cqmin * var(--fv-body)); max-width: 60ch; }
  .fv.hero.quote .body { margin-top: 0; font-size: calc(5.4cqmin * var(--fv-title)); line-height: 1.22; font-weight: 600; letter-spacing: -0.01em; text-wrap: balance; max-width: 30ch; }
  .fv.hero .body > :last-child { margin-bottom: 0; }
  .fv.grid, .fv.gallery { --fv-pad-y: 4cqmin; --fv-pad-x: 4cqmin; }
  .fv.gallery h2 { margin: 0 0 2.6cqmin; font-size: calc(4.8cqmin * var(--fv-title)); }
  .fv.grid header, .fv.gallery header { margin-bottom: 2.4cqmin; }
  .fv.grid footer, .fv.gallery footer { margin-top: 2.4cqmin; }
  .fv .media.fill { position: relative; flex: 1; height: auto; max-height: none; min-height: 0; grid-template-rows: 1fr; }
  .fv .media.fill.n3, .fv .media.fill.n4 { grid-template-rows: 1fr 1fr; }
  .fv .media.fill > img { min-width: 0; }
  .fv .media.fill.n1 { display: flex; align-items: center; justify-content: center; }
  .fv .media.fill.n1 img { width: auto; height: auto; max-width: 100%; max-height: 100%; }
  .fv .media { display: grid; gap: 2cqmin; height: 100%; max-height: 70cqh; }
  .fv .media.n2 { grid-template-columns: 1fr 1fr; } .fv .media.n3, .fv .media.n4 { grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; }
  .fv .media img { width: 100%; height: 100%; object-fit: cover; border-radius: calc(var(--fv-radius) * 1cqmin); min-height: 0; }
  .fv .media.n1 img { object-fit: contain; }
  .fv .media.n3 img:first-child { grid-row: span 2; }
  .fv.zoomable .media img { cursor: zoom-in; transition: transform .16s ease-out, filter .16s ease-out; -webkit-tap-highlight-color: transparent; }
  .fv.zoomable .media img:hover { filter: brightness(1.06); }
  .fv.zoomable .media img:active { transform: scale(.97); }
  @media (prefers-reduced-motion: reduce) { .fv.zoomable .media img { transition: none; } .fv.zoomable .media img:active { transform: none; } }
  .fv-focus { position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,.94); display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity .2s ease-out; -webkit-user-select: none; user-select: none; }
  .fv-focus.on { opacity: 1; }
  .fv-focus .item { max-width: calc(100vw - 32px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px));
    max-height: calc(100vh - 96px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); width: auto; height: auto; object-fit: contain;
    border-radius: 6px; transform: scale(.97); transition: transform .24s cubic-bezier(.2,.8,.2,1); background: #000; }
  .fv-focus.on .item { transform: none; }
  .fv-focus button { position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 0; padding: 0; cursor: pointer;
    background: rgba(255,255,255,.14); color: #fff; display: flex; align-items: center; justify-content: center;
    -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); transition: background-color .15s ease-out, transform .15s ease-out; }
  .fv-focus button:hover { background: rgba(255,255,255,.24); }
  .fv-focus button:active { transform: scale(.94); }
  .fv-focus button svg { width: 18px; height: 18px; stroke: currentColor; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .fv-focus .close { top: max(16px, env(safe-area-inset-top)); left: max(16px, env(safe-area-inset-left)); }
  .fv-focus .prev { left: max(16px, env(safe-area-inset-left)); top: 50%; margin-top: -22px; }
  .fv-focus .next { right: max(16px, env(safe-area-inset-right)); top: 50%; margin-top: -22px; }
  .fv-focus .count { position: absolute; bottom: max(18px, env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%);
    color: rgba(255,255,255,.8); font: 600 13px/1 -apple-system, system-ui, sans-serif; font-variant-numeric: tabular-nums;
    padding: 6px 12px; border-radius: 99px; background: rgba(0,0,0,.5); }
  @media (prefers-reduced-motion: reduce) { .fv-focus, .fv-focus .item { transition: none; } }
  @container (max-aspect-ratio: 1/1) {
    .fv .cols.media-on { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    .fv h1 { font-size: calc(10cqmin * var(--fv-title)); }
    .fv footer { flex-direction: column; align-items: stretch; }
    .fv footer > .qrs { align-self: flex-end; }
    .fv .media.fill.n2 { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
    .fv .media.fill.n3 { grid-template-rows: 2fr 1fr; }
    .fv .media.fill.n3 img:first-child { grid-row: auto; grid-column: span 2; }
  }`;

  // Web addresses written in the text: a full URL, www., or a bare domain like freeview.app.
  const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"')\]]+|[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.(?:app|com|io|dev|org|net|co|me|ai|design|studio|xyz|link|page|site|tv)(?:\/[^\s<>"')\]]*)?)/i;
  // Each address once, in reading order (a Markdown link counts once, by its target).
  function allURLs(...texts) {
    const found = [], seen = new Set();
    for (const t of texts) {
      const text = (t || '').replace(/\[([^\]]*)\]\(([^)]+)\)/g, ' $2 ');
      for (const m of text.matchAll(new RegExp(URL_RE.source, 'gi'))) {
        let u = m[1].replace(/[.,;:!?]+$/, '');
        if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
        const key = urlKey(u);
        if (!seen.has(key)) { seen.add(key); found.push(u); }
      }
    }
    return found;
  }
  function firstURL(...texts) { return allURLs(...texts)[0] || null; }
  const urlKey = (u) => u.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '').toLowerCase();

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

  // On a Magic slide the QR codes sit side by side after the text holding the web addresses (or under
  // the title), aligned with it. They stay in the footer only when no address can be found in the text.
  function placeQR(root, urls) {
    const qrs = root.querySelector('footer .qrs');
    if (!qrs) return;
    const keys = urls.map(urlKey);
    const holds = (el) => keys.some((key) => (el.textContent || '').toLowerCase().includes(key)
      || [...el.querySelectorAll('a[href]')].some((a) => a.href.replace(/\/$/, '').toLowerCase().includes(key)));
    const blocks = [...root.querySelectorAll('.body > *')];
    const target = blocks.some(holds) ? root.querySelector('.body') : [...root.querySelectorAll('h1, h2')].find(holds);
    if (!target) return;
    qrs.classList.add('inline');
    if (target.classList.contains('body')) target.appendChild(qrs); else target.after(qrs);
    const footer = root.querySelector('footer');
    if (footer && !footer.querySelector('.who, .qr')) footer.remove();
  }

  function render(el, spec) {
    installCSS();
    const t = Object.assign({ mode: 'dark', background: '#0b0b0c', foreground: '#ffffff', accent: '#ffffff', font: 'system', align: 'left', titleScale: 1, bodyScale: 1, radius: 2 }, spec.theme || {});
    const center = (spec.align || t.align) === 'center';
    const light = luminance(t.background) > 0.5;
    const cover = spec.kind === 'cover';
    const hasBg = cover && spec.background;

    // A Magic slide's layout, from what it has.
    // Each picture keeps the video or audio behind it (a picture that couldn't be made is left out).
    const shown = cover ? [] : (spec.images || []).map((src, i) => ({ src, video: (spec.videos || [])[i] || null })).filter((p) => p.src).slice(0, 4);
    const images = shown.map((p) => p.src);
    const body = (spec.body || '').trim(), hasTitle = !!(spec.title || '').trim();
    const layout = cover ? '' : images.length ? (body ? 'split' : hasTitle ? 'gallery' : 'grid') : 'hero';
    const lines = body.split('\n').filter((l) => l.trim()).length;
    const dense = layout === 'hero' && hasTitle && (body.length > 260 || lines > 5);
    const quote = layout === 'hero' && !hasTitle && body && body.length <= 160 && lines <= 3;

    const root = document.createElement('div');
    root.className = ['fv', cover ? 'cover' : 'text', layout, center && 'center', dense && 'dense', quote && 'quote'].filter(Boolean).join(' ');
    const vars = {
      '--fv-bg': t.background, '--fv-fg': hasBg ? '#ffffff' : t.foreground, '--fv-accent': t.accent, '--fv-font': FONTS[t.font] || FONTS.system,
      '--fv-align': center ? 'center' : 'left', '--fv-justify': center ? 'center' : 'flex-start', '--fv-items': center ? 'center' : 'flex-start',
      '--fv-title': t.titleScale, '--fv-body': t.bodyScale, '--fv-radius': t.radius,
      '--fv-scrim': 'rgba(0,0,0,.72)', '--fv-scrim-top': 'rgba(0,0,0,.35)',
      '--fv-qr-bg': hasBg ? 'rgba(255,255,255,.96)' : (light ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.96)'),
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);

    const urls = spec.qr === false ? [] : allURLs(spec.title, spec.subtitle, spec.body).slice(0, cover ? 1 : 4);
    const qrColor = hasBg || !light ? '#000000' : t.foreground;
    const qr = urls.length ? `<div class="qrs${urls.length > 2 ? ' many' : ''}">${urls.map((u) =>
      `<div class="qr"><div class="code">${qrSVG(u, qrColor)}</div><span>${esc(u.replace(/^https?:\/\//i, '').replace(/\/$/, ''))}</span></div>`).join('')}</div>` : '';

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
    } else if (layout === 'hero') {
      root.innerHTML = `<header>${logo}</header>
        <main>${hasTitle ? `<div class="accent"></div><h1>${esc(spec.title)}</h1>` : ''}${body ? `<div class="body">${markdown(spec.body)}</div>` : ''}</main>
        ${(who !== '<div></div>' || qr) ? `<footer>${who}${qr}</footer>` : ''}`;
    } else if (layout !== 'split') {
      root.innerHTML = `${logo ? `<header>${logo}</header>` : ''}${hasTitle ? `<h2>${esc(spec.title)}</h2>` : ''}
        <div class="media fill n${images.length}">${images.map((u) => `<img src="${esc(u)}" alt="">`).join('')}</div>
        ${(who !== '<div></div>' || qr) ? `<footer>${who}${qr}</footer>` : ''}`;
    } else {
      root.innerHTML = `<header>${logo}</header>
        <div class="cols${images.length ? ' media-on' : ''}">
          <div class="copy">${spec.title ? `<h2>${esc(spec.title)}</h2>` : ''}<div class="body">${markdown(spec.body)}</div></div>
          ${images.length ? `<div class="media n${images.length}">${images.map((u) => `<img src="${esc(u)}" alt="">`).join('')}</div>` : ''}
        </div>
        ${(who !== '<div></div>' || qr) ? `<footer>${who}${qr}</footer>` : ''}`;
    }
    root.querySelectorAll('.body a').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
    if (!cover && urls.length) placeQR(root, urls);
    const pictures = root.querySelectorAll('.media img');
    if (pictures.length && spec.zoom !== false) {
      const app = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.fvPicture;
      const items = [...pictures].map((img, i) => ({ src: img.getAttribute('src'), video: shown[i] ? shown[i].video : null }));
      root.classList.add('zoomable');
      pictures.forEach((img, i) => img.addEventListener('click', (e) => {
        e.stopPropagation();   // the web viewer's click-to-advance stays out of it
        if (app) app.postMessage(i); else focus(items, i);
      }));
    }
    el.innerHTML = '';
    el.appendChild(root);
    return root;
  }

  // Full screen on the web: one picture (or its video) at a time over everything, until closed.
  const ICON = { close: '<path d="M6 6l12 12M18 6L6 18"/>', prev: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>' };
  function focus(items, start) {
    installCSS();
    let index = start, media = null, touch = null;
    const box = document.createElement('div');
    box.className = 'fv-focus';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    const button = (cls, label) => {
      const b = document.createElement('button');
      b.className = cls; b.type = 'button'; b.setAttribute('aria-label', label);
      b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[cls]}</svg>`;
      box.appendChild(b);
      return b;
    };
    const count = document.createElement('div'); count.className = 'count';
    const show = () => {
      if (media) { if (media.pause) media.pause(); media.remove(); }
      const it = items[index];
      if (it.video) {
        media = document.createElement('video');
        media.controls = true; media.autoplay = true; media.playsInline = true; media.poster = it.src;
        media.setAttribute('playsinline', ''); media.setAttribute('controlslist', 'nodownload');
        media.src = it.video;
      } else {
        media = new Image(); media.alt = ''; media.draggable = false; media.src = it.src;
      }
      media.className = 'item';
      media.addEventListener('click', (e) => e.stopPropagation());
      box.insertBefore(media, box.firstChild);
      count.textContent = `${index + 1} / ${items.length}`;
      if (it.video) media.play().catch(() => {});
    };
    const step = (d) => { const n = Math.min(Math.max(index + d, 0), items.length - 1); if (n !== index) { index = n; show(); } };
    const close = () => {
      removeEventListener('keydown', keys, true);
      if (media && media.pause) media.pause();
      box.classList.remove('on');
      setTimeout(() => box.remove(), 200);
    };
    // Captured first, so the page's own keys (next slide, Esc) wait until this closes.
    const keys = (e) => {
      const k = e.key;
      if (k === 'Escape') close();
      else if (k === 'ArrowRight') step(1);
      else if (k === 'ArrowLeft') step(-1);
      else if (![' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Enter'].includes(k)) return;
      e.preventDefault(); e.stopImmediatePropagation();
    };
    button('close', 'Close').addEventListener('click', (e) => { e.stopPropagation(); close(); });
    if (items.length > 1) {
      button('prev', 'Previous picture').addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
      button('next', 'Next picture').addEventListener('click', (e) => { e.stopPropagation(); step(1); });
      box.appendChild(count);
    }
    box.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    box.addEventListener('touchstart', (e) => { if (e.touches.length === 1) touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (!touch) return;
      const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y;
      touch = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    });
    ['touchstart', 'touchend'].forEach((t) => box.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
    addEventListener('keydown', keys, true);
    show();
    document.body.appendChild(box);
    requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('on')));
    box.querySelector('.close').focus({ preventScroll: true });
  }

  window.FV = { render, firstURL, allURLs, fonts: FONTS };
})();
