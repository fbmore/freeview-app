/* FreeView on the web in the visitor's language: the shared-link viewer (view.html), the Magic-slide
 * renderer (fvslide.js) and the web editor (edit.html, edit.js). English is the source; a string without
 * a translation shows in English. Spanish, French, Italian and Brazilian Portuguese reuse the apps' own
 * translations (FreeView/Support/Localizable.xcstrings) wherever the web says the same thing, in the
 * apps' register (tú, vous, tu, você).
 *
 *   FVI18N.t('English text {name}', { name })        a string, with {placeholders} filled in
 *   FVI18N.n(count, '{n} slide', '{n} slides', vars)  the singular or plural, by the language's rules
 *   FVI18N.date(d, options)                           a date in the language (toLocaleDateString)
 *   FVI18N.apply(root)                                translates static markup: text, aria-label, title,
 *                                                     placeholder and alt that match a source string
 *
 * The language: ?lang=en|es|fr|it|pt-BR when given, else the one picked on freeview.app (localStorage fv-lang),
 * else the first of the browser's preferred languages
 * that the web speaks (es*, fr*, it*, en*, or any Portuguese → pt-BR), else English. <html lang> follows.
 */
(function () {
  'use strict';

  // ── the languages: one dictionary each, keyed by the English source string. To add one (es, fr, it…),
  //    give it a dictionary here and a line in LANGS: the browser's base language → the tag used.
  // Each language's strings are their own file (/i18n/<lang>.js), so a visitor downloads only theirs. It's
  // written in while the page is still parsing, so it runs before the scripts that follow this one.
  const DICTS = { es: 1, fr: 1, it: 1, 'pt-BR': 1 };
  const LANGS = { en: 'en', es: 'es', fr: 'fr', it: 'it', pt: 'pt-BR' };
  const SUPPORTED = LANGS;
  function pick() {
    let asked = null;
    try { asked = new URLSearchParams(location.search).get('lang'); } catch {}
    if (asked && DICTS[asked]) return asked;
    if (asked === 'en') return 'en';
    // The language picked on freeview.app (the home page's picker or footer), remembered on this device.
    let chosen = null;
    try { chosen = localStorage.getItem('fv-lang'); } catch {}
    if (chosen === 'en' || DICTS[chosen]) return chosen;
    const wants = asked ? [asked] : (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']);
    for (const l of wants) { const base = String(l || '').toLowerCase().split(/[-_]/)[0]; if (SUPPORTED[base]) return SUPPORTED[base]; }
    return 'en';
  }
  const lang = pick();
  if (lang !== 'en' && document.readyState === 'loading') document.write(`<script src="/i18n/${lang}.js?v=6"><\/script>`);
  const dictOf = () => (window.FVI18N_DICTS || {})[lang] || null;
  // English keeps the browser's own date and number formats, as before; the others use their language's.
  const locale = lang === 'en' ? undefined : lang;
  document.documentElement.lang = lang;

  const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s);
  function t(en, vars) {
    const dict = dictOf();
    const s = dict && Object.prototype.hasOwnProperty.call(dict, en) ? dict[en] : en;
    return fill(s, vars);
  }
  const rules = (() => { try { return new Intl.PluralRules(lang); } catch { return null; } })();
  function n(count, one, other, vars) {
    const form = rules ? rules.select(count) : (count === 1 ? 'one' : 'other');
    return t(form === 'one' ? one : other, Object.assign({ n: count }, vars));
  }
  const date = (d, opts) => new Date(d).toLocaleDateString(locale, opts);
  const dateTime = (d, opts) => new Date(d).toLocaleString(locale, opts);
  /** A number with a fixed count of decimals: 1.5 in English, 1,5 in Portuguese. */
  const fixed = (x, digits) => (lang === 'en' ? Number(x).toFixed(digits) : Number(x).toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }));

  /** Static markup: a text node or attribute whose (trimmed) text is a source string. */
  function apply(root) {
    const dict = dictOf();
    if (!dict) return;
    root = root || document.body;
    if (document.title && dict[document.title]) document.title = dict[document.title];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => (node.parentNode && /^(SCRIPT|STYLE)$/.test(node.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    for (const node of texts) {
      const raw = node.nodeValue, key = raw.trim();
      if (key && Object.prototype.hasOwnProperty.call(dict, key)) node.nodeValue = raw.replace(key, dict[key]);
    }
    for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) {
      root.querySelectorAll(`[${attr}]`).forEach((el) => {
        const v = el.getAttribute(attr);
        if (v && Object.prototype.hasOwnProperty.call(dict, v)) el.setAttribute(attr, dict[v]);
      });
    }
  }

  window.FVI18N = { lang, locale, t, n, date, dateTime, fixed, apply };
})();
