/* FreeView web editor (prototype). Make and present presentations in a browser, saved to the same
 * iCloud library the apps use (edit-store.js), with commentary recorded the FreeView way: the camera
 * as one track, the moments each slide came on as marks, played back together over the live slides.
 * What only the apps can do (live screens and windows, PowerPoint/Keynote, 3D) shows as a card that
 * says so, and stays untouched.
 */
(function () {
  'use strict';
  const S = window.FVStore;
  // The visitor's language (i18n.js); English as written here if it didn't load.
  const I = window.FVI18N || { lang: 'en', t: (s, v) => (v ? s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)) : s), apply() {},
    n: (c, one, other, v) => I.t(c === 1 ? one : other, Object.assign({ n: c }, v)), date: (d, o) => new Date(d).toLocaleDateString(undefined, o),
    dateTime: (d, o) => new Date(d).toLocaleString(undefined, o), fixed: (x, k) => Number(x).toFixed(k) };
  const T = I.t;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const LIBS = {
    marked: 'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js',
    purify: 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js',
    qrcode: 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js',
    pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    fvslide: '/fvslide.js?v=21',
  };
  const scripts = {};
  const loadScript = (url) => scripts[url] || (scripts[url] = new Promise((ok, fail) => {
    const t = document.createElement('script'); t.src = url; t.crossOrigin = 'anonymous'; t.onload = ok; t.onerror = fail; document.head.appendChild(t);
  }));
  const slideLibs = () => Promise.all([LIBS.marked, LIBS.purify, LIBS.qrcode, LIBS.fvslide].map(loadScript));

  const ICON = {
    plus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    rec: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="6.5" fill="#ff453a"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
    cam: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="6.5" width="13" height="11" rx="2.5"/><path d="M16 10.5l5-3v9l-5-3z"/></svg>',
    watch: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z" fill="currentColor" stroke="none"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    sound: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M4 9h3.5L12 5v14l-4.5-4H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    mute: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M4 9h3.5L12 5v14l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    folder: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/></svg>',
    stack: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="7" width="14" height="13" rx="2.5"/><path d="M7 4h11.5A2.5 2.5 0 0 1 21 6.5V16"/></svg>',
    globe: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>',
    device: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="2.5" y="4" width="15" height="10.5" rx="1.5"/><path d="M7 18h6M10 14.5V18"/><rect x="17" y="8" width="4.5" height="10" rx="1.2"/></svg>',
  };

  // ── state ──
  let store = null;
  let deck = null;      // { visit, folder, entries, selected, style }
  let profile = null;
  const infoCache = new Map();   // path → slide info

  // ── small UI helpers ──
  let toastTimer;
  function toast(text, action) {
    const t = $('#toast');
    t.innerHTML = `<span>${esc(text)}</span>` + (action ? `<button type="button">${esc(action.label)}</button>` : '');
    if (action) $('button', t).onclick = () => { t.classList.remove('on'); action.run(); };
    t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), action ? 6000 : 3200);
  }
  function busy(text) { $('#status').textContent = text || ''; $('#status').classList.toggle('on', !!text); }
  async function work(text, fn) {
    busy(text);
    try { return await fn(); } catch (e) { console.error(e); toast(errorText(e)); } finally { busy(''); }
  }
  function errorText(e, sharing) {
    const code = e && (e.ckErrorCode || e.serverErrorCode);
    if (code === 'QUOTA_EXCEEDED') return T('Your iCloud storage is full.');
    if (code === 'AUTHENTICATION_REQUIRED' || code === 'AUTHENTICATION_FAILED') return T('Sign in with Apple again to keep saving.');
    if (code === 'NETWORK_ERROR' || /NETWORK_ERROR|Failed to fetch/.test(String(e && (e.reason || e.message)))) return T('Couldn’t reach iCloud. Check your connection and try again.');
    if (code === 'LIMIT_EXCEEDED' || code === 'TOO_LARGE') return T('That file is too big to upload here. Add it in FreeView on your Mac, iPhone or iPad.');
    console.error(e);
    return sharing ? T("Couldn't share it. Try again.") : T("Couldn't save that. Try again.");
  }
  function show(view) {
    for (const id of ['welcome', 'library', 'deck', 'links', 'settings']) $('#' + id).hidden = id !== view;
    document.body.dataset.view = view;
    $('#tabs').hidden = view === 'welcome';
    const tab = view === 'deck' ? 'library' : view;
    $$('#tabs button').forEach((b) => { if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  }
  // ── FreeView Pro: bought in the app; the web follows it (see CloudStore.checkPro) ──
  let pro = null, proCheckedAt = 0;
  async function refreshPro(force) {
    if (!store || store.kind !== 'cloud' || (!force && Date.now() - proCheckedAt < 10 * 60e3)) return;
    proCheckedAt = Date.now();
    const was = pro; pro = await store.checkPro();
    // Testing on this computer only (never on freeview.app): ?devpro acts as Pro, to try Pro paths before the check can say so.
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has('devpro')) { pro = true; window.__fvDev = { latestCommentary, makeExport, deck: () => deck }; }
    if (pro !== was) { if (!deck && !$('#library').hidden) renderLibrary(); }
    renderProStatus();
  }
  function renderProStatus() {
    const el = $('#prostatus'); if (!el) return;
    el.textContent = pro === true ? T('Pro is on for this Apple Account: every presentation, here and in the app.')
      : pro === false ? T('Free: your three most recent presentations and one shared link. FreeView Pro unlocks everything, here and in the app. Get it in FreeView on your iPhone, iPad or Mac, signed in to the same Apple Account.')
      : store && store.kind === 'demo' ? T('Pro comes with your Apple Account once you sign in.') : T('Checking…');
    $('#progetbtn').hidden = pro !== false;
  }
  function showPaywall() {
    askChoice(T('Unlock FreeView Pro'), T('Pro keeps every presentation, with longer, bigger and password-protected links. Get it in FreeView on your iPhone, iPad or Mac, signed in to this Apple Account, then come back here.'),
      [['check', T('Check Again')], ['get', T('Get FreeView')]], (v) => {
        if (v === 'get') window.open('https://apps.apple.com/app/id1526222244', '_blank', 'noopener');
        else refreshPro(true).then(() => toast(pro === true ? T('Pro is on.') : pro === false ? T('Still on Free for this Apple Account.') : T('Couldn’t check right now. Try again in a moment.')));
      });
  }

  function goTab(tab) {
    if (tab === 'links') { deck = null; show('links'); $('#crumb').textContent = ''; renderLinks(); history.replaceState(null, '', '#links'); }
    else if (tab === 'settings') { deck = null; show('settings'); $('#crumb').textContent = ''; renderSettings(); history.replaceState(null, '', '#settings'); }
    else { showLibrary(); history.replaceState(null, '', location.pathname + location.search); }
  }

  // ── shared links (made in the apps; listed here to copy, open and check) ──

  function renderLinks() {
    const links = [...store.links.values()].map((x) => Object.assign({ thumb: x.thumb }, x.link))
      .filter((l) => l.recordName && !l.cleaned)
      .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    $('#linksempty').hidden = links.length > 0 || !!store.loading;
    $('#linklist').replaceChildren(...links.map((l) => {
      const url = 'https://freeview.app/v/' + l.recordName;
      const ends = S.fromApple(l.expiresAt), ended = ends < new Date();
      const never = ends - Date.now() > 3650 * 864e5;
      const day = (d) => I.date(d, { month: 'short', day: 'numeric' });
      const row = document.createElement('div'); row.className = 'linkrow' + (ended ? ' ended' : '');
      const when = never ? T('No end date') : ended ? T('Ended {date}', { date: day(ends) }) : T('Until {date}', { date: day(ends) });
      const bits = [I.n(l.slideCount, '{n} slide', '{n} slides'), when];
      if (l.hasPassword) bits.push(T('Password'));
      if (l.hasCommentary) bits.push(T('Commentary'));
      row.innerHTML = '<span class="lt"></span><div class="li"><strong>' + esc(l.title) + '</strong><span class="' + (ended ? 'ended' : '') + '">' + esc(bits.join(' · ')) + '</span></div>'
        + '<div class="la">' + (ended ? '<button type="button" class="btn small ghost" data-remove>' + T('Remove') + '</button>' : '<button type="button" class="btn small" data-copy>' + T('Copy Link') + '</button><a class="btn small ghost" href="' + esc(url) + '" target="_blank" rel="noopener">' + T('Open') + '</a><button type="button" class="icon-btn small" data-more aria-label="' + T('More') + '"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg></button>') + '</div>';
      if (l.thumb) $('.lt', row).style.backgroundImage = 'url("' + l.thumb + '")';
      const copy = $('[data-copy]', row);
      if (copy) copy.onclick = async () => { try { await navigator.clipboard.writeText(url); copy.textContent = T('Copied'); setTimeout(() => (copy.textContent = T('Copy Link')), 1600); } catch { toast(url); } };
      const rm = $('[data-remove]', row);
      if (rm) rm.onclick = () => work(T('Removing…'), () => removeLink(l)).then(renderLinks);
      const more = $('[data-more]', row);
      if (more) more.onclick = () => { const r = more.getBoundingClientRect(); linkMenu(l, r.right - 200, r.bottom + 4); };
      return row;
    }));
  }

  // ── sharing a link, as the app's Share Presentation (SharedLinks.swift, ShareExport.make): the slides made
  //    web-ready here, uploaded to iCloud's public database as one SharedSet, listed as a Link the apps sync ──

  const VIEWER = 'https://freeview.app/v/';
  // The Worker passes each upload on to iCloud, and Cloudflare caps a request near 100 MB.
  const UPLOAD_MAX = 95e6;
  const linkDays = (d) => (d === 7 ? T('1 week') : I.n(d, '{n} day', '{n} days'));
  const durations = (isPro) => (isPro ? [1, 7, 30, 90] : [1, 7]);
  const allLinks = () => [...store.links.values()].map((x) => x.link).filter((l) => l && l.recordName && !l.cleaned);
  const liveLinks = () => allLinks().filter((l) => S.fromApple(l.expiresAt) > new Date());
  const linkFor = (visitID) => liveLinks().filter((l) => l.visitID === visitID).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))[0];
  const mb = (n) => (n >= 1e9 ? I.fixed(n / 1e9, 1) + ' GB' : Math.max(1, Math.round(n / 1e6)) + ' MB');

  async function blobOf(path) {
    const u = await store.src(path); if (!u) return null;
    // no-store: the editor's <img> and <video> tags cache iCloud files without CORS headers, which a fetch then refuses.
    const r = await fetch(u, /^https?:/.test(u) ? { cache: 'no-store' } : undefined); return r.ok ? r.blob() : null;
  }
  function canvasBlob(c, type = 'image/jpeg', q = 0.85) {
    return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error(T('Couldn’t make a picture.')))), type, q));
  }
  /** As the app's writeJPEG: no larger than `side`, oriented, as JPEG. */
  async function jpeg(blob, side) {
    const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    const k = Math.min(1, side / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); bmp.close();
    return canvasBlob(c);
  }
  async function pdfPageJPEG(doc, p, side) {
    const page = await doc.getPage(p + 1);
    const base = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: side / Math.max(base.width, base.height) });
    const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: x, viewport: vp }).promise;
    return canvasBlob(c);
  }
  /** An audio slide's picture: its waveform, as the app's Waveform.card. */
  async function waveCard(blob) {
    const c = document.createElement('canvas'); c.width = 1920; c.height = 1080;
    const x = c.getContext('2d'); x.fillStyle = '#0B0B0C'; x.fillRect(0, 0, c.width, c.height);
    let peaks = new Array(96).fill(0.04);
    try {
      const buf = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(await blob.arrayBuffer());
      const d = buf.getChannelData(0), step = Math.max(1, Math.floor(d.length / peaks.length));
      peaks = peaks.map((_, i) => { let m = 0; for (let j = i * step; j < Math.min(d.length, (i + 1) * step); j += 16) m = Math.max(m, Math.abs(d[j])); return m; });
      const top = Math.max(...peaks, 0.01); peaks = peaks.map((v) => Math.max(0.04, v / top));
    } catch {}
    const w = 1440 / peaks.length; x.fillStyle = 'rgba(255,255,255,.85)';
    peaks.forEach((v, i) => { const h = v * 520; x.beginPath(); x.roundRect(240 + i * w + w * 0.2, 540 - h / 2, w * 0.6, h, w * 0.3); x.fill(); });
    return canvasBlob(c);
  }

  /** The presentation as files a browser can show (ShareExport.make): items, slide order, what was left out. */
  async function makeExport(visit, { withCommentary, onStep }) {
    const { folder, entries } = store.deckOf(visit);
    const x = { items: [], slides: [], origins: [], skipped: [], tooBig: [], cover: null, commentary: null, commentaryVideo: null };
    const add = (blob, type, name) => { x.items.push({ blob, type, name }); return x.items.length - 1; };
    const slide = (s, entry, page) => { x.slides.push(s); x.origins.push(entry + ':' + page); };
    const media = new Map();   // video or audio path → its item, uploaded once
    const asIs = async (path, type, name) => {
      if (media.has(path)) return media.get(path);
      const b = await blobOf(path); if (!b) return null;
      if (b.size > UPLOAD_MAX) { x.tooBig.push(S.baseName(path)); return null; }
      const i = add(b, type, name); media.set(path, i); return i;
    };
    for (const [i, entry] of entries.entries()) {
      onStep(i / entries.length);
      const path = `${folder}/${entry}`, t = S.fileType(entry), file = S.baseName(entry);
      const ext = file.includes('.') ? file.split('.').pop().toLowerCase() : '';
      const base = ext ? file.slice(0, -(ext.length + 1)) : file;
      try {
        if (t === 'image') {
          const b = await blobOf(path); const j = b && await jpeg(b, 2400).catch(() => null);
          if (j) slide('a:' + add(j, 'image', base + '.jpg'), i, 0); else x.skipped.push(file);
        } else if (t === 'webImage' && ext !== 'svgz') {
          const b = await blobOf(path); if (b) slide('a:' + add(b, 'image', file), i, 0); else x.skipped.push(file);
        } else if (t === 'live') {
          // Live only in the app: on the web it's the slide as it last looked live.
          const b = await blobOf(`${folder}/${S.posterPath(entry)}`); const j = b && await jpeg(b, 2400).catch(() => null);
          if (j) slide('a:' + add(j, 'image', base + '.jpg'), i, 0); else x.skipped.push(file);
        } else if (t === 'pdf') {
          const doc = await pdfDoc(await store.src(path));
          for (let p = 0; p < doc.numPages; p++) {
            slide('a:' + add(await pdfPageJPEG(doc, p, 2400), 'image', `${base}-${p + 1}.jpg`), i, p);
            onStep((i + (p + 1) / doc.numPages) / entries.length);
          }
        } else if (t === 'video') {
          const k = await asIs(path, 'video', file); if (k != null) slide('a:' + k, i, 0); else if (!x.tooBig.includes(file)) x.skipped.push(file);
        } else if (t === 'audio') {
          const b = await blobOf(path);
          if (!b || b.size > UPLOAD_MAX) { (b ? x.tooBig : x.skipped).push(file); continue; }
          const a = add(b, 'audio', file); media.set(path, a);
          const p = add(await waveCard(b), 'poster', base + '-waveform.jpg');
          slide(`a:${a}:p:${p}`, i, 0);
        } else if (t === 'link') {
          const m = /URL=(.+)/.exec((await store.text(path)) || ''); const page = m && m[1].trim();
          if (!page) continue;
          // Sites rarely show inside another page: the picture of it, with a button that opens it.
          const pic = await blobOf(`${folder}/${S.posterPath(entry)}`); const j = pic && await jpeg(pic, 1600).catch(() => null);
          slide(j ? `a:${add(j, 'image', base + '.jpg')}:u:${page}` : 'u:' + page, i, 0);
        } else if (t === 'markdown' || t === 'lottie') {
          const b = await blobOf(path); if (b) slide('a:' + add(b, t, file), i, 0); else x.skipped.push(file);
        } else if (t === 'model3D' && ext === 'glb') {
          const b = await blobOf(path); if (b && b.size <= UPLOAD_MAX) slide('a:' + add(b, 'model', file), i, 0); else x.skipped.push(file);
        } else if (t === 'sheet' && ext === 'csv') {
          const b = await blobOf(path); if (b) slide('a:' + add(b, 'table', file), i, 0); else x.skipped.push(file);
        } else if (t === 'custom') {
          const sl = await store.json(path); if (!sl) { x.skipped.push(file); continue; }
          // Its resolved description goes up (fvslide.js draws it on the web), each picture beside it.
          const pending = [];
          const ref = (p) => { if (!store.has(p)) return null; let k = pending.indexOf(p); if (k < 0) { pending.push(p); k = pending.length - 1; } return `pending-asset:${k}`; };
          const spec = await resolveSpec(folder, sl, ref);
          delete spec._live;
          let json = JSON.stringify(spec);
          for (const [k, p] of pending.entries()) {
            const pt = S.fileType(p), pf = S.baseName(p);
            let idx = null;
            if (pt === 'video' || pt === 'audio') idx = await asIs(p, 'asset', pf);
            else {
              const b = await blobOf(p);
              if (b && /\.png$/i.test(p)) idx = add(b, 'asset', `${base}-${k}.png`);
              else if (b) { const j = await jpeg(b, 2400).catch(() => null); if (j) idx = add(j, 'asset', `${base}-${k}.jpg`); }
            }
            // Matched with its quotes, so "pending-asset:1" doesn't match inside "pending-asset:10".
            json = json.split(`"pending-asset:${k}"`).join(idx == null ? 'null' : `"asset:${idx}"`);
          }
          slide('a:' + add(new Blob([json], { type: 'application/json' }), 'custom', base + '.json'), i, 0);
        } else {
          x.skipped.push(file);
        }
      } catch (e) { console.error(e); x.skipped.push(file); }
    }
    onStep(1);

    // The link preview's picture: the first photo, page or picture of a page; a video's cover; an audio waveform.
    for (const s of x.slides) {
      if (!s.startsWith('a:')) continue;
      const parts = s.split(':'), it = x.items[+parts[1]];
      try {
        if (it.type === 'image') x.cover = await jpeg(it.blob, 1200);
        else if (it.type === 'audio' && parts[2] === 'p') x.cover = await jpeg(x.items[+parts[3]].blob, 1200);
        else if (it.type === 'video') {
          const entry = entries[+x.origins[x.slides.indexOf(s)].split(':')[0]];
          const pic = await blobOf(`${folder}/${S.posterPath(entry)}`); if (pic) x.cover = await jpeg(pic, 1200);
        }
      } catch {}
      if (x.cover) break;
    }

    // The commentary: the take and its marks, renumbered to the slides that made it to the web (SlideMap.remap).
    const c = withCommentary && deck && deck.visit.id === visit.id ? await latestCommentary() : null;
    if (c && JSON.stringify(c.entries || []) === JSON.stringify(entries)) {
      const take = await blobOf(`${c._dir}/take.mov`).catch(() => null);
      if (!take) x.commentaryLeftOut = true;
      else if (take.size > UPLOAD_MAX) x.tooBig.push(T('Commentary'));
      if (take && take.size <= UPLOAD_MAX) {
        const appOrigins = [];
        for (const [i, entry] of entries.entries()) {
          const t = S.fileType(entry);
          let n = 1;
          if (t === 'pdf') n = (await pdfDoc(await store.src(`${folder}/${entry}`))).numPages;
          else if (t === 'link') n = /URL=./.test((await store.text(`${folder}/${entry}`)) || '') ? 1 : 0;
          for (let p = 0; p < n; p++) appOrigins.push(i + ':' + p);
        }
        const table = appOrigins.map((o) => { const k = x.origins.indexOf(o); return k < 0 ? null : k; });
        const marks = []; let last = 0;
        for (const m of c.marks) {
          const s = m.slide < table.length && table[m.slide] != null ? table[m.slide] : last; last = s;
          if (marks.length && marks[marks.length - 1].slide === s) continue;
          marks.push({ slide: s, time: m.time });
        }
        if (marks.length) marks[0].time = 0;
        const events = (c.events || []).flatMap((e) => (e.slide < table.length && table[e.slide] != null ? [{ t: e.time, s: table[e.slide], k: e.kind, v: e.values }] : []));
        x.commentary = JSON.stringify({ version: 1, id: c.id, duration: c.duration, marks, layout: c.layout, recordedLayout: c.recordedLayout || c.layout, events, clips: [] });
        x.commentaryVideo = take;
      }
    }
    return x;
  }

  /** Who the link is from, for the viewer's welcome screen (addSender): name, role, photo and logo. */
  async function addSender(x, folder) {
    const style = (await store.json(`${folder}/.style.json`)) || {};
    const custom = style.presenter === 'custom' && style.person;
    const who = (custom ? style.person : profile) || {};
    const sender = {};
    const name = [who.firstName, who.lastName].filter(Boolean).join(' ');
    if (name) sender.name = name;
    if (who.role) sender.role = who.role;
    const photo = await blobOf(custom ? `${folder}/.presenter.jpg` : '.profile/profile-photo.jpg');
    if (photo) { x.items.push({ blob: photo, type: 'asset', name: 'sender-photo.jpg' }); sender.photo = x.items.length - 1; }
    const logoMode = style.logo || 'profile';
    const logo = logoMode === 'none' ? null : await blobOf(logoMode === 'custom' ? `${folder}/.logo.png` : '.profile/default-logo.png');
    if (logo) { x.items.push({ blob: logo, type: 'asset', name: 'sender-logo.png' }); sender.logo = x.items.length - 1; }
    return Object.keys(sender).length ? sender : null;
  }
  async function hashPassword(password) {
    const salt = S.uuid().replace(/-/g, '').slice(0, 16);
    return `${salt}:${await S.sha256(salt + password)}`;
  }

  async function createLink(visit, o, onStage) {
    const isPro = pro === true;
    const x = await makeExport(visit, { withCommentary: o.commentary, onStep: (f) => onStage(T('Preparing…'), f) });
    if (!x.slides.length) throw new Error(T('Nothing in this presentation can go on the web yet.'));
    const sender = o.showSender ? await addSender(x, store.deckOf(visit).folder) : null;
    const total = x.items.reduce((n, it) => n + it.blob.size, 0) + (x.commentaryVideo ? x.commentaryVideo.size : 0);
    if (total >= (isPro ? 2e9 : 250e6)) throw new Error(isPro ? T('It comes to {size}, more than a link can carry (2 GB).', { size: mb(total) }) : T('It comes to {size}. Free links carry up to 250 MB; Pro up to 2 GB.', { size: mb(total) }));
    // Free: one live link. The web never ends a link on its own (Pro may only be unknown here): the person ends it.
    if (!isPro && liveLinks().length) throw new Error(T('Free shares one link at a time. End your current link in Shared Links first.'));

    const options = { mark: !isPro };
    if (sender) options.sender = sender;
    if (o.autoplay > 0) options.autoplay = o.autoplay;
    if (isPro && o.password) options.pw = await hashPassword(o.password);
    const name = S.uuid() + '-' + S.uuid();
    const expires = Date.now() + o.days * 864e5;
    const prefs = showPrefs();
    const fields = {
      title: { value: o.title }, expiresAt: { value: expires }, options: { value: JSON.stringify(options) },
      items: { value: x.items.map((it) => it.blob) }, itemTypes: { value: x.items.map((it) => it.type) }, itemNames: { value: x.items.map((it) => it.name) },
      slides: { value: x.slides }, transition: { value: prefs.transition === 'magicMove' ? 'crossfade' : prefs.transition },
    };
    if (o.message) fields.message = { value: o.message };
    if (x.cover) fields.cover = { value: x.cover };
    if (x.commentary) { fields.commentary = { value: x.commentary }; fields.commentaryVideo = { value: x.commentaryVideo }; }

    onStage(T('Uploading…'), 0);
    const stopWatch = S.watchUploads(total, (f) => onStage(T('Uploading…'), f));
    try { await store.publicSave({ recordName: name, recordType: 'SharedSet', fields }); } finally { stopWatch(); }

    const ownerKey = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
    const now = S.appleNow();
    const link = { recordName: name, title: o.title, slideCount: x.slides.length, createdAt: now, updatedAt: now, expiresAt: expires / 1000 - 978307200,
      visitID: visit.id, skipped: x.skipped.concat(x.tooBig), hasPassword: !!options.pw, hasCommentary: !!x.commentary, hasSender: !!sender, ownerKey };
    if (o.message) link.message = o.message;
    if (options.autoplay) link.autoplay = options.autoplay;
    await store.putLink(link, x.cover);
    // Its viewings are its owner's, before the address is out (the app's LinkVisit.claim).
    fetch(`${S.WORKER}/own/${name}`, { method: 'POST', headers: { 'X-FV-Owner': ownerKey } }).catch(() => {});
    return { link, tooBig: x.tooBig, skipped: x.skipped, commentaryLeftOut: !!x.commentaryLeftOut };
  }

  /** Stop Sharing: the copies go from iCloud now, the link stays in the list as ended. */
  async function stopLink(link) {
    await store.publicDelete(link.recordName);
    await store.putLink(Object.assign({}, link, { expiresAt: S.appleNow(), updatedAt: S.appleNow() }));
    if (link.ownerKey) fetch(`${S.WORKER}/link/${link.recordName}`, { method: 'DELETE', headers: { 'X-FV-Owner': link.ownerKey } }).catch(() => {});
  }
  /** Keep Longer: same link, a new end counted from now. */
  async function extendLink(link, days) {
    const expires = Date.now() + days * 864e5;
    await store.publicUpdate(link.recordName, { expiresAt: { value: expires } });
    await store.putLink(Object.assign({}, link, { expiresAt: expires / 1000 - 978307200 }));
  }
  async function removeLink(link) {
    if (S.fromApple(link.expiresAt) > new Date()) await stopLink(link);
    else await store.publicDelete(link.recordName).catch(() => {});
    await store.deleteLink(link.recordName);
  }

  function linkURLRow(link) {
    const url = VIEWER + link.recordName;
    return `<div class="linkout"><input readonly value="${esc(url)}" aria-label="${T('Link')}"><button type="button" class="btn primary" data-copylink>${T('Copy Link')}</button><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${T('Open')}</a></div>`;
  }
  function wireCopy(root, link) {
    const b = $('[data-copylink]', root); if (!b) return;
    b.onclick = async () => { try { await navigator.clipboard.writeText(VIEWER + link.recordName); b.textContent = T('Copied'); setTimeout(() => (b.textContent = T('Copy Link')), 1600); } catch { $('input', root).select(); } };
  }

  /** Share Presentation: the app's sheet, then its progress, then the link. */
  async function openShare(fresh) {
    if (!deck) return;
    const d = $('#sharesheet'), body = $('.sh-body', d);
    const visit = deck.visit, isPro = pro === true;
    const existing = !fresh && linkFor(visit.id);
    const done = (res) => {
      const l = res.link, ends = S.fromApple(l.expiresAt);
      const left = res.skipped.length ? `<p class="foot">${T('Left out, since browsers can’t show them: {list}. They play in FreeView on your iPhone, iPad or Mac.', { list: esc(res.skipped.join(', ')) })}</p>` : '';
      const big = res.tooBig.length ? `<p class="foot">${T('Too large to upload from a browser (over {size} each): {list}. Share from FreeView on your Mac or iPhone to include them.', { size: mb(UPLOAD_MAX), list: esc(res.tooBig.join(', ')) })}</p>` : '';
      const lost = res.commentaryLeftOut ? `<p class="foot">${T('The commentary couldn’t go in: its video isn’t in iCloud. Record it again to include it.')}</p>` : '';
      $('h2', d).textContent = T('Shared Link');
      body.innerHTML = `<p class="lede">${esc(l.title)} · ${I.n(l.slideCount, '{n} slide', '{n} slides')} · ${T('Works until {date}', { date: esc(I.dateTime(ends, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) })}</p>
        ${linkURLRow(l)}${left}${big}${lost}
        <div class="row end"><button type="button" class="btn" data-new>${T('New Link…')}</button><button type="button" class="btn primary" data-done>${T('Done')}</button></div>`;
      wireCopy(body, l);
      $('[data-done]', body).onclick = () => d.close();
      $('[data-new]', body).onclick = () => openShare(true);
    };
    if (existing) { if (!d.open) d.showModal(); return done({ link: existing, skipped: existing.skipped || [], tooBig: [] }); }

    const c = await latestCommentary();
    const fits = c && JSON.stringify(c.entries || []) === JSON.stringify(deck.entries);
    const name = [profile && profile.firstName, profile && profile.lastName].filter(Boolean).join(' ');
    const hasMe = !!name || store.has('.profile/profile-photo.jpg');
    const last = allLinks().filter((l) => l.visitID === visit.id).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
    const auto = last ? last.autoplay || 0 : 0;
    const days = 7;
    const freeNote = !isPro && liveLinks().length ? T('Free shares one link at a time, for up to a week and 250 MB. To share this one, first end your current link in Shared Links. Pro shares as many as you like, for up to 90 days, up to 2 GB each, with passwords and per-slide views.')
      : fresh ? T('A separate link with its own end date and view count. Your current link keeps working until it ends.')
      : T('PDF pages become images; videos go up as they are. Everything is uploaded to iCloud for as long as the link works.');
    $('h2', d).textContent = fresh ? T('New Link') : T('Share Presentation');
    body.innerHTML = `
      ${c ? `<section class="sect"><h3>${T('Commentary')}</h3><div class="switches">${sw('commentary', T('Include Commentary'), fits, !fits, clock(c.duration || 0))}</div>
        <p class="foot">${fits ? T('The link opens on your commentary: your camera and voice, the slides following along, in the layout you chose. People can still browse the slides on their own.') : T('The commentary was recorded on a different arrangement of slides, so it can’t go in this link. Record it again to include it.')}</p></section>` : ''}
      <section class="sect">
        <label class="field"><span>${T('Title')}</span><input id="sh-title" value="${esc(visit.title || '')}" autocomplete="off"></label>
        <label class="field"><span>${T('Message (optional)')}</span><textarea id="sh-message" rows="2" placeholder="${T('Shown before the presentation starts')}"></textarea></label>
        <div class="switches">${sw('sender', T('Show My Name and Photo'), hasMe, !hasMe)}</div>
        <p class="foot">${T('The title shows in link previews. With a message, the link opens on a welcome screen with your name, photo and logo (from Settings › Profile), before the presentation starts.')}</p>
      </section>
      <section class="sect">
        ${isPro ? `<label class="field"><span>${T('Password (optional)')}</span><input id="sh-password" type="password" autocomplete="new-password"></label>`
                : `<button type="button" class="prolock small" id="sh-pwpro"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><span>${T('Password')}</span><strong>Pro</strong></button>`}
        <p class="foot">${isPro ? T('People will need it to open the link. Share it separately.') : T('Protect links with a password, share more of them for longer, and drop the FreeView mark with Pro.')}</p>
      </section>
      <section class="sect">
        <div class="switches">${sw('autoplay', T('Autoplay'), auto > 0)}</div>
        <label class="field inline" id="sh-autorow" ${auto > 0 ? '' : 'hidden'}><span>${T('Each Slide For')}</span><select id="sh-seconds">${[...new Set([3, 5, 10, 20, 30, 60, auto || 5])].sort((a, b) => a - b).map((s) => `<option value="${s}" ${s === (auto || 5) ? 'selected' : ''}>${T('{n} Seconds', { n: s })}</option>`).join('')}</select></label>
        <p class="foot">${T('The link plays by itself, each slide for this long; videos and audio play to their end. People can still step through it.')}</p>
      </section>
      <section class="sect">
        <label class="field inline"><span>${T('Link works for')}</span><select id="sh-days">${[1, 7, 30, 90].map((n) => `<option value="${n}" ${n === days ? 'selected' : ''}>${linkDays(n)}${durations(isPro).includes(n) ? '' : ' · Pro'}</option>`).join('')}</select></label>
        <p class="foot">${T('Anyone with the link can watch it in a browser, ready to present. It stops working on its own after that; you can end it sooner in Shared Links.')}</p>
      </section>
      <p class="foot">${freeNote}</p>
      <div class="row end"><button type="button" class="btn" data-cancel>${T('Cancel')}</button><button type="button" class="btn primary" data-create>${T('Create Link')}</button></div>`;
    if (!d.open) d.showModal();
    const swOn = (k) => { const i = $(`[data-sw="${k}"]`, body); return !!(i && i.checked && !i.disabled); };
    $('[data-sw="autoplay"]', body).onchange = (e) => { $('#sh-autorow').hidden = !e.target.checked; };
    $('#sh-days').onchange = (e) => { if (!durations(isPro).includes(+e.target.value)) { e.target.value = '7'; showPaywall(); } };
    if ($('#sh-pwpro')) $('#sh-pwpro').onclick = showPaywall;
    $('[data-cancel]', body).onclick = () => d.close();
    const create = $('[data-create]', body);
    if (!isPro && liveLinks().length) {
      // One link at a time on Free: end the current one first, in Shared Links.
      create.disabled = true;
      const go = document.createElement('button'); go.type = 'button'; go.className = 'btn'; go.textContent = T('Open Shared Links');
      go.onclick = () => { d.close(); goTab('links'); };
      create.before(go);
    }
    $('#sh-title').oninput = () => { create.disabled = !$('#sh-title').value.trim() || (!isPro && liveLinks().length > 0); };
    create.onclick = async () => {
      const o = { title: $('#sh-title').value.trim(), message: $('#sh-message').value.trim(), showSender: swOn('sender'), commentary: swOn('commentary'),
        password: $('#sh-password') ? $('#sh-password').value : '', autoplay: swOn('autoplay') ? +$('#sh-seconds').value : 0, days: +$('#sh-days').value };
      if (store.kind === 'demo') return toast(T('In the sample nothing is uploaded. Sign in with Apple to share links.'));
      d.addEventListener('cancel', blockEsc);
      body.innerHTML = `<p class="lede" id="sh-stage">${T('Preparing…')}</p><div class="bar"><i id="sh-bar"></i></div><p class="foot">${T('Keep this page open until the link is ready.')}</p>`;
      try {
        const res = await createLink(visit, o, (label, f) => { $('#sh-stage').textContent = label; $('#sh-bar').style.transform = `scaleX(${Math.max(0.02, Math.min(1, f))})`; });
        done(res);
        if (!$('#links').hidden) renderLinks();
      } catch (e) {
        console.error(e);
        d.close(); toast(e && !e.ckErrorCode && !e.serverErrorCode && e.message && !/fetch|network/i.test(e.message) ? e.message : errorText(e, true));
      } finally { d.removeEventListener('cancel', blockEsc); }
    };
  }
  const blockEsc = (e) => e.preventDefault();

  function linkMenu(l, x, y) {
    const visit = l.visitID && store.visit(l.visitID);
    showMenu(x, y, [
      visit && { label: T('Edit Presentation'), run: () => openDeck(l.visitID) },
      { label: T('Keep Longer…'), run: () => askChoice(T('Keep Longer'), T('From now. The link stays the same.'), durations(pro === true).map((n) => [String(n), linkDays(n)]),
        (v) => work(T('Saving…'), () => extendLink(l, +v)).then(renderLinks)) },
      '-',
      { label: T('Stop Sharing'), danger: true, run: () => askChoice(T('Stop Sharing?'), T('The link stops working now, and its copies are deleted from iCloud.'), [['remove', T('Stop Sharing')]],
        () => work(T('Stopping…'), () => stopLink(l)).then(renderLinks)) },
    ].filter(Boolean));
  }

  // ── settings: the profile the apps use for covers and Magic slides ──

  const CONTACTS = [['website', 'Website', 'example.com', 'url'], ['email', 'Email', 'you@example.com', 'email'], ['phone', 'Phone', '+1 555 0100', 'tel'],
    ['linkedin', 'LinkedIn', 'handle', 'off'], ['x', 'X', '@handle', 'off'], ['instagram', 'Instagram', '@handle', 'off'], ['github', 'GitHub', 'handle', 'off'],
    ['threads', 'Threads', '@handle', 'off'], ['bluesky', 'Bluesky', 'you.bsky.social', 'off']];
  async function renderSettings() {
    renderProStatus();
    profile = (await store.json('.profile/profile.json')) || profile || {};
    const p = Object.assign({ firstName: '', lastName: '', role: '', contacts: {} }, profile);
    $('#contactfields').innerHTML = CONTACTS.map(([k, label, ph, ac]) =>
      '<label class="field"><span>' + T(label) + '</span><input data-contact="' + k + '" value="' + esc((p.contacts || {})[k] || '') + '" placeholder="' + esc(T(ph)) + '" autocomplete="' + ac + '" spellcheck="false"></label>').join('');
    for (const k of ['firstName', 'lastName', 'role']) $('#p-' + k).value = p[k] || '';
    const save = debounce(() => work(T('Saving…'), async () => {
      // Every key, always: the apps' decoder has no defaults.
      const next = { firstName: $('#p-firstName').value.trim(), lastName: $('#p-lastName').value.trim(), role: $('#p-role').value.trim(), contacts: {} };
      $$('[data-contact]').forEach((i) => { const v = i.value.trim(); if (v) next.contacts[i.dataset.contact] = v; });
      await store.writeJSON('.profile/profile.json', next);
      profile = next; infoCache.clear();
    }), 700);
    $$('#settings input').forEach((i) => (i.oninput = save));
    const pics = async () => {
      const photo = await store.src('.profile/profile-photo.jpg'), logo = await store.src('.profile/default-logo.png');
      $('#photoframe').style.backgroundImage = photo ? 'url("' + photo + '")' : '';
      $('#logoframe').style.backgroundImage = logo ? 'url("' + logo + '")' : '';
    };
    pics();
    $('#photobtn').onclick = () => pickFiles('image/*', ([f]) => work(T('Saving your photo…'), async () => { await store.putFile('.profile/profile-photo.jpg', await asImage(f, 'image/jpeg', 1200)); infoCache.clear(); pics(); }));
    $('#logobtn').onclick = () => pickFiles('image/*', ([f]) => work(T('Saving your logo…'), async () => { await store.putFile('.profile/default-logo.png', await asImage(f, 'image/png', 1200)); infoCache.clear(); pics(); }));
    $('#icloudnote').textContent = store.kind === 'demo' ? T('This is a demo: nothing is saved. Sign in with Apple to use your own library.')
      : T('Everything here is saved to your iCloud and shows up in FreeView on your iPhone, iPad and Mac.');
    $('#signout2').hidden = store.kind === 'demo';
    const sp = showPrefs();
    $('#slideshow').innerHTML = `
      <label class="field inline"><span>${T('Transition')}</span><select data-sp="transition">${TRANSITIONS.filter(([v]) => v !== 'magicMove').map(([v, l]) => `<option value="${v}" ${sp.transition === v ? 'selected' : ''}>${T(l)}</option>`).join('')}</select></label>
      <div class="switches">${sw('numbers', T('Show slide numbers'), sp.numbers)}${sw('arrows', T('Show ‹ › buttons'), sp.arrows)}${sw('loop', T('Loop videos'), sp.loop)}</div>
      <label class="field inline"><span>${T('Autoplay')}</span><select data-sp="autoplay">${[[0, T('Off')], ...[3, 5, 10, 20, 30].map((n) => [n, T('Each slide {n} seconds', { n })]), [60, T('Each slide 1 minute')]].map(([v, l]) => `<option value="${v}" ${+sp.autoplay === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <p class="foot">${T('For presenting in this browser. The transition is for slides without one of their own.')}</p>`;
    $$('#slideshow [data-sw]').forEach((c) => (c.onchange = () => setShowPref(c.dataset.sw, c.checked)));
    $$('#slideshow [data-sp]').forEach((c) => (c.onchange = () => setShowPref(c.dataset.sp, c.dataset.sp === 'autoplay' ? +c.value : c.value)));
  }
  /** A picture as the file type the apps keep it in (JPEG photo, PNG logo), no larger than max. */
  async function asImage(file, type, max) {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise((ok) => c.toBlob(ok, type, 0.88));
  }

  // ── slides: what each entry is, and how it's drawn ──

  const KIND_LABEL = { image: 'Photo', webImage: 'Picture', video: 'Video', audio: 'Sound', pdf: 'PDF', custom: 'Slide', live: 'Live', link: 'Website',
    markdown: 'Text', model3D: '3D model', office: 'Office file', sheet: 'Table', lottie: 'Animation', webarchive: 'Web page', other: 'File' };

  /** Everything needed to draw one entry of a presentation. */
  async function slideInfo(folder, entry) {
    const path = `${folder}/${entry}`;
    if (infoCache.has(path) && infoCache.get(path).tag === tagOf(path)) return infoCache.get(path);
    const type = S.fileType(entry);
    const info = { entry, path, type, name: S.baseName(entry), url: await store.src(path), poster: await store.src(`${folder}/${S.posterPath(entry)}`), tag: tagOf(path) };
    if (type === 'custom') {
      info.slide = await store.json(path);
      info.spec = info.slide && await resolveSpec(folder, info.slide);
      info.label = info.slide ? T(info.slide.kind === 'cover' ? 'Cover' : 'Magic slide') : T('Slide');
    } else if (type === 'live') {
      const live = await store.json(path);
      info.cameras = !!(live && live.tiles && live.tiles.length && live.tiles.every((t) => /^camera:/.test(t.source)));
    } else if (type === 'link') {
      const text = await store.text(path) || '';
      const m = /URL=(.+)/.exec(text) || /<string>(https?:[^<]+)<\/string>/.exec(text);
      info.href = m ? m[1].trim() : '';
    }
    info.label = info.label || T(KIND_LABEL[type] || 'File');
    infoCache.set(path, info);
    return info;
  }
  const tagOf = (path) => { const f = store.files.get(path); return f ? (f.tag || f.url) : ''; };

  /** A Magic slide or cover, resolved the way the apps do (CustomSlides.spec) for fvslide.js. */
  /** `ref`, when given, stands in for `store.src` (a link's export swaps each file for a placeholder). */
  async function resolveSpec(folder, slide, ref) {
    const src = ref || ((p) => store.src(p));
    const style = deck && deck.folder === folder ? deck.style : await store.json(`${folder}/.style.json`);
    const theme = Object.assign({ background: '#0B0B0C', foreground: '#FFFFFF', accent: '#FFFFFF', font: 'system', align: 'left', titleScale: 1, bodyScale: 1, radius: 2 }, style && style.theme);
    const spec = { kind: slide.kind, title: slide.title || '', subtitle: slide.subtitle || '', body: slide.body || '', qr: slide.qr !== false, theme };
    const buttons = (slide.buttons || []).filter((b) => b.url).map((b) => ({ label: b.label || b.url, url: /:\/\//.test(b.url) ? b.url : 'https://' + b.url }));
    if (buttons.length) spec.buttons = buttons;
    const logoMode = (style && style.logo) || 'profile';
    if (slide.showLogo && logoMode !== 'none') {
      const logo = await src(logoMode === 'custom' ? `${folder}/.logo.png` : '.profile/default-logo.png');
      if (logo) spec.logo = logo;
    }
    const picture = (entry) => {
      const t = S.fileType(entry);
      if (t === 'image' || t === 'webImage') return src(`${folder}/${entry}`);
      return src(`${folder}/${S.posterPath(entry)}`);
    };
    if (slide.kind === 'cover' && slide.background) { const bg = await picture(slide.background); if (bg) spec.background = bg; }
    if (slide.kind === 'text') {
      if (slide.align) spec.align = slide.align;
      if (slide.split) spec.split = slide.split;
      const images = [], videos = [], fits = [], live = [];
      for (const entry of (slide.images || []).slice(0, 4)) {
        const t = S.fileType(entry);
        let pic = await picture(entry);
        if (!pic && t === 'live') pic = CAMERA_POSTER;
        if (!pic) continue;
        images.push(pic);
        videos.push(t === 'video' || t === 'audio' ? await src(`${folder}/${entry}`) : null);
        if (t === 'live') {
          const l = await store.json(`${folder}/${entry}`); const tile = l && l.tiles && l.tiles[0];
          fits.push(tile && tile.fill ? 'cover' : 'contain');
          live.push(!!(tile && /^camera:/.test(tile.source)));
        } else { fits.push(null); live.push(false); }
      }
      spec.images = images;
      if (videos.some(Boolean)) spec.videos = videos;
      const kept = (slide.images || []).slice(0, 4).filter((e) => true);
      if (slide.syncsMedia && videos.some(Boolean)) spec.syncs = true;
      const silent = new Set(slide.silent || []);
      if (silent.size) spec.silent = kept.map((e) => (silent.has(e) ? true : null)).slice(0, images.length);
      const sites = await Promise.all(kept.map(async (e) => { if (S.fileType(e) !== 'link') return null; const t = await store.text(`${folder}/${e}`) || ''; const m = /URL=(.+)/.exec(t); return m ? m[1].trim() : null; }));
      if (sites.some(Boolean)) spec.sites = sites.slice(0, images.length);
      if (fits.some(Boolean)) spec.fits = fits;
      if (slide.edge && images.length === 1) spec.edge = S.fileType(slide.images[0]) === 'image' ? 'still' : 'media';
      spec._live = live;
    }
    const who = style && style.presenter === 'custom' && style.person ? style.person : profile;
    const photo = await src(style && style.presenter === 'custom' ? `${folder}/.presenter.jpg` : '.profile/profile-photo.jpg');
    if (who) {
      const person = {};
      const name = [who.firstName, who.lastName].filter(Boolean).join(' ');
      if (slide.showName && name) person.name = name;
      if (slide.showRole && who.role) person.role = who.role;
      if (slide.showPhoto && photo) person.photo = photo;
      if (Object.keys(person).length) spec.person = person;
      spec.contacts = (slide.contacts || []).map((field) => contact(field, (who.contacts || {})[field])).filter(Boolean);
    }
    return spec;
  }
  function contact(field, value) {
    const v = (value || '').trim(); if (!v) return null;
    const h = v.replace(/^@/, '');
    const href = { website: /:\/\//.test(v) ? v : 'https://' + v, email: 'mailto:' + v, phone: 'tel:' + v.replace(/[^+\d]/g, ''),
      linkedin: 'https://www.linkedin.com/in/' + h, x: 'https://x.com/' + h, instagram: 'https://instagram.com/' + h, github: 'https://github.com/' + h,
      threads: 'https://www.threads.net/@' + h, bluesky: 'https://bsky.app/profile/' + h }[field] || '';
    const label = T({ website: 'Website', email: 'Email', phone: 'Phone', linkedin: 'LinkedIn', x: 'X', instagram: 'Instagram', github: 'GitHub', threads: 'Threads', bluesky: 'Bluesky' }[field] || field);
    return { label, value: v, href };
  }
  // A camera that hasn't been seen yet: a dark frame with a camera, until the browser's own camera is on.
  const CAMERA_POSTER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#1c1c1e"/><g fill="none" stroke="#8e8e93" stroke-width="18" stroke-linejoin="round"><rect x="600" y="340" width="300" height="220" rx="40"/><path d="M900 420l100-60v180l-100-60z"/></g></svg>');

  // The browser's camera, shared by every live slide and the commentary.
  let cameraStream = null;
  async function camera(withSound) {
    if (cameraStream && (!withSound || cameraStream.getAudioTracks().length)) return cameraStream;
    const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: !!withSound });
    if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = s;
    return s;
  }
  function stopCamera() { if (cameraStream) { cameraStream.getTracks().forEach((t) => t.stop()); cameraStream = null; } }
  function liveVideo(fill) {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.autoplay = true; v.setAttribute('playsinline', '');
    v.className = 'live-cam' + (fill ? ' fill' : '');
    v.srcObject = cameraStream; v.play().catch(() => {});
    return v;
  }

  const pdfs = new Map();
  async function pdfDoc(url) {
    if (!pdfs.has(url)) pdfs.set(url, (async () => {
      await loadScript(LIBS.pdf);
      pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.pdfWorker;
      return pdfjsLib.getDocument({ url }).promise;
    })());
    return pdfs.get(url);
  }
  async function drawPDF(el, url, page, scale) {
    const doc = await pdfDoc(url);
    const p = await doc.getPage(page + 1);
    const box = el.getBoundingClientRect();
    const base = p.getViewport({ scale: 1 });
    const fit = Math.min((box.width || 320) / base.width, (box.height || 180) / base.height) * (window.devicePixelRatio || 1) * (scale || 1);
    const vp = p.getViewport({ scale: Math.max(fit, 0.2) });
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; c.className = 'pdf';
    await p.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    el.replaceChildren(c);
    return doc.numPages;
  }

  /** Draws one slide into `el`. `live` turns cameras on (presenting); otherwise they show their poster. */
  async function draw(el, info, { page = 0, live = false, thumb = false, present = false } = {}) {
    const outer = el; el = document.createElement('div'); el.className = 'slidebox' + (thumb ? ' mini' : ''); outer.replaceChildren(el);
    const t = info.type;
    if (t === 'custom') {
      if (!info.spec) return card(el, info, T('This slide couldn’t be read.'));
      await slideLibs();
      const host = document.createElement('div'); host.className = 'fvhost'; el.appendChild(host);
      if (!present) {
        // In the editor (thumbnails and the large slide) a slide is drawn at one size and shrunk, so it's laid out exactly like the large one
        // (the renderer's minimum sizes would otherwise move things around in a small box).
        const W = 1280, H = 800;
        host.style.cssText = `position:absolute;left:0;top:0;right:auto;bottom:auto;width:${W}px;height:${H}px;transform-origin:0 0`;
        const fit = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; const k = Math.min(w / W, h / H); host.style.transform = `translate(${(w - W * k) / 2}px,${(h - H * k) / 2}px) scale(${k})`; };
        fit(); new ResizeObserver(fit).observe(el);
      }
      const spec = Object.assign({}, info.spec); delete spec._live;
      FV.render(host, spec);
      const cams = info.spec._live || [];
      if (cams.some(Boolean)) {
        if (live) { try { await camera(false); } catch { } }
        if (cameraStream) $$('.media img', host).forEach((img, i) => { if (cams[i]) { const v = liveVideo((info.spec.fits || [])[i] !== 'contain'); v.style.borderRadius = getComputedStyle(img).borderRadius; img.replaceWith(v); } });
      }
      if (thumb) host.style.pointerEvents = 'none';
      return;
    }
    if (t === 'image' || t === 'webImage') {
      const img = new Image(); img.decoding = 'async'; img.alt = info.name; img.draggable = false; img.src = info.url;
      img.onerror = () => card(el, info, T('This picture doesn’t open in a browser (HEIC and some others). It shows in FreeView.'));
      return el.appendChild(img);
    }
    if (t === 'video') {
      const v = document.createElement('video');
      v.playsInline = true; v.muted = thumb || !live; v.loop = true; v.preload = thumb ? 'metadata' : 'auto';
      v.setAttribute('playsinline', ''); v.src = info.url + (thumb ? '#t=0.5' : '');
      if (info.poster) v.poster = info.poster;
      if (live) v.autoplay = true; else if (!thumb) v.controls = true;
      return el.appendChild(v);
    }
    if (t === 'audio') {
      if (info.poster) { const img = new Image(); img.src = info.poster; el.appendChild(img); } else card(el, info, '', true);
      if (!thumb) { const a = document.createElement('audio'); a.src = info.url; a.controls = !live; a.autoplay = live; a.className = 'audio'; el.appendChild(a); }
      return;
    }
    if (t === 'pdf') {
      try { const n = await drawPDF(el, info.url, page, thumb ? 1 : 1.5); info.pages = n; } catch { card(el, info, T('This PDF couldn’t be opened.')); }
      return;
    }
    if (t === 'live' && info.cameras) {
      if (live) { try { await camera(false); el.appendChild(liveVideo(true)); return; } catch { } }
      const img = new Image(); img.src = info.poster || CAMERA_POSTER; el.appendChild(img);
      return;
    }
    if (t === 'link') {
      if (info.poster) { const img = new Image(); img.src = info.poster; el.appendChild(img); }
      else { const d = document.createElement('div'); d.className = 'webcard'; d.innerHTML = `<div class="host">${esc(hostOf(info.href))}</div>`; el.appendChild(d); }
      if (!thumb && info.href) { const a = document.createElement('a'); a.className = 'chip open'; a.href = info.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = T('Open {host}', { host: hostOf(info.href) }); el.appendChild(a); }
      return;
    }
    if (t === 'markdown') {
      await Promise.all([loadScript(LIBS.marked), loadScript(LIBS.purify)]);
      const d = document.createElement('div'); d.className = 'md' + (thumb ? ' small' : '');
      d.innerHTML = DOMPurify.sanitize(marked.parse(await store.text(info.path) || ''));
      return el.appendChild(d);
    }
    const why = { live: 'A live screen, window or iPhone. It plays in FreeView on your Mac.', office: 'Keynote and PowerPoint files show in FreeView on your iPhone, iPad and Mac.',
      model3D: '3D models show in FreeView on your iPhone, iPad and Mac.', webarchive: 'Saved web pages open in FreeView.' }[t] || 'This file opens in FreeView on your iPhone, iPad or Mac.';
    card(el, info, T(why));
  }
  function card(el, info, why, quiet) {
    el.replaceChildren();
    if (info.poster) { const img = new Image(); img.src = info.poster; img.className = 'dim'; el.appendChild(img); }
    const d = document.createElement('div'); d.className = 'appcard';
    d.innerHTML = `${ICON.device}<strong>${esc(info.name)}</strong>${quiet ? '' : `<span>${esc(why)}</span>`}`;
    el.appendChild(d);
  }
  const hostOf = (href) => { try { return new URL(href).hostname.replace(/^www\./, ''); } catch { return href || T('Website'); } };

  // ── library ──

  async function showLibrary() {
    deck = null; show('library');
    $('#crumb').textContent = '';
    renderLibrary();
  }
  async function renderLibrary() {
    const grid = $('#grid');
    const q = ($('#search').value || '').trim().toLowerCase();
    const all = store.visibleDecks(pro);
    const hidden = store.decks().length - all.length;
    const decks = all.filter((v) => !q || (v.title || '').toLowerCase().includes(q));
    const lock = $('#prolock'); lock.hidden = !hidden;
    if (hidden) $('span', lock).textContent = I.n(hidden, '1 more presentation in your history', '{n} more presentations in your history');
    $('#empty').hidden = decks.length > 0 || !!store.loading;
    if (!decks.length && store.loading) {
      grid.replaceChildren(...Array.from({ length: 8 }, () => { const d = document.createElement('div'); d.className = 'deckcard ghost'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = '<div class="cover"></div><div class="meta"><span class="bar"></span><span class="bar short"></span></div>'; return d; }));
      return;
    }
    grid.replaceChildren(...decks.map((v) => {
      const { folder, entries } = store.deckOf(v);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'deckcard';
      b.innerHTML = `<div class="cover"></div><div class="meta"><strong>${esc(v.title)}</strong><span>${I.n(entries.length, '{n} slide', '{n} slides')} · ${when(S.fromApple(v.date))}</span></div>`;
      b.onclick = () => openDeck(v.id);
      b.oncontextmenu = (e) => { e.preventDefault(); deckMenu(v, e.clientX, e.clientY); };
      const more = document.createElement('span'); more.className = 'more'; more.setAttribute('role', 'button'); more.setAttribute('aria-label', T('More')); more.tabIndex = 0;
      more.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>';
      more.onclick = (e) => { e.stopPropagation(); const r = more.getBoundingClientRect(); deckMenu(v, r.left, r.bottom + 4); };
      more.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); more.click(); } };
      b.appendChild(more);
      if (entries[0]) slideInfo(folder, entries[0]).then((info) => draw($('.cover', b), info, { thumb: true })).catch(() => {});
      return b;
    }));
  }
  function when(d) {
    const days = Math.round((Date.now() - d) / 864e5);
    if (days < 1) return T('today'); if (days < 2) return T('yesterday'); if (days < 7) return T('{n} days ago', { n: days });
    return I.date(d, { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  }

  // ── a presentation ──

  async function openDeck(id, selected = 0) {
    const visit = store.visit(id); if (!visit) return showLibrary();
    if (!store.visibleDecks(pro).some((v) => v.id === id)) { showLibrary(); return showPaywall(); }
    const { folder, entries } = store.deckOf(visit);
    deck = { visit, folder, entries, selected: Math.min(selected, Math.max(0, entries.length - 1)), style: await store.json(`${folder}/.style.json`) };
    deck.chosen = new Set(entries.length ? [entries[deck.selected]] : []); deck.anchor = deck.selected;
    $('#stylebtn').setAttribute('aria-pressed', 'false');
    deck.notes = (await store.json(`${folder}/.notes.json`)) || {};
    deck.transitions = (await store.json(`${folder}/.transitions.json`)) || {};
    show('deck');
    $('#crumb').textContent = visit.title;
    $('#title').value = visit.title;
    renderRail(); renderSelected(); renderCommentary();
    history.replaceState(null, '', `#deck=${id}`);
  }
  async function saveEntries(entries, title) {
    deck.visit = await store.saveDeck(deck.visit, entries, title);
    deck.entries = entries.slice();
  }

  function renderRail() {
    const rail = $('#rail');
    if (!deck.chosen) deck.chosen = new Set();
    for (const e of [...deck.chosen]) if (!deck.entries.includes(e)) deck.chosen.delete(e);
    if (!deck.chosen.size && deck.entries[deck.selected]) deck.chosen.add(deck.entries[deck.selected]);
    rail.replaceChildren(...deck.entries.map((entry, i) => {
      const on = chosenHas(entry);
      const b = document.createElement('div'); b.className = 'thumb' + (on ? ' on' : '') + (i === deck.selected ? ' focus' : ''); b.tabIndex = 0; b.draggable = true;
      b.setAttribute('role', 'option'); b.setAttribute('aria-selected', on);
      b.innerHTML = `<span class="n">${i + 1}</span><div class="frame"></div>`;
      b.onclick = (e) => clickThumb(i, e);
      b.oncontextmenu = (e) => { e.preventDefault(); if (!chosenHas(entry)) select(i); slideMenu(e.clientX, e.clientY); };
      b.onkeydown = (e) => {
        if ((e.altKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) { e.preventDefault(); move(i, i - 1); }
        else if ((e.altKey || e.metaKey) && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) { e.preventDefault(); move(i, i + 1); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); e.shiftKey ? extendTo(i - 1) : select(i - 1, true); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); e.shiftKey ? extendTo(i + 1) : select(i + 1, true); }
        else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); deleteChosen(); }
      };
      b.ondragstart = (e) => { e.dataTransfer.setData('text/fv-slide', String(i)); e.dataTransfer.effectAllowed = 'move'; b.classList.add('dragging'); };
      b.ondragend = () => b.classList.remove('dragging');
      b.ondragover = (e) => { if (e.dataTransfer.types.includes('text/fv-slide')) { e.preventDefault(); b.classList.add('drop'); } };
      b.ondragleave = () => b.classList.remove('drop');
      b.ondrop = (e) => { b.classList.remove('drop'); const from = parseInt(e.dataTransfer.getData('text/fv-slide'), 10); if (Number.isInteger(from)) { e.preventDefault(); move(from, i); } };
      slideInfo(deck.folder, entry).then((info) => draw($('.frame', b), info, { thumb: true })).catch(() => {});
      return b;
    }));
    const add = document.createElement('button'); add.type = 'button'; add.className = 'thumb add'; add.innerHTML = ICON.plus + `<span>${T('Add')}</span>`;
    add.onclick = (e) => openAddMenu(e.currentTarget);
    rail.appendChild(add);
    $('#deck').classList.toggle('blank', deck.entries.length === 0);
  }
  const chosenHas = (entry) => !!(deck && deck.chosen && deck.chosen.has(entry));
  /** The chosen slides, in the presentation's order. */
  const chosenList = () => deck.entries.filter((e) => deck.chosen.has(e));
  function paintChosen() {
    $$('#rail .thumb:not(.add)').forEach((t, k) => { const on = chosenHas(deck.entries[k]); t.classList.toggle('on', on); t.classList.toggle('focus', k === deck.selected); t.setAttribute('aria-selected', on); });
  }
  function clickThumb(i, e) {
    if (e.metaKey || e.ctrlKey) {
      const entry = deck.entries[i];
      if (deck.chosen.has(entry) && deck.chosen.size > 1) deck.chosen.delete(entry); else deck.chosen.add(entry);
      deck.selected = i; paintChosen(); return renderSelected();
    }
    if (e.shiftKey) return extendTo(i);
    select(i);
  }
  function extendTo(i) {
    if (i < 0 || i >= deck.entries.length) return;
    const a = Math.min(deck.anchor ?? deck.selected, i), b = Math.max(deck.anchor ?? deck.selected, i);
    deck.chosen = new Set(deck.entries.slice(a, b + 1)); deck.selected = i;
    paintChosen(); const el = $$('#rail .thumb')[i]; if (el) { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); el.focus(); }
    renderSelected();
  }
  function selectAll() { deck.chosen = new Set(deck.entries); paintChosen(); renderSelected(); }
  function select(i, focus) {
    if (i < 0 || i >= deck.entries.length) return;
    deck.selected = i; deck.anchor = i; deck.chosen = new Set([deck.entries[i]]);
    paintChosen();
    const el = $$('#rail .thumb')[i]; if (el) { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); if (focus) el.focus(); }
    renderSelected();
  }
  async function move(from, to) {
    if (to < 0 || to >= deck.entries.length || from === to) return;
    const entries = deck.entries.slice(); const [e] = entries.splice(from, 1); entries.splice(to, 0, e);
    deck.entries = entries; deck.selected = to; renderRail(); renderSelected();
    $$('#rail .thumb')[to].focus();
    await work(T('Saving…'), () => saveEntries(entries));
  }
  async function removeSlide(i) {
    const entries = deck.entries.slice(); const [gone] = entries.splice(i, 1);
    deck.entries = entries; deck.selected = Math.min(i, entries.length - 1); renderRail(); renderSelected();
    await work(T('Saving…'), () => saveEntries(entries));
    // The file goes a moment later, so Undo can bring the slide back as it was.
    let undone = false;
    const timer = setTimeout(() => { if (!undone) store.deleteFile(`${deck.folder}/${gone}`).catch(() => {}); }, 6500);
    toast(T('Slide removed'), { label: T('Undo'), run: async () => {
      undone = true; clearTimeout(timer);
      const back = deck.entries.slice(); back.splice(i, 0, gone);
      deck.entries = back; deck.selected = i; renderRail(); renderSelected();
      await work(T('Saving…'), () => saveEntries(back));
    } });
  }

  let selectedToken = 0;
  async function renderSelected() {
    const token = ++selectedToken;
    if (deck && deck.styling) { const info0 = deck.entries.length && await slideInfo(deck.folder, deck.entries[deck.selected]); if (info0) { const box0 = document.createElement('div'); $('#canvas').replaceChildren(box0); await draw(box0, info0, { live: !!cameraStream }); } return renderStyle(); }
    const canvas = $('#canvas'), panel = $('#inspector');
    if (!deck.entries.length) {
      canvas.innerHTML = `<div class="blankstate"><strong>${T('Start with your photos, videos or a PDF')}</strong><span>${T('Or make a Magic slide: a title, a few words and pictures, laid out for you.')}</span>
        <div class="row"><button type="button" class="btn primary" data-add="files">${ICON.plus} ${T('Add Files')}</button><button type="button" class="btn" data-add="magic">${T('Magic Slide')}</button></div></div>`;
      $$('[data-add]', canvas).forEach((b) => b.onclick = () => addAction(b.dataset.add));
      panel.replaceChildren(); return;
    }
    const info = await slideInfo(deck.folder, deck.entries[deck.selected]);
    if (token !== selectedToken) return;
    const box = document.createElement('div'); canvas.replaceChildren(box);
    await draw(box, info, { live: !!cameraStream });
    if (token !== selectedToken) return;
    renderInspector(info);
  }

  function renderInspector(info) {
    const panel = $('#inspector');
    if (deck.chosen && deck.chosen.size > 1) return severalInspector(panel);
    const i = deck.selected;
    const head = `<div class="kind">${esc(info.label)}<span>${T('{n} of {count}', { n: i + 1, count: deck.entries.length })}</span></div>`;
    const own = (deck.transitions || {})[info.entry] || '';
    const slideSect = `<section class="sect"><h3>${T('Slide')}</h3>
      <label class="field inline"><span>${T('Transition')}</span><select id="f-trans"><option value="">${T('Default')}</option>${TRANSITIONS.map(([v, l]) => `<option value="${v}" ${own === v ? 'selected' : ''}>${T(l)}</option>`).join('')}</select></label>
      <label class="field"><span>${T('Notes')}</span><textarea id="f-notes" rows="4" placeholder="${T('What you’ll say over this slide')}">${esc((deck.notes || {})[info.entry] || '')}</textarea></label>
      <p class="foot">${T('Only you see them: under the camera while you record, and in FreeView while you present.')}</p></section>`;
    const tail = slideSect + `<div class="actions"><button type="button" class="btn ghost" data-act="up" ${i === 0 ? 'disabled' : ''}>${T('Move Earlier')}</button><button type="button" class="btn ghost" data-act="down" ${i === deck.entries.length - 1 ? 'disabled' : ''}>${T('Move Later')}</button>
      <button type="button" class="btn ghost danger" data-act="remove">${ICON.trash} ${T('Remove Slide')}</button></div>`;
    if (info.type === 'custom' && info.slide) {
      customInspector(panel, info, head, tail);
    } else {
      const note = { image: '', webImage: '', video: '', audio: '', pdf: info.pages ? I.n(info.pages, '{n} page, each one a slide when you present.', '{n} pages, each one a slide when you present.') : '', link: info.href ? T('Shows {host}.', { host: hostOf(info.href) }) : '' }[info.type];
      const appOnly = note === undefined;
      const editBtn = info.type === 'image' ? `<div class="row wrap"><button type="button" class="btn small" id="editphoto">${T('Edit Photo…')}</button></div>`
        : info.type === 'video' ? `<div class="row wrap"><button type="button" class="btn small" id="editcover">${T('Choose Cover…')}</button></div>`
        : info.type === 'pdf' && info.pages ? `<div class="row wrap"><button type="button" class="btn small" id="pdfpics">${T('Make Each Page a Picture')}</button></div>` : '';
      panel.innerHTML = head + `<div class="filename">${esc(info.type === 'link' && info.href ? info.href : info.name)}</div>` + (note ? `<p class="hint">${esc(note)}</p>` : '') + editBtn +
        (appOnly ? `<div class="appnote">${ICON.device}<span>${T('Edit this slide in FreeView on your Mac, iPhone or iPad. It stays as it is here and moves with the rest.')}</span></div>` : '') + tail;
    }
    $$('[data-act]', panel).forEach((b) => b.onclick = () => ({ up: () => move(i, i - 1), down: () => move(i, i + 1), remove: () => removeSlide(i) }[b.dataset.act]()));
    const ep2 = $('#editphoto', panel); if (ep2) ep2.onclick = () => editPhoto(info);
    const ec = $('#editcover', panel); if (ec) ec.onclick = () => chooseCover(info);
    const pp2 = $('#pdfpics', panel); if (pp2) pp2.onclick = () => pdfToPictures(info, i);
    const tr = $('#f-trans', panel);
    if (tr) tr.onchange = () => {
      const m = Object.assign({}, deck.transitions); if (tr.value) m[info.entry] = tr.value; else delete m[info.entry];
      deck.transitions = m;
      work(T('Saving…'), () => (Object.keys(m).length ? store.writeJSON(`${deck.folder}/.transitions.json`, m) : store.deleteFile(`${deck.folder}/.transitions.json`)));
    };
    const nt = $('#f-notes', panel);
    if (nt) {
      const saveNotes = debounce(() => {
        // As the app keeps them: only slides still in the presentation, no blank notes, nothing when empty.
        const m = {}; for (const [k, v] of Object.entries(deck.notes || {})) if (v.trim() && deck.entries.includes(k.split('#')[0])) m[k] = v;
        deck.notes = m;
        work(T('Saving…'), () => (Object.keys(m).length ? store.writeJSON(`${deck.folder}/.notes.json`, m) : store.deleteFile(`${deck.folder}/.notes.json`)));
      }, 700);
      nt.oninput = () => { deck.notes = Object.assign({}, deck.notes, { [info.entry]: nt.value }); saveNotes(); };
    }
  }
  const TRANSITIONS = [['slide', 'Slide'], ['instant', 'Instant'], ['crossfade', 'Cross-fade'], ['fadeBlack', 'Fade through black'], ['fadeWhite', 'Fade through white'], ['magicMove', 'Magic Move']];

  // ── a cover's or Magic slide's panel: the app's sections, in the app's order and words ──
  const CONTACT_ORDER = ['website', 'email', 'phone', 'linkedin', 'x', 'instagram', 'github', 'threads', 'bluesky'];
  const CONTACT_LABEL = { website: 'Website', email: 'Email', phone: 'Phone', linkedin: 'LinkedIn', x: 'X', instagram: 'Instagram', github: 'GitHub', threads: 'Threads', bluesky: 'Bluesky' };
  /** Whose details a slide shows: the slide's own presenter, the presentation's, or the profile's. */
  function presenterOf(slide) {
    const style = deck.style || {};
    const custom = style.presenter === 'custom' && style.person;
    const who = slide.person || (custom ? style.person : profile) || {};
    const photoPath = slide.photo ? `${deck.folder}/${slide.photo}` : custom ? `${deck.folder}/.presenter.jpg` : '.profile/profile-photo.jpg';
    return { who, name: [who.firstName, who.lastName].filter(Boolean).join(' '), role: who.role || '', contacts: who.contacts || {}, hasPhoto: store.has(photoPath) };
  }
  const sw = (key, label, on, disabled, extra) =>
    `<label class="switch${disabled ? ' off' : ''}"><span>${label}${extra ? `<em>${esc(extra)}</em>` : ''}</span><input type="checkbox" role="switch" data-sw="${key}" ${on ? 'checked' : ''} ${disabled ? 'disabled' : ''}><i aria-hidden="true"></i></label>`;
  function customInspector(panel, info, head, tail) {
    const s = info.slide, cover = s.kind === 'cover';
    const P = presenterOf(s);
    const images = s.images || [];
    const hasBody = !!(s.body || '').trim();
    const sections = [];
    sections.push(`<section class="sect"><h3>${T('Text')}</h3>
      <label class="field"><span>${T('Title')}</span><input id="f-title" value="${esc(s.title)}" placeholder="${T(cover ? 'Your presentation' : 'Title')}" autocomplete="off"></label>
      ${cover ? `<label class="field"><span>${T('Subtitle')}</span><input id="f-subtitle" value="${esc(s.subtitle)}" placeholder="${T('A subtitle, a date, a place')}" autocomplete="off"></label>`
              : `<label class="field"><span>${T('Text')}</span><textarea id="f-body" rows="5" placeholder="${T('A few words. **Bold**, lists and links work.')}">${esc(s.body)}</textarea></label>`}</section>`);
    if (!cover) {
      const plays = images.filter((m) => ['video', 'audio'].includes(S.fileType(m)));
      const silent = new Set(s.silent || []);
      sections.push(`<section class="sect"><h3>${T('Media')} <em>${T('{n} of {count}', { n: images.length, count: 4 })}</em></h3>
        ${images.length ? `<div class="mgrid" role="list">${images.map((m, k) => {
          const t = S.fileType(m), sound = t === 'video' || t === 'audio';
          return `<div class="mtile" role="listitem" draggable="true" tabindex="0" data-k="${k}" aria-label="${esc(T('{label}, {n} of {count}', { label: mediaLabel(m), n: k + 1, count: images.length }))}">
            <span class="mi-thumb" data-k="${k}"></span><span class="mlabel">${esc(mediaLabel(m))}</span>
            <button type="button" class="mbtn drop" data-drop="${k}" aria-label="${T('Remove')}">${ICON.x}</button>
            ${sound ? `<button type="button" class="mbtn snd${silent.has(m) ? ' muted' : ''}" data-snd="${k}" aria-label="${T(silent.has(m) ? 'Sound off' : 'Sound on')}" title="${T(silent.has(m) ? 'Its sound is off. Click to turn it on.' : 'Its sound plays. Click to turn it off.')}">${silent.has(m) ? ICON.mute : ICON.sound}</button>` : ''}
          </div>`; }).join('')}</div>` : ''}
        ${plays.length ? `<div class="switches">${sw('syncsMedia', T(plays.length > 1 ? 'Sync Media' : 'Play on the Slide'), s.syncsMedia === true)}</div>` : ''}
        ${images.length < 4 ? `<div class="addlist">
          <button type="button" class="addrow" data-media="files">${ICON.folder}<span>${T('Add from Files')}</span></button>
          <button type="button" class="addrow" data-media="deck">${ICON.stack}<span>${T('Add from This Presentation')}</span></button>
          <button type="button" class="addrow" data-media="site">${ICON.globe}<span>${T('Add a Website')}</span></button>
          <button type="button" class="addrow" data-media="front">${ICON.cam}<span>${T('Add a Live Camera')}</span><em>${T('Front')}</em></button>
          <button type="button" class="addrow" data-media="back">${ICON.cam}<span>${T('Add a Live Camera')}</span><em>${T('Back')}</em></button></div>` : ''}
        <p class="foot">${T('Up to four, of any kind. With text they sit beside it; on their own they fill the slide. Drag one onto another to reorder.')}${plays.length ? ' ' + T('With Sync Media on, its videos and audio play right on the slide and start and pause together.') : ''}</p></section>`);
      const align = s.align || '';
      sections.push(`<section class="sect"><h3>${T('Layout')}</h3>
        <div class="seg" role="radiogroup" aria-label="${T('Alignment')}">${[['', 'Style'], ['center', 'Centre'], ['left', 'Left']].map(([v, l]) => `<button type="button" role="radio" aria-checked="${align === v}" data-align="${v}">${T(l)}</button>`).join('')}</div>
        ${images.length && hasBody ? `<label class="field inline"><span>${T('Text Column')}</span><select id="f-split">${[['', T('Auto')], ['0.3', '30%'], ['0.4', '40%'], ['0.5', '50%'], ['0.6', '60%']].map(([v, l]) => `<option value="${v}" ${String(s.split || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
        <p class="foot">${T('The slide arranges itself: a title on its own becomes the hero, pictures on their own fill the slide, and text sits beside pictures.')}</p></section>`);
    } else {
      sections.push(`<section class="sect"><h3>${T('Background')}</h3>
        <div class="bgrow"><span class="mi-thumb big" id="bgthumb"></span><div class="row wrap"><button type="button" class="btn small" id="bgpick">${T(s.background ? 'Replace…' : 'Choose Picture…')}</button>${s.background ? `<button type="button" class="btn small ghost danger" id="bgdrop">${T('Remove')}</button>` : ''}</div></div></section>`);
    }
    const contactRows = CONTACT_ORDER.filter((k) => (P.contacts[k] || '').trim()).map((k) => sw('c:' + k, T(CONTACT_LABEL[k]), (s.contacts || []).includes(k), false, P.contacts[k]));
    sections.push(`<section class="sect"><h3>${T('Show')}</h3><div class="switches">
      ${sw('showLogo', T('Logo'), s.showLogo)}
      ${sw('showName', T('Name'), s.showName, !P.name, P.name)}
      ${sw('showPhoto', T('Photo'), s.showPhoto, !P.hasPhoto)}
      ${sw('showRole', T('Role'), s.showRole, !P.role, P.role)}
      ${contactRows.join('')}</div>
      <p class="foot">${s.person ? T('This slide shows a presenter of its own. Choose what it shows.') : T('Name, photo, role and contacts come from Settings › Profile, or from the presenter set in this presentation’s Style. Choose what this slide shows.')}</p>
      ${s.person ? '' : `<button type="button" class="btn small" id="editprofile">${T('Edit Profile and Contacts…')}</button>`}</section>`);
    const buttons = s.buttons || [];
    sections.push(`<section class="sect"><h3>${T('Links')}</h3><div class="switches">${sw('qr', T('QR Codes for Web Addresses'), s.qr !== false)}</div>
      ${buttons.map((b, k) => `<div class="btnrow"><input data-bl="${k}" value="${esc(b.label)}" placeholder="${T('Label')}" aria-label="${T('Button label')}"><input data-bu="${k}" value="${esc(b.url)}" placeholder="${T('Web address')}" aria-label="${T('Button web address')}" inputmode="url" spellcheck="false"><button type="button" class="icon-btn" data-bdrop="${k}" aria-label="${T('Remove button')}">${ICON.trash}</button></div>`).join('')}
      <button type="button" class="btn small" id="addbutton">${ICON.plus} ${T('Add Button')}</button></section>`);
    panel.innerHTML = head + sections.join('') + tail;

    const save = debounce(() => saveCustom(info), 600);
    for (const [id, key] of [['#f-title', 'title'], ['#f-subtitle', 'subtitle'], ['#f-body', 'body']]) {
      const f = $(id, panel); if (!f) continue;
      f.oninput = () => { s[key] = f.value; if (info.spec) info.spec[key] = f.value; redrawCanvas(info); save(); };
    }
    $$('[data-align]', panel).forEach((b) => (b.onclick = () => { if (b.dataset.align) s.align = b.dataset.align; else delete s.align; saveCustom(info, true); }));
    const split = $('#f-split', panel); if (split) split.onchange = () => { if (split.value) s.split = +split.value; else delete s.split; saveCustom(info, true); };
    $$('[data-drop]', panel).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const [m] = s.images.splice(+b.dataset.drop, 1); if (s.silent) { s.silent = s.silent.filter((x) => x !== m); if (!s.silent.length) delete s.silent; } saveCustom(info, true); }));
    $$('[data-snd]', panel).forEach((b) => (b.onclick = (e) => {
      e.stopPropagation(); const m = s.images[+b.dataset.snd]; const set = new Set(s.silent || []);
      if (set.has(m)) set.delete(m); else set.add(m);
      if (set.size) s.silent = [...set]; else delete s.silent; saveCustom(info, true);
    }));
    $$('[data-media]', panel).forEach((b) => (b.onclick = () => {
      const k = b.dataset.media;
      if (k === 'files') pickFiles('image/*,video/*,audio/*,application/pdf,.pdf', (files) => addMediaTo(info, files));
      else if (k === 'deck') pickFromDeck(info);
      else if (k === 'site') addSiteTo(info);
      else addCameraTo(info, k);
    }));
    // Reorder: drag one tile onto another (as in the app), or ⌥← / ⌥→ on a focused tile.
    const moveMedia = (from, to) => { if (to < 0 || to >= s.images.length || from === to) return; const [m] = s.images.splice(from, 1); s.images.splice(to, 0, m); saveCustom(info, true).then(() => { const t = $$('.mtile', $('#inspector'))[to]; if (t) t.focus(); }); };
    $$('.mtile', panel).forEach((t) => {
      const k = +t.dataset.k;
      t.ondragstart = (e) => { e.dataTransfer.setData('text/fv-media', String(k)); e.dataTransfer.effectAllowed = 'move'; t.classList.add('dragging'); };
      t.ondragend = () => t.classList.remove('dragging');
      t.ondragover = (e) => { if (e.dataTransfer.types.includes('text/fv-media')) { e.preventDefault(); t.classList.add('drop'); } };
      t.ondragleave = () => t.classList.remove('drop');
      t.ondrop = (e) => { t.classList.remove('drop'); const from = parseInt(e.dataTransfer.getData('text/fv-media'), 10); if (Number.isInteger(from)) { e.preventDefault(); moveMedia(from, k); } };
      t.onkeydown = (e) => {
        if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) { e.preventDefault(); moveMedia(k, k - 1); }
        else if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) { e.preventDefault(); moveMedia(k, k + 1); }
        else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); $('[data-drop]', t).click(); }
      };
    });
    $$('.mi-thumb[data-k]', panel).forEach((t) => { const m = s.images[+t.dataset.k]; const u = S.fileType(m) === 'image' ? store.url(`${deck.folder}/${m}`) : store.url(`${deck.folder}/${S.posterPath(m)}`); if (u) t.style.backgroundImage = `url("${u}")`; });
    $$('[data-sw]', panel).forEach((c) => (c.onchange = () => {
      const k = c.dataset.sw;
      if (k.startsWith('c:')) {
        const f = k.slice(2); s.contacts = (s.contacts || []).filter((x) => x !== f);
        if (c.checked) s.contacts.push(f);
      } else s[k] = c.checked;
      saveCustom(info, true);
    }));
    const ep = $('#editprofile', panel); if (ep) ep.onclick = () => goTab('settings');
    // Cover background: a picture of its own, kept like a Magic slide's (.picture-xxxxxxxx.jpg).
    const bg = $('#bgthumb', panel);
    if (bg && s.background) { const u = store.url(`${deck.folder}/${s.background}`); if (u) bg.style.backgroundImage = `url("${u}")`; }
    const pick = $('#bgpick', panel);
    if (pick) pick.onclick = () => pickFiles('image/*', ([f]) => work(T('Uploading…'), async () => {
      const name = `.picture-${S.shortID()}.${(f.name.split('.').pop() || 'jpg').toLowerCase()}`;
      await store.putFile(`${deck.folder}/${name}`, f); s.background = name;
    }).then(() => saveCustom(info, true)));
    const drop = $('#bgdrop', panel); if (drop) drop.onclick = () => { delete s.background; saveCustom(info, true); };
    // Buttons: a label and a web address, under the text (beside the QR codes).
    const bsave = debounce(() => saveCustom(info), 700);
    $$('[data-bl]', panel).forEach((i) => (i.oninput = () => { s.buttons[+i.dataset.bl].label = i.value; bsave(); }));
    $$('[data-bu]', panel).forEach((i) => (i.oninput = () => { s.buttons[+i.dataset.bu].url = i.value.trim(); bsave(); }));
    $$('[data-bdrop]', panel).forEach((b) => (b.onclick = () => { s.buttons.splice(+b.dataset.bdrop, 1); if (!s.buttons.length) delete s.buttons; saveCustom(info, true); }));
    $('#addbutton', panel).onclick = () => { s.buttons = (s.buttons || []).concat([{ label: '', url: '' }]); renderInspector(info); const l = $$('[data-bl]', panel).pop(); if (l) l.focus(); };
  }

  // ── the presentation's Style (the app's Style sheet): how its covers and Magic slides look ──
  const THEME_DEFAULT = { background: '#0B0B0C', foreground: '#FFFFFF', accent: '#FFFFFF', font: 'system', align: 'left', titleScale: 1, bodyScale: 1, radius: 2 };
  const PRESETS = [
    ['Minimal', {}],
    ['Paper', { background: '#FFFFFF', foreground: '#111111', accent: '#111111' }],
    ['Editorial', { background: '#F6F1E7', foreground: '#1F1B16', accent: '#B4532A', font: 'serif', titleScale: 1.08 }],
    ['Bold', { background: '#111111', foreground: '#FFFFFF', accent: '#FFD60A', font: 'system', align: 'center', titleScale: 1.2 }],
    ['Playful', { background: '#5B3DF5', foreground: '#FFFFFF', accent: '#FFB4E1', font: 'rounded', radius: 4 }],
    ['Mono', { background: '#0E1116', foreground: '#E6EDF3', accent: '#3FB950', font: 'mono', bodyScale: 0.92, radius: 1 }],
    ['Midnight', { background: '#0B1B3A', foreground: '#F2F5FF', accent: '#7CC4FF', font: 'avenir' }],
  ].map(([n, t]) => [n, Object.assign({}, THEME_DEFAULT, t)]);
  const FONTS = [['system', 'System'], ['rounded', 'Rounded'], ['serif', 'Serif'], ['mono', 'Mono'], ['avenir', 'Avenir']];
  const FONT_CSS = { system: '-apple-system, system-ui, sans-serif', rounded: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif', serif: 'ui-serif, "New York", Georgia, serif', mono: 'ui-monospace, "SF Mono", Menlo, monospace', avenir: '"Avenir Next", Avenir, system-ui, sans-serif' };
  const sameTheme = (a, b) => Object.keys(THEME_DEFAULT).every((k) => String(a[k]).toUpperCase() === String(b[k]).toUpperCase());
  /** The style as the apps decode it: theme (every key) and logo always there. */
  function fullStyle(st) {
    const out = Object.assign({ logo: 'profile' }, st || {});
    out.theme = Object.assign({}, THEME_DEFAULT, (st || {}).theme);
    return out;
  }
  let styleSave;
  async function saveStyle(redrawPanel) {
    clearTimeout(styleSave);
    styleSave = setTimeout(() => work(T('Saving…'), async () => {
      await store.writeJSON(`${deck.folder}/.style.json`, fullStyle(deck.style));
      await saveEntries(deck.entries);
    }), 500);
    infoCache.clear();
    const box = $('#canvas > div'); const info = deck.entries.length && await slideInfo(deck.folder, deck.entries[deck.selected]);
    if (box && info) draw(box, info, { live: !!cameraStream });
    $$('#rail .thumb:not(.add)').forEach((t, i) => slideInfo(deck.folder, deck.entries[i]).then((x) => { if (x.type === 'custom') draw($('.frame', t), x, { thumb: true }); }));
    if (redrawPanel) renderStyle();
  }
  function swatch(name, theme, current, attr) {
    const on = sameTheme(theme, current);
    return `<button type="button" class="swatch${on ? ' on' : ''}" ${attr} aria-pressed="${on}"><span class="sw" style="background:${theme.background};color:${theme.foreground}"><i style="background:${theme.accent}"></i><b style="font-family:${FONT_CSS[theme.font] || FONT_CSS.system}">Aa</b></span><span class="swn">${esc(T(name))}</span></button>`;
  }
  async function renderStyle() {
    const panel = $('#inspector');
    deck.style = fullStyle(deck.style);
    const st = deck.style, t = st.theme;
    const saved = (await store.json('.profile/styles.json')) || [];
    const others = store.visibleDecks(pro).filter((v) => v.id !== deck.visit.id && v.kind.deck).slice(0, 30);
    const logoURL = st.logo === 'custom' ? await store.src(`${deck.folder}/.logo.png`) : st.logo === 'profile' ? await store.src('.profile/default-logo.png') : '';
    const custom = st.presenter === 'custom';
    const person = Object.assign({ firstName: '', lastName: '', role: '', contacts: {} }, st.person || {});
    const photoURL = custom ? await store.src(`${deck.folder}/.presenter.jpg`) : '';
    panel.innerHTML = `<div class="kind">${T('Style')}<button type="button" class="btn small" id="styledone">${T('Done')}</button></div>
      <p class="foot">${T('Styles apply to covers and Magic slides only. Photos, PDFs and other files stay as they are.')}</p>
      <section class="sect"><h3>${T('Presets')}</h3><div class="swatches">${PRESETS.map(([n, th], i) => swatch(n, th, t, `data-preset="${i}"`)).join('')}</div>
        <button type="button" class="btn small" id="brandbtn" ${logoURL ? '' : 'disabled'}>${T('Make a Style from the Logo')}</button><div id="brandout"></div></section>
      <section class="sect"><h3>${T('Colours')}</h3><div class="colors">
        ${[['background', 'Background'], ['foreground', 'Text'], ['accent', 'Accent']].map(([k, l]) => `<label class="colorrow"><span>${T(l)}</span><input type="color" data-color="${k}" value="${esc(String(t[k]).toLowerCase())}"></label>`).join('')}</div></section>
      <section class="sect"><h3>${T('Type')}</h3>
        <label class="field inline"><span>${T('Font')}</span><select id="st-font">${FONTS.map(([v, l]) => `<option value="${v}" ${t.font === v ? 'selected' : ''}>${T(l)}</option>`).join('')}</select></label>
        <div class="seg" role="radiogroup" aria-label="${T('Alignment')}">${[['center', 'Centre'], ['left', 'Left']].map(([v, l]) => `<button type="button" role="radio" aria-checked="${t.align === v}" data-stalign="${v}">${T(l)}</button>`).join('')}</div>
        ${[['titleScale', 'Titles', 0.75, 1.4, 0.01], ['bodyScale', 'Text', 0.8, 1.3, 0.01], ['radius', 'Picture corners', 0, 6, 0.1]].map(([k, l, a, b, st2]) => `<label class="slider"><span>${T(l)}</span><input type="range" data-range="${k}" min="${a}" max="${b}" step="${st2}" value="${t[k]}"></label>`).join('')}</section>
      <section class="sect"><h3>${T('Logo')}</h3>
        <div class="seg" role="radiogroup" aria-label="${T('Logo')}">${[['profile', 'From Settings'], ['custom', 'This Presentation’s'], ['none', 'None']].map(([v, l]) => `<button type="button" role="radio" aria-checked="${st.logo === v}" data-logo="${v}">${T(l)}</button>`).join('')}</div>
        ${st.logo === 'custom' ? `<div class="bgrow"><span class="mi-thumb big contain" id="logothumb"></span><button type="button" class="btn small" id="logopick">${T(logoURL ? 'Replace Logo…' : 'Choose Logo…')}</button></div>` : ''}
        <p class="foot">${T(st.logo === 'profile' && !store.has('.profile/default-logo.png') ? 'Add a default logo in Settings › Profile.' : 'Shown on slides that have Logo turned on.')}</p></section>
      <section class="sect"><h3>${T('Presenter')}</h3>
        <div class="seg" role="radiogroup" aria-label="${T('Presenter')}">${[['profile', 'From Settings'], ['custom', 'This Presentation’s']].map(([v, l]) => `<button type="button" role="radio" aria-checked="${(st.presenter || 'profile') === v}" data-presenter="${v}">${T(l)}</button>`).join('')}</div>
        ${custom ? `<div class="bgrow"><span class="mi-thumb big round" id="ppthumb"></span><div class="row wrap"><button type="button" class="btn small" id="pppick">${T(photoURL ? 'Replace Photo…' : 'Choose Photo…')}</button>${photoURL ? `<button type="button" class="btn small ghost danger" id="ppdrop">${T('Remove Photo')}</button>` : ''}</div></div>
          <div class="grid2"><label class="field"><span>${T('First name')}</span><input data-pp="firstName" value="${esc(person.firstName)}"></label><label class="field"><span>${T('Last name')}</span><input data-pp="lastName" value="${esc(person.lastName)}"></label></div>
          <label class="field"><span>${T('Role or company')}</span><input data-pp="role" value="${esc(person.role)}"></label>
          <details class="contacts"><summary>${T('Contacts')}</summary><div class="grid2">${CONTACT_ORDER.map((k) => `<label class="field"><span>${T(CONTACT_LABEL[k])}</span><input data-ppc="${k}" value="${esc((person.contacts || {})[k] || '')}" spellcheck="false"></label>`).join('')}</div></details>` : ''}
        <p class="foot">${T(custom ? 'Covers and Magic slides in this presentation show this person where a slide has Name, Photo, Role or contacts turned on. A slide can still have a presenter of its own.' : 'Covers and Magic slides show you, from Settings › Profile, where a slide has Name, Photo, Role or contacts turned on.')}</p></section>
      <section class="sect"><h3>${T('Saved Styles')}</h3>
        ${saved.length ? `<div class="savedlist">${saved.map((x, i) => `<button type="button" class="savedrow" data-saved="${i}"><span class="dot" style="background:${x.theme.background};box-shadow:inset 0 0 0 4px ${x.theme.accent}"></span><span>${esc(x.name)}</span>${st.themeName === x.name && sameTheme(x.theme, t) ? '<em>✓</em>' : ''}</button>`).join('')}</div>` : ''}
        <button type="button" class="btn small" id="savestyle">${T('Save Style As…')}</button>
        ${others.length ? `<label class="field inline"><span>${T('Copy from')}</span><select id="copyfrom"><option value="">${T('A presentation…')}</option>${others.map((v) => `<option value="${v.id}">${esc(v.title)}</option>`).join('')}</select></label>` : ''}</section>`;

    $('#styledone').onclick = () => { deck.styling = false; $('#stylebtn').setAttribute('aria-pressed', 'false'); renderSelected(); };
    $$('[data-preset]', panel).forEach((b) => (b.onclick = () => { st.theme = Object.assign({}, PRESETS[+b.dataset.preset][1]); delete st.themeName; saveStyle(true); }));
    $$('[data-color]', panel).forEach((i) => (i.oninput = () => { t[i.dataset.color] = i.value.toUpperCase(); delete st.themeName; saveStyle(false); }));
    $('#st-font').onchange = (e) => { t.font = e.target.value; delete st.themeName; saveStyle(true); };
    $$('[data-stalign]', panel).forEach((b) => (b.onclick = () => { t.align = b.dataset.stalign; delete st.themeName; saveStyle(true); }));
    $$('[data-range]', panel).forEach((i) => (i.oninput = () => { t[i.dataset.range] = Math.round(+i.value * 100) / 100; delete st.themeName; saveStyle(false); }));
    $$('[data-logo]', panel).forEach((b) => (b.onclick = () => { st.logo = b.dataset.logo; saveStyle(true); }));
    const lt = $('#logothumb', panel); if (lt && logoURL) lt.style.backgroundImage = `url("${logoURL}")`;
    const lp = $('#logopick', panel); if (lp) lp.onclick = () => pickFiles('image/*', ([f]) => work(T('Saving the logo…'), async () => { await store.putFile(`${deck.folder}/.logo.png`, await asImage(f, 'image/png', 1200)); }).then(() => saveStyle(true)));
    $$('[data-presenter]', panel).forEach((b) => (b.onclick = () => {
      if (b.dataset.presenter === 'custom') { st.presenter = 'custom'; if (!st.person) st.person = Object.assign({ firstName: '', lastName: '', role: '', contacts: {} }, profile || {}); }
      else { st.presenter = 'profile'; }
      saveStyle(true);
    }));
    const pt = $('#ppthumb', panel); if (pt && photoURL) pt.style.backgroundImage = `url("${photoURL}")`;
    const pp = $('#pppick', panel); if (pp) pp.onclick = () => pickFiles('image/*', ([f]) => work(T('Saving the photo…'), async () => { await store.putFile(`${deck.folder}/.presenter.jpg`, await asImage(f, 'image/jpeg', 1200)); }).then(() => saveStyle(true)));
    const pd = $('#ppdrop', panel); if (pd) pd.onclick = () => work(T('Removing…'), () => store.deleteFile(`${deck.folder}/.presenter.jpg`)).then(() => saveStyle(true));
    $$('[data-pp]', panel).forEach((i) => (i.oninput = () => { st.person[i.dataset.pp] = i.value; saveStyle(false); }));
    $$('[data-ppc]', panel).forEach((i) => (i.oninput = () => { const c = st.person.contacts = st.person.contacts || {}; const v = i.value.trim(); if (v) c[i.dataset.ppc] = v; else delete c[i.dataset.ppc]; saveStyle(false); }));
    $$('[data-saved]', panel).forEach((b) => (b.onclick = () => { const x = saved[+b.dataset.saved]; st.theme = Object.assign({}, THEME_DEFAULT, x.theme); st.themeName = x.name; saveStyle(true); }));
    $('#savestyle', panel).onclick = () => {
      askName(T('Save Style As'), st.themeName || '', (name) => {
      const list = saved.filter((x) => x.name !== name).concat([{ id: S.uuid(), name, theme: Object.assign({}, t) }]);
      work(T('Saving the style…'), () => store.writeJSON('.profile/styles.json', list)).then(() => { st.themeName = name; saveStyle(true); });
      });
    };
    const cf = $('#copyfrom', panel); if (cf) cf.onchange = () => copyStyleFrom(cf.value);
    $('#brandbtn', panel).onclick = () => brandStyles(logoURL);
  }

  /** A name, asked in a small sheet (Return saves). */
  function askName(title, value, done) {
    const d = $('#namepick'), input = $('input', d);
    $('h2', d).textContent = title; input.value = value; d.showModal(); input.select();
    input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); d.close('save'); } };
    d.onclose = () => { const v = input.value.trim(); if (d.returnValue === 'save' && v) done(v); };
  }
  async function copyStyleFrom(id) {
    const v = store.visit(id); if (!v) return;
    const other = store.deckOf(v).folder;
    const theirs = fullStyle(await store.json(`${other}/.style.json`));
    await work(T('Copying the style…'), async () => {
      const copy = async (from, to) => { const u = await store.src(`${other}/${from}`); if (u) await store.putFile(`${deck.folder}/${to}`, await (await fetch(u)).blob()); };
      if (theirs.logo === 'custom') await copy('.logo.png', '.logo.png');
      if (theirs.presenter === 'custom') await copy('.presenter.jpg', '.presenter.jpg');
      deck.style = theirs;
    });
    saveStyle(true);
  }
  /** "Make a Style from the Logo": its main colours (a few rounds of k-means, as the app does), as three styles. */
  async function brandStyles(url) {
    const out = $('#brandout');
    const img = new Image(); img.crossOrigin = 'anonymous'; img.src = url;
    try { await img.decode(); } catch { return; }
    const N = 64, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, N, N);
    let d; try { d = x.getImageData(0, 0, N, N).data; } catch { return toast(T('That logo can’t be read here.')); }
    const samples = []; let opaque = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] <= 200) continue; opaque++;
      const p = [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255], mx = Math.max(...p), mn = Math.min(...p);
      if (mx < 0.08 || mx - mn < 0.12) continue; samples.push(p);
    }
    if (samples.length < 8 || samples.length * 100 < opaque * 4) { out.innerHTML = `<p class="foot">${T('This logo is black, white or grey, so there are no brand colours to use. Pick a preset or set the colours below.')}</p>`; return; }
    const K = 3, dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    let centers = [0, 1, 2].map((k) => samples[Math.floor(k * samples.length / K)]);
    const nearest = (p) => centers.reduce((best, cc, k) => (dist(p, cc) < dist(p, centers[best]) ? k : best), 0);
    for (let r = 0; r < 12; r++) {
      const sums = centers.map(() => [0, 0, 0]), counts = centers.map(() => 0);
      for (const p of samples) { const k = nearest(p); sums[k][0] += p[0]; sums[k][1] += p[1]; sums[k][2] += p[2]; counts[k]++; }
      centers = centers.map((cc, k) => (counts[k] ? sums[k].map((v) => v / counts[k]) : cc));
    }
    const counts = centers.map(() => 0); for (const p of samples) counts[nearest(p)]++;
    const colors = centers.map((cc, k) => [cc, counts[k]]).sort((a, b) => b[1] - a[1]).filter(([, n]) => n > samples.length / 20).map(([cc]) => cc);
    const hex = (cc) => '#' + cc.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
    const lum = (cc) => { const l = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * l(cc[0]) + 0.7152 * l(cc[1]) + 0.0722 * l(cc[2]); };
    const contrast = (a, b) => { const [l1, l2] = [lum(a), lum(b)]; return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
    const main = colors[0], second = colors[1] || main, base = deck.style.theme;
    const themes = [
      ['Brand', Object.assign({}, base, { background: hex(main), foreground: lum(main) > 0.45 ? '#111111' : '#FFFFFF', accent: contrast(second, main) > 1.6 ? hex(second) : lum(main) > 0.45 ? '#000000' : '#FFFFFF' })],
      ['Brand Light', Object.assign({}, base, { background: '#FFFFFF', foreground: '#111111', accent: hex(lum(main) > 0.8 ? second : main) })],
      ['Brand Dark', Object.assign({}, base, { background: '#0B0B0C', foreground: '#FFFFFF', accent: hex(lum(main) < 0.12 ? second : main) })],
    ];
    deck.style.theme = Object.assign({}, themes[0][1]); delete deck.style.themeName;
    await saveStyle(true);
    $('#brandout').innerHTML = `<p class="foot">${T('Brand colours')}</p><div class="swatches">${themes.map(([n, th], i) => swatch(n, th, deck.style.theme, `data-brand="${i}"`)).join('')}</div>`;
    $$('[data-brand]').forEach((b) => (b.onclick = () => { deck.style.theme = Object.assign({}, themes[+b.dataset.brand][1]); delete deck.style.themeName; saveStyle(false).then(() => $$('[data-brand]').forEach((o) => o.classList.toggle('on', o === b))); }));
  }
  const mediaLabel = (m) => T({ live: 'Live camera', video: 'Video', audio: 'Sound', link: 'Website', pdf: 'PDF' }[S.fileType(m)] || 'Photo');
  function debounce(fn, ms) { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; }
  async function redrawCanvas(info) {
    const box = $('#canvas > div'); if (!box || !info.spec) return;
    await draw(box, info, { live: !!cameraStream });
  }
  async function saveCustom(info, redraw) {
    await work(T('Saving…'), async () => {
      await store.writeJSON(info.path, info.slide, true);
      infoCache.delete(info.path);
      if (redraw) { await renderSelected(); }
      const thumb = $$('#rail .thumb')[deck.selected];
      if (thumb) slideInfo(deck.folder, info.entry).then((x) => draw($('.frame', thumb), x, { thumb: true }));
      await saveEntries(deck.entries);   // bumps it in Recents
    });
  }


  // ── several slides at once (the app's "N Slides" panel) ──
  function severalInspector(panel) {
    const picked = chosenList(), n = picked.length;
    const values = new Set(picked.map((e) => (deck.transitions || {})[e] || ''));
    const val = values.size === 1 ? [...values][0] : 'mixed';
    panel.innerHTML = `<div class="kind">${T('{n} Slides', { n })}</div>
      <div class="fan">${picked.slice(0, 3).map(() => '<span class="frame"></span>').join('')}</div>
      <section class="sect">
        <label class="field inline"><span>${T('Transition')}</span><select id="m-trans"><option value="">${T('Default')}</option>${val === 'mixed' ? `<option value="mixed" selected>${T('Mixed')}</option>` : ''}${TRANSITIONS.map(([v, l]) => `<option value="${v}" ${val === v ? 'selected' : ''}>${T(l)}</option>`).join('')}</select></label>
        <button type="button" class="btn small" id="m-dup">${T('Duplicate {n} Slides…', { n })}</button>
        <button type="button" class="btn small ghost danger" id="m-del">${ICON.trash} ${T('Delete {n} Slides', { n })}</button>
        <p class="foot">${T('Changes here apply to these {n} slides only.', { n })}</p></section>`;
    $$('.fan .frame', panel).forEach((f, k) => slideInfo(deck.folder, picked[k]).then((x) => draw(f, x, { thumb: true })));
    $('#m-trans').onchange = (e) => {
      if (e.target.value === 'mixed') return;
      const m = Object.assign({}, deck.transitions); for (const p of picked) { if (e.target.value) m[p] = e.target.value; else delete m[p]; }
      deck.transitions = m;
      work(T('Saving…'), () => (Object.keys(m).length ? store.writeJSON(`${deck.folder}/.transitions.json`, m) : store.deleteFile(`${deck.folder}/.transitions.json`)));
    };
    $('#m-dup').onclick = () => askChoice(T('Duplicate {n} Slides', { n }), T('Where should the copies go?'), [['after', T('After the Selection')], ['end', T('At the End of the Presentation')]], (c) => duplicateChosen(c === 'end'));
    $('#m-del').onclick = deleteChosen;
  }

  /** Copies one slide from presentation `from` into `to`, with everything it shows (LocalFiles.copyEntry). */
  async function copyEntry(entry, from, to) {
    const copyFile = async (src, dst) => { const u = await store.src(`${from}/${src}`); if (!u) return false; await store.putFile(`${to}/${dst}`, await (await fetch(u)).blob()); return true; };
    const slash = entry.indexOf('/');
    if (slash > 0) {
      const slot = entry.slice(0, slash), rest = entry.slice(slash + 1);
      const used = store.pathsIn(to + '/').map((p) => parseInt(p.slice(to.length + 1).split('/')[0], 10)).filter((x) => Number.isInteger(x));
      const next = String((used.length ? Math.max(...used) : -1) + 1);
      for (const p of store.pathsIn(`${from}/${slot}/`)) await copyFile(p.slice(from.length + 1), `${next}/${p.slice(from.length + slot.length + 2)}`);
      return `${next}/${rest}`;
    }
    const dot = entry.lastIndexOf('.'), base = dot > 0 ? entry.slice(0, dot) : entry, ext = dot > 0 ? entry.slice(dot + 1) : '';
    const exists = (n) => store.has(`${to}/${n}`);
    let name = from === to ? `${base} Copy.${ext}` : entry, n = 2;
    while (exists(name)) { name = `${base} Copy${n === 2 && from !== to ? '' : ' ' + n}.${ext}`; n++; }
    if (S.fileType(entry) !== 'custom') { await copyFile(entry, name); return name; }
    const slide = await store.json(`${from}/${entry}`);
    const own = async (ref) => {
      const hidden = ref.startsWith('.');
      if (!(hidden || from !== to) || !store.has(`${from}/${ref}`)) return ref;
      const leaf = ref.split('/').pop(), refExt = leaf.includes('.') ? leaf.split('.').pop() : '';
      const prefix = hidden ? leaf.slice(0, leaf.indexOf('-') > 0 ? leaf.indexOf('-') : leaf.length) : '.picture';
      const copy = `${prefix}-${S.shortID()}${refExt ? '.' + refExt : ''}`;
      if (!await copyFile(ref, copy)) return ref;
      if (store.has(`${from}/${S.posterPath(ref)}`)) await copyFile(S.posterPath(ref), S.posterPath(copy));
      const sound = `.sound-${leaf.replace(/\.[^.]+$/, '')}.m4a`;
      if (store.has(`${from}/${sound}`)) await copyFile(sound, `.sound-${copy.replace(/\.[^.]+$/, '')}.m4a`);
      return copy;
    };
    slide.images = await Promise.all((slide.images || []).map(own));
    if (slide.background) slide.background = await own(slide.background);
    if (slide.photo) slide.photo = await own(slide.photo);
    if (slide.silent) slide.silent = slide.silent.filter((x) => slide.images.includes(x));
    await store.writeJSON(`${to}/${name}`, slide, true);
    return name;
  }
  async function insertCopies(copies, at, label) {
    const entries = deck.entries.slice(); entries.splice(Math.min(at, entries.length), 0, ...copies);
    await saveEntries(entries);
    deck.chosen = new Set(copies); deck.selected = entries.indexOf(copies[0]); deck.anchor = deck.selected;
    renderRail(); renderSelected();
    // label: 'duplicated' or 'pasted'
    toast(copies.length > 1 ? T(`{n} slides ${label}`, { n: copies.length }) : T(`Slide ${label}`));
  }
  async function duplicateChosen(atEnd) {
    const picked = chosenList(); if (!picked.length) return;
    await work(picked.length > 1 ? T('Duplicating {n} slides…', { n: picked.length }) : T('Duplicating…'), async () => {
      const copies = [];
      for (const e of picked) {
        const c = await copyEntry(e, deck.folder, deck.folder); copies.push(c);
        if ((deck.transitions || {})[e]) deck.transitions[c] = deck.transitions[e];
        if ((deck.notes || {})[e]) deck.notes[c] = deck.notes[e];
      }
      if (Object.keys(deck.transitions || {}).length) await store.writeJSON(`${deck.folder}/.transitions.json`, deck.transitions);
      if (Object.keys(deck.notes || {}).length) await store.writeJSON(`${deck.folder}/.notes.json`, deck.notes);
      const at = atEnd ? deck.entries.length : Math.max(...picked.map((e) => deck.entries.indexOf(e))) + 1;
      await insertCopies(copies, at, 'duplicated');
    });
  }
  const CLIP = 'freeview-slides:';
  async function copyChosen() {
    const picked = chosenList(); if (!picked.length) return;
    const text = CLIP + JSON.stringify({ folder: deck.folder, entries: picked });
    try { await navigator.clipboard.writeText(text); } catch { window.__fvClip = text; }
    window.__fvClip = text;
    toast(picked.length > 1 ? T('{n} slides copied', { n: picked.length }) : T('Slide copied'));
  }
  async function pasteSlides(text) {
    let c; try { c = JSON.parse(text.slice(CLIP.length)); } catch { return; }
    const known = (c.entries || []).filter((e) => store.has(`${c.folder}/${e}`));
    if (!known.length) return toast(T('Those slides aren’t in your library any more.'));
    await work(T('Pasting…'), async () => {
      const copies = []; for (const e of known) copies.push(await copyEntry(e, c.folder, deck.folder));
      const sel = chosenList(); const at = sel.length ? Math.max(...sel.map((e) => deck.entries.indexOf(e))) + 1 : deck.entries.length;
      await insertCopies(copies, at, 'pasted');
    });
  }
  async function deleteChosen() {
    const picked = chosenList(); if (!picked.length) return;
    const before = deck.entries.slice(), first = deck.entries.indexOf(picked[0]);
    const entries = deck.entries.filter((e) => !deck.chosen.has(e));
    deck.entries = entries; deck.selected = Math.min(first, entries.length - 1); deck.chosen = new Set(entries[deck.selected] ? [entries[deck.selected]] : []);
    renderRail(); renderSelected();
    await work(T('Saving…'), () => saveEntries(entries));
    // The files go a moment later, so Undo brings the slides back as they were.
    let undone = false;
    const timer = setTimeout(() => { if (!undone) for (const g of picked) if (!deck || !deck.entries.includes(g)) store.deleteFile(`${deck ? deck.folder : ''}/${g}`).catch(() => {}); }, 6500);
    toast(picked.length > 1 ? T('{n} slides deleted', { n: picked.length }) : T('Slide deleted'), { label: T('Undo'), run: async () => {
      undone = true; clearTimeout(timer);
      deck.entries = before; deck.chosen = new Set(picked); deck.selected = first; renderRail(); renderSelected();
      await work(T('Saving…'), () => saveEntries(before));
    } });
  }
  async function replaceSlide(i) {
    pickFiles('', async ([f]) => {
      const old = deck.entries[i];
      await work(T('Replacing…'), async () => {
        const entry = `${freeSlot()}/${S.cleanName(f.name)}`;
        await store.putFile(`${deck.folder}/${entry}`, f);
        const entries = deck.entries.slice(); entries[i] = entry;
        for (const m of [deck.notes, deck.transitions]) if (m && m[old]) { m[entry] = m[old]; delete m[old]; }
        await saveEntries(entries);
        if (old.includes('/')) store.deleteFile(`${deck.folder}/${old}`).catch(() => {});
      });
      deck.chosen = new Set([deck.entries[i]]); renderRail(); renderSelected();
    });
  }

  // ── a small menu at a point (right-click on a slide or a presentation) ──
  function showMenu(x, y, items) {
    const m = $('#ctxmenu');
    m.replaceChildren(...items.map((it) => {
      if (it === '-') { const hr = document.createElement('hr'); return hr; }
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem');
      b.className = it.danger ? 'danger' : ''; b.innerHTML = `<span>${esc(it.label)}</span>${it.key ? `<kbd>${it.key}</kbd>` : ''}`;
      b.onclick = () => { m.hidden = true; it.run(); };
      return b;
    }));
    m.hidden = false;
    const r = m.getBoundingClientRect();
    m.style.left = Math.min(x, innerWidth - r.width - 8) + 'px'; m.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
    $('button', m).focus();
    const close = (e) => { if (!m.contains(e.target)) { m.hidden = true; document.removeEventListener('pointerdown', close, true); } };
    setTimeout(() => document.addEventListener('pointerdown', close, true));
  }
  function slideMenu(x, y) {
    const n = deck.chosen.size, i = deck.selected, entry = deck.entries[i];
    const t = S.fileType(entry);
    showMenu(x, y, [
      ...(n === 1 ? [{ label: T('Present from Here'), run: () => present({ from: P_indexOf(entry) }) },
                     { label: T((deck.notes || {})[entry] ? 'Edit Notes…' : 'Add Notes…'), run: () => { const nt = $('#f-notes'); if (nt) { nt.scrollIntoView({ block: 'center' }); nt.focus(); } } },
                     ...(t !== 'custom' ? [{ label: T('Replace…'), run: () => replaceSlide(i) }] : []), '-'] : []),
      { label: n > 1 ? T('Copy {n} Slides', { n }) : T('Copy'), key: '⌘C', run: copyChosen },
      { label: n > 1 ? T('Duplicate {n} Slides', { n }) : T('Duplicate'), key: '⌘D', run: () => (n > 1 ? $('#m-dup').click() : duplicateChosen(false)) },
      '-',
      { label: n > 1 ? T('Delete {n} Slides', { n }) : T('Delete'), key: '⌫', danger: true, run: deleteChosen },
    ]);
  }
  /** Where an entry starts when presenting (a PDF before it counts a slide a page). */
  function P_indexOf(entry) { return Math.max(0, deck.entries.indexOf(entry)); }

  /** A choice of a few, asked in a small sheet. */
  function askChoice(title, text, options, done) {
    const d = $('#choice');
    $('h2', d).textContent = title; $('p', d).textContent = text;
    $('.row', d).replaceChildren(...[['cancel', T('Cancel')]].concat(options).map(([v, l], k) => {
      const b = document.createElement('button'); b.className = 'btn' + (k === options.length ? ' primary' : '') + (v === 'remove' ? ' danger-fill' : ''); b.value = v; b.textContent = l; return b;
    }));
    d.onclose = () => { if (d.returnValue && d.returnValue !== 'cancel') done(d.returnValue); };
    d.showModal();
  }

  // ── adding: a web page, the camera, the microphone, the screen ──
  function addWebPage() {
    const d = $('#sitepick'); const input = $('input', d); input.value = ''; $('h2', d).textContent = T('Add a Web Page');
    d.showModal(); input.focus();
    input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); d.close('add'); } };
    d.onclose = async () => {
      $('h2', d).textContent = T('Add a Website');
      if (d.returnValue !== 'add') return;
      let url = input.value.trim(); if (!url) return; if (!/^[a-z]+:\/\//i.test(url)) url = 'https://' + url;
      try { new URL(url); } catch { return toast(T('That doesn’t look like a web address.')); }
      await addLinkSlide(url);
    };
  }
  async function addLinkSlide(url) {
    const name = hostOf(url).replace(/\//g, ' ') + '.url', slot = freeSlot(), entry = `${slot}/${name}`;
    await work(T('Adding the page…'), async () => {
      await store.putFile(`${deck.folder}/${entry}`, new Blob([`[InternetShortcut]\nURL=${url}\n`], { type: 'text/plain' }));
      await store.putFile(`${deck.folder}/${S.posterPath(entry)}`, await siteCard(url));
      const entries = deck.entries.slice(); const at = deck.entries.length ? deck.selected + 1 : 0; entries.splice(at, 0, entry);
      await saveEntries(entries); deck.selected = at; deck.chosen = new Set([entry]);
    });
    renderRail(); renderSelected();
  }
  const stamp = () => { const d = new Date(), z = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} at ${z(d.getHours())}.${z(d.getMinutes())}.${z(d.getSeconds())}`; };
  function mp4Type(audioOnly) {
    const list = audioOnly ? ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4'] : ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4'];
    return window.MediaRecorder ? list.find((t) => MediaRecorder.isTypeSupported(t)) : null;
  }
  /** Take a photo or video, record sound, or record the screen; what's made is added as a slide. */
  async function capture(kind) {
    const d = $('#capture'), view = $('video', d), status = $('.cap-status', d), btns = $('.cap-buttons', d);
    const type = mp4Type(kind === 'audio');
    if (kind !== 'photo' && !type) return toast(T('This browser can’t record in a format FreeView plays. Use Safari, or Chrome 126 or later.'));
    let stream;
    try {
      if (kind === 'screen') {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
        let mic = null; try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {}
        const tracks = [...screen.getVideoTracks()];
        const audios = [...screen.getAudioTracks(), ...(mic ? mic.getAudioTracks() : [])];
        if (audios.length > 1) { const ac = new AudioContext(), dst = ac.createMediaStreamDestination(); for (const t of audios) ac.createMediaStreamSource(new MediaStream([t])).connect(dst); tracks.push(...dst.stream.getAudioTracks()); }
        else tracks.push(...audios);
        stream = new MediaStream(tracks); stream.__parts = [screen, mic];
      } else stream = await navigator.mediaDevices.getUserMedia(kind === 'audio' ? { audio: true } : { video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: true });
    } catch { return toast(T(kind === 'screen' ? 'Screen recording was not started.' : 'FreeView needs your camera or microphone for that. Allow it in the address bar and try again.')); }
    const stopAll = () => { for (const t of stream.getTracks()) t.stop(); for (const s2 of stream.__parts || []) if (s2) s2.getTracks().forEach((t) => t.stop()); };
    $('h2', d).textContent = T({ camera: 'Take a Photo or Video', audio: 'Record Audio', screen: 'Record Screen' }[kind]);
    view.hidden = kind === 'audio'; view.srcObject = stream; view.muted = true; view.classList.toggle('mirror', kind === 'camera'); view.play().catch(() => {});
    let rec = null, chunks = [], t0 = 0, paused = 0, pausedAt = 0, timer = 0, result = null;
    const clock2 = () => { const sec = Math.floor(((rec && rec.state === 'paused' ? pausedAt : performance.now()) - t0 - paused) / 1000); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
    const finish = (file) => { result = file; d.close('use'); };
    const buttons = (list) => btns.replaceChildren(...list.map(([label, cls, fn]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + cls; b.textContent = label; b.onclick = fn; return b; }));
    const startRec = () => {
      chunks = []; rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: kind === 'screen' ? 6_000_000 : 4_000_000 });
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.start(1000); t0 = performance.now(); paused = 0;
      timer = setInterval(() => (status.textContent = '● ' + clock2()), 250);
      buttons([[T('Pause'), '', () => { if (rec.state === 'recording') { rec.pause(); pausedAt = performance.now(); this_.textContent = T('Resume'); } else { rec.resume(); paused += performance.now() - pausedAt; this_.textContent = T('Pause'); } }], [T('Stop'), 'primary rec', stopRec]]);
      const this_ = $('button', btns);
    };
    const stopRec = async () => {
      clearInterval(timer);
      await new Promise((ok) => { rec.onstop = ok; rec.stop(); });
      const blob = new Blob(chunks, { type: type.split(';')[0] });
      const name = { camera: `Video ${stamp()}.mp4`, audio: `Recording ${stamp()}.m4a`, screen: `Screen Recording ${stamp()}.mp4` }[kind];
      status.textContent = T('{time} recorded', { time: clock2() });
      view.srcObject = null; if (kind !== 'audio') { view.src = URL.createObjectURL(blob); view.muted = false; view.controls = true; view.classList.remove('mirror'); }
      const a = kind === 'audio' ? Object.assign(document.createElement('audio'), { controls: true, src: URL.createObjectURL(blob), className: 'cap-audio' }) : null;
      if (a) status.after(a);
      buttons([[T('Record Again'), '', () => { if (a) a.remove(); view.controls = false; view.removeAttribute('src'); view.srcObject = stream; view.muted = true; view.classList.toggle('mirror', kind === 'camera'); view.play(); status.textContent = ''; ready(); }],
               [T('Use Recording'), 'primary', () => finish(new File([blob], name, { type: blob.type }))]]);
    };
    const ready = () => {
      if (kind === 'camera') buttons([[T('Take Photo'), '', async () => {
        const c = document.createElement('canvas'); c.width = view.videoWidth; c.height = view.videoHeight;
        const x = c.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(view, 0, 0);
        const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.9)); finish(new File([blob], `Photo ${stamp()}.jpg`, { type: 'image/jpeg' }));
      }], [T('Record Video'), 'primary rec', startRec]]);
      else buttons([[T('Record'), 'primary rec', startRec]]);
    };
    status.textContent = kind === 'screen' ? T('Sharing your screen. Press Record when you’re ready; the recording becomes a slide.') : '';
    ready();
    d.onclose = () => { clearInterval(timer); if (rec && rec.state !== 'inactive') rec.stop(); stopAll(); view.srcObject = null; view.removeAttribute('src'); view.controls = false; $$('.cap-audio', d).forEach((x) => x.remove()); if (d.returnValue === 'use' && result) addFiles([result]); };
    for (const t of stream.getVideoTracks()) t.onended = () => { if (rec && rec.state !== 'inactive') stopRec(); };
    d.showModal();
  }

  // ── Home: a presentation's menu (Rename, Edit, Duplicate, Remove) and search ──
  function deckMenu(v, x, y) {
    showMenu(x, y, [
      { label: T('Edit Presentation'), run: () => openDeck(v.id) },
      { label: T('Rename'), run: () => askName(T('Rename'), v.title, (name) => work(T('Renaming…'), async () => { const nv = JSON.parse(JSON.stringify(v)); nv.title = name; nv.renamed = true; await store.putVisit(nv); }).then(renderLibrary)) },
      { label: T('Duplicate'), run: () => duplicateDeck(v) },
      '-',
      { label: T('Remove'), danger: true, run: () => askChoice(T('Remove “{title}”?', { title: v.title }), T('It’s removed from FreeView on all your devices, with its slides.'), [['remove', T('Remove')]], () => work(T('Removing…'), () => store.deleteDeck(v)).then(renderLibrary)) },
    ]);
  }
  async function duplicateDeck(v) {
    const { folder, entries } = store.deckOf(v);
    const files = store.pathsIn(folder + '/');
    let made;
    await work(T('Duplicating “{title}”…', { title: v.title }), async () => {
      const copy = S.uuid();
      let k = 0;
      for (const p of files) { busy(T('Duplicating… {k} of {n}', { k: ++k, n: files.length })); const u = await store.src(p); if (u) await store.putFile(`${copy}/${p.slice(folder.length + 1)}`, await (await fetch(u)).blob()); }
      made = { id: S.uuid(), title: T('{title} Copy', { title: v.title }), date: S.appleNow(), kind: { deck: { folder: copy, entries } } };
      await store.putVisit(made);
    });
    if (made) openDeck(made.id);
  }

  // ── the app's media editor: a photo's crop, rotation and black & white; a video's cover ──
  /** The untouched file, kept beside an edited one (MediaEditorView: `.original-<name>`). */
  const originalOf = (entry) => { const i = entry.lastIndexOf('/'); return (i >= 0 ? entry.slice(0, i + 1) : '') + '.original-' + entry.slice(i + 1); };
  async function editPhoto(info) {
    const d = $('#photoedit'), cv = $('canvas', d), x = cv.getContext('2d');
    const img = new Image(); img.crossOrigin = 'anonymous'; img.src = info.url;
    try { await img.decode(); } catch { return toast(T('This picture can’t be edited here.')); }
    const st = { rot: 0, bw: false, aspect: 'original', crop: { x: 0, y: 0, w: 1, h: 1 } };   // crop in the rotated picture's 0…1 space
    const hasOriginal = store.has(`${deck.folder}/${originalOf(info.entry)}`);
    $('#pe-revert').hidden = !hasOriginal;
    const dims = () => (st.rot % 180 ? [img.naturalHeight, img.naturalWidth] : [img.naturalWidth, img.naturalHeight]);
    /** The picture as edited, at `scale`, cropped or not. */
    function render(scale, cropped) {
      const [W, H] = dims(), c = document.createElement('canvas');
      const cr = cropped ? st.crop : { x: 0, y: 0, w: 1, h: 1 };
      c.width = Math.max(1, Math.round(W * cr.w * scale)); c.height = Math.max(1, Math.round(H * cr.h * scale));
      const g = c.getContext('2d');
      if (st.bw) g.filter = 'grayscale(1)';
      g.translate(-cr.x * W * scale, -cr.y * H * scale);
      g.translate(W * scale / 2, H * scale / 2); g.rotate(st.rot * Math.PI / 180);
      g.drawImage(img, -img.naturalWidth * scale / 2, -img.naturalHeight * scale / 2, img.naturalWidth * scale, img.naturalHeight * scale);
      return c;
    }
    const box = $('.pe-stage', d);
    let view = { s: 1, ox: 0, oy: 0 };
    function paint() {
      const [W, H] = dims(), bw2 = box.clientWidth, bh = box.clientHeight;
      const k = Math.min(bw2 / W, bh / H) * 0.94; view = { s: k, ox: (bw2 - W * k) / 2, oy: (bh - H * k) / 2 };
      cv.width = bw2 * devicePixelRatio; cv.height = bh * devicePixelRatio; cv.style.width = bw2 + 'px'; cv.style.height = bh + 'px';
      x.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); x.clearRect(0, 0, bw2, bh);
      x.drawImage(render(k, false), view.ox, view.oy);
      const c = st.crop, rx = view.ox + c.x * W * k, ry = view.oy + c.y * H * k, rw = c.w * W * k, rh = c.h * H * k;
      x.fillStyle = 'rgba(0,0,0,.55)'; x.beginPath(); x.rect(view.ox, view.oy, W * k, H * k); x.rect(rx, ry, rw, rh); x.fill('evenodd');
      x.strokeStyle = '#fff'; x.lineWidth = 2; x.strokeRect(rx, ry, rw, rh);
      x.lineWidth = 1; x.strokeStyle = 'rgba(255,255,255,.35)';
      for (const f of [1 / 3, 2 / 3]) { x.beginPath(); x.moveTo(rx + rw * f, ry); x.lineTo(rx + rw * f, ry + rh); x.moveTo(rx, ry + rh * f); x.lineTo(rx + rw, ry + rh * f); x.stroke(); }
      x.fillStyle = '#fff'; for (const [hx, hy] of [[rx, ry], [rx + rw, ry], [rx, ry + rh], [rx + rw, ry + rh]]) x.fillRect(hx - 5, hy - 5, 10, 10);
      $$('[data-aspect]', d).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.aspect === st.aspect)));
      $('#pe-bw').setAttribute('aria-pressed', String(st.bw));
    }
    function fitAspect() {
      const [W, H] = dims();
      if (st.aspect === 'square') { const side = Math.min(W, H); st.crop = { w: side / W, h: side / H, x: (1 - side / W) / 2, y: (1 - side / H) / 2 }; }
      else if (st.aspect === 'original') st.crop = { x: 0, y: 0, w: 1, h: 1 };
      paint();
    }
    // Dragging: a corner resizes (keeping a square square), inside moves.
    let drag = null;
    cv.onpointerdown = (e) => {
      const [W, H] = dims(), r = cv.getBoundingClientRect(), px = (e.clientX - r.left - view.ox) / (W * view.s), py = (e.clientY - r.top - view.oy) / (H * view.s);
      const c = st.crop, tol = 14 / (Math.min(W, H) * view.s);
      const corner = [['tl', c.x, c.y], ['tr', c.x + c.w, c.y], ['bl', c.x, c.y + c.h], ['br', c.x + c.w, c.y + c.h]].find(([, cx2, cy2]) => Math.abs(px - cx2) < tol * 1.5 && Math.abs(py - cy2) < tol * 1.5);
      if (corner) drag = { kind: corner[0], start: { ...c } };
      else if (px > c.x && px < c.x + c.w && py > c.y && py < c.y + c.h) drag = { kind: 'move', start: { ...c }, px, py };
      else return;
      if (st.aspect === 'original' && drag.kind !== 'move') st.aspect = 'free';
      cv.setPointerCapture(e.pointerId);
    };
    cv.onpointermove = (e) => {
      if (!drag) return;
      const [W, H] = dims(), r = cv.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (e.clientX - r.left - view.ox) / (W * view.s))), py = Math.min(1, Math.max(0, (e.clientY - r.top - view.oy) / (H * view.s)));
      const s0 = drag.start, min = 0.05;
      let { x: cx2, y: cy2, w, h } = s0;
      if (drag.kind === 'move') { cx2 = Math.min(1 - w, Math.max(0, s0.x + px - drag.px)); cy2 = Math.min(1 - h, Math.max(0, s0.y + py - drag.py)); }
      else {
        let l = s0.x, t = s0.y, rr = s0.x + s0.w, b = s0.y + s0.h;
        if (drag.kind.includes('l')) l = Math.min(px, rr - min); else rr = Math.max(px, l + min);
        if (drag.kind.startsWith('t')) t = Math.min(py, b - min); else b = Math.max(py, t + min);
        if (st.aspect === 'square') { const side = Math.min((rr - l) * W, (b - t) * H); if (drag.kind.includes('l')) l = rr - side / W; else rr = l + side / W; if (drag.kind.startsWith('t')) t = b - side / H; else b = t + side / H; }
        cx2 = l; cy2 = t; w = rr - l; h = b - t;
      }
      st.crop = { x: cx2, y: cy2, w, h }; paint();
    };
    cv.onpointerup = () => { drag = null; };
    $$('[data-aspect]', d).forEach((b) => (b.onclick = () => { st.aspect = b.dataset.aspect; fitAspect(); }));
    $('#pe-rotate').onclick = () => { st.rot = (st.rot + 90) % 360; fitAspect(); };
    $('#pe-bw').onclick = () => { st.bw = !st.bw; paint(); };
    $('#pe-revert').onclick = () => d.close('revert');
    d.onclose = async () => {
      removeEventListener('resize', paint);
      if (d.returnValue === 'revert') {
        await work(T('Reverting…'), async () => {
          const u = await store.src(`${deck.folder}/${originalOf(info.entry)}`);
          await store.putFile(info.path, await (await fetch(u)).blob());
          await store.deleteFile(`${deck.folder}/${originalOf(info.entry)}`);
        });
      } else if (d.returnValue === 'done') {
        const edited = st.rot || st.bw || st.crop.w < 0.999 || st.crop.h < 0.999;
        if (!edited) return;
        await work(T('Saving the photo…'), async () => {
          // The untouched file stays beside it the first time, for Revert.
          if (!store.has(`${deck.folder}/${originalOf(info.entry)}`)) await store.putFile(`${deck.folder}/${originalOf(info.entry)}`, await (await fetch(info.url)).blob());
          const png = /\.png$/i.test(info.entry);
          const out = await new Promise((ok) => render(1, true).toBlob(ok, png ? 'image/png' : 'image/jpeg', 0.92));
          if (png || /\.jpe?g$/i.test(info.entry)) await store.putFile(info.path, out);
          else {
            // Other formats are saved as JPEG, and the slide follows the new name (as in the app).
            const entry = info.entry.replace(/\.[^./]+$/, '') + '.jpg';
            await store.putFile(`${deck.folder}/${entry}`, out);
            const entries = deck.entries.map((e) => (e === info.entry ? entry : e)); await saveEntries(entries);
          }
        });
      } else return;
      infoCache.delete(info.path); renderRail(); renderSelected();
    };
    d.showModal(); fitAspect(); addEventListener('resize', paint);
  }
  /** A video's cover: a frame of it, kept as `.<name>.poster.jpg` (MediaEditorView's "Set as Cover"). */
  async function chooseCover(info) {
    const d = $('#coverpick'), v = $('video', d), range = $('input', d);
    v.src = info.url; v.muted = true; v.crossOrigin = 'anonymous';
    await new Promise((ok) => { v.onloadedmetadata = ok; v.onerror = ok; });
    range.max = v.duration || 0; range.step = 0.05; range.value = 0;
    range.oninput = () => { v.currentTime = +range.value; };
    d.onclose = async () => {
      if (d.returnValue !== 'set') return;
      await work(T('Setting the cover…'), async () => {
        const c = document.createElement('canvas'); const k = Math.min(1, 1600 / Math.max(v.videoWidth, v.videoHeight));
        c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.88));
        await store.putFile(`${deck.folder}/${S.posterPath(info.entry)}`, blob);
      });
      infoCache.delete(info.path); renderRail(); renderSelected();
    };
    d.showModal();
  }
  // ── adding ──

  function pickFiles(accept, done) {
    const input = $('#picker'); input.accept = accept; input.value = '';
    input.onchange = () => { if (input.files.length) done([...input.files]); };
    input.click();
  }
  function openAddMenu(anchor) {
    const m = $('#addmenu');
    const hasCover = deck.entries.some((e) => S.fileType(e) === 'custom' && infoCache.get(`${deck.folder}/${e}`) && (infoCache.get(`${deck.folder}/${e}`).slide || {}).kind === 'cover');
    const items = [['files', 'Files…', 'Photos, videos, PDFs and more; each one a slide. You can also drop or paste them.'],
      ['pdfpics', 'PDF as Pictures…', 'Each page becomes a photo of its own, to move, edit or remove'],
      ['web', 'Web Page…', 'A website, live when you present'],
      ['camera', 'Take a Photo or Video', 'With this computer’s camera'],
      ['audio', 'Record Audio', 'Your voice or anything near the microphone'],
      ...(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia ? [['screen', 'Record Screen', 'A window, a tab or the whole screen, as a video']] : []),
      '-', ...(hasCover ? [] : [['cover', 'Cover Slide', 'The title, with your name and contacts']]),
      ['magic', 'Magic Slide', 'A title, a few words and up to four pictures'],
      ['live', 'Live Camera', 'A Magic slide with your camera, live when you present']];
    m.replaceChildren(...items.map((it) => { if (it === '-') return document.createElement('hr'); const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.dataset.add = it[0]; b.innerHTML = `<strong>${T(it[1])}</strong><span>${T(it[2])}</span>`; b.onclick = () => addAction(it[0]); return b; }));
    const r = anchor.getBoundingClientRect();
    m.hidden = false;
    const h = m.offsetHeight, w = m.offsetWidth;
    m.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
    m.style.top = (r.bottom + 6 + h > innerHeight ? Math.max(8, r.top - 6 - h) : r.bottom + 6) + 'px';
    $('button', m).focus();
    const close = (e) => { if (!m.contains(e.target)) { m.hidden = true; document.removeEventListener('pointerdown', close, true); } };
    setTimeout(() => document.addEventListener('pointerdown', close, true));
  }
  function addAction(kind) {
    $('#addmenu').hidden = true;
    if (kind === 'files') pickFiles('', addFiles);
    else if (kind === 'pdfpics') pickFiles('application/pdf,.pdf', addPDFPictures);
    else if (kind === 'magic') addCustom('text');
    else if (kind === 'cover') addCustom('cover');
    else if (kind === 'live') addCustom('text', true);
    else if (kind === 'web') addWebPage();
    else capture(kind);
  }
  function freeSlot() {
    let n = 0; for (const e of deck.entries) { const m = /^(\d+)\//.exec(e); if (m) n = Math.max(n, +m[1] + 1); }
    for (const p of store.pathsIn(deck.folder + '/')) { const m = new RegExp('^' + deck.folder + '/(\\d+)/').exec(p); if (m) n = Math.max(n, +m[1] + 1); }
    return n;
  }
  async function addFiles(files) {
    let at = deck.entries.length ? deck.selected + 1 : 0;
    const entries = deck.entries.slice();
    let done = 0;
    await work(files.length === 1 ? T('Uploading {name}…', { name: files[0].name }) : T('Uploading {n} files…', { n: files.length }), async () => {
      for (const file of files) {
        const entry = `${freeSlot() + done}/${S.cleanName(file.name)}`;
        busy(T('Uploading {k} of {n}…', { k: done + 1, n: files.length }));
        await store.putFile(`${deck.folder}/${entry}`, file);
        entries.splice(at++, 0, entry); done++;
      }
      await saveEntries(entries);
    });
    if (done) { deck.selected = at - 1; renderRail(); renderSelected(); }
  }
  /** A PDF's pages as JPEGs (2400 px on the long side, as Share makes them), named "<file> - Page N.jpg". */
  async function pdfPictures(src, name, k, n) {
    const doc = await pdfjsDoc(src);
    const base = S.cleanName(name.replace(/\.pdf$/i, '')) || 'PDF';
    const out = [];
    for (let p = 0; p < doc.numPages; p++) {
      busy(n > 1 ? T('Making pictures: {name}, page {k} of {n}…', { name, k: p + 1, n: doc.numPages }) : T('Making pictures: page {k} of {n}…', { k: p + 1, n: doc.numPages }));
      const blob = await pdfPageJPEG(doc, p, 2400);
      out.push(new File([blob], `${base} - ${T('Page {n}', { n: p + 1 })}.jpg`, { type: 'image/jpeg' }));
    }
    doc.destroy();
    return out;
  }
  async function pdfjsDoc(src) {
    await loadScript(LIBS.pdf);
    pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.pdfWorker;
    return pdfjsLib.getDocument(src instanceof Blob ? { data: new Uint8Array(await src.arrayBuffer()) } : { url: src }).promise;
  }
  /** Add menu › PDF as Pictures: every page of each PDF picked becomes an image slide. */
  async function addPDFPictures(files) {
    const pdfFiles = files.filter((f) => /\.pdf$/i.test(f.name) || f.type === 'application/pdf');
    if (!pdfFiles.length) return toast(T('Choose a PDF.'));
    let pics = [], failed = [];
    await work(T('Making pictures…'), async () => {
      for (const [k, f] of pdfFiles.entries()) {
        try { pics = pics.concat(await pdfPictures(f, f.name, k + 1, pdfFiles.length)); } catch (e) { console.error(e); failed.push(f.name); }
      }
    });
    if (failed.length) toast(T('{name} couldn’t be opened.', { name: failed.join(', ') }));
    if (pics.length) await addFiles(pics);
  }
  /** A PDF slide's "Make Each Page a Picture": its pages take its place as image slides (Undo brings the PDF back). */
  async function pdfToPictures(info, i) {
    const entries = deck.entries.slice();
    const made = [];
    await work(T('Making pictures…'), async () => {
      let pics;
      try { pics = await pdfPictures(info.url, info.name, 1, 1); } catch (e) { console.error(e); return toast(T('This PDF couldn’t be opened.')); }
      let slot = freeSlot();
      for (const [k, f] of pics.entries()) {
        busy(T('Uploading {k} of {n}…', { k: k + 1, n: pics.length }));
        const entry = `${slot++}/${S.cleanName(f.name)}`;
        await store.putFile(`${deck.folder}/${entry}`, f); made.push(entry);
      }
      entries.splice(i, 1, ...made);
      await saveEntries(entries);
    });
    if (!made.length) return;
    deck.selected = i; renderRail(); renderSelected();
    let undone = false;
    const timer = setTimeout(() => { if (!undone) store.deleteFile(`${deck.folder}/${info.entry}`).catch(() => {}); }, 6500);
    toast(I.n(made.length, 'The PDF is now {n} picture', 'The PDF is now {n} pictures'), { label: T('Undo'), run: async () => {
      undone = true; clearTimeout(timer);
      const back = deck.entries.filter((e) => !made.includes(e)); back.splice(Math.min(i, back.length), 0, info.entry);
      deck.entries = back; deck.selected = i; renderRail(); renderSelected();
      await work(T('Saving…'), () => saveEntries(back));
      for (const e of made) store.deleteFile(`${deck.folder}/${e}`).catch(() => {});
    } });
  }
  function uniqueName(base) {
    const taken = new Set(store.pathsIn(deck.folder + '/').map((p) => p.slice(deck.folder.length + 1)).concat(deck.entries));
    let name = `${base}.fvslide`, n = 2;
    while (taken.has(name)) name = `${base} ${n++}.fvslide`;
    return name;
  }
  async function addCustom(kind, withCamera) {
    const entry = uniqueName(kind === 'cover' ? 'Cover' : 'Magic Slide');
    const slide = S.newCustomSlide(kind, kind === 'cover' ? { title: deck.visit.title } : { title: withCamera ? T('Live') : '' });
    if (kind === 'cover') {
      const P = presenterOf(slide);
      slide.showPhoto = P.hasPhoto;
      slide.contacts = CONTACT_ORDER.filter((k) => (P.contacts[k] || '').trim()).slice(0, 2);
    }
    await work(T('Adding…'), async () => {
      if (withCamera) slide.images.push(await cameraMedia());
      await store.writeJSON(`${deck.folder}/${entry}`, slide, true);
      const entries = deck.entries.slice(); const at = deck.entries.length ? deck.selected + 1 : 0;
      entries.splice(at, 0, entry); await saveEntries(entries); deck.selected = at;
    });
    renderRail(); await renderSelected();
    const f = $('#f-title'); if (f) { f.focus(); f.select(); }
  }
  /** A live camera for a Magic slide: a .fvlive the apps show live too, with a poster from this camera. */
  async function cameraMedia(facing) {
    const name = `.live-${S.shortID()}.fvlive`;
    let poster = null;
    try { await camera(false); poster = await frameOf(cameraStream); } catch { toast(T('The camera is off, so the slide shows a placeholder until it’s on.')); }
    const live = S.newCameraMedia(); if (facing === 'back') live.tiles[0].source = 'camera:back';
    await store.writeJSON(`${deck.folder}/${name}`, live, true);
    if (poster) await store.putFile(`${deck.folder}/${S.posterPath(name)}`, poster);
    return name;
  }
  async function frameOf(stream) {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.srcObject = stream; await v.play();
    await new Promise((r) => setTimeout(r, 350));
    const c = document.createElement('canvas'); c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); v.srcObject = null;
    return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
  }
  async function videoPoster(file) {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = URL.createObjectURL(file);
    await new Promise((ok, fail) => { v.onloadeddata = ok; v.onerror = fail; });
    v.currentTime = Math.min(0.5, (v.duration || 1) / 3);
    await new Promise((ok) => { v.onseeked = ok; });
    const c = document.createElement('canvas'); const k = Math.min(1, 1600 / Math.max(v.videoWidth, v.videoHeight));
    c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); URL.revokeObjectURL(v.src);
    return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
  }
  async function addMediaTo(info, files) {
    await work(T('Uploading…'), async () => {
      for (const file of files.slice(0, 4 - info.slide.images.length)) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const name = `.picture-${S.shortID()}.${ext}`;
        await store.putFile(`${deck.folder}/${name}`, file);
        if (S.fileType(name) === 'video') { try { await store.putFile(`${deck.folder}/${S.posterPath(name)}`, await videoPoster(file)); } catch {} }
        info.slide.images.push(name);
      }
    });
    await saveCustom(info, true);
  }

  /** Picks one of this presentation's photos, videos or PDFs to show on the Magic slide too. */
  function pickFromDeck(info) {
    const ok = deck.entries.filter((e) => ['image', 'webImage', 'video', 'audio', 'pdf'].includes(S.fileType(e)) && !info.slide.images.includes(e));
    if (!ok.length) return toast(T('This presentation has no photos, videos or PDFs to add yet.'));
    const d = $('#deckpick');
    $('.dp-grid', d).replaceChildren(...ok.map((e) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'dp-item'; b.innerHTML = '<span class="frame"></span><span class="dp-name"></span>';
      $('.dp-name', b).textContent = S.baseName(e);
      slideInfo(deck.folder, e).then((x) => draw($('.frame', b), x, { thumb: true }));
      b.onclick = () => { d.close(); info.slide.images.push(e); saveCustom(info, true); };
      return b;
    }));
    d.showModal();
  }
  /** A website on the slide: its address, kept as the apps keep one, with a card of its name (the app pictures the page itself). */
  async function addSiteTo(info) {
    const d = $('#sitepick'); const input = $('input', d); input.value = '';
    d.showModal(); input.focus();
    input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); d.close('add'); } };
    d.onclose = async () => {
      if (d.returnValue !== 'add') return;
      let url = input.value.trim(); if (!url) return;
      if (!/^[a-z]+:\/\//i.test(url)) url = 'https://' + url;
      try { new URL(url); } catch { return toast(T('That doesn’t look like a web address.')); }
      const name = `.site-${S.shortID()}.url`;
      await work(T('Adding the website…'), async () => {
        await store.putFile(`${deck.folder}/${name}`, new Blob([`[InternetShortcut]\nURL=${url}\n`], { type: 'text/plain' }));
        await store.putFile(`${deck.folder}/${S.posterPath(name)}`, await siteCard(url));
        info.slide.images.push(name);
      });
      saveCustom(info, true);
    };
  }
  function siteCard(url) {
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1000;
    const x = c.getContext('2d'); x.fillStyle = '#1c1c1e'; x.fillRect(0, 0, 1600, 1000);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 96px -apple-system, system-ui, sans-serif'; x.fillText(hostOf(url), 800, 470, 1400);
    x.fillStyle = 'rgba(255,255,255,.55)'; x.font = '500 44px -apple-system, system-ui, sans-serif'; x.fillText(T('Opens the website'), 800, 580);
    return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.9));
  }
  async function addCameraTo(info, facing) {
    await work(T('Adding the camera…'), async () => { info.slide.images.push(await cameraMedia(facing)); });
    await saveCustom(info, true);
  }

  // ── presenting, recording and watching ──

  const P = { slides: [], index: 0, nodes: [], rec: null, watch: null };
  const SHOW_DEFAULT = { transition: 'crossfade', numbers: false, arrows: true, loop: true, autoplay: 0 };
  function showPrefs() { try { return Object.assign({}, SHOW_DEFAULT, JSON.parse(localStorage.getItem('fv-slideshow') || '{}')); } catch { return Object.assign({}, SHOW_DEFAULT); } }
  function setShowPref(k, v) { const p2 = showPrefs(); p2[k] = v; try { localStorage.setItem('fv-slideshow', JSON.stringify(p2)); } catch {} }

  /** The slides as shown: a PDF is one slide per page (as the apps count them for a commentary's marks). */
  async function expand() {
    const out = [];
    for (const entry of deck.entries) {
      const info = await slideInfo(deck.folder, entry);
      if (info.type === 'pdf') {
        let n = 1; try { n = (await pdfDoc(info.url)).numPages; } catch {}
        for (let p = 0; p < n; p++) out.push({ info, page: p });
      } else out.push({ info, page: 0 });
    }
    return out;
  }
  async function present({ from = 0, record = false, watch = null } = {}) {
    if (!deck.entries.length) return;
    const shell = $('#present');
    shell.hidden = false; document.body.classList.add('presenting');
    shell.classList.toggle('recording', record); shell.classList.toggle('watching', !!watch);
    P.slides = await expand();
    const stage = $('#pstage');
    P.nodes = P.slides.map(() => { const d = document.createElement('div'); d.className = 'pslide'; stage.appendChild(d); return d; });
    if (shell.requestFullscreen && !watch) shell.requestFullscreen().catch(() => {});
    const prefs = showPrefs(); P.prefs = prefs; P.started = performance.now();
    shell.classList.toggle('numbers', prefs.numbers); shell.classList.toggle('arrows', prefs.arrows && !watch && !record);
    go(Math.min(from, P.slides.length - 1), true);
    if (record) startRecording();
    if (watch) startWatching(watch);
    $('#pclose').focus();
  }
  function go(n, jump) {
    if (n < 0 || n >= P.slides.length) return;
    const prev = P.nodes[P.index];
    P.index = n;
    [n, n + 1, n - 1].forEach((k) => { const s = P.slides[k], el = P.nodes[k]; if (s && !el.dataset.drawn) { el.dataset.drawn = '1'; const box = document.createElement('div'); el.appendChild(box); draw(box, s.info, { page: s.page, live: true, present: true }); } });
    const t = (deck.transitions || {})[P.slides[n].info.entry] || (P.prefs || SHOW_DEFAULT).transition || 'crossfade';
    const stage = $('#pstage'); stage.dataset.t = t === 'magicMove' ? 'crossfade' : t;
    stage.dataset.dir = jump ? '' : (prev && P.nodes.indexOf(prev) > n ? 'back' : 'fwd');
    P.nodes.forEach((el, k) => el.classList.toggle('on', k === n));
    if (prev && prev !== P.nodes[n]) $$('video, audio', prev).forEach((m) => { if (!m.srcObject) m.pause(); });
    $$('video:not(.live-cam), audio', P.nodes[n]).forEach((m) => { if (!m.srcObject) { m.loop = (P.prefs || SHOW_DEFAULT).loop; m.muted = !!P.watch; m.currentTime = 0; m.play().catch(() => { m.muted = true; m.play().catch(() => {}); }); } });
    $('#pcount').textContent = `${n + 1} / ${P.slides.length}`;
    $('#pnum').textContent = n + 1;
    clearTimeout(P.auto);
    const auto = (P.prefs || SHOW_DEFAULT).autoplay;
    if (auto > 0 && !P.rec && !P.watch && n < P.slides.length - 1) P.auto = setTimeout(() => go(n + 1), auto * 1000);
    updateNotesWindow();
    const note = (deck.notes || {})[`${P.slides[n].info.entry}#${P.slides[n].page}`] || (deck.notes || {})[P.slides[n].info.entry] || '';
    $('#pnotes').textContent = note; $('#pnotes').hidden = !note || !P.rec;
    if (P.rec && P.rec.started && !jump) P.rec.marks.push({ slide: n, time: +recTime().toFixed(3) });
  }
  function closePresent() {
    if (P.rec) return stopRecording();
    clearTimeout(P.auto);
    stopWatching();
    if (P.notesWin && !P.notesWin.closed) P.notesWin.close();
    $('#present').hidden = true; document.body.classList.remove('presenting');
    $('#pstage').replaceChildren(); P.nodes = []; P.slides = [];
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (!cameraLiveInDeck()) stopCamera();
    renderSelected();
  }
  const cameraLiveInDeck = () => false;


  // ── Notes in a window of their own (for a second screen while presenting) ──
  function openNotesWindow() {
    if (P.notesWin && !P.notesWin.closed) { P.notesWin.focus(); return; }
    const w = window.open('', 'fvnotes', 'width=560,height=680');
    if (!w) return toast(T('Allow pop-ups for this site to open the notes window.'));
    P.notesWin = w;
    w.document.title = T('Notes · FreeView'); w.document.documentElement.lang = document.documentElement.lang;
    w.document.body.innerHTML = `<style>
      html,body{margin:0;background:#0b0b0c;color:#f5f5f7;font:17px/1.45 -apple-system,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
      main{padding:24px;display:flex;flex-direction:column;gap:18px;height:100vh;box-sizing:border-box}
      header{display:flex;justify-content:space-between;color:rgba(245,245,247,.6);font-variant-numeric:tabular-nums}
      #n{font-size:30px;font-weight:600;color:#f5f5f7} #t{font-size:30px;font-weight:600;color:#f5f5f7}
      #notes{flex:1;overflow:auto;font-size:26px;line-height:1.4;white-space:pre-wrap;text-wrap:pretty}
      #notes.empty{color:rgba(245,245,247,.38);font-size:20px}
      footer{color:rgba(245,245,247,.6);font-size:15px} footer b{color:#f5f5f7;font-weight:600}
      nav{display:flex;gap:10px} button{flex:1;min-height:52px;border:0;border-radius:14px;background:#26262a;color:#f5f5f7;font:600 17px -apple-system,system-ui,sans-serif;cursor:pointer}
      button:active{transform:scale(.96)}</style>
      <main><header><span>${T('{n} of {count}', { n: '<span id="n">1</span>', count: '<span id="of">1</span>' })}</span><span id="t">0:00</span></header>
      <div id="notes"></div><footer>${T('Next:')} <b id="next"></b></footer>
      <nav><button id="prev">${T('Previous')}</button><button id="fwd">${T('Next')}</button></nav></main>`;
    w.document.getElementById('prev').onclick = () => go(P.index - 1);
    w.document.getElementById('fwd').onclick = () => go(P.index + 1);
    w.addEventListener('keydown', (e) => { if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(P.index + 1); } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(P.index - 1); } });
    clearInterval(P.notesClock);
    P.notesClock = setInterval(() => { if (w.closed) return clearInterval(P.notesClock); const el = w.document.getElementById('t'); if (el) el.textContent = clock((performance.now() - (P.started || performance.now())) / 1000); }, 500);
    updateNotesWindow();
  }
  function slideTitle(sl) {
    if (!sl) return T('End of the presentation');
    const i = sl.info; if (i.type === 'custom' && i.slide) return i.slide.title || T(i.slide.kind === 'cover' ? 'Cover' : 'Magic slide');
    if (i.type === 'pdf') return T('{name}, page {n}', { name: i.name, n: sl.page + 1 });
    return i.type === 'link' ? hostOf(i.href) : i.name;
  }
  function updateNotesWindow() {
    const w = P.notesWin; if (!w || w.closed || !P.slides.length) return;
    const sl = P.slides[P.index], d = w.document;
    const text = (deck.notes || {})[`${sl.info.entry}#${sl.page}`] || (deck.notes || {})[sl.info.entry] || '';
    d.getElementById('n').textContent = P.index + 1; d.getElementById('of').textContent = P.slides.length;
    const el = d.getElementById('notes'); el.textContent = text || T('No notes for this slide.'); el.classList.toggle('empty', !text);
    d.getElementById('next').textContent = slideTitle(P.slides[P.index + 1]);
  }
  // Recording: the camera and microphone as one MP4 take, and the time each slide came on.
  function recordingType() {
    if (!window.MediaRecorder) return null;
    for (const t of ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4']) if (MediaRecorder.isTypeSupported(t)) return t;
    return null;
  }
  const recTime = () => P.rec ? (P.rec.paused ? P.rec.elapsed : P.rec.elapsed + (performance.now() - P.rec.t0) / 1000) : 0;
  async function startRecording() {
    const type = recordingType();
    if (!type) { toast(T('This browser can’t record video FreeView can play. Use Safari, or Chrome 126 or later.')); closePresent(); return; }
    let stream;
    try { stream = await camera(true); } catch { toast(T('FreeView needs your camera and microphone to record. Allow them in the address bar and try again.')); $('#present').classList.remove('recording'); return; }
    const bubble = $('#bubble'); bubble.srcObject = stream; bubble.hidden = false; bubble.play().catch(() => {});
    const count = $('#countdown'); count.hidden = false;
    for (const n of [3, 2, 1]) { count.textContent = n; await new Promise((r) => setTimeout(r, 800)); }
    count.hidden = true;
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 128_000 });
    P.rec = { rec, chunks: [], marks: [{ slide: P.index, time: 0 }], t0: performance.now(), elapsed: 0, started: true, type };
    rec.ondataavailable = (e) => { if (e.data.size) P.rec.chunks.push(e.data); };
    rec.start(1000);
    $('#pill').hidden = false; $('#ppause').hidden = false; $('#ppause').textContent = T('Pause');
    const tick = () => { if (!P.rec) return; $('#ptime').textContent = (P.rec.paused ? T('Paused') + ' · ' : '') + clock(recTime()); P.rec.raf = requestAnimationFrame(tick); };
    tick();
  }

  function togglePause() {
    const r = P.rec; if (!r) return;
    if (r.paused) { r.rec.resume(); r.t0 = performance.now(); r.paused = false; $('#ppause').textContent = T('Pause'); $('#present').classList.remove('paused'); }
    else { r.rec.pause(); r.elapsed += (performance.now() - r.t0) / 1000; r.paused = true; $('#ppause').textContent = T('Resume'); $('#present').classList.add('paused'); }
  }
  async function stopRecording() {
    const r = P.rec; if (!r) return;
    cancelAnimationFrame(r.raf);
    const duration = recTime();
    await new Promise((ok) => { r.rec.onstop = ok; r.rec.stop(); });
    P.rec = null; $('#pill').hidden = true; $('#ppause').hidden = true; $('#present').classList.remove('paused'); $('#bubble').hidden = true; $('#bubble').srcObject = null;
    $('#present').classList.remove('recording');
    stopCamera();
    closePresent();
    const take = new Blob(r.chunks, { type: r.type.split(';')[0] });
    const id = S.uuid();
    const layout = { baseTemplateID: 'bubble:farAlongFarAcross', switches: [] };
    const commentary = { version: 1, id, recordedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), duration: +duration.toFixed(3), slideCount: 0,
      entries: deck.entries.slice(), marks: r.marks, recordedLayout: layout, layout, layoutChosen: false, events: [], clips: [] };
    commentary.slideCount = (await expand()).length;
    await work(T('Saving your commentary ({size})…', { size: I.fixed(take.size / 1e6, 1) + ' MB' }), async () => {
      const dir = `${deck.folder}/.commentary-${id}`;
      await store.putFile(`${dir}/take.mov`, take);   // the apps look for take.mov; MP4 inside plays the same
      await store.writeJSON(`${dir}/commentary.json`, commentary, true);
      await saveEntries(deck.entries);
      toast(T('Commentary saved. It’s in FreeView on your other devices too.'));
    });
    renderCommentary();
    const c = await latestCommentary(); if (c) present({ from: c.marks[0].slide, watch: c });
  }
  const clock = (s) => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  /** The newest commentary of this presentation (the apps keep the newest too). */
  async function latestCommentary() {
    const files = store.pathsIn(deck.folder + '/.commentary-').filter((p) => p.endsWith('/commentary.json'));
    let best = null;
    for (const p of files) {
      const c = await store.json(p); if (!c || !Array.isArray(c.marks) || !c.marks.length) continue;
      const dir = p.slice(0, -'/commentary.json'.length);
      const take = await store.src(`${dir}/take.mov`); if (!take) continue;
      if (!best || (c.recordedAt || '') > (best.recordedAt || '')) best = Object.assign(c, { take, _dir: dir });
    }
    return best;
  }
  async function renderCommentary() {
    const c = deck && await latestCommentary();
    const b = $('#watchbtn');
    b.hidden = !c;
    if (c) $('span', b).textContent = `${T('Watch Commentary')} · ${clock(c.duration || 0)}`;
  }
  // The app's layouts (CommentaryLayout.swift): where the camera and the slides sit, by template id.
  const FULL = { along: [0, 1], across: [0, 1] }, HIDDEN = { along: [0, 1], across: [0, 1], hidden: true };
  const TEMPLATES = {
    split: { name: T('Split'), face: { along: [0.5, 1], across: [0, 1] }, scene: { along: [0, 0.5], across: [0, 1] } },
    faceWithSlides: { name: T('You, slides inset'), face: FULL, scene: { corner: 'nearAlongFarAcross', side: 0.42, margin: 0.04, radius: 0.1 } },
    faceOnly: { name: T('You only'), face: FULL, scene: HIDDEN },
    slidesOnly: { name: T('Slides only'), face: HIDDEN, scene: FULL },
  };
  function template(tid) {
    const [kind, corner] = (tid || '').split(':');
    if (kind === 'bubble' && corner) return { name: T('Bubble'), face: { corner, side: 0.30, margin: 0.04, radius: 0.5 }, scene: FULL };
    if (kind === 'inset' && corner) return { name: T('Inset'), face: { corner, side: 0.34, margin: 0.04, radius: 0.14 }, scene: FULL };
    return TEMPLATES[tid] || template('bubble:farAlongFarAcross');
  }
  function layerRect(frame, W, H) {
    const portrait = H >= W;
    if (frame.corner) {
      const short = Math.min(W, H), side = frame.side * short, m = frame.margin * short;
      const farAlong = frame.corner.startsWith('farAlong'), farAcross = frame.corner.endsWith('FarAcross');
      const a = farAlong ? (portrait ? H : W) - m - side : m, c = farAcross ? (portrait ? W : H) - m - side : m;
      return portrait ? { x: c, y: a, w: side, h: side, r: frame.radius * side } : { x: a, y: c, w: side, h: side, r: frame.radius * side };
    }
    const long = portrait ? H : W, short = portrait ? W : H;
    const a0 = frame.along[0] * long, a1 = frame.along[1] * long, c0 = frame.across[0] * short, c1 = frame.across[1] * short;
    return Object.assign(portrait ? { x: c0, y: a0, w: c1 - c0, h: a1 - a0, r: 0 } : { x: a0, y: c0, w: a1 - a0, h: c1 - c0, r: 0 }, { hidden: !!frame.hidden });
  }
  function applyLayout(tid) {
    // As in the app's review, the stage sits above the controls (slides re-laid out, not scaled).
    const shell = $('#present'), rv = $('#review'), W = shell.clientWidth, H = shell.clientHeight - (rv.hidden ? 0 : rv.offsetHeight + 28), t = template(tid);
    const place = (el, r) => { Object.assign(el.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', right: 'auto', bottom: 'auto', borderRadius: r.r + 'px', opacity: r.hidden ? '0' : '1' }); };
    const face = layerRect(t.face, W, H), scene = layerRect(t.scene, W, H);
    place($('#bubble'), face); place($('#pstage'), scene);
    shell.classList.toggle('face-behind', !scene.hidden && scene.w * scene.h < face.w * face.h);
    P.applied = tid;
  }
  function resetLayers() { for (const el of [$('#bubble'), $('#pstage')]) el.removeAttribute('style'); $('#present').classList.remove('face-behind'); }
  const layoutOf = (c) => c.layout || { baseTemplateID: 'bubble:farAlongFarAcross', switches: [] };
  function layoutAtTime(c, t) { const L = layoutOf(c); let id = L.baseTemplateID || 'bubble:farAlongFarAcross'; for (const sw of (L.switches || []).slice().sort((a, b) => a.time - b.time)) { if (sw.time <= t + 0.001) id = sw.templateID; else break; } return id; }
  function startWatching(c) {
    const v = $('#bubble'); v.srcObject = null; v.src = c.take; v.hidden = false; v.muted = false;
    P.watch = c; P.applied = null;
    $('#pill').hidden = true; $('#review').hidden = false;
    const marks = c.marks.slice().sort((a, b) => a.time - b.time);
    const at = (t) => { let n = marks[0].slide; for (const m of marks) if (m.time <= t + 0.001) n = m.slide; else break; return n; };
    const scrub = $('#rscrub');
    const tick = () => {
      if (!P.watch) return;
      const n = at(v.currentTime); if (n !== P.index) go(n, true);
      const tid = layoutAtTime(c, v.currentTime); if (tid !== P.applied) { P.applied = tid; renderReview(); applyLayout(tid); }
      if (!P.scrubbing) scrub.value = v.currentTime;
      $('#rtime').textContent = `${clock(v.currentTime)} / ${clock(c.duration || v.duration || 0)}`;
      $('#rplay').innerHTML = v.paused ? ICON.play : ICON.pause;
      P.watch.raf = requestAnimationFrame(tick);
    };
    scrub.max = c.duration || 1; scrub.step = 0.05;
    scrub.oninput = () => { P.scrubbing = true; v.currentTime = +scrub.value; };
    scrub.onchange = () => { P.scrubbing = false; };
    v.onloadedmetadata = () => { if (!c.duration) { scrub.max = v.duration; } };
    v.onended = () => toast(T('That’s the end of the commentary.'));
    renderReview(); applyLayout(layoutAtTime(c, 0)); requestAnimationFrame(() => applyLayout(P.applied));
    v.play().then(tick).catch(() => { v.muted = true; v.play().then(tick); });
    addEventListener('resize', relayoutReview);
  }
  function relayoutReview() { if (P.watch) applyLayout(P.applied); }
  function stopWatching() {
    if (!P.watch) return;
    cancelAnimationFrame(P.watch.raf); P.watch = null;
    removeEventListener('resize', relayoutReview);
    const v = $('#bubble'); v.pause(); v.removeAttribute('src'); v.load(); v.hidden = true; $('#review').hidden = true;
    resetLayers();
  }
  const LAYOUT_CHOICES = [['bubble', 'Bubble'], ['inset', 'Inset'], ['split', 'Split'], ['faceWithSlides', 'You, slides inset'], ['faceOnly', 'You only'], ['slidesOnly', 'Slides only']];
  const CORNERS = [['nearAlongNearAcross', '↖'], ['farAlongNearAcross', '↗'], ['nearAlongFarAcross', '↙'], ['farAlongFarAcross', '↘']];
  /** The review bar: the layout from the playhead on, its corner, keyframes on the timeline, As Recorded, Delete. */
  function renderReview() {
    const c = P.watch; if (!c) return;
    const v = $('#bubble'), L = layoutOf(c), cur = P.applied || layoutAtTime(c, v.currentTime);
    const [kind, corner] = cur.split(':');
    const near = (L.switches || []).find((sw) => Math.abs(sw.time - v.currentTime) < 0.35);
    $('#rlayouts').innerHTML = LAYOUT_CHOICES.map(([k, l]) => `<button type="button" class="chip${(kind === k) ? ' on' : ''}" data-lay="${k}">${T(l)}</button>`).join('')
      + (kind === 'bubble' || kind === 'inset' ? `<span class="corners">${CORNERS.map(([k, g]) => `<button type="button" class="chip corner${corner === k ? ' on' : ''}" data-corner="${k}" aria-label="${T('Corner')}">${g}</button>`).join('')}</span>` : '');
    const D = c.duration || v.duration || 1;
    $('#rdots').innerHTML = (L.switches || []).map((sw, k) => `<button type="button" class="kdot${near === sw ? ' on' : ''}" style="left:${(sw.time / D) * 100}%" data-k="${k}" aria-label="${T('Layout change at {time}', { time: clock(sw.time) })}"></button>`).join('');
    $('#rnote').textContent = [template(L.baseTemplateID).name].concat((L.switches || []).slice().sort((a, b) => a.time - b.time).map((sw) => template(sw.templateID).name)).join(' → ') + (c.layoutChosen ? '' : ' · ' + T('as recorded'));
    $('#rremove').hidden = !near;
    $$('[data-lay]').forEach((b) => (b.onclick = () => {
      const k = b.dataset.lay; const keepCorner = corner && (k === 'bubble' || k === 'inset') ? corner : 'farAlongFarAcross';
      setLayoutFromHere(k === 'bubble' || k === 'inset' ? `${k}:${keepCorner}` : k);
    }));
    $$('[data-corner]').forEach((b) => (b.onclick = () => setLayoutFromHere(`${kind}:${b.dataset.corner}`)));
    $$('#rdots .kdot').forEach((d) => (d.onclick = () => { v.currentTime = L.switches[+d.dataset.k].time + 0.01; renderReview(); }));
  }
  /** "Layout from here": a keyframe at the playhead (the base layout when at the start), saved at once. */
  function setLayoutFromHere(tid) {
    const c = P.watch, v = $('#bubble'), t = v.currentTime;
    const L = JSON.parse(JSON.stringify(layoutOf(c))); L.switches = L.switches || [];
    if (t < 0.3) L.baseTemplateID = tid;
    else {
      const near = L.switches.find((sw) => Math.abs(sw.time - t) < 0.35);
      if (near) near.templateID = tid; else L.switches.push({ time: +t.toFixed(3), templateID: tid });
      L.switches.sort((a, b) => a.time - b.time);
    }
    c.layout = L; c.layoutChosen = true; applyLayout(layoutAtTime(c, t)); renderReview(); saveCommentary(c);
  }
  function removeKeyframe() {
    const c = P.watch, v = $('#bubble'), L = layoutOf(c);
    L.switches = (L.switches || []).filter((sw) => Math.abs(sw.time - v.currentTime) >= 0.35);
    c.layout = L; c.layoutChosen = true; applyLayout(layoutAtTime(c, v.currentTime)); renderReview(); saveCommentary(c);
  }
  function asRecorded() {
    const c = P.watch; c.layout = JSON.parse(JSON.stringify(c.recordedLayout || { baseTemplateID: 'bubble:farAlongFarAcross', switches: [] })); c.layoutChosen = false;
    applyLayout(layoutAtTime(c, $('#bubble').currentTime)); renderReview(); saveCommentary(c);
  }
  const saveCommentary = debounce(() => {
    const c = P.watch || P.lastWatch; if (!c) return;
    const out = Object.assign({}, c); delete out.take; delete out._dir; delete out.raf;
    work(T('Saving the layout…'), () => store.writeJSON(`${c._dir}/commentary.json`, out, true));
  }, 500);
  function deleteCommentary() {
    const c = P.watch; if (!c) return;
    askChoice(T('Delete This Commentary?'), T('The recording and its layout are deleted from FreeView on all your devices. This can’t be undone.'), [['remove', T('Delete')]], async () => {
      const dir = c._dir; closePresent();
      await work(T('Deleting…'), async () => { for (const p2 of store.pathsIn(dir + '/')) await store.deleteFile(p2); });
      renderCommentary();
    });
  }

  // ── wiring ──

  function wire() {
    $('#sharebtn').onclick = () => openShare(false);
    $('#prolock').onclick = showPaywall; $('#progetbtn').onclick = showPaywall;
    $('#newdeck').onclick = $('#newdeck2').onclick = async () => {
      const v = await work(T('Creating…'), () => store.newDeck(T('Untitled Presentation')));
      if (v) { await openDeck(v.id); $('#title').focus(); $('#title').select(); }
    };
    $('#home').onclick = (e) => { e.preventDefault(); if (store && document.body.dataset.view !== 'welcome') goTab('library'); };
    $$('#tabs button').forEach((b) => (b.onclick = () => goTab(b.dataset.tab)));
    $('#signout2').onclick = () => $('#signout').click();
    $('#backbtn').onclick = () => showLibrary();
    $('#title').onchange = () => { const t = $('#title').value.trim() || T('Untitled Presentation'); $('#title').value = t; $('#crumb').textContent = t; work(T('Saving…'), () => saveEntries(deck.entries, t)); };
    $('#title').onkeydown = (e) => { if (e.key === 'Enter') e.target.blur(); };
    $('#addbtn').onclick = (e) => openAddMenu(e.currentTarget);
    $('#stylebtn').onclick = () => { deck.styling = !deck.styling; $('#stylebtn').setAttribute('aria-pressed', String(!!deck.styling)); renderSelected(); };
    $$('#addmenu [data-add]').forEach((b) => b.onclick = () => addAction(b.dataset.add));
    $('#presentbtn').onclick = () => present({ from: deck.selected });
    $('#recordbtn').onclick = () => present({ from: 0, record: true });
    $('#watchbtn').onclick = async () => { const c = await latestCommentary(); if (c) present({ from: c.marks[0].slide, watch: c }); };
    $('#pclose').onclick = closePresent;
    $('#pnotesbtn').onclick = openNotesWindow;
    $('#ppause').onclick = togglePause;
    $('#rplay').onclick = () => { const v = $('#bubble'); v.paused ? v.play() : v.pause(); };
    $('#rdone').onclick = closePresent;
    $('#rremove').onclick = removeKeyframe;
    $('#rrecorded').onclick = asRecorded;
    $('#rdelete').onclick = deleteCommentary;
    $('#parrowl').onclick = (e) => { e.stopPropagation(); go(P.index - 1); };
    $('#parrowr').onclick = (e) => { e.stopPropagation(); go(P.index + 1); };
    $('#pstop').onclick = () => (P.rec ? stopRecording() : closePresent());
    $('#pprev').onclick = () => go(P.index - 1);
    $('#pnext').onclick = () => go(P.index + 1);
    $('#pstage').onclick = (e) => { if (P.watch || e.target.closest('a, button, video[controls], .fv .media img')) return; go(P.index + (e.clientX < innerWidth / 3 ? -1 : 1)); };
    document.addEventListener('keydown', (e) => {
      if ($('#present').hidden) {
        if (e.key === 'Escape') { $('#addmenu').hidden = true; $('#ctxmenu').hidden = true; }
        const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable]');
        if (!deck || typing || document.querySelector('dialog[open]') || $('#deck').hidden) return;
        const cmd = e.metaKey || e.ctrlKey;
        if (cmd && e.key.toLowerCase() === 'a') { e.preventDefault(); selectAll(); }
        else if (cmd && e.key.toLowerCase() === 'd') { e.preventDefault(); deck.chosen.size > 1 ? $('#m-dup') && $('#m-dup').click() : duplicateChosen(false); }
        else if (cmd && e.key.toLowerCase() === 'c') { e.preventDefault(); copyChosen(); }
        else if (cmd && e.key === 'Enter') { e.preventDefault(); present({ from: deck.selected }); }
        else if (!cmd && (e.key === 'Backspace' || e.key === 'Delete') && e.target.closest('#rail, body') && !e.target.closest('#inspector')) { e.preventDefault(); deleteChosen(); }
        return;
      }
      if (P.watch && (e.key === ' ')) { e.preventDefault(); const v = $('#bubble'); v.paused ? v.play() : v.pause(); return; }
      if (P.watch) { if (e.key === 'Escape') closePresent(); else if (e.key === 'ArrowLeft') $('#bubble').currentTime -= 5; else if (e.key === 'ArrowRight') $('#bubble').currentTime += 5; return; }
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(P.index + 1); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(P.index - 1); }
      else if (e.key === 'Escape') { e.preventDefault(); closePresent(); }
    });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && !$('#present').hidden && !P.rec && !P.watch) closePresent(); });
    // Drop files anywhere on a presentation to add them.
    document.addEventListener('dragover', (e) => { if (deck && e.dataTransfer.types.includes('Files')) { e.preventDefault(); document.body.classList.add('dropping'); } });
    document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) document.body.classList.remove('dropping'); });
    document.addEventListener('drop', (e) => { document.body.classList.remove('dropping'); if (deck && e.dataTransfer.files.length) { e.preventDefault(); addFiles([...e.dataTransfer.files]); } });
    window.addEventListener('focus', () => store && store.kind === 'cloud' && store.sync().catch(() => {}));
    // ⌘V in a presentation: slides copied here, files, or a web address.
    document.addEventListener('paste', (e) => {
      if (!deck || $('#deck').hidden || (e.target.closest && e.target.closest('input, textarea, [contenteditable]'))) return;
      const text = e.clipboardData.getData('text/plain') || '';
      if (text.startsWith(CLIP)) { e.preventDefault(); return pasteSlides(text); }
      if (e.clipboardData.files.length) { e.preventDefault(); return addFiles([...e.clipboardData.files]); }
      if (/^https?:\/\/\S+$/i.test(text.trim())) { e.preventDefault(); return addLinkSlide(text.trim()); }
      if (window.__fvClip && !text) { e.preventDefault(); pasteSlides(window.__fvClip); }
    });
    // Home: search and each presentation's menu.
    $('#search').oninput = () => renderLibrary();
  }

  async function start() {
    I.apply(document.body);
    wire();
    const demo = new URLSearchParams(location.search).has('demo');
    if (demo) {
      store = new S.DemoStore(); await store.seed();
      // Demo only: a handle for trying things out (nothing here reaches iCloud).
      window.__fvDemo = { store, deck: () => deck, renderCommentary, present: (o) => present(o), makeExport: (v) => makeExport(v, { withCommentary: true, onStep() {} }) };
      $('#modebadge').hidden = false;
      // ?free shows the Free limits in the sample.
      if (new URLSearchParams(location.search).has('free')) pro = false;
      return enter();
    }
    show('welcome');
    store = new S.CloudStore();
    $('#signout').onclick = () => { const apple = $('#apple-sign-out-button .apple-auth-button') || $('#apple-sign-out-button > *'); if (apple) apple.click(); };
    // Our button opens CloudKit's sign-in window through CloudKit's own (hidden) button.
    $('#signin').onclick = () => {
      const apple = $('#apple-sign-in-button .apple-auth-button') || $('#apple-sign-in-button > *');
      if (apple) { apple.click(); return; }
      $('#signin').setAttribute('aria-busy', 'true'); toast(T('Connecting to iCloud… try again in a moment.'));
      setTimeout(() => $('#signin').removeAttribute('aria-busy'), 1500);
    };
    try {
      await store.auth({ signIn: 'apple-sign-in-button', signOut: 'apple-sign-out-button', onSignedOut: () => location.reload() });
      $('#account').hidden = false;
      // The library shows at once and fills in as iCloud sends it (a big one takes a few pages).
      busy(T('Loading your library…'));
      const loading = store.sync((n) => busy(n ? I.n(n, 'Loading your library… {n} presentation', 'Loading your library… {n} presentations') : T('Loading your library…')));
      await enter();
      await loading.catch((e) => { console.error(e); toast(T('iCloud didn’t send everything. Reload to try again.')); });
      busy('');
      refreshPro(true);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshPro(); });
      // The profile (name, photo, role) may have come in after the first slides were drawn.
      profile = await store.json('.profile/profile.json');
      infoCache.clear();
      if (deck) { deck.style = await store.json(`${deck.folder}/.style.json`); renderRail(); renderSelected(); }
      if (!deck && !$('#library').hidden) { const m = /deck=([0-9A-F-]+)/i.exec(location.hash); if (m && store.visit(m[1])) openDeck(m[1]); else renderLibrary(); }
      if (!$('#links').hidden) renderLinks();
      if (!$('#settings').hidden) renderSettings();
    } catch (e) {
      console.error(e);
      $('#welcome-error').hidden = false; $('#welcome-error').textContent = T('iCloud couldn’t be reached. Check your connection and reload.');
    }
  }
  async function enter() {
    profile = await store.json('.profile/profile.json');
    store.onChange(debounce(() => { if (!deck && !$('#library').hidden) renderLibrary(); if (!$('#links').hidden) renderLinks(); }, 200));
    const m = /deck=([0-9A-F-]+)/i.exec(location.hash);
    if (m && store.visit(m[1])) openDeck(m[1]);
    else if (location.hash === '#links' || location.hash === '#settings') goTab(location.hash.slice(1));
    else showLibrary();
  }
  start();
})();
