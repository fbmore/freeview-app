/* FreeView web editor: the library, read and written in the apps' own format.
 *
 * The apps sync a library through the person's private CloudKit database (CloudSync.swift), zone
 * `Library`. The web editor reads and writes those same records, so what's made here shows up on their
 * iPhone, iPad and Mac, and the other way round:
 *   Item  `i-<VISIT UUID>`  visit (Bytes: the Visit as JSON, sorted keys, date in seconds since 2001), modified
 *   File  `f-<sha256(path)>` path ("<FOLDER UUID>/<entry>"), asset, size, modified, sha (sha256 of the bytes)
 * A presentation is a Visit {id, title, date, kind: {deck: {folder, entries}}}; entries are paths in
 * its folder, in slide order ("0/photo.jpg", "Magic Slide 2.fvslide"). Hidden files beside them hold
 * the style (.style.json), Magic-slide media (.picture-xxxxxxxx.jpg), posters (..picture-….jpg.poster.jpg),
 * live sources (.live-xxxxxxxx.fvlive) and commentaries (.commentary-<UUID>/commentary.json + take.mov).
 *
 * Two stores share one interface: CloudStore (CloudKit JS, signed in with Apple) and DemoStore (in
 * memory, for trying the editor without an account).
 */
(function () {
  'use strict';

  const CONTAINER = 'iCloud.com.fbmore.freeview';
  // Development until the Library record types are deployed to Production (the apps sync only in
  // Debug builds today). The Production token is limited to freeview.app.
  const ENVIRONMENT = 'development';
  const API_TOKEN = '5e1d560dfe41765d17f2038ce3de8596787149ef30f7132dd5a190c7f9db2f0e';
  const ZONE = { zoneName: 'Library' };

  // iCloud's upload host (…icloud-content.com/…/singleFileUpload) only lets www.icloud.com read its
  // replies, so CloudKit JS's asset uploads fail anywhere else ("NETWORK_ERROR"). Those requests go
  // through the FreeView Worker instead, which passes the bytes on to iCloud and keeps nothing.
  const WORKER = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has('localworker')
    ? 'http://localhost:8787' : 'https://freeview-views.fbmore.workers.dev';
  const UPLOAD_PROXY = `${WORKER}/ck-upload`;
  (function routeUploads() {
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      const u = String(url);
      if (/^POST$/i.test(method) && /^https:\/\/[^/]*icloud-content\.com(:\d+)?\/.*Upload/i.test(u)) url = `${UPLOAD_PROXY}?u=${encodeURIComponent(u)}`;
      return open.call(this, method, url, ...rest);
    };
  })();

  // ── format helpers ──

  /** JSON with keys sorted at every level, as the apps' encoders write it. */
  function sortedJSON(value, pretty) {
    const sort = (v) => {
      if (Array.isArray(v)) return v.map(sort);
      if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v).sort()) if (v[k] !== undefined) o[k] = sort(v[k]); return o; }
      return v;
    };
    return JSON.stringify(sort(value), null, pretty ? 2 : 0);
  }
  const uuid = () => crypto.randomUUID().toUpperCase();
  const shortID = () => crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  /** Swift's default Date encoding: seconds since 1 January 2001. */
  const appleNow = () => Date.now() / 1000 - 978307200;
  const fromApple = (s) => new Date((s + 978307200) * 1000);

  async function sha256(data) {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(await data.arrayBuffer());
    const d = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  function toBase64(text) {
    const bytes = new TextEncoder().encode(text); let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function fromBase64(b64) {
    const s = atob(b64), bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  const EXT = {
    image: ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'tif', 'tiff', 'bmp', 'avif'],
    webImage: ['gif', 'svg', 'svgz'],
    video: ['mp4', 'mov', 'm4v', 'webm'],
    audio: ['m4a', 'mp3', 'wav', 'aac', 'aiff', 'caf'],
    pdf: ['pdf'],
    custom: ['fvslide'],
    live: ['fvlive'],
    link: ['url', 'webloc'],
    markdown: ['md', 'markdown', 'mdown', 'mkd'],
    model3D: ['usdz', 'usd', 'usda', 'usdc', 'obj', 'stl', 'ply', 'abc', 'dae', 'scn', 'glb', 'gltf'],
    office: ['key', 'pptx', 'ppt', 'pps', 'ppsx', 'docx', 'doc', 'pages', 'numbers'],
    sheet: ['csv', 'tsv', 'xlsx', 'xls'],
    webarchive: ['webarchive'],
  };
  function fileType(path) {
    const name = path.split('/').pop().toLowerCase();
    if (name.endsWith('.lottie') || name.endsWith('.lottie.json')) return 'lottie';
    const ext = name.includes('.') ? name.split('.').pop() : '';
    for (const [type, list] of Object.entries(EXT)) if (list.includes(ext)) return type;
    return 'other';
  }
  /** The picture the apps keep beside a file that isn't one: `.<name>.poster.jpg` in the same folder. */
  function posterPath(entry) {
    const i = entry.lastIndexOf('/');
    return (i >= 0 ? entry.slice(0, i + 1) : '') + '.' + entry.slice(i + 1) + '.poster.jpg';
  }
  const baseName = (p) => p.split('/').pop();
  /** A file name the apps (and every file system) accept. */
  function cleanName(name) {
    const n = name.normalize('NFC').replace(/[\/\\:\u0000-\u001f]/g, '-').replace(/^\.+/, '').trim();
    return n || 'file';
  }

  /** A new Magic slide or cover, with every key the apps need to read it (their decoder has no defaults). */
  function newCustomSlide(kind, fields) {
    return Object.assign({
      kind, title: '', subtitle: '', body: '', images: [],
      showLogo: true, showName: kind === 'cover', showPhoto: false, showRole: false,
      contacts: [], qr: true,
    }, fields || {});
  }
  /** A camera as one of a Magic slide's media: live wherever it's shown (the browser's own camera here). */
  function newCameraMedia() {
    return { media: true, tiles: [{ id: uuid(), source: 'camera:front', name: '', app: '', bundle: '', title: '', fill: true, device: false, sound: true }] };
  }

  // ── the file cache: by content, in the browser's private file system ──
  //
  // iCloud's download addresses expire, but each File record carries `sha` (the bytes' SHA-256), so a
  // file is kept under its sha: unchanged files are never downloaded twice, a changed file is a new sha.
  // What's uploaded from here goes in at once. Big videos play from iCloud the first time while they're
  // copied in the background (a <video> needs range requests, which a half-fetched copy can't answer).
  // Least recently used files go first once the cache passes its cap.
  class FileCache {
    constructor() {
      this.urls = new Map();       // sha → object URL (this page's lifetime)
      this.pending = new Map();    // sha → Promise
      this.queue = []; this.running = 0;
      this.ready = (async () => {
        if (!navigator.storage || !navigator.storage.getDirectory) return null;
        try {
          const root = await navigator.storage.getDirectory();
          this.dir = await root.getDirectoryHandle('fv-files', { create: true });
          if (navigator.storage.persist) navigator.storage.persist().catch(() => {});
          const est = navigator.storage.estimate ? await navigator.storage.estimate() : {};
          this.cap = Math.min(2e9, (est.quota || 4e9) * 0.5);
          try { this.index = JSON.parse(localStorage.getItem('fv-cache') || '{}'); } catch { this.index = {}; }
          return this.dir;
        } catch { return null; }
      })();
    }
    touch(sha, size) { this.index[sha] = { size: size || (this.index[sha] && this.index[sha].size) || 0, used: Date.now() }; this.saveIndex(); }
    saveIndex() { clearTimeout(this.t); this.t = setTimeout(() => { try { localStorage.setItem('fv-cache', JSON.stringify(this.index)); } catch {} }, 500); }
    /** An object URL for a cached file, or null. */
    async get(sha) {
      if (!sha) return null;
      if (this.urls.has(sha)) { this.touch(sha); return this.urls.get(sha); }
      if (!await this.ready) return null;
      try {
        const file = await (await this.dir.getFileHandle(sha)).getFile();
        if (!file.size) return null;
        const url = URL.createObjectURL(file); this.urls.set(sha, url); this.touch(sha, file.size);
        return url;
      } catch { return null; }
    }
    async put(sha, blob) {
      if (!sha || !await this.ready) return;
      try {
        const handle = await this.dir.getFileHandle(sha, { create: true });
        const w = await handle.createWritable(); await w.write(blob); await w.close();
        this.touch(sha, blob.size); this.evict();
      } catch {}
    }
    /** Copies a file in from iCloud when there's a moment (a few at a time). */
    fetchLater(sha, url, size) {
      if (!sha || !url || this.pending.has(sha) || this.urls.has(sha)) return;
      if (size && this.cap && size > this.cap / 4) return;   // too big to be worth keeping
      const p = new Promise((ok) => this.queue.push(async () => {
        try { const r = await fetch(url); if (r.ok) await this.put(sha, await r.blob()); } catch {}
        ok();
      }));
      this.pending.set(sha, p); this.pump();
    }
    pump() {
      while (this.running < 2 && this.queue.length) {
        const job = this.queue.shift(); this.running++;
        const run = () => job().finally(() => { this.running--; this.pump(); });
        (window.requestIdleCallback || setTimeout)(run);
      }
    }
    async evict() {
      const entries = Object.entries(this.index);
      let total = entries.reduce((s, [, v]) => s + (v.size || 0), 0);
      if (!this.cap || total <= this.cap) return;
      entries.sort((a, b) => a[1].used - b[1].used);
      for (const [sha, v] of entries) {
        if (total <= this.cap * 0.85) break;
        if (this.urls.has(sha)) continue;   // in use on this page
        try { await this.dir.removeEntry(sha); } catch {}
        delete this.index[sha]; total -= v.size || 0;
      }
      this.saveIndex();
    }
  }

  // ── the library in memory, whichever store fills it ──

  class Library {
    constructor() {
      this.items = new Map();   // visit id → { visit, tag }
      this.links = new Map();   // record name → { link, thumb }
      this.files = new Map();   // path → { url, size, modified, tag, blob? }
      this.listeners = new Set();
      this.cache = new Map();   // path → parsed JSON / text
    }
    onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    changed() { for (const fn of this.listeners) fn(); }

    decks() {
      return [...this.items.values()].map((i) => i.visit)
        .filter((v) => v.kind && (v.kind.deck || v.kind.file))
        .sort((a, b) => b.date - a.date);
    }
    /** As the app's Home: everything with Pro; on Free every single file and the three most recent
     *  presentations. `pro` null (not known) shows everything. */
    visibleDecks(pro) {
      if (pro !== false) return this.decks();
      let n = 0;
      return this.decks().filter((v) => !v.kind.deck || ++n <= FREE_PRESENTATIONS);
    }
    visit(id) { const i = this.items.get(id); return i && i.visit; }
    /** A presentation's folder and slides; a single file reads as a deck of one. */
    deckOf(visit) {
      if (visit.kind.deck) return { folder: visit.kind.deck.folder, entries: visit.kind.deck.entries.slice() };
      return { folder: visit.kind.file.folder, entries: [visit.kind.file.entry] };
    }
    has(path) { return this.files.has(path); }
    url(path) { const f = this.files.get(path); return f ? (f.local || f.url) : ''; }
    /** The best address for a file: the cached copy if there is one; else iCloud's (copied in for next time). */
    async src(path) {
      const f = this.files.get(path); if (!f) return '';
      if (f.local) return f.local;
      if (this.fileCache && f.sha) {
        const local = await this.fileCache.get(f.sha);
        if (local) { f.local = local; return local; }
        this.fileCache.fetchLater(f.sha, f.url, f.size);
      }
      return f.url;
    }
    async text(path) {
      if (this.cache.has(path)) return this.cache.get(path);
      const f = this.files.get(path); if (!f) return null;
      const text = f.blob ? await f.blob.text() : await fetch(await this.src(path)).then((r) => (r.ok ? r.text() : null)).catch(() => null);
      if (text != null) this.cache.set(path, text);
      return text;
    }
    async json(path) { const t = await this.text(path); try { return t == null ? null : JSON.parse(t); } catch { return null; } }
    /** Every file in a folder (hidden ones too), for finding commentaries. */
    pathsIn(prefix) { return [...this.files.keys()].filter((p) => p.startsWith(prefix)); }

    async writeJSON(path, value, pretty) {
      const text = sortedJSON(value, pretty);
      this.cache.set(path, text);
      await this.putFile(path, new Blob([text], { type: 'application/json' }));
    }
    /** Saves a presentation's slide order and title (and bumps it to the top of Recents). */
    async saveDeck(visit, entries, title) {
      const v = JSON.parse(JSON.stringify(visit));
      if (v.kind.file) v.kind = { deck: { folder: v.kind.file.folder, entries } };
      else v.kind.deck.entries = entries;
      if (title != null && title !== v.title) { v.title = title; v.renamed = true; }
      v.date = appleNow();
      await this.putVisit(v);
      return v;
    }
    async newDeck(title) {
      const v = { id: uuid(), title: title || 'Untitled Presentation', date: appleNow(), kind: { deck: { folder: uuid(), entries: [] } } };
      await this.putVisit(v);
      return v;
    }
  }

  // ── CloudKit: the person's own iCloud ──

  class CloudStore extends Library {
    constructor() { super(); this.kind = 'cloud'; this.token = null; this.fileCache = new FileCache(); }

    static load() {
      return new Promise((ok, fail) => {
        if (window.CloudKit) return ok();
        window.addEventListener('cloudkitloaded', ok, { once: true });
        const s = document.createElement('script');
        s.src = 'https://cdn.apple-cloudkit.com/ck/2/cloudkit.js'; s.async = true; s.onerror = () => fail(new Error('CloudKit could not load.'));
        document.head.appendChild(s);
      });
    }
    /** Sets up Sign in with Apple; resolves with the user once they're signed in. */
    async auth({ signIn, signOut, onSignedOut }) {
      await CloudStore.load();
      CloudKit.configure({ containers: [{
        containerIdentifier: CONTAINER, environment: ENVIRONMENT,
        apiTokenAuth: { apiToken: API_TOKEN, persist: true,
          signInButton: { id: signIn, theme: 'white-with-outline' }, signOutButton: { id: signOut, theme: 'black' } },
      }] });
      this.container = CloudKit.getDefaultContainer();
      this.db = this.container.privateCloudDatabase;
      const user = await this.container.setUpAuth();
      this.container.whenUserSignsOut().then(() => onSignedOut && onSignedOut());
      return user || this.container.whenUserSignsIn();
    }

    /** Pro, as the app sees it: the Worker asks iCloud whose sign-in this is, then RevenueCat (the app
     *  logs in there with the same iCloud user). true / false, or null when it couldn't be checked. */
    async checkPro() {
      const auth = this.container && this.container._auth;
      const token = auth && auth._ckSession;
      if (!token) return null;
      try {
        const r = await fetch(`${WORKER}/pro`, { method: 'POST', body: JSON.stringify({ token, env: ENVIRONMENT }) });
        const j = await r.json();
        // iCloud may hand back a fresh sign-in token; keep using the newest.
        if (j.token && j.token !== token && typeof auth._setSession === 'function') auth._setSession(j.token);
        return typeof j.pro === 'boolean' ? j.pro : null;
      } catch { return null; }
    }

    /** Everything in the Library zone (then only what changed, on later calls). */
    /** `onPage` hears after each page, so a big library shows as it arrives. */
    async sync(onPage) {
      let more = true;
      this.loading = true;
      while (more) {
        const res = await this.db.fetchRecordZoneChanges({ zoneID: ZONE, syncToken: this.token || undefined, resultsLimit: 200 });
        if (res.hasErrors) {
          const e = res.errors[0];
          if (e.ckErrorCode === 'ZONE_NOT_FOUND') { await this.db.saveRecordZones([ZONE]); this.token = null; return this.changed(); }
          throw e;
        }
        const zone = res.zones[0];
        for (const r of zone.records) this.take(r);
        this.token = zone.syncToken; more = zone.moreComing;
        if (onPage) onPage(this.decks().length);
        if (more) this.changed();
      }
      this.loading = false;
      this.changed();
    }
    take(r) {
      const f = r.fields || {};
      if (r.recordType === 'Item' || r.recordName.startsWith('i-')) {
        const id = r.recordName.slice(2);
        if (r.deleted) return this.items.delete(id);
        try { this.items.set(id, { visit: JSON.parse(fromBase64(f.visit.value)), tag: r.recordChangeTag }); } catch {}
      } else if (r.recordType === 'Link' || r.recordName.startsWith('l-')) {
        const name = r.recordName.slice(2);
        if (r.deleted) return this.links.delete(name);
        try {
          const t = f.thumb && f.thumb.value;
          this.links.set(name, { link: JSON.parse(fromBase64(f.link.value)), thumb: t && t.downloadURL ? t.downloadURL.replace('${f}', 'thumb.jpg') : '' });
        } catch {}
      } else if (r.recordType === 'File' || r.recordName.startsWith('f-')) {
        if (r.deleted) { for (const [p, v] of this.files) if (v.name === r.recordName) { this.files.delete(p); this.cache.delete(p); } return; }
        const path = f.path && f.path.value; if (!path) return;
        const a = f.asset && f.asset.value;
        const url = a && a.downloadURL ? a.downloadURL.replace('${f}', encodeURIComponent(baseName(path))) : '';
        const old = this.files.get(path);
        const sha = f.sha && f.sha.value;
        if (old && old.tag !== r.recordChangeTag) this.cache.delete(path);
        this.files.set(path, { name: r.recordName, url, sha, size: f.size && f.size.value, modified: f.modified && f.modified.value, tag: r.recordChangeTag,
          local: old && old.sha && old.sha === sha ? old.local : undefined });
      }
    }

    async save(record) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const res = await this.db.saveRecords([record], { zoneID: ZONE });
        if (!res.hasErrors) return res.records[0];
        const e = res.errors[0];
        if (attempt === 0 && (e.ckErrorCode === 'CONFLICT' || e.ckErrorCode === 'SERVER_RECORD_CHANGED' || e.ckErrorCode === 'EXISTS')) {
          // Changed elsewhere since we read it: write over it with its latest change tag (newest wins, as in the apps).
          const got = await this.db.fetchRecords([record.recordName], { zoneID: ZONE });
          const server = got.records && got.records[0];
          record.recordChangeTag = server && !server.deleted ? server.recordChangeTag : undefined;
          continue;
        }
        if (e.ckErrorCode === 'ZONE_NOT_FOUND' && attempt === 0) { await this.db.saveRecordZones([ZONE]); continue; }
        throw e;
      }
    }
    async putFile(path, blob) {
      const name = 'f-' + await sha256(path);
      const old = this.files.get(path);
      const sha = await sha256(blob);
      const r = await this.save({
        recordName: name, recordType: 'File', recordChangeTag: old && old.tag, zoneID: ZONE,
        fields: { path: { value: path }, asset: { value: blob }, size: { value: blob.size }, modified: { value: Date.now() }, sha: { value: sha } },
      });
      this.cache.delete(path);
      this.take(r);
      // What was uploaded from here is shown from here, and kept: it's never downloaded back.
      const f = this.files.get(path);
      if (f) { f.sha = sha; f.local = URL.createObjectURL(blob); this.fileCache.urls.set(sha, f.local); }
      this.fileCache.put(sha, blob);
      this.changed();
    }
    async deleteFile(path) {
      const f = this.files.get(path); if (!f) return;
      const res = await this.db.deleteRecords([f.name], { zoneID: ZONE });
      if (res.hasErrors && res.errors[0].ckErrorCode !== 'NOT_FOUND') throw res.errors[0];
      this.files.delete(path); this.cache.delete(path); this.changed();
    }
    async putVisit(visit) {
      const old = this.items.get(visit.id);
      const r = await this.save({
        recordName: 'i-' + visit.id, recordType: 'Item', recordChangeTag: old && old.tag, zoneID: ZONE,
        fields: { visit: { value: toBase64(sortedJSON(visit)) }, modified: { value: Date.now() } },
      });
      this.items.set(visit.id, { visit, tag: r.recordChangeTag });
      this.changed();
    }
    /** Removes a presentation and its folder: on the apps, deleting the Item removes the folder too. */
    async deleteDeck(visit) {
      const { folder } = this.deckOf(visit);
      const names = this.pathsIn(folder + '/').map((p) => this.files.get(p).name);
      for (let i = 0; i < names.length; i += 200) await this.db.deleteRecords(names.slice(i, i + 200), { zoneID: ZONE });
      await this.db.deleteRecords(['i-' + visit.id], { zoneID: ZONE });
      for (const p of this.pathsIn(folder + '/')) this.files.delete(p);
      this.items.delete(visit.id); this.changed();
    }
  }

  // ── a library in memory, to try the editor without signing in ──

  class DemoStore extends Library {
    constructor() { super(); this.kind = 'demo'; }
    async putFile(path, blob) {
      const old = this.files.get(path); if (old && old.url) URL.revokeObjectURL(old.url);
      this.cache.delete(path);
      this.files.set(path, { url: URL.createObjectURL(blob), size: blob.size, modified: Date.now(), blob });
      this.changed();
    }
    async deleteFile(path) { this.files.delete(path); this.cache.delete(path); this.changed(); }
    async putVisit(visit) { this.items.set(visit.id, { visit }); this.changed(); }
    async deleteDeck(visit) { const { folder } = this.deckOf(visit); for (const p of this.pathsIn(folder + '/')) this.files.delete(p); this.items.delete(visit.id); this.changed(); }
    async sync() {}

    /** A small sample presentation: a cover, two photos and a Magic slide. */
    async seed() {
      const picture = (w, h, a, b, label) => new Promise((ok) => {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.fillStyle = 'rgba(255,255,255,.9)'; x.font = `600 ${Math.round(h / 9)}px -apple-system, system-ui, sans-serif`;
        x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, w / 2, h / 2);
        c.toBlob(ok, 'image/jpeg', 0.88);
      });
      const v = await this.newDeck('Spring Launch');
      const f = v.kind.deck.folder;
      await this.putFile(`${f}/0/Studio.jpg`, await picture(1600, 1000, '#2b5876', '#4e4376', 'Studio'));
      await this.putFile(`${f}/1/Market.jpg`, await picture(1600, 1000, '#f2994a', '#eb5757', 'Market'));
      const pic = `.picture-${shortID()}.jpg`;
      await this.putFile(`${f}/${pic}`, await picture(1200, 900, '#11998e', '#38ef7d', 'Garden'));
      await this.writeJSON(`${f}/Cover.fvslide`, newCustomSlide('cover', { title: 'Spring Launch', subtitle: 'What we are making this season' }), true);
      await this.writeJSON(`${f}/Magic Slide.fvslide`, newCustomSlide('text', { title: 'Three new rooms', body: 'Each one opens in **April**, with tours every weekend.', images: [pic] }), true);
      await this.saveDeck(v, ['Cover.fvslide', '0/Studio.jpg', 'Magic Slide.fvslide', '1/Market.jpg']);
    }
  }

  const FREE_PRESENTATIONS = 3;
  window.FVStore = {
    CloudStore, DemoStore, sortedJSON, uuid, shortID, appleNow, fromApple, sha256, fileType, posterPath,
    baseName, cleanName, newCustomSlide, newCameraMedia,
  };
})();
