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
UPDATED = "9 October 2026"
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
.duo{position:relative;width:min(760px,92vw);margin:16px auto 0;padding-right:min(120px,14vw)}
.duo .tab{width:100%;border-radius:30px;border:1px solid var(--line);background:#000;padding:10px;box-shadow:0 30px 80px rgba(0,0,0,.7)}
.duo .tab img{width:100%;height:auto;display:block;border-radius:20px}
.duo .ph{position:absolute;right:0;bottom:-28px;width:min(220px,30vw);border-radius:34px;border:1px solid var(--line);background:#000;padding:7px;
  box-shadow:0 30px 80px rgba(0,0,0,.85)}
.duo .ph img{width:100%;height:auto;display:block;border-radius:27px}
.appstore{display:inline-block;margin:0 auto}
.appstore img{height:56px;width:auto;display:block}
.heroBadge{margin:66px auto 12px}
.storenote{margin:0 auto 24px;font-size:13px;font-weight:300;color:var(--muted)}
.ctarow{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.cta{display:inline-flex;gap:8px;align-items:center;background:#fff;color:#000;font-weight:600;padding:13px 24px;border-radius:16px;font-size:16px;
  transition-property:scale;transition-duration:120ms;transition-timing-function:ease-out}
.cta:active{scale:.96}
.cta.ghost{background:var(--surface);color:var(--ink);box-shadow:inset 0 0 0 1px var(--line)}
.dots{display:flex;gap:7px;justify-content:center;margin-top:38px}
.dots i{width:7px;height:7px;border-radius:99px;background:rgba(255,255,255,.22)}
.dots i.on{width:22px;background:#fff}

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
  .feat .bul{align-items:center}
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
.field .typed{display:inline-block;overflow:hidden;width:0;animation:type 6s steps(12,end) infinite;vertical-align:bottom}
.field .caret{display:inline-block;width:1.5px;height:15px;background:#fff;margin-left:1px;animation:caret 1s step-end infinite}
@keyframes type{0%,8%{width:0}40%,100%{width:12ch}}
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
  .field .typed{width:12ch}.counter .n b:first-child{opacity:1}}
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

FEATURES = "\n".join([
    feature("Open anything", "Type an address, paste a link, or pick a file. Web pages, PDFs, videos, photos and HTML prototypes open edge to edge, with no browser bars and no app chrome in the way.",
            [("globe", "Any web address, or a search, saved for offline if you like"), ("doc", "PDFs, videos, photos, Office and Keynote files"),
             ("code", "HTML prototypes with their CSS and JavaScript"), ("folder", "Single files or whole folders, from Files, Photos, AirDrop or Mail")], MOCK_OPEN),
    feature("PDFs become slides", "Open a PDF and swipe through it a page at a time, on black, scaled to fit. Pinch to zoom in, and a quiet page counter fades away after each turn.",
            [("stack", "One page at a time, edge to edge"), ("keys", "Presentation clickers and arrow keys"), ("airplay", "AirPlay to a bigger screen")], MOCK_SLIDES, flip=True),
    feature("Instant presentations", "Pick several files or photos and FreeView turns them into a deck, one item per slide. A multi-page PDF becomes one slide per page, and a video plays when its slide comes up.",
            [("photo", "Photos, PDFs, videos and pages together"), ("play", "Videos play only on their slide, looping if you like"), ("check", "In the order you picked them")], MOCK_DECK),
    feature("Kiosk mode", "Hand someone your iPad with something on screen and nothing else. No buttons, no menus. Leaving takes your PIN: touch and hold with three fingers, shake the device, or press ⌘. on a keyboard.",
            [("lock", "Nothing drawn over what you show"), ("hand", "Three fingers, a shake or ⌘., then your PIN"), ("check", "Pairs with Guided Access to stay in the app")], MOCK_KIOSK, flip=True),
    feature("Night mode", "Everything turns deep red on black, web pages and videos included, so the screen is easy on dark-adapted eyes. Keep it on, or let it come on after 9 pm.",
            [("moon", "Deep red on black, pages and videos too"), ("clock", "Always, or from 9 pm to 6 am"), ("check", "White pages darkened, not glowing red")], MOCK_NIGHT),
    feature("Private by design", "No account, no ads, no tracking. Your history and files stay on your device, and you decide how much of it FreeView remembers.",
            [("eyeslash", "Private browsing keeps no cookies or history"), ("check", "Or stay signed in and keep no history"), ("face", "Lock with Face ID or Touch ID")], MOCK_PRIVATE, flip=True),
])

INDEX_BODY = f"""{ICONS}
<header class="hero">
  <div class="logo" role="img" aria-label="FreeView"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="{MARK_PATH}"/></svg></div>
  <h1>FreeView</h1>
  <p class="tag">View and present anything, full screen. Web pages, PDFs, videos, photos and prototypes, with nothing in the way.</p>
  <div class="duo">
    <div class="tab"><img src="shot-ipad-pdf.webp" width="880" height="1260" alt="A PDF slide shown full screen on iPad"></div>
    <div class="ph"><img src="shot-home.webp" width="612" height="1330" alt="The FreeView home screen on iPhone, with an address field and recent items"></div>
  </div>
  <a class="appstore heroBadge" href="{STORE}" target="_blank" rel="noopener" aria-label="Download FreeView on the App Store">
    <img src="appstore-badge.svg" alt="Download on the App Store">
  </a>
  <p class="storenote">For iPhone, iPad and Mac · Free to start · The new 2.0 is in beta on TestFlight</p>
  <div class="ctarow">
    <a class="cta" href="{TESTFLIGHT}" target="_blank" rel="noopener">Join the 2.0 beta</a>
    <a class="cta ghost" href="#tour">See the tour</a>
    <a class="cta ghost" href="support.html">Support</a>
  </div>
  <div class="dots" aria-hidden="true"><i class="on"></i><i></i><i></i><i></i><i></i><i></i></div>
</header>

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
      <div class="shotframe"><img src="shot-paywall.webp" width="612" height="1330" alt="FreeView Pro: yearly with a free week, or lifetime" loading="lazy"></div>
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
    <p>Viewing, presenting, kiosk mode, night mode and private browsing are free, and FreeView keeps your three most recent items. FreeView Pro keeps your whole history.</p>
    <div class="price">
      <div class="cardp best"><div class="amt">$4.99</div><div class="per">Pro · yearly · first week free</div></div>
      <div class="cardp"><div class="amt">$9.99</div><div class="per">Lifetime · pay once</div></div>
    </div>
    <p style="font-size:13px;margin-top:16px">US prices; your App Store shows local pricing. The yearly plan renews automatically unless cancelled at least 24 hours before the period ends; manage it in Settings → Apple Account → Subscriptions.</p>
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


def legal(title, desc, heading, body):
    return HEAD.format(title=f"FreeView — {title}", desc=desc, css=LEGAL_CSS) + f"""<div class="wrap">
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

  <p class="lead">FreeView shows web pages and files full screen, and it keeps what you open on your device. It has no accounts, no analytics, no advertising and no developer server.</p>

  <p><span class="pill">In short</span>&nbsp; Your history, files and settings stay on your device. The only thing that ever leaves it is the record of a FreeView Pro purchase, handled anonymously by RevenueCat so your purchase can be unlocked and restored.</p>

  <hr>

  <h2>What FreeView stores, and where</h2>
  <ul>
    <li><strong>History</strong>: the addresses, titles and dates of what you open, and any names you give them, in a file inside FreeView on your device.</li>
    <li><strong>Files you open</strong>: PDFs, videos, photos, HTML prototypes and presentations are copied into FreeView's own storage on your device, so they keep working after the original moves.</li>
    <li><strong>Settings</strong>: choices such as private browsing, night mode, kiosk mode and looping videos, on your device.</li>
    <li><strong>Kiosk PIN</strong>: stored in your device's Keychain as a salted hash, on this device only. We never see it.</li>
    <li><strong>Web data</strong>: cookies, site storage and cache are kept by Apple's WebKit on your device, as in Safari. With <strong>Private browsing</strong> on, they last only while a page is open and nothing is added to history. With <strong>Don't remember my browsing</strong> on, nothing is added to history.</li>
  </ul>
  <p>None of this is sent to us, and we have no way to read it. It may be included in your device's own iCloud or computer backup, under Apple's terms.</p>

  <h2>Face ID and Touch ID</h2>
  <p>Used only if you turn on <strong>Lock with Face ID</strong>, to unlock FreeView when you come back to it. Face ID and Touch ID are handled entirely by your device; FreeView never receives your face or fingerprint data.</p>

  <h2>Photos and files</h2>
  <p>FreeView uses the system pickers, so it can only see the items you choose. It never gets access to your whole photo library.</p>

  <h2>Purchases</h2>
  <p>FreeView Pro is sold through the App Store. To unlock and restore it, FreeView uses <a href="https://www.revenuecat.com/privacy/">RevenueCat</a>, which receives an anonymous app user identifier and your App Store receipt (what you bought and when). It does not receive your name, email or Apple Account details. Payments themselves are handled by Apple.</p>

  <h2>What we don't collect</h2>
  <ul>
    <li>No accounts, names, email addresses or phone numbers</li>
    <li>No browsing history, file contents or search terms</li>
    <li>No location, contacts, camera or microphone</li>
    <li>No advertising identifiers, tracking or analytics</li>
    <li>No crash reports sent to us</li>
  </ul>

  <h2>Websites you visit</h2>
  <p>Pages you open in FreeView load directly from their own servers, and those sites have their own privacy policies. FreeView adds nothing to those requests.</p>

  <h2>Children</h2>
  <p>FreeView is not directed at children and does not knowingly collect information from anyone.</p>

  <h2>Deleting your data</h2>
  <p>Swipe an item in Recent to remove it, use <strong>Clear History</strong> in Settings to remove everything including imported files, or delete the app.</p>

  <h2>Changes</h2>
  <p>If this policy changes, the date above changes with it, and the new version appears here.</p>

  <h2>Contact</h2>
  <p><a href="mailto:{EMAIL}">{EMAIL}</a></p>
"""

TERMS = f"""  <p class="muted">Last updated: {UPDATED}</p>

  <p class="lead">These terms cover your use of FreeView, made by FRANCESCO BERTOCCI, LLC. By using the app you agree to them and to Apple's <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Standard End User License Agreement</a>.</p>

  <hr>

  <h2>The service</h2>
  <p>FreeView shows web pages and files full screen: PDFs, videos, images, HTML prototypes and presentations, with private browsing, night mode, kiosk mode and Face ID lock. It is free to use and keeps your three most recent items. FreeView Pro keeps your whole history.</p>

  <h2>FreeView Pro and subscriptions</h2>
  <ul>
    <li><strong>Plans:</strong> Yearly, $4.99 per year, starting with a one-week free trial for eligible Apple Accounts; Lifetime, $9.99, a one-time purchase. Prices are in US dollars; the App Store shows local pricing.</li>
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

  <h2>Acceptable use</h2>
  <p>Don't use FreeView to display content that is illegal, or that you don't have the right to show. Kiosk mode limits what a viewer can do inside FreeView; it is not a security boundary for the device. Use Guided Access if an iPhone or iPad must stay locked to the app.</p>

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
  <p>Web addresses, PDFs, videos, audio, photos and images, HTML files or folders (with their CSS and JavaScript), and anything WebKit can render, such as Office and Keynote files, text, GIF and SVG.</p>
  <h3>How do I open a file from another app?</h3>
  <p>Tap <strong>File</strong> on the home screen to pick from Files or Photos, use <strong>Share → FreeView</strong> (or <strong>Open in…</strong>) from Files, Mail or AirDrop, or on iPad and Mac drag files onto the home screen.</p>
  <h3>Can I open a whole folder?</h3>
  <p>Yes. Choose <strong>File or Folder</strong> and pick a folder. If it has an HTML page (an <code>index.html</code>, or the first one FreeView finds), it opens as that page with its CSS, JavaScript and images. Otherwise everything FreeView can show inside it (photos, PDFs, videos, documents) becomes a presentation, in name order.</p>
  <h3>Can I save a web page to read offline?</h3>
  <p>Open the page, tap the round button in the corner and choose <strong>Save for Offline</strong>. FreeView keeps the page with its images and styles; it appears in Recent and opens without a connection. Pages that load their content later through JavaScript (feeds, maps) may be incomplete offline.</p>
  <h3>How do I make a presentation?</h3>
  <p>Tap <strong>File</strong>, then choose <strong>Files</strong> or <strong>Photos and Videos</strong> under "Present several". Items appear in the order you picked them, one per slide; a multi-page PDF becomes one slide per page. Swipe, or use a presentation clicker or the arrow keys.</p>
  <h3>How do I leave a page?</h3>
  <p>Tap the round button in the corner and choose <strong>Close</strong>. It fades after a few seconds but stays tappable. With a keyboard, press ⌘. (or ⌘W on iPad).</p>

  <h2>Kiosk mode</h2>
  <h3>How do I exit kiosk mode?</h3>
  <p>Touch and hold anywhere with three fingers, shake the device, or press ⌘. on a keyboard, then enter your PIN. If you use iOS Zoom, its three-finger gestures can get in the way; shaking always works.</p>
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
  <p>Your whole history. Free keeps the three most recent items; everything else in FreeView is free.</p>
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
    "index.html": HEAD.format(title="FreeView — View and present anything, full screen",
                              desc="FreeView shows web pages, PDFs, videos, photos and prototypes full screen on iPhone, iPad and Mac, with instant presentations, kiosk mode and a red night mode.",
                              css=INDEX_CSS) + INDEX_BODY,
    "privacy.html": legal("Privacy Policy", "How FreeView handles your data: it stays on your device.", "Privacy Policy", PRIVACY),
    "terms.html": legal("Terms of Use", "Terms of use for FreeView and FreeView Pro.", "Terms of Use", TERMS),
    "support.html": legal("Support", "Help with FreeView: opening files, presentations, kiosk mode, night mode and FreeView Pro.", "Support", SUPPORT),
    "404.html": NOT_FOUND,
}

for name, html in PAGES.items():
    (OUT / name).write_text(html)
    print("wrote", name, len(html))
