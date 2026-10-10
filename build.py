#!/usr/bin/env python3
"""Generates the FreeView site into the folder given as argv[1] (usually `.`).

Same structure as the Videogram site (videogram-app): a black, SF Pro Rounded home page with an animated
hero, alternating feature rows with CSS phone mockups, a gallery of real screenshots, pricing and a
footer; legal pages share one simple template. Everything is inline; the only files are the
screenshots (shot-*.webp), logo.png and the App Store badge.

    python3 build.py .
"""
import sys
import pathlib

OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
YEAR = "2026"
UPDATED = "10 October 2026"
EMAIL = "hello@freeview.app"
STORE = "https://apps.apple.com/app/id1526222244"
# Public TestFlight link for the 2.0 beta (external group "FreeView"). Drop it once 2.0 is live.
TESTFLIGHT = "https://testflight.apple.com/join/4T1Lixbc"

# ── shared bits ──────────────────────────────────────────────────────────────

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="color-scheme" content="dark">
<link rel="canonical" href="https://freeview.app/{path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="FreeView">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="https://freeview.app/{path}">
<meta property="og:image" content="https://freeview.app/og.jpg">
<meta property="og:image:width" content="1280">
<meta property="og:image:height" content="720">
<meta property="og:image:alt" content="One FreeView presentation opening on a laptop, tablet, phone and TV from a single link.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="https://freeview.app/og.jpg">
<link rel="icon" type="image/png" href="/logo.png">
<link rel="apple-touch-icon" href="/logo.png">
<style>{css}</style>
</head>
<body>
"""

# The FreeView mark: four viewfinder corners. Animated in the hero, static elsewhere.
MARK_PATH = "M4 9V6.5A2.5 2.5 0 0 1 6.5 4H9M15 4h2.5A2.5 2.5 0 0 1 20 6.5V9M20 15v2.5a2.5 2.5 0 0 1-2.5 2.5H15M9 20H6.5A2.5 2.5 0 0 1 4 17.5V15"

# SF Symbol-style icons, stroke = currentColor.
ICONS = """<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <g id="i-globe"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/></g>
  <g id="i-doc"><path d="M7 3h7l4 4v14H7z" stroke-linejoin="round"/><path d="M14 3v4h4M10 12h5M10 16h5" stroke-linecap="round"/></g>
  <g id="i-play"><rect x="3" y="5" width="18" height="14" rx="2.4"/><path d="M10 9l5 3-5 3z" stroke-linejoin="round"/></g>
  <g id="i-photo"><rect x="3" y="5" width="18" height="14" rx="2.4"/><circle cx="8.5" cy="10" r="1.6"/><path d="M5 18l4.5-4.5L13 17l3-3 3 3"/></g>
  <g id="i-code"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/></g>
  <g id="i-stack"><rect x="4" y="8" width="16" height="12" rx="2.2"/><path d="M6.5 5h11M9 2.5h6" stroke-linecap="round"/></g>
  <g id="i-lock"><rect x="5" y="10.5" width="14" height="10" rx="2.4"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></g>
  <g id="i-moon"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" stroke-linejoin="round"/></g>
  <g id="i-eyeslash"><path d="M3 12s3.2-6 9-6c2 0 3.7.7 5 1.7M21 12s-3.2 6-9 6c-2 0-3.7-.7-5-1.7" stroke-linecap="round"/><path d="M4 20L20 4" stroke-linecap="round"/></g>
  <g id="i-face"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M9 9v1.5M15 9v1.5M12 9v4h-1M9.5 16c1.5 1 3.5 1 5 0" stroke-linecap="round"/></g>
  <g id="i-keys"><rect x="2.5" y="6" width="19" height="12" rx="2.4"/><path d="M6 10h1M10 10h1M14 10h1M18 10h0M7 14h10" stroke-linecap="round"/></g>
  <g id="i-check"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5" stroke-linecap="round" stroke-linejoin="round"/></g>
  <g id="i-airplay"><path d="M7 17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" stroke-linecap="round"/><path d="M12 15l5 6H7z" stroke-linejoin="round"/></g>
  <g id="i-hand"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6 7-2.4 0-4-1.2-5.2-3.2L4 14.5a1.5 1.5 0 0 1 2.4-1.7L8 14.5" stroke-linecap="round" stroke-linejoin="round"/></g>
  <g id="i-clock"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/></g>
  <g id="i-folder"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke-linejoin="round"/></g>
</defs></svg>"""


def icon(name, w="1.7"):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{w}" aria-hidden="true"><use href="#i-{name}"/></svg>'


def bullets(items):
    return '<ul class="bul">' + "".join(f"<li>{icon(i)}{t}</li>" for i, t in items) + "</ul>"


STATUS = ('<div class="st"><span>9:41</span><svg viewBox="0 0 34 12" fill="#fff" aria-hidden="true"><rect x="0" y="3" width="4" height="6" rx="1"/>'
          '<rect x="6" y="1" width="4" height="10" rx="1"/><rect x="20" y="1" width="12" height="7" rx="2"/></svg></div>')


def phone(inner, label, status=True):
    return (f'<div class="phone" role="img" aria-label="{label}"><div class="notch"></div><div class="screen">'
            f'{STATUS if status else ""}{inner}</div></div>')


def feature(title, text, items, mock, flip=False):
    copy = f'<div class="copy"><h2>{title}</h2><p>{text}</p>{bullets(items)}</div>'
    body = mock + copy if flip else copy + mock
    return f'<section class="feat{" flip" if flip else ""}"><div class="wrap">{body}</div></section>'


# ── home page ────────────────────────────────────────────────────────────────

INDEX_CSS = """
:root{--ink:#fff;--muted:rgba(255,255,255,.5);--muted2:rgba(255,255,255,.7);--canvas:#000;
  --surface:rgba(255,255,255,.06);--surface2:rgba(255,255,255,.09);--line:rgba(255,255,255,.1);--red:#ff2d1f}
*{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{margin:0;background:var(--canvas);color:var(--ink);
  font-family:ui-rounded,"SF Pro Rounded",-apple-system,system-ui,"Segoe UI",Roboto,sans-serif;line-height:1.5;overflow-x:hidden}
a{color:var(--ink);text-decoration:none}
.wrap{max-width:1040px;margin:0 auto;padding:0 24px}
svg{display:block}
h1,h2{text-wrap:balance}p,li{text-wrap:pretty}

/* hero */
header.hero{text-align:center;padding:96px 24px 72px;background:radial-gradient(52% 40% at 50% 8%,rgba(255,255,255,.05),transparent 70%)}
.logo{width:116px;height:116px;margin:0 auto 26px;border-radius:26px;background:#000;box-shadow:0 0 0 1px var(--line),0 24px 60px rgba(0,0,0,.8);
  display:flex;align-items:center;justify-content:center}
.logo svg{width:64px;height:64px}
.logo path{animation:breathe 4.8s cubic-bezier(.65,0,.35,1) infinite;transform-origin:12px 12px}
@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(.86)}}
h1{font-size:clamp(38px,7vw,64px);font-weight:300;letter-spacing:-.02em;margin:0 0 14px}
.tag{font-size:clamp(16px,2.3vw,20px);color:var(--muted2);font-weight:300;max-width:560px;margin:0 auto 30px}
.tag strong{display:block;font-weight:600;color:var(--ink,#fff);font-size:1.25em;letter-spacing:-.01em;margin-bottom:6px;text-wrap:balance}
.herovid{display:block;width:min(1040px,100%);aspect-ratio:16/9;height:auto;margin:8px auto 0;background:#000}
.appstore{display:inline-block;margin:0 auto}
.appstore img{height:56px;width:auto;display:block}
.heroBadge{margin:36px auto 12px}
.storenote{margin:0 auto 24px;font-size:13px;font-weight:300;color:var(--muted)}
.ctarow{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.cta{display:inline-flex;gap:8px;align-items:center;background:#fff;color:#000;font-weight:600;padding:13px 24px;border-radius:16px;font-size:16px;
  transition-property:scale;transition-duration:120ms;transition-timing-function:ease-out}
.cta:active{scale:.96}
.cta.ghost{background:var(--surface);color:var(--ink);box-shadow:inset 0 0 0 1px var(--line)}

/* feature rows */
section.feat{padding:60px 0;border-top:1px solid var(--line)}
.feat .wrap{display:grid;grid-template-columns:1fr 300px;gap:56px;align-items:center}
.feat.flip .wrap{grid-template-columns:300px 1fr}
.feat.flip .copy{order:2}
.feat h2{font-size:clamp(26px,3.6vw,34px);font-weight:600;letter-spacing:-.01em;margin:0 0 14px;line-height:1.12}
.feat p{color:var(--muted2);font-size:17px;font-weight:300;margin:0 0 18px}
.bul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
.bul li{display:flex;gap:11px;align-items:center;color:var(--muted2);font-size:15px}
.bul li svg{width:17px;height:17px;flex:0 0 auto;opacity:.85;color:#fff}
@media(max-width:760px){
  .feat .wrap,.feat.flip .wrap{grid-template-columns:1fr;gap:30px;justify-items:center}
  .feat.flip .copy{order:0}.feat .copy{text-align:center}
  .feat .bul{align-items:flex-start;text-align:left;max-width:360px;margin-left:auto;margin-right:auto}
}

/* phone */
.phone{width:288px;height:600px;border-radius:44px;background:#050505;box-shadow:0 0 0 1px var(--line),0 30px 80px rgba(0,0,0,.7),inset 0 0 0 5px #000;
  padding:14px;position:relative}
.phone .notch{position:absolute;top:14px;left:50%;transform:translateX(-50%);width:104px;height:24px;background:#000;border-radius:99px;z-index:5}
.screen{width:100%;height:100%;border-radius:30px;background:#000;overflow:hidden;position:relative;display:flex;flex-direction:column}
.screen .st{display:flex;justify-content:space-between;align-items:center;padding:15px 22px 4px;font-size:12px;color:#fff;font-weight:600}
.screen .st svg{width:34px;height:12px;opacity:.9}
.screen .body{flex:1;display:flex;flex-direction:column;align-items:center;padding:26px 20px 22px;text-align:center}
.mini-mark{display:flex;gap:6px;align-items:center;font-weight:700;font-size:19px;letter-spacing:-.01em;margin-top:18px}
.mini-mark svg{width:17px;height:17px}
.mini-sub{font-size:11px;color:var(--muted);margin-top:4px}
.corner{position:absolute;right:12px;bottom:12px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.14);
  display:flex;align-items:center;justify-content:center;gap:2.5px}
.corner i{width:3px;height:3px;border-radius:50%;background:#fff}

/* 1 · open anything: an address being typed, then the kinds of things FreeView opens */
.field{width:100%;margin-top:22px;height:40px;border-radius:12px;background:var(--surface2);display:flex;align-items:center;padding:0 12px;
  font-size:13px;color:#fff;text-align:left;overflow:hidden;white-space:nowrap}
.field .typed{display:inline-block;overflow:hidden;max-width:0;animation:type 6s steps(12,end) infinite;vertical-align:bottom}
.field .caret{display:inline-block;width:1.5px;height:15px;background:#fff;margin-left:1px;animation:caret 1s step-end infinite}
@keyframes type{0%,8%{max-width:0}40%,100%{max-width:8em}}   /* past the text width: the caret lands right after the last letter */
@keyframes caret{50%{opacity:0}}
.kinds{display:flex;flex-direction:column;gap:9px;margin-top:20px;width:100%}
.kinds .row{display:flex;align-items:center;gap:12px;text-align:left;font-size:14px;color:#fff;background:var(--surface);
  border-radius:13px;padding:11px 13px;opacity:0;transform:translateY(10px);animation:up 6s ease-out infinite}
.kinds .row svg{width:19px;height:19px;opacity:.92;color:#fff}
.kinds .row:nth-child(1){animation-delay:.1s}.kinds .row:nth-child(2){animation-delay:.25s}.kinds .row:nth-child(3){animation-delay:.4s}
.kinds .row:nth-child(4){animation-delay:.55s}.kinds .row:nth-child(5){animation-delay:.7s}
@keyframes up{0%{opacity:0;transform:translateY(10px)}12%,92%{opacity:1;transform:none}100%{opacity:0}}

/* 2 · PDFs become slides: pages glide by, the counter follows */
.slides{position:absolute;inset:0;display:flex;align-items:center;overflow:hidden}
.track{display:flex;flex:none;width:400%;animation:swipe 10s cubic-bezier(.65,0,.35,1) infinite}
.slide{width:25%;padding:0 10px}
.pg{aspect-ratio:16/10;border-radius:6px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;text-align:left;position:relative;overflow:hidden;color:#fff}
.pg .k{font-size:6px;letter-spacing:1.5px;text-transform:uppercase;opacity:.6}
.pg b{font-size:19px;line-height:1.02;letter-spacing:-.5px}
.pg.a{background:#0f172a}.pg.a::after{content:"";position:absolute;right:-30px;top:-30px;width:110px;height:110px;border-radius:50%;
  background:radial-gradient(circle at 30% 30%,#f97316,#db2777 55%,#7c3aed)}
.pg.b{background:#f4f1ea;color:#111}
.pg.c{background:#161616}.pg.c .bars{display:flex;align-items:flex-end;gap:6px;height:60px}.pg.c .bars i{flex:1;background:#c2410c;border-radius:3px 3px 0 0}
.pg.d{background:#052e2b}
@keyframes swipe{0%,20%{transform:translateX(0)}25%,45%{transform:translateX(-25%)}50%,70%{transform:translateX(-50%)}75%,95%{transform:translateX(-75%)}100%{transform:translateX(0)}}
.counter{position:absolute;left:50%;bottom:44px;transform:translateX(-50%);font-size:11px;font-weight:600;color:#fff;background:rgba(0,0,0,.55);
  border-radius:99px;padding:4px 10px;font-variant-numeric:tabular-nums;box-shadow:0 0 0 1px var(--line)}
.counter .n{display:inline-grid;width:1ch}
.counter .n b{grid-area:1/1;font-weight:600;opacity:0;animation:n1 10s step-end infinite}
.counter .n b:nth-child(2){animation-name:n2}.counter .n b:nth-child(3){animation-name:n3}.counter .n b:nth-child(4){animation-name:n4}
@keyframes n1{0%{opacity:1}25%{opacity:0}}
@keyframes n2{0%{opacity:0}25%{opacity:1}50%{opacity:0}}
@keyframes n3{0%{opacity:0}50%{opacity:1}75%{opacity:0}}
@keyframes n4{0%{opacity:0}75%{opacity:1}}

/* 3 · instant presentations: three items fan out, then line up as slides */
.deckstage{position:relative;flex:1;width:100%;margin-top:10px}
.card{position:absolute;left:50%;top:44%;width:150px;height:100px;margin:-50px 0 0 -75px;border-radius:12px;box-shadow:0 14px 30px rgba(0,0,0,.6),0 0 0 1px var(--line);
  display:flex;align-items:center;justify-content:center;color:#fff}
.card svg{width:30px;height:30px}
.card.p{background:linear-gradient(135deg,#7c3aed,#db2777);animation:fanA 7s cubic-bezier(.65,0,.35,1) infinite}
.card.d{background:#f4f1ea;color:#111;animation:fanB 7s cubic-bezier(.65,0,.35,1) infinite}
.card.v{background:#1d4ed8;animation:fanC 7s cubic-bezier(.65,0,.35,1) infinite}
@keyframes fanA{0%,15%{transform:rotate(-10deg) translate(-14px,6px)}45%,85%{transform:translate(0,-120px) scale(.86)}100%{transform:rotate(-10deg) translate(-14px,6px)}}
@keyframes fanB{0%,15%{transform:rotate(0)}45%,85%{transform:translate(0,0) scale(.86)}100%{transform:rotate(0)}}
@keyframes fanC{0%,15%{transform:rotate(10deg) translate(14px,6px)}45%,85%{transform:translate(0,120px) scale(.86)}100%{transform:rotate(10deg) translate(14px,6px)}}
.deckdots{display:flex;gap:6px;justify-content:center;margin-bottom:6px;opacity:0;animation:show 7s ease-out infinite}
.deckdots i{width:6px;height:6px;border-radius:99px;background:rgba(255,255,255,.3)}.deckdots i:first-child{width:18px;background:#fff}
@keyframes show{0%,40%{opacity:0}50%,85%{opacity:1}100%{opacity:0}}
.pick{font-size:11.5px;color:var(--muted2);background:var(--surface);border-radius:99px;padding:5px 11px;margin-top:4px}

/* 4 · kiosk: nothing on screen, then the PIN pad after a three-finger press */
.kiosk{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
.kiosk .pg{width:86%}
.fingers{position:absolute;top:36%;left:50%;transform:translateX(-50%);display:flex;gap:16px;opacity:0;animation:press 8s ease-out infinite}
.fingers i{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.35);box-shadow:0 0 0 6px rgba(255,255,255,.12)}
@keyframes press{0%,20%{opacity:0;transform:translateX(-50%) scale(1.2)}28%,40%{opacity:1;transform:translateX(-50%) scale(1)}46%,100%{opacity:0}}
.pin{position:absolute;inset:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
  opacity:0;animation:pinIn 8s ease-out infinite}
@keyframes pinIn{0%,42%{opacity:0}48%,92%{opacity:1}100%{opacity:0}}
.pin .t{font-size:14px;font-weight:600}
.pin .dots4{display:flex;gap:14px}
.pin .dots4 i{width:11px;height:11px;border-radius:50%;box-shadow:inset 0 0 0 1.5px #fff}
.pin .dots4 i:nth-child(1){animation:fill1 8s step-end infinite}.pin .dots4 i:nth-child(2){animation:fill2 8s step-end infinite}
.pin .dots4 i:nth-child(3){animation:fill3 8s step-end infinite}.pin .dots4 i:nth-child(4){animation:fill4 8s step-end infinite}
@keyframes fill1{0%{background:none}58%{background:#fff}96%{background:none}}
@keyframes fill2{0%{background:none}64%{background:#fff}96%{background:none}}
@keyframes fill3{0%{background:none}70%{background:#fff}96%{background:none}}
@keyframes fill4{0%{background:none}76%{background:#fff}96%{background:none}}
.pad{display:grid;grid-template-columns:repeat(3,44px);gap:10px}
.pad i{width:44px;height:44px;border-radius:50%;background:var(--surface2);font-style:normal;display:flex;align-items:center;justify-content:center;font-size:16px}

/* 5 · night mode: a page turns deep red on black */
.night{position:absolute;inset:0;padding:54px 20px 20px;text-align:left;background:#fff;color:#111;animation:nightBg 7s ease-in-out infinite}
.night .h{font-size:22px;font-weight:700;letter-spacing:-.4px;margin:6px 0 8px}
.night .ln{height:7px;border-radius:4px;background:currentColor;opacity:.22;margin:8px 0}
.night .img{height:110px;border-radius:10px;margin:14px 0;background:linear-gradient(160deg,#16a34a,#0ea5e9 60%,#1e1b4b);animation:nightImg 7s ease-in-out infinite}
@keyframes nightBg{0%,30%{background:#fff;color:#111}50%,85%{background:#000;color:var(--red)}100%{background:#fff;color:#111}}
@keyframes nightImg{0%,30%{filter:none}50%,85%{filter:grayscale(1) brightness(.75) sepia(1) hue-rotate(-50deg) saturate(9)}100%{filter:none}}
.moonchip{position:absolute;right:14px;top:50px;font-size:10.5px;font-weight:600;border-radius:99px;padding:4px 9px;background:rgba(255,45,31,.12);color:var(--red);
  opacity:0;animation:show2 7s ease-in-out infinite}
@keyframes show2{0%,35%{opacity:0}50%,85%{opacity:1}100%{opacity:0}}

/* 6 · private: recent items, with the private-browsing chip */
.hist{width:100%;margin-top:20px;border-radius:14px;background:var(--surface);overflow:hidden;text-align:left}
.hist .r{display:flex;align-items:center;gap:11px;padding:11px 12px;box-shadow:inset 0 -1px 0 var(--line)}
.hist .r:last-child{box-shadow:none}
.hist .r svg{width:16px;height:16px;opacity:.6;color:#fff}
.hist .r b{display:block;font-size:12.5px;font-weight:600}.hist .r span{display:block;font-size:10.5px;color:var(--muted)}
.hist .r.lockrow{font-size:12px;justify-content:space-between}.hist .r.lockrow b{font-size:12px}
.chipp{display:inline-flex;gap:5px;align-items:center;font-size:11px;color:var(--muted2);align-self:flex-start;margin:4px 0 0 2px}
.chipp svg{width:13px;height:13px}

/* real screenshot gallery */
.gallery{padding:70px 0;border-top:1px solid var(--line);text-align:center}
.gallery h2{font-size:clamp(26px,3.6vw,34px);font-weight:600;margin:0 0 6px}
.gallery p{color:var(--muted2);font-weight:300;max-width:600px;margin:0 auto 8px}
.shots{display:flex;gap:22px;justify-content:center;flex-wrap:wrap;margin-top:36px}
.featshot{width:260px!important;justify-self:center}
.shotframe{width:min(220px,calc(50% - 11px));border-radius:34px;box-shadow:0 0 0 1px var(--line),0 24px 60px rgba(0,0,0,.6);background:#000;padding:8px}
.shotframe img{width:100%;height:auto;display:block;border-radius:26px;outline:1px solid rgba(255,255,255,.1);outline-offset:-1px}
.shots.ipad{margin-top:22px}
.tabframe{width:min(440px,100%);border-radius:30px;box-shadow:0 0 0 1px var(--line),0 24px 60px rgba(0,0,0,.6);background:#000;padding:10px}
.tabframe img{width:100%;height:auto;display:block;border-radius:20px;outline:1px solid rgba(255,255,255,.1);outline-offset:-1px}

/* pricing */
.price{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:34px}
.price .cardp{background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);border-radius:18px;padding:18px 26px;min-width:170px}
.price .cardp.best{box-shadow:inset 0 0 0 1px rgba(255,255,255,.4)}
.price .amt{font-size:24px;font-weight:700;font-variant-numeric:tabular-nums}
.price .per{color:var(--muted);font-size:13px;font-weight:300;margin-top:2px}

footer{padding:52px 24px 68px;text-align:center;color:var(--muted);border-top:1px solid var(--line);font-size:14px;font-weight:300}
footer a{color:var(--muted2);display:inline-block;padding:12px 10px}

@media (prefers-reduced-motion: reduce){*{animation:none!important}
  .kinds .row{opacity:1!important;transform:none!important}.deckdots{opacity:1}.fingers,.pin{display:none}
  .field .typed{max-width:none}.counter .n b:first-child{opacity:1}}
"""

PG_A = '<div class="pg a"><div class="k">Lumen Studio</div><b>New season,<br>new light.</b><div class="k">01</div></div>'

MOCK_OPEN = phone(
    '<div class="body"><div class="mini-mark">' + f'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="{MARK_PATH}"/></svg>'
    + 'FreeView</div><div class="mini-sub">View and present anything, full screen</div>'
    '<div class="field"><span class="typed">freeview.app</span><span class="caret"></span></div>'
    '<div class="kinds">'
    f'<div class="row">{icon("globe",1.6)}Web page</div><div class="row">{icon("doc",1.6)}PDF</div>'
    f'<div class="row">{icon("play",1.6)}Video</div><div class="row">{icon("photo",1.6)}Photo</div>'
    f'<div class="row">{icon("code",1.7)}HTML prototype</div></div></div>',
    "The FreeView home screen: an address being typed, and the kinds of things it opens: web pages, PDFs, videos, photos and HTML prototypes")

MOCK_SLIDES = phone(
    '<div class="slides"><div class="track">'
    f'<div class="slide">{PG_A}</div>'
    '<div class="slide"><div class="pg b"><div class="k">The year in numbers</div><b>42 new<br>pieces</b><div class="k">02</div></div></div>'
    '<div class="slide"><div class="pg c"><div class="k">Growth</div><div class="bars"><i style="height:40%"></i><i style="height:55%"></i>'
    '<i style="height:70%"></i><i style="height:100%"></i></div><div class="k">03</div></div></div>'
    '<div class="slide"><div class="pg d"><div class="k">Thank you</div><b>Questions?</b><div class="k">04</div></div></div>'
    '</div></div><div class="counter"><span class="n"><b>1</b><b>2</b><b>3</b><b>4</b></span> / 4</div><div class="corner"><i></i><i></i><i></i></div>',
    "A PDF shown full screen on black, one page at a time, with a page counter: 1 of 4, 2 of 4 and so on", status=False)

MOCK_DECK = phone(
    '<div class="body"><div class="pick">Present several, one per slide</div><div class="deckstage">'
    f'<div class="card v">{icon("play",1.6)}</div><div class="card d">{icon("doc",1.6)}</div><div class="card p">{icon("photo",1.6)}</div>'
    '</div><div class="deckdots"><i></i><i></i><i></i></div></div>',
    "A photo, a PDF and a video picked together, lining up as the slides of one presentation")

MOCK_KIOSK = phone(
    f'<div class="kiosk">{PG_A.replace("pg a", "pg a")}</div>'
    '<div class="fingers"><i></i><i></i><i></i></div>'
    '<div class="pin"><div class="t">Enter PIN to exit</div><div class="dots4"><i></i><i></i><i></i><i></i></div>'
    '<div class="pad"><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i></div></div>',
    "A slide shown with nothing on top of it; a three-finger press brings up the PIN pad, and four digits fill in", status=False)

MOCK_NIGHT = phone(
    '<div class="night"><div class="moonchip">Night mode</div><div class="ln" style="width:40%"></div><div class="h">Aurora</div>'
    '<div class="ln"></div><div class="ln" style="width:86%"></div><div class="ln" style="width:92%"></div><div class="img"></div>'
    '<div class="ln"></div><div class="ln" style="width:70%"></div><div class="ln" style="width:88%"></div></div>',
    "A white web page that turns deep red on black, image included, when night mode comes on", status=False)

MOCK_PRIVATE = phone(
    '<div class="body"><div class="mini-mark">' + f'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="{MARK_PATH}"/></svg>'
    + f'FreeView</div><div class="chipp">{icon("eyeslash")}Private</div><div class="hist">'
    f'<div class="r">{icon("doc",1.6)}<div><b>Lumen Spring 2026</b><span>Lumen-Spring-2026.pdf</span></div></div>'
    f'<div class="r">{icon("stack",1.6)}<div><b>Launch deck</b><span>Presentation · 3 items</span></div></div>'
    f'<div class="r">{icon("globe",1.6)}<div><b>FreeView</b><span>freeview.app</span></div></div>'
    f'<div class="r lockrow"><span style="display:flex;gap:10px;align-items:center">{icon("lock",1.6)}2 more in your history</span><b>Unlock</b></div>'
    '</div></div>',
    "The recent list with three items and a private-browsing indicator")

def shot(img, alt):
    """A real app screen in a phone outline, for feature rows."""
    return f'<div class="shotframe featshot"><img src="{img}" width="612" height="1330" alt="{alt}" loading="lazy"></div>'

FEATURES = "\n".join([
    feature("Any mix of files, one presentation", "Pick a Keynote deck, a PDF, a film, photos, a 3D model, a voice note and a spreadsheet, and they become one presentation, a slide each, in the order you want. No converting, no copying and pasting, no slide software.",
            [("stack", "Keynote, PowerPoint, Word, PDFs, videos, photos, audio"), ("check", "3D models, Lottie animations, Markdown, tables and live web pages"),
             ("folder", "From Files, Photos, AirDrop, Mail or the camera, even a scan")],
            shot("shot-deck.webp", "Editing a presentation in FreeView: a cover, a brief, photos, a film, a 3D prototype, numbers, a Keynote review and a voice note, in order")),
    feature("Make it yours in seconds", "Add a cover with your logo, name, photo and contacts, and text slides for the bits in between. Any web address on a slide becomes a QR code. Pick a style or make one from your logo's colours.",
            [("photo", "Any picture from the presentation as the cover"), ("check", "Saved styles you can copy to other presentations"),
             ("code", "A QR code for every link, automatically")],
            shot("shot-cover.webp", "A cover slide over a photo of the sea: title, logo, the presenter's photo, name and contacts"), flip=True),
    feature("Share one link, whatever the size", "Long films, big decks, dozens of photos: send a link, not attachments. Add a welcome message, choose how long it works, and update it after edits without changing the link.",
            [("airplay", "One link instead of files people can't open"), ("lock", "A welcome screen, a password if you need one"),
             ("clock", "Ends when you choose; see how often it was opened")],
            shot("shot-share.webp", "Sharing a presentation: its cover, what's in it, a title and message, and how long the link works")),
    feature("Opens on any screen", "Whoever gets the link watches it in their browser, on a laptop, tablet, phone or TV, ready to present. No app, no account, nothing to install, and Keynote, video and 3D all just play.",
            [("globe", "Any modern browser"), ("keys", "Arrow keys, clickers, swipe or tap"), ("check", "Full screen, filled edge to edge")],
            shot("shot-web-phone.webp", "The shared presentation playing in a phone's browser"), flip=True),
    feature("Edit right in the presentation", "Crop, rotate or reimagine a photo, trim a video or a voice note, fix a PDF page, wherever it's used, on a slide or a cover. Revert always brings back the original.",
            [("photo", "Crop, rotate, black and white, Reimagine"), ("play", "Trim, mute and pick the cover frame of videos"),
             ("hand", "Take photos, scan documents or record audio straight in")],
            shot("shot-edit.webp", "Editing a photo in FreeView: crop, rotate and black and white")),
    feature("Present anything, anywhere", "On your own screen everything opens full screen with nothing in the way. Hand over an iPad in kiosk mode, or switch to deep red night mode in the dark.",
            [("lock", "Kiosk mode with a PIN"), ("moon", "Red night mode, pages and videos too"), ("airplay", "AirPlay and external displays")], MOCK_KIOSK, flip=True),
    feature("Private by design", "No account, no ads, no tracking. Your files and history never leave your device unless you share them, and shared links end on their own.",
            [("eyeslash", "Private browsing keeps no cookies or history"), ("face", "Lock with Face ID or Touch ID"), ("check", "Stop any link whenever you like")], MOCK_PRIVATE),
])

INDEX_BODY = f"""{ICONS}
<header class="hero">
  <div class="logo" role="img" aria-label="FreeView"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="{MARK_PATH}"/></svg></div>
  <h1>FreeView</h1>
  <p class="tag"><strong>Easy to build. Easier to share.</strong> Drop in any mix of files for a presentation, then send one link that plays on any screen, at any size.</p>
  <video class="herovid" src="hero.mp4?v=4" poster="hero-poster.webp?v=4" width="1280" height="720" autoplay muted loop playsinline preload="auto"
    aria-label="A 30-second tour in three steps: drop in a Keynote deck, a PDF, a film, photos, a 3D model and a spreadsheet and they become one presentation; add a branded cover in one tap; send one link with no size limits; it plays on a laptop, tablet, phone and TV. Easy to build, easier to share."></video>
  <a class="appstore heroBadge" href="{STORE}" target="_blank" rel="noopener" aria-label="Download FreeView on the App Store">
    <img src="appstore-badge.svg" alt="Download on the App Store">
  </a>
  <p class="storenote">For iPhone, iPad and Mac · Free to start · The new 2.0 is in beta on TestFlight</p>
  <div class="ctarow">
    <a class="cta" href="{TESTFLIGHT}" target="_blank" rel="noopener">Join the 2.0 beta</a>
    <a class="cta ghost" href="#tour">See the tour</a>
    <a class="cta ghost" href="support.html">Support</a>
  </div>
</header>

<script>if(matchMedia('(prefers-reduced-motion: reduce)').matches){{var v=document.querySelector('.herovid');v.removeAttribute('autoplay');v.pause();}}</script>
<div id="tour"></div>
{FEATURES}

<section class="gallery">
  <div class="wrap">
    <h2>Straight from the app</h2>
    <p>Real screens on iPhone and iPad: the home screen, a PDF as a slide, night mode on a web page, and FreeView&nbsp;Pro.</p>
    <div class="shots">
      <div class="shotframe"><img src="shot-home.webp" width="612" height="1330" alt="The home screen with an address field, Paste and File buttons, and three recent items" loading="lazy"></div>
      <div class="shotframe"><img src="shot-pdf.webp" width="612" height="1330" alt="A PDF slide shown full screen on black" loading="lazy"></div>
      <div class="shotframe"><img src="shot-night.webp" width="612" height="1330" alt="A Wikipedia article in night mode, deep red on black" loading="lazy"></div>
      <div class="shotframe"><img src="shot-paywall.webp" width="612" height="1330" alt="FreeView Pro: monthly, yearly with a free week, or lifetime" loading="lazy"></div>
    </div>
    <div class="shots ipad">
      <div class="tabframe"><img src="shot-ipad-home.webp" width="880" height="1260" alt="The FreeView home screen on iPad with recent pages, files and presentations" loading="lazy"></div>
      <div class="tabframe"><img src="shot-ipad-pdf.webp" width="880" height="1260" alt="A PDF slide full screen on iPad" loading="lazy"></div>
    </div>
  </div>
</section>

<section class="gallery" style="padding-top:24px">
  <div class="wrap">
    <h2>Free to use. Pro if you want it all.</h2>
    <p>Viewing, presenting, editing, custom slides and styles are free. Free keeps your three most recent presentations and shares one link at a time, for up to a week. FreeView Pro keeps every presentation and shares as many links as you like, for up to 90 days or with no end date, with passwords, per-slide views and no FreeView mark.</p>
    <div class="price">
      <div class="cardp"><div class="amt">$1.99</div><div class="per">Pro · monthly</div></div>
      <div class="cardp best"><div class="amt">$9.99</div><div class="per">Pro · yearly · first week free</div></div>
      <div class="cardp"><div class="amt">$19.99</div><div class="per">Lifetime · pay once</div></div>
    </div>
    <p style="font-size:13px;margin-top:16px">US prices; your App Store shows local pricing. Monthly and yearly plans renew automatically unless cancelled at least 24 hours before the period ends; manage them in Settings → Apple Account → Subscriptions.</p>
    <a class="appstore" style="margin-top:26px" href="{STORE}" target="_blank" rel="noopener" aria-label="Download FreeView on the App Store">
      <img src="appstore-badge.svg" alt="Download on the App Store">
    </a>
    <p style="font-size:13px;margin-top:14px">Want the new version today? <a href="{TESTFLIGHT}" target="_blank" rel="noopener" style="text-decoration:underline;text-underline-offset:3px">Join the FreeView 2.0 beta on TestFlight</a>.</p>
  </div>
</section>

<footer>
  © {YEAR} FRANCESCO BERTOCCI, LLC · FreeView
  <div style="margin-top:4px"><a href="privacy.html">Privacy</a>·<a href="terms.html">Terms</a>·<a href="support.html">Support</a>·<a href="mailto:{EMAIL}">{EMAIL}</a></div>
</footer>
</body>
</html>
"""

# ── legal pages (Videogram's legal template) ─────────────────────────────────

LEGAL_CSS = """
:root{--ink:#fff;--muted:rgba(255,255,255,.55);--canvas:#000;--surface:rgba(255,255,255,.06);--accent:#fff}
*{box-sizing:border-box}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{margin:0;background:var(--canvas);color:var(--ink);font-family:-apple-system,"SF Pro Rounded",system-ui,"Segoe UI",Roboto,sans-serif;line-height:1.65}
.wrap{max-width:720px;margin:0 auto;padding:48px 24px 96px}
nav{font-size:14px}
nav a{color:var(--muted);text-decoration:none;display:inline-block;padding:12px 0}
nav a:hover{color:var(--ink)}
.kicker{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-top:16px;font-weight:600}
h1{font-size:40px;font-weight:700;letter-spacing:-.02em;margin:8px 0 4px;text-wrap:balance}
h2{font-size:22px;font-weight:600;margin:40px 0 8px;text-wrap:balance}
h3{font-size:18px;font-weight:600;margin:26px 0 4px}
p,li{font-size:17px;color:#d9d9de;text-wrap:pretty}
.muted{color:var(--muted);font-size:14px}
a{color:var(--accent)}
.lead{font-size:19px;color:var(--ink)}
hr{border:none;border-top:1px solid rgba(255,255,255,.09);margin:40px 0}
.pill{display:inline-block;background:var(--accent);color:#000;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:999px;font-weight:700}
.contact{background:var(--surface);border-radius:20px;padding:22px 24px;margin:26px 0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.contact a{font-size:20px;font-weight:600;text-decoration:none}
.contact p{margin:6px 0 0;color:var(--muted);font-size:15px}
code{background:var(--surface);padding:2px 6px;border-radius:6px;font-size:15px}
footer{margin-top:56px;font-size:13px;color:var(--muted)}
footer a{color:var(--muted)}
"""


def legal(title, desc, heading, body, path):
    return HEAD.format(title=f"FreeView — {title}", desc=desc, css=LEGAL_CSS, path=path) + f"""<div class="wrap">
  <nav><a href="./">← FreeView</a></nav>
  <img src="logo.png" alt="FreeView" width="52" height="52" style="border-radius:12px;display:block;margin:12px 0 4px;outline:1px solid rgba(255,255,255,.1);outline-offset:-1px">
  <div class="kicker">FreeView</div>
  <h1>{heading}</h1>
{body}
  <footer>© {YEAR} FRANCESCO BERTOCCI, LLC · <a href="./">FreeView</a> · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="support.html">Support</a></footer>
</div>
</body>
</html>
"""


PRIVACY = f"""  <p class="muted">Last updated: {UPDATED}</p>

  <p class="lead">FreeView shows web pages and files full screen, and it keeps what you open on your device. It has no accounts, no analytics and no advertising. The only things that leave your device are presentations you choose to share as a link, and the anonymous record of a FreeView Pro purchase.</p>

  <p><span class="pill">In short</span>&nbsp; Your files and history never leave your device unless you share them. When you share a presentation, a copy of it goes to iCloud for as long as the link works, and anyone with the link can watch it. The only other thing that leaves your device is the anonymous record of a FreeView Pro purchase.</p>

  <hr>

  <h2>What FreeView stores on your device</h2>
  <ul>
    <li><strong>History</strong>: the addresses, titles and dates of what you open, and any names you give them.</li>
    <li><strong>Files and presentations</strong>: PDFs, videos, photos, audio, documents and the slides you make are copied into FreeView's own storage, with pictures FreeView makes from them (pages of Keynote, PowerPoint or Word files, previews and edits).</li>
    <li><strong>Profile</strong>: the name, role, photo, logo and contact details you add in Settings, for your covers and slides. They appear only on slides where you turn them on.</li>
    <li><strong>Styles, settings and the kiosk PIN</strong>: your choices, saved styles, and the PIN as a salted hash in the Keychain.</li>
    <li><strong>Web data</strong>: cookies, site storage and cache, kept by Apple's WebKit as in Safari. Private browsing keeps none of it once a page closes.</li>
  </ul>
  <p>None of this is sent to us unless you share a presentation. It may be included in your device's own iCloud or computer backup, under Apple's terms.</p>

  <h2>Shared presentations</h2>
  <p>When you use <strong>Share Presentation</strong>, FreeView uploads a copy of that presentation so it can be watched in a browser at freeview.app:</p>
  <ul>
    <li><strong>What's uploaded</strong>: the presentation's title, your optional message, its slides as web-ready files (photos, PDF and document pages as pictures, videos, audio, 3D models, animations, tables), the text of your covers and text slides, and only the profile details you chose to show on them (for example your name, photo, logo, email or website).</li>
    <li><strong>Where</strong>: the public database of FreeView's iCloud container (iCloud.com.fbmore.freeview), run by Apple. Each link has a long random address; there is no list or search of shared presentations, so it can only be found by someone you give the link to.</li>
    <li><strong>Who can see it</strong>: anyone who has the link, without signing in. Link previews in apps like Messages show its title, message and cover picture.</li>
    <li><strong>How long</strong>: until the link ends (after the time you choose) or you stop sharing it in Settings → Shared Links. Ended links stop working right away, and their copies are deleted from iCloud within a day.</li>
    <li><strong>Views</strong>: each opening of a link adds one to a count for that link, so you can see how often it was watched. The count is just a number per link, kept on Cloudflare; no IP address, cookie or device detail is stored.</li>
    <li><strong>Viewer libraries</strong>: the web viewer loads open-source code (for Markdown, tables, Lottie animations, 3D models and QR codes) from cdnjs and jsDelivr, which, like any website, see the viewer's IP address when serving it.</li>
  </ul>
  <p>Share only what you have the right to share: anyone with the link can view and save what they see.</p>

  <h2>Camera, microphone, photos and files</h2>
  <p>The camera is used only when you take a photo or video, or scan a document, for a presentation; the microphone only when you record audio or a video's sound. FreeView uses the system pickers for Photos and Files, so it only sees the items you choose. What you capture or pick stays on your device unless you share it.</p>

  <h2>Reimagine</h2>
  <p>On devices with Apple Intelligence, <strong>Reimagine</strong> uses Apple's Image Playground to make a new picture from a photo. Apple processes it on your device or with Private Cloud Compute, under Apple's privacy terms; FreeView sends nothing to us.</p>

  <h2>Face ID and Touch ID</h2>
  <p>Used only if you turn on <strong>Lock with Face ID</strong>, to unlock FreeView. Your device handles it entirely; FreeView never receives face or fingerprint data.</p>

  <h2>Purchases</h2>
  <p>FreeView Pro is sold through the App Store. To unlock and restore it, FreeView uses <a href="https://www.revenuecat.com/privacy/">RevenueCat</a>, which receives an anonymous app user identifier and your App Store receipt (what you bought and when). It does not receive your name, email or Apple Account details. Payments are handled by Apple.</p>

  <h2>What we don't collect</h2>
  <ul>
    <li>No accounts, and no names, emails or phone numbers, except profile details you put on a slide you share</li>
    <li>No browsing history, search terms, or files you don't share</li>
    <li>No location or contacts</li>
    <li>No advertising identifiers, tracking or analytics</li>
    <li>No crash reports sent to us</li>
  </ul>

  <h2>Websites you visit</h2>
  <p>Pages you open in FreeView, including web-page slides, load directly from their own servers and follow their own privacy policies.</p>

  <h2>Children</h2>
  <p>FreeView is not directed at children and does not knowingly collect information from anyone.</p>

  <h2>Deleting your data</h2>
  <ul>
    <li><strong>On your device</strong>: swipe an item in Recent to remove it, use <strong>Clear History</strong> in Settings, clear your profile in Settings → Profile and Contacts, or delete the app.</li>
    <li><strong>Shared links</strong>: Settings → Shared Links → <strong>Stop Sharing</strong> deletes a link's copies from iCloud. Links you don't stop are deleted automatically after they end. Deleting the app doesn't stop links that are still running, so stop them first; or <a href="mailto:{EMAIL}">write to us</a> with the link and we'll remove it.</li>
  </ul>

  <h2>Changes</h2>
  <p>If this policy changes, the date above changes with it, and the new version appears here.</p>

  <h2>Contact</h2>
  <p><a href="mailto:{EMAIL}">{EMAIL}</a></p>
"""

TERMS = f"""  <p class="muted">Last updated: {UPDATED}</p>

  <p class="lead">These terms cover your use of FreeView, made by FRANCESCO BERTOCCI, LLC. By using the app you agree to them and to Apple's <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Standard End User License Agreement</a>.</p>

  <hr>

  <h2>The service</h2>
  <p>FreeView shows web pages and files full screen (PDFs, videos, images, documents, HTML prototypes and presentations) and lets you make presentations with your own cover and text slides, edit their photos, videos and audio, and share them as a link that plays in any browser. It is free to use, keeps your three most recent presentations and shares one link at a time; FreeView Pro keeps every presentation and shares more links, for longer, with passwords and per-slide views.</p>

  <h2>FreeView Pro and subscriptions</h2>
  <ul>
    <li><strong>Plans:</strong> Monthly, $1.99 per month; Yearly, $9.99 per year, starting with a one-week free trial for eligible Apple Accounts; Lifetime, $19.99, a one-time purchase. Prices are in US dollars; the App Store shows local pricing.</li>
    <li><strong>Payment:</strong> charged to your Apple Account at confirmation of purchase, or when the free week ends.</li>
    <li><strong>Renewal:</strong> the yearly plan renews automatically unless cancelled at least 24 hours before the end of the current period. Your account is charged for renewal within 24 hours before the period ends.</li>
    <li><strong>Managing:</strong> cancel or change in Settings → Apple Account → Subscriptions. Cancelling stops the next renewal; Pro stays on until the period ends.</li>
    <li><strong>Free trial:</strong> any unused part of a free trial is forfeited when you purchase a subscription.</li>
    <li><strong>Refunds:</strong> handled by Apple at <a href="https://reportaproblem.apple.com">reportaproblem.apple.com</a>.</li>
    <li><strong>Restore:</strong> use <strong>Restore Purchases</strong> in Settings on any device signed in to the same Apple Account.</li>
  </ul>

  <h2>License</h2>
  <p>You may use FreeView on Apple devices you own or control, as described in Apple's Standard EULA. You may not copy, modify or reverse engineer the app except where the law allows it.</p>

  <h2>Your content</h2>
  <p>The files and pages you open remain yours. You are responsible for having the right to view and show them, especially when presenting to others or leaving FreeView in kiosk mode in a public place.</p>

  <h2>Shared links</h2>
  <p>When you share a presentation, you're responsible for what it contains and who you send the link to. Anyone with the link can watch it, and can save or screenshot what they see; ending a link stops it from opening, but it can't take back copies others already made. Free shares one link at a time, for up to a week and 250 MB, with a small "Made with FreeView" mark. Pro shares any number of links, up to 2 GB each, for up to 90 days or with no end date, with optional passwords and no mark. A link with no end date stays up until you stop sharing it, while Pro is active; if Pro ends, it switches to ending 30 days later. Links depend on iCloud and FreeView's service continuing; we'll give notice before any change that would end them. We may remove a shared presentation that breaks these terms or the law, or when asked by its owner.</p>

  <h2>Acceptable use</h2>
  <p>Don't use FreeView to display or share content that is illegal, harmful, or that you don't have the right to show, and don't use shared links to harass anyone or to impersonate someone else. Kiosk mode limits what a viewer can do inside FreeView; it is not a security boundary for the device. Use Guided Access if an iPhone or iPad must stay locked to the app.</p>

  <h2>Third-party websites</h2>
  <p>Web pages you open belong to their owners and follow their own terms. We are not responsible for their content.</p>

  <h2>No warranty</h2>
  <p>FreeView is provided "as is", without warranties of any kind, to the extent the law allows.</p>

  <h2>Limitation of liability</h2>
  <p>To the extent the law allows, FRANCESCO BERTOCCI, LLC is not liable for indirect or consequential damages, and our total liability is limited to the amount you paid for FreeView in the twelve months before the claim.</p>

  <h2>Changes</h2>
  <p>We may update these terms; the date above shows the latest version. Continuing to use FreeView means you accept the update.</p>

  <h2>Governing law</h2>
  <p>These terms are governed by the laws of the State of New York, United States, without regard to conflict-of-law rules.</p>

  <h2>Contact</h2>
  <p><a href="mailto:{EMAIL}">{EMAIL}</a></p>
"""

SUPPORT = f"""  <div class="contact">
    <a href="mailto:{EMAIL}?subject=FreeView%20support">{EMAIL}</a>
    <p>Please include your device, iOS version and FreeView version (Settings, at the bottom). Replies usually within two working days.</p>
  </div>

  <h2>Opening things</h2>
  <h3>What can FreeView open?</h3>
  <p>Web addresses, PDFs, videos, audio, photos (including animated GIFs and SVGs), Keynote, PowerPoint, Pages, Word and Numbers files, spreadsheets and CSV, Markdown, Lottie animations, 3D models (USDZ, OBJ, STL, GLB and more), HTML files or folders with their CSS and JavaScript, and anything else WebKit can render.</p>
  <h3>How do I open a file from another app?</h3>
  <p>Tap <strong>File</strong> on the home screen to pick from Files or Photos, use <strong>Share → FreeView</strong> (or <strong>Open in…</strong>) from Files, Mail or AirDrop, or on iPad and Mac drag files onto the home screen.</p>
  <h3>What does Paste do?</h3>
  <p>It opens what you copied: a link or text opens like the address field, and copied files, photos or PDFs are added (several become a presentation).</p>
  <h3>Can I send things to FreeView from other apps?</h3>
  <p>Yes. In Safari, Photos, Files or Mail, tap Share and choose <strong>FreeView</strong>. It's added right away and opens the next time you switch to FreeView; several items open as a presentation.</p>
  <h3>Can I open a whole folder?</h3>
  <p>Yes. Choose <strong>File or Folder</strong> and pick a folder. If it has an HTML page (an <code>index.html</code>, or the first one FreeView finds), it opens as that page with its CSS, JavaScript and images. Otherwise everything FreeView can show inside it (photos, PDFs, videos, documents) becomes a presentation, in name order.</p>
  <h3>Can I save a web page to read offline?</h3>
  <p>Open the page, tap the round button in the corner and choose <strong>Save for Offline</strong>. FreeView keeps the page with its images and styles; it appears in Recent and opens without a connection. Pages that load their content later through JavaScript (feeds, maps) may be incomplete offline.</p>
  <h3>How do I make a presentation?</h3>
  <p>Tap <strong>File</strong>, then choose <strong>Files</strong> or <strong>Photos and Videos</strong> under "Present several". Items appear in the order you picked them, one per slide; a multi-page PDF becomes one slide per page. Swipe, or use a presentation clicker or the arrow keys.</p>
  <h3>How do I change a presentation?</h3>
  <p>Touch and hold it in Recent and choose <strong>Edit Presentation</strong>, or choose <strong>Edit Slides</strong> from the round button while it's open. Drag to reorder, tap the minus to delete, add files or photos, or touch and hold a slide to replace it.</p>
  <h3>Can I search inside my files?</h3>
  <p>Tap the magnifying glass next to Recent. FreeView searches names and addresses, and also the text inside PDFs, documents, web pages you've opened, saved pages and even photos. A match inside a presentation opens on its slide.</p>
  <h3>How do I leave a page?</h3>
  <p>Tap the round button in the corner and choose <strong>Close</strong>. It fades after a few seconds but stays tappable. With a keyboard, press Esc (or ⌘.).</p>

  <h2>Presentations and sharing</h2>
  <h3>Can FreeView open Keynote, PowerPoint and Word files?</h3>
  <p>Yes. Each slide or page becomes a still picture, so the presentation looks right on any screen and in shared links. Animations, builds, transitions and embedded video aren't kept, and fonts your device doesn't have are replaced with similar ones. Spreadsheets and CSV files show as a table.</p>
  <h3>How do I add a cover or a text slide?</h3>
  <p>In <strong>Edit Presentation</strong>, choose <strong>Add Cover Slide</strong> or <strong>Add Text Slide</strong>. A cover can use any picture from the presentation, Photos or the camera as its background, and show your logo, name, photo and the contacts you pick. Any web address in a slide's text shows as a QR code.</p>
  <h3>How do styles work?</h3>
  <p>Tap <strong>Style…</strong> in Edit Presentation to pick a preset, colours, font and logo, or make a style from your logo's colours. Styles affect covers and text slides only. Save a style by name to use it again, or copy one from another presentation.</p>
  <h3>Where do my name, logo and contacts come from?</h3>
  <p>Settings → <strong>Profile and Contacts</strong>. Each slide chooses which of them to show, if any.</p>
  <h3>Can I edit photos and videos in a presentation?</h3>
  <p>Tap a photo, video, audio clip or PDF in Edit Presentation (or a cover's background or a text slide's picture). Photos can be cropped, rotated, made black and white, or reimagined with Image Playground where available; videos trimmed, muted, rotated or given a cover frame; audio trimmed or re-recorded; PDF pages rotated, cropped or made black and white. <strong>Revert</strong> always brings back the original.</p>
  <h3>How do I share a presentation?</h3>
  <p>Touch and hold it in Recent and choose <strong>Share Presentation…</strong>. Pick how long the link works and add a message if you like; the link opens in any browser, ready to present. If you edit the presentation later, choose <strong>Update Shared Link…</strong>: the link stays the same.</p>
  <h3>How do I stop sharing?</h3>
  <p>Settings → <strong>Shared Links</strong>: swipe a link or touch and hold it and choose <strong>Stop Sharing</strong>. Its copies are deleted from iCloud. Links also end on their own, after the time you chose.</p>
  <h3>Do I need iCloud to share?</h3>
  <p>Yes: sharing uses iCloud, so sign in to iCloud in the Settings app. People watching the link don't need anything but a browser.</p>

  <h2>Kiosk mode</h2>
  <h3>How do I exit kiosk mode?</h3>
  <p>Touch and hold anywhere with three fingers, shake the device, or press Esc on a keyboard, then enter your PIN. If you use iOS Zoom, its three-finger gestures can get in the way; shaking always works.</p>
  <h3>I forgot my PIN.</h3>
  <p>Force-quit FreeView (swipe it up in the app switcher) and reopen it; you'll land on the home screen. Then go to Settings, turn kiosk mode off and on again to set a new PIN.</p>
  <h3>Can people leave the app?</h3>
  <p>Kiosk mode controls what happens inside FreeView. To keep an iPhone or iPad locked to FreeView, also turn on Guided Access: Settings → Accessibility → Guided Access.</p>
  <h3>FreeView on a Mac</h3>
  <p>FreeView runs on Apple silicon Macs as an iPad app in a window. Kiosk mode hides the controls there, but macOS always lets people close or quit the window, so use it for presenting rather than unattended kiosks.</p>

  <h2>Privacy and night mode</h2>
  <h3>Private browsing or "Don't remember my browsing"?</h3>
  <p>Private browsing keeps no cookies, logins or history once a page closes. "Don't remember my browsing" keeps you signed in to sites but adds nothing to history.</p>
  <h3>Face ID isn't asking when I come back.</h3>
  <p>Turn on <strong>Lock with Face ID</strong> in FreeView's Settings, and make sure FreeView is allowed in iOS Settings → Face ID &amp; Passcode → Other Apps.</p>
  <h3>Night mode looks too bright on a white page.</h3>
  <p>Turn on <strong>Darken web pages</strong> under Night mode in Settings.</p>

  <h2>FreeView Pro</h2>
  <h3>What does Pro add?</h3>
  <p>Free keeps your three most recent presentations (single files and pages are unlimited) and shares one link at a time, for up to a week, up to 250 MB. Pro keeps every presentation and shares as many links as you like, up to 2 GB each, for up to 90 days or with no end date, with passwords, views per slide and no FreeView mark. Viewing, presenting, editing, custom slides and styles are free for everyone.</p>
  <h3>How do I restore my purchase?</h3>
  <p>Settings → <strong>Restore Purchases</strong>, on a device signed in to the same Apple Account.</p>
  <h3>How do I cancel or get a refund?</h3>
  <p>Cancel in iOS Settings → Apple Account → Subscriptions (or <strong>Manage Subscription</strong> in FreeView's Settings). Refunds are handled by Apple at <a href="https://reportaproblem.apple.com">reportaproblem.apple.com</a>.</p>

  <h2>Your data</h2>
  <p>Everything stays on your device. Swipe an item to remove it, or use <strong>Clear History</strong> in Settings to remove everything, including imported files. See the <a href="privacy.html">privacy policy</a>.</p>
"""

NOT_FOUND = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FreeView</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/png" href="/logo.png">
<style>
  html{-webkit-font-smoothing:antialiased}
  body{margin:0;background:#000;color:#fff;font-family:ui-rounded,-apple-system,system-ui,sans-serif;
    display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}
  a{color:#fff}
</style>
</head>
<body>
<p>Page not found. <a href="/">FreeView</a></p>
</body>
</html>
"""

PAGES = {
    "index.html": HEAD.format(title="FreeView — Any mix of files, one presentation, one link", path="",
                              desc="Easy to build, easier to share: turn Keynote, PDFs, videos, photos, 3D and more into one presentation on iPhone, iPad and Mac, and send one link that plays on any screen, whatever the size.",
                              css=INDEX_CSS) + INDEX_BODY,
    "privacy.html": legal("Privacy Policy", "How FreeView handles your data: on your device, except presentations you share.", "Privacy Policy", PRIVACY, "privacy.html"),
    "terms.html": legal("Terms of Use", "Terms of use for FreeView and FreeView Pro.", "Terms of Use", TERMS, "terms.html"),
    "support.html": legal("Support", "Help with FreeView: opening files, presentations, kiosk mode, night mode and FreeView Pro.", "Support", SUPPORT, "support.html"),
    "404.html": NOT_FOUND,
}

for name, html in PAGES.items():
    (OUT / name).write_text(html)
    print("wrote", name, len(html))
