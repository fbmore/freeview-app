/* FreeView web editor (prototype). Make and present presentations in a browser, saved to the same
 * iCloud library the apps use (edit-store.js), with commentary recorded the FreeView way: the camera
 * as one track, the moments each slide came on as marks, played back together over the live slides.
 * What only the apps can do (live screens and windows, PowerPoint/Keynote, 3D) shows as a card that
 * says so, and stays untouched.
 */
(function () {
  'use strict';
  const S = window.FVStore;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const LIBS = {
    marked: 'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js',
    purify: 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js',
    qrcode: 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js',
    pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    fvslide: '/fvslide.js?v=20',
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
  function errorText(e) {
    const code = e && (e.ckErrorCode || e.serverErrorCode);
    if (code === 'QUOTA_EXCEEDED') return 'Your iCloud storage is full.';
    if (code === 'AUTHENTICATION_REQUIRED' || code === 'AUTHENTICATION_FAILED') return 'Sign in with Apple again to keep saving.';
    return (e && (e.reason || e.message)) ? `Couldn't save: ${e.reason || e.message}` : "Couldn't save that. Try again.";
  }
  function show(view) {
    for (const id of ['welcome', 'library', 'deck']) $('#' + id).hidden = id !== view;
    document.body.dataset.view = view;
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
      info.label = info.slide ? (info.slide.kind === 'cover' ? 'Cover' : 'Magic slide') : 'Slide';
    } else if (type === 'live') {
      const live = await store.json(path);
      info.cameras = !!(live && live.tiles && live.tiles.length && live.tiles.every((t) => /^camera:/.test(t.source)));
    } else if (type === 'link') {
      const text = await store.text(path) || '';
      const m = /URL=(.+)/.exec(text) || /<string>(https?:[^<]+)<\/string>/.exec(text);
      info.href = m ? m[1].trim() : '';
    }
    info.label = info.label || KIND_LABEL[type] || 'File';
    infoCache.set(path, info);
    return info;
  }
  const tagOf = (path) => { const f = store.files.get(path); return f ? (f.tag || f.url) : ''; };

  /** A Magic slide or cover, resolved the way the apps do (CustomSlides.spec) for fvslide.js. */
  async function resolveSpec(folder, slide) {
    const style = deck && deck.folder === folder ? deck.style : await store.json(`${folder}/.style.json`);
    const theme = Object.assign({ background: '#0B0B0C', foreground: '#FFFFFF', accent: '#FFFFFF', font: 'system', align: 'left', titleScale: 1, bodyScale: 1, radius: 2 }, style && style.theme);
    const spec = { kind: slide.kind, title: slide.title || '', subtitle: slide.subtitle || '', body: slide.body || '', qr: slide.qr !== false, theme };
    const buttons = (slide.buttons || []).filter((b) => b.url).map((b) => ({ label: b.label || b.url, url: /:\/\//.test(b.url) ? b.url : 'https://' + b.url }));
    if (buttons.length) spec.buttons = buttons;
    const logoMode = (style && style.logo) || 'profile';
    if (slide.showLogo && logoMode !== 'none') {
      const logo = await store.src(logoMode === 'custom' ? `${folder}/.logo.png` : '.profile/default-logo.png');
      if (logo) spec.logo = logo;
    }
    const picture = (entry) => {
      const t = S.fileType(entry);
      if (t === 'image' || t === 'webImage') return store.src(`${folder}/${entry}`);
      return store.src(`${folder}/${S.posterPath(entry)}`);
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
        videos.push(t === 'video' || t === 'audio' ? await store.src(`${folder}/${entry}`) : null);
        if (t === 'live') {
          const l = await store.json(`${folder}/${entry}`); const tile = l && l.tiles && l.tiles[0];
          fits.push(tile && tile.fill ? 'cover' : 'contain');
          live.push(!!(tile && /^camera:/.test(tile.source)));
        } else { fits.push(null); live.push(false); }
      }
      spec.images = images;
      if (videos.some(Boolean)) spec.videos = videos;
      if (fits.some(Boolean)) spec.fits = fits;
      if (slide.edge && images.length === 1) spec.edge = S.fileType(slide.images[0]) === 'image' ? 'still' : 'media';
      spec._live = live;
    }
    const who = style && style.presenter === 'custom' && style.person ? style.person : profile;
    const photo = await store.src(style && style.presenter === 'custom' ? `${folder}/.presenter.jpg` : '.profile/profile-photo.jpg');
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
    const label = { website: 'Website', email: 'Email', phone: 'Phone', linkedin: 'LinkedIn', x: 'X', instagram: 'Instagram', github: 'GitHub', threads: 'Threads', bluesky: 'Bluesky' }[field] || field;
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
  async function draw(el, info, { page = 0, live = false, thumb = false } = {}) {
    const outer = el; el = document.createElement('div'); el.className = 'slidebox' + (thumb ? ' mini' : ''); outer.replaceChildren(el);
    const t = info.type;
    if (t === 'custom') {
      if (!info.spec) return card(el, info, 'This slide couldn’t be read.');
      await slideLibs();
      const host = document.createElement('div'); host.className = 'fvhost'; el.appendChild(host);
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
      img.onerror = () => card(el, info, 'This picture doesn’t open in a browser (HEIC and some others). It shows in FreeView.');
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
      try { const n = await drawPDF(el, info.url, page, thumb ? 1 : 1.5); info.pages = n; } catch { card(el, info, 'This PDF couldn’t be opened.'); }
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
      if (!thumb && info.href) { const a = document.createElement('a'); a.className = 'chip open'; a.href = info.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Open ' + hostOf(info.href); el.appendChild(a); }
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
    card(el, info, why);
  }
  function card(el, info, why, quiet) {
    el.replaceChildren();
    if (info.poster) { const img = new Image(); img.src = info.poster; img.className = 'dim'; el.appendChild(img); }
    const d = document.createElement('div'); d.className = 'appcard';
    d.innerHTML = `${ICON.device}<strong>${esc(info.name)}</strong>${quiet ? '' : `<span>${esc(why)}</span>`}`;
    el.appendChild(d);
  }
  const hostOf = (href) => { try { return new URL(href).hostname.replace(/^www\./, ''); } catch { return href || 'Website'; } };

  // ── library ──

  async function showLibrary() {
    deck = null; show('library');
    $('#crumb').textContent = '';
    renderLibrary();
  }
  async function renderLibrary() {
    const grid = $('#grid');
    const decks = store.decks();
    $('#empty').hidden = decks.length > 0 || !!store.loading;
    if (!decks.length && store.loading) {
      grid.replaceChildren(...Array.from({ length: 8 }, () => { const d = document.createElement('div'); d.className = 'deckcard ghost'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = '<div class="cover"></div><div class="meta"><span class="bar"></span><span class="bar short"></span></div>'; return d; }));
      return;
    }
    grid.replaceChildren(...decks.map((v) => {
      const { folder, entries } = store.deckOf(v);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'deckcard';
      b.innerHTML = `<div class="cover"></div><div class="meta"><strong>${esc(v.title)}</strong><span>${entries.length} slide${entries.length === 1 ? '' : 's'} · ${when(S.fromApple(v.date))}</span></div>`;
      b.onclick = () => openDeck(v.id);
      if (entries[0]) slideInfo(folder, entries[0]).then((info) => draw($('.cover', b), info, { thumb: true })).catch(() => {});
      return b;
    }));
  }
  function when(d) {
    const days = Math.round((Date.now() - d) / 864e5);
    if (days < 1) return 'today'; if (days < 2) return 'yesterday'; if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  }

  // ── a presentation ──

  async function openDeck(id, selected = 0) {
    const visit = store.visit(id); if (!visit) return showLibrary();
    const { folder, entries } = store.deckOf(visit);
    deck = { visit, folder, entries, selected: Math.min(selected, Math.max(0, entries.length - 1)), style: await store.json(`${folder}/.style.json`) };
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
    rail.replaceChildren(...deck.entries.map((entry, i) => {
      const b = document.createElement('div'); b.className = 'thumb' + (i === deck.selected ? ' on' : ''); b.tabIndex = 0; b.draggable = true;
      b.setAttribute('role', 'option'); b.setAttribute('aria-selected', i === deck.selected);
      b.innerHTML = `<span class="n">${i + 1}</span><div class="frame"></div>`;
      b.onclick = () => select(i);
      b.onkeydown = (e) => {
        if ((e.altKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) { e.preventDefault(); move(i, i - 1); }
        else if ((e.altKey || e.metaKey) && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) { e.preventDefault(); move(i, i + 1); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select(i - 1, true); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select(i + 1, true); }
        else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); removeSlide(i); }
      };
      b.ondragstart = (e) => { e.dataTransfer.setData('text/fv-slide', String(i)); e.dataTransfer.effectAllowed = 'move'; b.classList.add('dragging'); };
      b.ondragend = () => b.classList.remove('dragging');
      b.ondragover = (e) => { if (e.dataTransfer.types.includes('text/fv-slide')) { e.preventDefault(); b.classList.add('drop'); } };
      b.ondragleave = () => b.classList.remove('drop');
      b.ondrop = (e) => { b.classList.remove('drop'); const from = parseInt(e.dataTransfer.getData('text/fv-slide'), 10); if (Number.isInteger(from)) { e.preventDefault(); move(from, i); } };
      slideInfo(deck.folder, entry).then((info) => draw($('.frame', b), info, { thumb: true })).catch(() => {});
      return b;
    }));
    const add = document.createElement('button'); add.type = 'button'; add.className = 'thumb add'; add.innerHTML = ICON.plus + '<span>Add</span>';
    add.onclick = (e) => openAddMenu(e.currentTarget);
    rail.appendChild(add);
    $('#deck').classList.toggle('blank', deck.entries.length === 0);
  }
  function select(i, focus) {
    if (i < 0 || i >= deck.entries.length) return;
    deck.selected = i;
    $$('#rail .thumb').forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-selected', k === i); });
    const el = $$('#rail .thumb')[i]; if (el) { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); if (focus) el.focus(); }
    renderSelected();
  }
  async function move(from, to) {
    if (to < 0 || to >= deck.entries.length || from === to) return;
    const entries = deck.entries.slice(); const [e] = entries.splice(from, 1); entries.splice(to, 0, e);
    deck.entries = entries; deck.selected = to; renderRail(); renderSelected();
    $$('#rail .thumb')[to].focus();
    await work('Saving…', () => saveEntries(entries));
  }
  async function removeSlide(i) {
    const entries = deck.entries.slice(); const [gone] = entries.splice(i, 1);
    deck.entries = entries; deck.selected = Math.min(i, entries.length - 1); renderRail(); renderSelected();
    await work('Saving…', () => saveEntries(entries));
    // The file goes a moment later, so Undo can bring the slide back as it was.
    let undone = false;
    const timer = setTimeout(() => { if (!undone) store.deleteFile(`${deck.folder}/${gone}`).catch(() => {}); }, 6500);
    toast('Slide removed', { label: 'Undo', run: async () => {
      undone = true; clearTimeout(timer);
      const back = deck.entries.slice(); back.splice(i, 0, gone);
      deck.entries = back; deck.selected = i; renderRail(); renderSelected();
      await work('Saving…', () => saveEntries(back));
    } });
  }

  let selectedToken = 0;
  async function renderSelected() {
    const token = ++selectedToken;
    const canvas = $('#canvas'), panel = $('#inspector');
    if (!deck.entries.length) {
      canvas.innerHTML = `<div class="blankstate"><strong>Start with your photos, videos or a PDF</strong><span>Or make a Magic slide: a title, a few words and pictures, laid out for you.</span>
        <div class="row"><button type="button" class="btn primary" data-add="files">${ICON.plus} Add Files</button><button type="button" class="btn" data-add="magic">Magic Slide</button></div></div>`;
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
    const i = deck.selected;
    const head = `<div class="kind">${esc(info.label)}<span>${i + 1} of ${deck.entries.length}</span></div>`;
    const tail = `<div class="actions"><button type="button" class="btn ghost" data-act="up" ${i === 0 ? 'disabled' : ''}>Move Earlier</button><button type="button" class="btn ghost" data-act="down" ${i === deck.entries.length - 1 ? 'disabled' : ''}>Move Later</button>
      <button type="button" class="btn ghost danger" data-act="remove">${ICON.trash} Remove Slide</button></div>`;
    if (info.type === 'custom' && info.slide) {
      const s = info.slide, cover = s.kind === 'cover';
      panel.innerHTML = head + `
        <label class="field"><span>Title</span><input id="f-title" value="${esc(s.title)}" placeholder="${cover ? 'Presentation title' : 'Title'}" autocomplete="off"></label>
        ${cover ? `<label class="field"><span>Subtitle</span><input id="f-subtitle" value="${esc(s.subtitle)}" placeholder="A line under the title" autocomplete="off"></label>`
                : `<label class="field"><span>Text</span><textarea id="f-body" rows="5" placeholder="A few words. **Bold**, lists and links work.">${esc(s.body)}</textarea></label>`}
        ${cover ? '' : `<div class="field"><span>Pictures and videos <em>${(s.images || []).length} of 4</em></span><div class="media-list">${(s.images || []).map((m, k) => `
          <div class="media-item"><span class="mi-thumb" data-k="${k}"></span><span class="mi-name">${esc(mediaLabel(m))}</span><button type="button" class="icon-btn" data-drop="${k}" aria-label="Remove">${ICON.trash}</button></div>`).join('')}</div>
          <div class="row wrap">${(s.images || []).length < 4 ? `<button type="button" class="btn small" data-media="files">${ICON.plus} Photo or Video</button><button type="button" class="btn small" data-media="camera">${ICON.cam} Live Camera</button>` : ''}</div></div>
          <div class="field"><span>Text</span><div class="seg" role="radiogroup">${['left', 'center'].map((a) => `<button type="button" role="radio" aria-checked="${(s.align || 'left') === a}" data-align="${a}">${a === 'left' ? 'Left' : 'Centered'}</button>`).join('')}</div></div>`}
        ${tail}`;
      const save = debounce(() => saveCustom(info), 600);
      for (const [id, key] of [['#f-title', 'title'], ['#f-subtitle', 'subtitle'], ['#f-body', 'body']]) {
        const f = $(id, panel); if (!f) continue;
        f.oninput = () => { s[key] = f.value; info.spec && (info.spec[key] = f.value); redrawCanvas(info); save(); };
      }
      $$('[data-align]', panel).forEach((b) => b.onclick = () => { s.align = b.dataset.align; saveCustom(info, true); });
      $$('[data-drop]', panel).forEach((b) => b.onclick = () => { s.images.splice(+b.dataset.drop, 1); saveCustom(info, true); });
      $$('[data-media]', panel).forEach((b) => b.onclick = () => b.dataset.media === 'camera' ? addCameraTo(info) : pickFiles('image/*,video/*', (files) => addMediaTo(info, files)));
      $$('.mi-thumb', panel).forEach((t) => { const m = s.images[+t.dataset.k]; const u = S.fileType(m) === 'image' ? store.url(`${deck.folder}/${m}`) : store.url(`${deck.folder}/${S.posterPath(m)}`); if (u) t.style.backgroundImage = `url("${u}")`; });
    } else {
      const note = { image: '', webImage: '', video: '', audio: '', pdf: info.pages ? `${info.pages} page${info.pages === 1 ? '' : 's'}, each one a slide when you present.` : '', link: info.href ? `Shows ${hostOf(info.href)}.` : '' }[info.type];
      const appOnly = note === undefined;
      panel.innerHTML = head + `<div class="filename">${esc(info.name)}</div>` + (note ? `<p class="hint">${esc(note)}</p>` : '') +
        (appOnly ? `<div class="appnote">${ICON.device}<span>Edit this slide in FreeView on your Mac, iPhone or iPad. It stays as it is here and moves with the rest.</span></div>` : '') + tail;
    }
    $$('[data-act]', panel).forEach((b) => b.onclick = () => ({ up: () => move(i, i - 1), down: () => move(i, i + 1), remove: () => removeSlide(i) }[b.dataset.act]()));
  }
  const mediaLabel = (m) => { const t = S.fileType(m); return t === 'live' ? 'Live camera' : t === 'video' ? 'Video' : t === 'audio' ? 'Sound' : 'Photo'; };
  function debounce(fn, ms) { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; }
  async function redrawCanvas(info) {
    const box = $('#canvas > div'); if (!box || !info.spec) return;
    await draw(box, info, { live: !!cameraStream });
  }
  async function saveCustom(info, redraw) {
    await work('Saving…', async () => {
      await store.writeJSON(info.path, info.slide, true);
      infoCache.delete(info.path);
      if (redraw) { await renderSelected(); }
      const thumb = $$('#rail .thumb')[deck.selected];
      if (thumb) slideInfo(deck.folder, info.entry).then((x) => draw($('.frame', thumb), x, { thumb: true }));
      await saveEntries(deck.entries);   // bumps it in Recents
    });
  }

  // ── adding ──

  function pickFiles(accept, done) {
    const input = $('#picker'); input.accept = accept; input.value = '';
    input.onchange = () => { if (input.files.length) done([...input.files]); };
    input.click();
  }
  function openAddMenu(anchor) {
    const m = $('#addmenu');
    const r = anchor.getBoundingClientRect();
    m.style.left = Math.min(r.left, innerWidth - 260) + 'px';
    m.style.top = (r.bottom + 6 + 220 > innerHeight ? r.top - 6 - 212 : r.bottom + 6) + 'px';
    m.hidden = false; $('button', m).focus();
    const close = (e) => { if (!m.contains(e.target)) { m.hidden = true; document.removeEventListener('pointerdown', close, true); } };
    setTimeout(() => document.addEventListener('pointerdown', close, true));
  }
  function addAction(kind) {
    $('#addmenu').hidden = true;
    if (kind === 'files') pickFiles('image/*,video/*,audio/*,application/pdf,.pdf,.md,.key,.pptx,.usdz,.glb', addFiles);
    else if (kind === 'magic') addCustom('text');
    else if (kind === 'cover') addCustom('cover');
    else if (kind === 'camera') addCustom('text', true);
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
    await work(`Uploading ${files.length === 1 ? files[0].name : files.length + ' files'}…`, async () => {
      for (const file of files) {
        const entry = `${freeSlot() + done}/${S.cleanName(file.name)}`;
        busy(`Uploading ${done + 1} of ${files.length}…`);
        await store.putFile(`${deck.folder}/${entry}`, file);
        entries.splice(at++, 0, entry); done++;
      }
      await saveEntries(entries);
    });
    if (done) { deck.selected = at - 1; renderRail(); renderSelected(); }
  }
  function uniqueName(base) {
    const taken = new Set(store.pathsIn(deck.folder + '/').map((p) => p.slice(deck.folder.length + 1)).concat(deck.entries));
    let name = `${base}.fvslide`, n = 2;
    while (taken.has(name)) name = `${base} ${n++}.fvslide`;
    return name;
  }
  async function addCustom(kind, withCamera) {
    const entry = uniqueName(kind === 'cover' ? 'Cover' : 'Magic Slide');
    const slide = S.newCustomSlide(kind, kind === 'cover' ? { title: deck.visit.title } : { title: withCamera ? 'Live' : '' });
    await work('Adding…', async () => {
      if (withCamera) slide.images.push(await cameraMedia());
      await store.writeJSON(`${deck.folder}/${entry}`, slide, true);
      const entries = deck.entries.slice(); const at = deck.entries.length ? deck.selected + 1 : 0;
      entries.splice(at, 0, entry); await saveEntries(entries); deck.selected = at;
    });
    renderRail(); await renderSelected();
    const f = $('#f-title'); if (f) { f.focus(); f.select(); }
  }
  /** A live camera for a Magic slide: a .fvlive the apps show live too, with a poster from this camera. */
  async function cameraMedia() {
    const name = `.live-${S.shortID()}.fvlive`;
    let poster = null;
    try { await camera(false); poster = await frameOf(cameraStream); } catch { toast('The camera is off, so the slide shows a placeholder until it’s on.'); }
    await store.writeJSON(`${deck.folder}/${name}`, S.newCameraMedia(), true);
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
    await work('Uploading…', async () => {
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
  async function addCameraTo(info) {
    await work('Adding the camera…', async () => { info.slide.images.push(await cameraMedia()); });
    await saveCustom(info, true);
  }

  // ── presenting, recording and watching ──

  const P = { slides: [], index: 0, nodes: [], rec: null, watch: null };

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
    go(Math.min(from, P.slides.length - 1), true);
    if (record) startRecording();
    if (watch) startWatching(watch);
    $('#pclose').focus();
  }
  function go(n, jump) {
    if (n < 0 || n >= P.slides.length) return;
    const prev = P.nodes[P.index];
    P.index = n;
    [n, n + 1, n - 1].forEach((k) => { const s = P.slides[k], el = P.nodes[k]; if (s && !el.dataset.drawn) { el.dataset.drawn = '1'; const box = document.createElement('div'); el.appendChild(box); draw(box, s.info, { page: s.page, live: true }); } });
    P.nodes.forEach((el, k) => el.classList.toggle('on', k === n));
    if (prev && prev !== P.nodes[n]) $$('video, audio', prev).forEach((m) => { if (!m.srcObject) m.pause(); });
    $$('video:not(.live-cam), audio', P.nodes[n]).forEach((m) => { if (!m.srcObject) { m.muted = false; m.currentTime = 0; m.play().catch(() => { m.muted = true; m.play().catch(() => {}); }); } });
    $('#pcount').textContent = `${n + 1} / ${P.slides.length}`;
    if (P.rec && P.rec.started && !jump) P.rec.marks.push({ slide: n, time: +recTime().toFixed(3) });
  }
  function closePresent() {
    if (P.rec) return stopRecording();
    stopWatching();
    $('#present').hidden = true; document.body.classList.remove('presenting');
    $('#pstage').replaceChildren(); P.nodes = []; P.slides = [];
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (!cameraLiveInDeck()) stopCamera();
    renderSelected();
  }
  const cameraLiveInDeck = () => false;

  // Recording: the camera and microphone as one MP4 take, and the time each slide came on.
  function recordingType() {
    if (!window.MediaRecorder) return null;
    for (const t of ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4']) if (MediaRecorder.isTypeSupported(t)) return t;
    return null;
  }
  const recTime = () => P.rec ? (P.rec.paused ? P.rec.elapsed : P.rec.elapsed + (performance.now() - P.rec.t0) / 1000) : 0;
  async function startRecording() {
    const type = recordingType();
    if (!type) { toast('This browser can’t record video FreeView can play. Use Safari, or Chrome 126 or later.'); closePresent(); return; }
    let stream;
    try { stream = await camera(true); } catch { toast('FreeView needs your camera and microphone to record. Allow them in the address bar and try again.'); $('#present').classList.remove('recording'); return; }
    const bubble = $('#bubble'); bubble.srcObject = stream; bubble.hidden = false; bubble.play().catch(() => {});
    const count = $('#countdown'); count.hidden = false;
    for (const n of [3, 2, 1]) { count.textContent = n; await new Promise((r) => setTimeout(r, 800)); }
    count.hidden = true;
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 128_000 });
    P.rec = { rec, chunks: [], marks: [{ slide: P.index, time: 0 }], t0: performance.now(), elapsed: 0, started: true, type };
    rec.ondataavailable = (e) => { if (e.data.size) P.rec.chunks.push(e.data); };
    rec.start(1000);
    $('#pill').hidden = false;
    const tick = () => { if (!P.rec) return; $('#ptime').textContent = clock(recTime()); P.rec.raf = requestAnimationFrame(tick); };
    tick();
  }
  async function stopRecording() {
    const r = P.rec; if (!r) return;
    cancelAnimationFrame(r.raf);
    const duration = recTime();
    await new Promise((ok) => { r.rec.onstop = ok; r.rec.stop(); });
    P.rec = null; $('#pill').hidden = true; $('#bubble').hidden = true; $('#bubble').srcObject = null;
    $('#present').classList.remove('recording');
    stopCamera();
    closePresent();
    const take = new Blob(r.chunks, { type: r.type.split(';')[0] });
    const id = S.uuid();
    const layout = { baseTemplateID: 'bubble:farAlongFarAcross', switches: [] };
    const commentary = { version: 1, id, recordedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), duration: +duration.toFixed(3), slideCount: 0,
      entries: deck.entries.slice(), marks: r.marks, recordedLayout: layout, layout, layoutChosen: false, events: [], clips: [] };
    commentary.slideCount = (await expand()).length;
    await work(`Saving your commentary (${(take.size / 1e6).toFixed(1)} MB)…`, async () => {
      const dir = `${deck.folder}/.commentary-${id}`;
      await store.putFile(`${dir}/take.mov`, take);   // the apps look for take.mov; MP4 inside plays the same
      await store.writeJSON(`${dir}/commentary.json`, commentary, true);
      await saveEntries(deck.entries);
      toast('Commentary saved. It’s in FreeView on your other devices too.');
    });
    renderCommentary();
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
      if (!best || (c.recordedAt || '') > (best.recordedAt || '')) best = Object.assign(c, { take });
    }
    return best;
  }
  async function renderCommentary() {
    const c = deck && await latestCommentary();
    const b = $('#watchbtn');
    b.hidden = !c;
    if (c) $('span', b).textContent = `Watch Commentary · ${clock(c.duration || 0)}`;
  }
  function startWatching(c) {
    const v = $('#bubble'); v.srcObject = null; v.src = c.take; v.hidden = false; v.muted = false;
    P.watch = c;
    const marks = c.marks.slice().sort((a, b) => a.time - b.time);
    const at = (t) => { let n = marks[0].slide; for (const m of marks) if (m.time <= t + 0.001) n = m.slide; else break; return n; };
    const tick = () => { if (!P.watch) return; const n = at(v.currentTime); if (n !== P.index) go(n, true); $('#ptime').textContent = clock(v.currentTime); P.watch.raf = requestAnimationFrame(tick); };
    v.onended = () => toast('That’s the end of the commentary.');
    v.play().then(tick).catch(() => { v.muted = true; v.play().then(tick); });
    $('#pill').hidden = false;
  }
  function stopWatching() {
    if (!P.watch) return;
    cancelAnimationFrame(P.watch.raf); P.watch = null;
    const v = $('#bubble'); v.pause(); v.removeAttribute('src'); v.load(); v.hidden = true; $('#pill').hidden = true;
  }

  // ── wiring ──

  function wire() {
    $('#newdeck').onclick = $('#newdeck2').onclick = async () => {
      const v = await work('Creating…', () => store.newDeck('Untitled Presentation'));
      if (v) { await openDeck(v.id); $('#title').focus(); $('#title').select(); }
    };
    $('#home').onclick = (e) => { e.preventDefault(); if (store) showLibrary(); };
    $('#backbtn').onclick = () => showLibrary();
    $('#title').onchange = () => { const t = $('#title').value.trim() || 'Untitled Presentation'; $('#title').value = t; $('#crumb').textContent = t; work('Saving…', () => saveEntries(deck.entries, t)); };
    $('#title').onkeydown = (e) => { if (e.key === 'Enter') e.target.blur(); };
    $('#addbtn').onclick = (e) => openAddMenu(e.currentTarget);
    $$('#addmenu [data-add]').forEach((b) => b.onclick = () => addAction(b.dataset.add));
    $('#presentbtn').onclick = () => present({ from: deck.selected });
    $('#recordbtn').onclick = () => present({ from: 0, record: true });
    $('#watchbtn').onclick = async () => { const c = await latestCommentary(); if (c) present({ from: c.marks[0].slide, watch: c }); };
    $('#pclose').onclick = closePresent;
    $('#pstop').onclick = () => (P.rec ? stopRecording() : closePresent());
    $('#pprev').onclick = () => go(P.index - 1);
    $('#pnext').onclick = () => go(P.index + 1);
    $('#pstage').onclick = (e) => { if (P.watch || e.target.closest('a, button, video[controls], .fv .media img')) return; go(P.index + (e.clientX < innerWidth / 3 ? -1 : 1)); };
    document.addEventListener('keydown', (e) => {
      if ($('#present').hidden) { if (e.key === 'Escape') $('#addmenu').hidden = true; return; }
      if (P.watch && (e.key === ' ')) { e.preventDefault(); const v = $('#bubble'); v.paused ? v.play() : v.pause(); return; }
      if (P.watch) { if (e.key === 'Escape') closePresent(); return; }
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
  }

  async function start() {
    wire();
    const demo = new URLSearchParams(location.search).has('demo');
    if (demo) {
      store = new S.DemoStore(); await store.seed();
      $('#modebadge').hidden = false;
      return enter();
    }
    show('welcome');
    store = new S.CloudStore();
    $('#signout').onclick = () => { const apple = $('#apple-sign-out-button .apple-auth-button') || $('#apple-sign-out-button > *'); if (apple) apple.click(); };
    // Our button opens CloudKit's sign-in window through CloudKit's own (hidden) button.
    $('#signin').onclick = () => {
      const apple = $('#apple-sign-in-button .apple-auth-button') || $('#apple-sign-in-button > *');
      if (apple) { apple.click(); return; }
      $('#signin').setAttribute('aria-busy', 'true'); toast('Connecting to iCloud… try again in a moment.');
      setTimeout(() => $('#signin').removeAttribute('aria-busy'), 1500);
    };
    try {
      await store.auth({ signIn: 'apple-sign-in-button', signOut: 'apple-sign-out-button', onSignedOut: () => location.reload() });
      $('#account').hidden = false;
      // The library shows at once and fills in as iCloud sends it (a big one takes a few pages).
      busy('Loading your library…');
      const loading = store.sync((n) => busy(n ? `Loading your library… ${n} presentation${n === 1 ? '' : 's'}` : 'Loading your library…'));
      await enter();
      await loading.catch((e) => { console.error(e); toast('iCloud didn’t send everything. Reload to try again.'); });
      busy('');
      if (!deck) { const m = /deck=([0-9A-F-]+)/i.exec(location.hash); if (m && store.visit(m[1])) openDeck(m[1]); else renderLibrary(); }
    } catch (e) {
      console.error(e);
      $('#welcome-error').hidden = false; $('#welcome-error').textContent = 'iCloud couldn’t be reached. Check your connection and reload.';
    }
  }
  async function enter() {
    profile = await store.json('.profile/profile.json');
    store.onChange(debounce(() => { if (!deck && $('#library').hidden === false) renderLibrary(); }, 200));
    const m = /deck=([0-9A-F-]+)/i.exec(location.hash);
    if (m && store.visit(m[1])) openDeck(m[1]); else showLibrary();
  }
  start();
})();
