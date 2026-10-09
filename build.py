#!/usr/bin/env python3
"""Generates the FreeView site (index, privacy, terms, support) into the folder given as argv[1].
One shared inline stylesheet; every page self-contained, no external assets."""
import sys, pathlib
OUT = pathlib.Path(sys.argv[1])
YEAR = "2026"
UPDATED = "October 9, 2026"
EMAIL = "hello@freeview.app"

CSS = """
:root{--ink:#141414;--muted:#5f5f5b;--canvas:#f5f5f2;--surface:#ffffff;--accent:#141414;--line:oklch(0 0 0 / .1);
  --shadow:0 1px 1px oklch(0 0 0 / .04),0 4px 12px oklch(0 0 0 / .05),0 18px 40px oklch(0 0 0 / .06)}
@media (prefers-color-scheme:dark){:root{--ink:#f2f2ef;--muted:#a3a39e;--canvas:#0d0d0d;--surface:#181818;--accent:#f2f2ef;--line:oklch(1 0 0 / .1);
  --shadow:0 1px 1px oklch(0 0 0 / .3),0 6px 18px oklch(0 0 0 / .35)}}
*{box-sizing:border-box}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{margin:0;background:var(--canvas);color:var(--ink);font-family:ui-serif,Georgia,"Times New Roman",serif;line-height:1.6}
a{color:var(--ink);text-decoration-thickness:1px;text-underline-offset:3px}
a:hover{text-decoration-thickness:2px}
h1,h2,h3{text-wrap:balance;font-weight:300}
p,li{text-wrap:pretty}
.wrap{max-width:760px;margin:0 auto;padding:44px 20px 72px}
nav{display:flex;justify-content:space-between;align-items:center;font-size:14px;gap:12px}
nav .brand{display:flex;align-items:center;gap:8px;font-style:italic;letter-spacing:2px;text-transform:uppercase;color:var(--ink);text-decoration:none}
nav .brand svg{width:18px;height:18px}
nav .links a{margin-left:16px;color:var(--muted);text-decoration:none;display:inline-block;padding:12px 0}
nav .links a:hover{color:var(--ink)}
.hero{text-align:center;padding:56px 0 8px}
.kicker{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);font-style:italic}
h1{font-size:clamp(38px,7vw,54px);font-style:italic;margin:12px 0 14px;line-height:1.08}
.lead{font-size:19px;color:var(--muted);max-width:540px;margin:0 auto;font-style:italic}
.cta-row{text-align:center;margin:28px 0 4px}
.cta{display:inline-block;background:var(--ink);color:var(--canvas);font:italic 500 16px/1 ui-serif,Georgia,serif;padding:16px 30px;border-radius:999px;
  box-shadow:var(--shadow);text-decoration:none;transition-property:scale,box-shadow;transition-duration:150ms;transition-timing-function:ease-out}
a.cta:active{scale:.96}
.cta-note{font-size:13px;color:var(--muted);font-style:italic;margin:12px 0 0}
.pager{margin:44px auto 8px;max-width:460px}
.stage{position:relative;background:var(--surface);border-radius:32px;min-height:440px;overflow:hidden;box-shadow:var(--shadow);touch-action:pan-y}
.slide{position:absolute;inset:0;padding:40px 28px 36px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;
  opacity:0;translate:0 6px;pointer-events:none;transition-property:opacity,translate;transition-duration:320ms;transition-timing-function:ease-out}
.slide.active{opacity:1;translate:0 0;pointer-events:auto}
.art{width:200px;height:170px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;color:var(--ink)}
.art svg{width:100%;height:100%}
.num{font-size:11px;letter-spacing:3px;text-transform:uppercase;font-style:italic;color:var(--muted)}
.title{font-size:30px;font-style:italic;margin:8px 0 0;line-height:1.15}
.rule{width:48px;height:1px;background:var(--line);margin:16px auto}
.body{font-size:15px;font-style:italic;color:var(--muted);margin:0;max-width:330px}
.dots{display:flex;gap:0;justify-content:center;margin-top:10px}
.dot{width:36px;height:44px;border:0;background:none;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center}
.dot::before{content:"";width:6px;height:6px;border-radius:99px;background:var(--line);transition-property:width,background-color;transition-duration:150ms;transition-timing-function:ease-out}
.dot[aria-current="true"]::before{width:22px;background:var(--ink)}
.features{display:grid;grid-template-columns:1fr;gap:16px;margin:56px 0}
@media (min-width:620px){.features{grid-template-columns:1fr 1fr}}
.card{background:var(--surface);border-radius:24px;padding:24px;box-shadow:var(--shadow)}
.card h3{margin:0 0 6px;font-size:19px;font-style:italic}
.card p{margin:0;font-size:15px;color:var(--muted)}
.price{text-align:center;margin:56px 0}
.price h2{font-size:28px;font-style:italic;margin:0 0 10px}
.plans{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin:22px 0 10px}
.plan{background:var(--surface);border-radius:24px;padding:20px 26px;min-width:200px;box-shadow:var(--shadow)}
.plan .name{font-size:13px;letter-spacing:2px;text-transform:uppercase;font-style:italic;color:var(--muted)}
.plan .amt{font-size:26px;font-variant-numeric:tabular-nums;margin-top:4px}
.plan .per{font-size:14px;color:var(--muted);font-style:italic}
.fine{font-size:13px;color:var(--muted);font-style:italic;max-width:560px;margin:10px auto 0}
hr{border:0;border-top:1px solid var(--line);margin:48px 0}
footer{text-align:center;font-size:13px;color:var(--muted)}
footer a{color:var(--muted)}
.doc h1{font-size:40px;text-align:left;margin:40px 0 6px}
.doc .date{color:var(--muted);font-style:italic;font-size:14px;margin:0 0 24px}
.doc h2{font-size:24px;font-style:italic;margin:36px 0 8px}
.doc h3{font-size:18px;font-style:italic;margin:22px 0 4px}
.doc p,.doc li{font-size:17px}
.doc ul{padding-left:22px}
.pill{background:var(--surface);border-radius:20px;padding:18px 22px;box-shadow:var(--shadow);margin:20px 0}
.pill p{margin:0;font-size:16px}
.contact{background:var(--surface);border-radius:24px;padding:24px;box-shadow:var(--shadow);margin:28px 0}
.contact p{margin:6px 0 0;color:var(--muted)}
.contact a.mail{font-size:20px;font-style:italic}
"""

MARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 9V6.5A2.5 2.5 0 0 1 6.5 4H9M15 4h2.5A2.5 2.5 0 0 1 20 6.5V9M20 15v2.5a2.5 2.5 0 0 1-2.5 2.5H15M9 20H6.5A2.5 2.5 0 0 1 4 17.5V15"/></svg>'

def page(title, desc, body, script=""):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='5' fill='%23000'/%3E%3Cpath d='M6 10V8a2 2 0 0 1 2-2h2M14 6h2a2 2 0 0 1 2 2v2M18 14v2a2 2 0 0 1-2 2h-2M10 18H8a2 2 0 0 1-2-2v-2' stroke='%23fff' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E">
<style>{CSS}</style>
</head>
<body>
<div class="wrap">
<nav>
  <a class="brand" href="./">{MARK}FreeView</a>
  <span class="links"><a href="support.html">Support</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a></span>
</nav>
{body}
<hr>
<footer>
  <p>© {YEAR} FRANCESCO BERTOCCI, LLC · <a href="support.html">Support</a> · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="mailto:{EMAIL}">{EMAIL}</a></p>
</footer>
</div>
{script}
</body>
</html>
"""

# ── inline art for the pager (stroke = currentColor, follows light/dark)
A = 'viewBox="0 0 200 170" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'
ART = [
  f'<svg {A}><rect x="40" y="18" width="120" height="134" rx="18"/><path d="M62 52h76M62 72h56M62 92h66" opacity=".35"/><path d="M58 30V26a6 6 0 0 1 6-6h6M130 20h6a6 6 0 0 1 6 6v4M142 140v4a6 6 0 0 1-6 6h-6M70 150h-6a6 6 0 0 1-6-6v-4"/></svg>',
  f'<svg {A}><rect x="58" y="34" width="96" height="70" rx="10" opacity=".35"/><rect x="48" y="44" width="96" height="70" rx="10" opacity=".6"/><rect x="38" y="54" width="96" height="70" rx="10" style="fill:var(--surface)"/><path d="M78 78l20 11-20 11z"/><circle cx="76" cy="146" r="3" fill="currentColor" stroke="none"/><circle cx="90" cy="146" r="3" opacity=".3"/><circle cx="104" cy="146" r="3" opacity=".3"/></svg>',
  f'<svg {A}><rect x="36" y="20" width="128" height="96" rx="14"/><rect x="82" y="90" width="36" height="44" rx="8" style="fill:var(--surface)"/><path d="M90 90v-8a10 10 0 0 1 20 0v8"/><circle cx="100" cy="112" r="3" fill="currentColor" stroke="none"/><path d="M70 150h60" opacity=".35"/></svg>',
  f'<svg {A}><path d="M118 34a50 50 0 1 0 38 70 42 42 0 0 1-38-70z" stroke="#e0241a"/><path d="M60 128h70M70 140h50" stroke="#e0241a" opacity=".5"/></svg>',
]
SLIDES = [
  ("01", "Open anything", "A web address, a PDF, a video, a photo or an HTML prototype. FreeView shows it edge to edge, with nothing in the way."),
  ("02", "Present in a tap", "PDFs become slides. Pick several files and FreeView turns them into a deck, one item per slide."),
  ("03", "Kiosk mode", "Hand over your iPad. Nothing is drawn over what you show, and leaving takes your PIN."),
  ("04", "Night mode", "Everything in deep red on black, web pages and videos included, easy on your eyes in the dark."),
]
slides = "\n".join(f"""    <div class="slide{' active' if i==0 else ''}" role="group" aria-roledescription="slide" aria-label="{n} of 4">
      <div class="art">{ART[i]}</div>
      <div class="num">{n} / 04</div>
      <h2 class="title">{t}</h2>
      <div class="rule"></div>
      <p class="body">{b}</p>
    </div>""" for i,(n,t,b) in enumerate(SLIDES))
dots = "".join(f'<button class="dot" aria-label="Show slide {i+1}"{" aria-current=\"true\"" if i==0 else ""}></button>' for i in range(4))

FEATURES = [
  ("PDFs as slides", "Swipe page by page, pinch to zoom, a quiet page counter that fades away."),
  ("Videos, full screen", "Edge to edge, looping if you like, with AirPlay to a bigger screen."),
  ("Instant presentations", "Photos, PDFs, videos and pages in one deck. A clicker or arrow keys move you along."),
  ("Prototypes that just work", "Open an HTML file or folder with its CSS and JavaScript, from Files, AirDrop or Mail."),
  ("Private by design", "No account, no ads, no tracking. Private browsing, a no-history mode and Face ID lock. Your files stay on your device."),
  ("Minimal on purpose", "One field, one button, your recent items below. Black and white, light or dark, iPhone and iPad."),
]
cards = "\n".join(f'  <div class="card"><h3>{h}</h3><p>{p}</p></div>' for h,p in FEATURES)

index_body = f"""
<header class="hero">
  <div class="kicker">View and present anything, full screen</div>
  <h1>Nothing in the way.</h1>
  <p class="lead">FreeView opens a web page, a PDF, a video, a photo or a prototype edge to edge, so you can show it on your iPhone or iPad without browser bars or app chrome.</p>
</header>
<div class="cta-row">
  <!-- Swap for the App Store link once 2.0 is live:
       <a class="cta" href="https://apps.apple.com/app/id1526222244">Download on the App Store</a> -->
  <a class="cta" href="https://apps.apple.com/app/id1526222244">Get FreeView on the App Store</a>
  <p class="cta-note">Free for iPhone and iPad. Version 2.0 is on its way.</p>
</div>

<section class="pager" aria-roledescription="carousel" aria-label="How FreeView works">
  <div class="stage" id="stage">
{slides}
  </div>
  <div class="dots" id="dots">{dots}</div>
</section>

<section class="features">
{cards}
</section>

<section class="price">
  <h2>Free to use. Pro if you want it all.</h2>
  <p class="lead" style="font-size:17px">Everything above is free and keeps your three most recent items. FreeView Pro keeps your whole history.</p>
  <div class="plans">
    <div class="plan"><div class="name">Yearly</div><div class="amt">$4.99</div><div class="per">per year, first week free</div></div>
    <div class="plan"><div class="name">Lifetime</div><div class="amt">$9.99</div><div class="per">one-time purchase</div></div>
  </div>
  <p class="fine">US prices; your App Store shows local pricing. The yearly plan renews automatically unless cancelled at least 24 hours before the period ends. Manage it in Settings → Apple Account → Subscriptions.</p>
</section>
"""

PAGER_JS = """<script>
(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const dots = [...document.querySelectorAll('.dot')];
  const stage = document.getElementById('stage');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0, timer;
  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
  }
  function restart() { clearInterval(timer); if (!reduce) timer = setInterval(() => show(i + 1), 5000); }
  dots.forEach((d, k) => d.addEventListener('click', () => { show(k); restart(); }));
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { show(i + 1); restart(); }
    if (e.key === 'ArrowLeft') { show(i - 1); restart(); }
  });
  let x0 = null;
  stage.addEventListener('pointerdown', e => { x0 = e.clientX; });
  stage.addEventListener('pointerup', e => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { show(i + (dx < 0 ? 1 : -1)); restart(); }
  });
  restart();
})();
</script>"""

privacy_body = f"""
<article class="doc">
<h1>Privacy Policy</h1>
<p class="date">Last updated {UPDATED}</p>
<p>FreeView is made by FRANCESCO BERTOCCI, LLC. It is built to keep what you open on your device. There is no account, no analytics, no advertising and no developer server.</p>
<div class="pill"><p><strong>In short:</strong> your history, files and settings stay on your device. The only thing that leaves it is the record of a FreeView Pro purchase, handled anonymously by RevenueCat so your purchase can be unlocked and restored.</p></div>

<h2>What FreeView stores, and where</h2>
<ul>
  <li><strong>History</strong>: the addresses, titles and dates of what you open, and any names you give them. Stored in a file inside FreeView on your device.</li>
  <li><strong>Files you open</strong>: PDFs, videos, photos, HTML prototypes and presentations are copied into FreeView's own storage on your device, so they keep working after the original moves.</li>
  <li><strong>Settings</strong>: choices such as private browsing, night mode, kiosk mode and looping videos, on your device.</li>
  <li><strong>Kiosk PIN</strong>: stored in your device's Keychain as a salted hash, on this device only. We never see it.</li>
  <li><strong>Web data</strong>: cookies, site storage and cache are kept by Apple's WebKit on your device, as in Safari. With <em>private browsing</em> on, they last only while a page is open and nothing is added to history. With <em>Don't remember my browsing</em> on, nothing is added to history.</li>
</ul>
<p>None of this is sent to us, and we have no way to read it. It may be included in your device's own iCloud or computer backup, under Apple's terms.</p>

<h2>Device permissions</h2>
<ul>
  <li><strong>Face ID</strong> (optional): used only to unlock FreeView when you come back to it, if you turn on <em>Lock with Face ID</em>. Face ID is handled entirely by iOS; FreeView never receives your face data.</li>
  <li><strong>Photos and files</strong>: FreeView uses the system pickers, so it can only see the items you choose. It does not get access to your whole library.</li>
</ul>

<h2>Purchases</h2>
<p>FreeView Pro is sold through the App Store. To unlock and restore it, FreeView uses <a href="https://www.revenuecat.com/privacy/">RevenueCat</a>, which receives an anonymous app user identifier and your App Store receipt (what you bought and when). It does not receive your name, email or Apple Account details. Payments themselves are handled by Apple.</p>

<h2>What we do not collect</h2>
<ul>
  <li>No accounts, names, email addresses or phone numbers</li>
  <li>No browsing history, file contents or search terms</li>
  <li>No location, contacts, camera or microphone</li>
  <li>No advertising identifiers, tracking or analytics</li>
  <li>No crash reports sent to us</li>
</ul>

<h2>Websites you visit</h2>
<p>Pages you open in FreeView are loaded directly from their own servers, and those sites have their own privacy policies. FreeView does not add anything to those requests.</p>

<h2>Children</h2>
<p>FreeView is not directed at children and does not knowingly collect information from anyone.</p>

<h2>Deleting your data</h2>
<p>Swipe an item in Recent to remove it, use <em>Clear History</em> in Settings to remove everything including imported files, or delete the app.</p>

<h2>Changes</h2>
<p>If this policy changes, the date above changes with it, and the new version appears here.</p>

<h2>Contact</h2>
<p>Questions: <a href="mailto:{EMAIL}">{EMAIL}</a></p>
</article>
"""

terms_body = f"""
<article class="doc">
<h1>Terms of Use</h1>
<p class="date">Last updated {UPDATED}</p>
<p>These terms cover your use of FreeView, made by FRANCESCO BERTOCCI, LLC. By using the app you agree to them and to Apple's <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Standard End User License Agreement</a>.</p>

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
  <li><strong>Restore:</strong> use <em>Restore Purchases</em> in Settings on any device signed in to the same Apple Account.</li>
</ul>

<h2>License</h2>
<p>You may use FreeView on Apple devices you own or control, as described in Apple's Standard EULA. You may not copy, modify or reverse engineer the app except where the law allows it.</p>

<h2>Your content</h2>
<p>The files and pages you open remain yours. You are responsible for having the right to view and show them, especially when presenting to others or leaving FreeView in kiosk mode in a public place.</p>

<h2>Acceptable use</h2>
<p>Don't use FreeView to display content that is illegal, or that you don't have the right to show. Kiosk mode limits what a viewer can do inside FreeView; it is not a security boundary for the device. Use Guided Access if a device must stay locked to the app.</p>

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
</article>
"""

support_body = f"""
<article class="doc">
<h1>Support</h1>
<div class="contact">
  <a class="mail" href="mailto:{EMAIL}?subject=FreeView%20support">{EMAIL}</a>
  <p>Please include your device, iOS version and FreeView version (Settings, at the bottom). Replies usually within two working days.</p>
</div>

<h2>Opening things</h2>
<h3>What can FreeView open?</h3>
<p>Web addresses, PDFs, videos, audio, photos and images, HTML files or folders (with their CSS and JavaScript), and anything WebKit can render, such as Office and Keynote files, text, GIF and SVG.</p>
<h3>How do I open a file from another app?</h3>
<p>Tap <em>File</em> on the home screen to pick from Files or Photos, or use <em>Share → FreeView</em> (or <em>Open in…</em>) from Files, Mail or AirDrop.</p>
<h3>How do I make a presentation?</h3>
<p>Tap <em>File</em>, then choose <em>Files</em> or <em>Photos and Videos</em> under "Present several". Items appear in the order you picked them, one per slide; a multi-page PDF becomes one slide per page. Swipe, or use a presentation clicker or the arrow keys.</p>
<h3>How do I leave a page?</h3>
<p>Tap the round button in the corner and choose <em>Close</em>. It fades after a few seconds but stays tappable.</p>

<h2>Kiosk mode</h2>
<h3>How do I exit kiosk mode?</h3>
<p>Touch and hold anywhere with three fingers, or shake the device, then enter your PIN. If you use iOS Zoom, its three-finger gestures can get in the way; shaking always works.</p>
<h3>I forgot my PIN.</h3>
<p>Force-quit FreeView (swipe up from the app switcher) and reopen it; you'll land on the home screen. Then go to Settings, turn kiosk mode off and on again to set a new PIN.</p>
<h3>Can people leave the app?</h3>
<p>Kiosk mode controls what happens inside FreeView. To keep a device locked to FreeView, also turn on Guided Access: Settings → Accessibility → Guided Access.</p>
<h3>Using a keyboard, or FreeView on a Mac?</h3>
<p>Press ⌘. (Command-period) to leave a page; in kiosk mode it asks for your PIN. On an iPad keyboard ⌘W closes the page too. On a Mac, FreeView runs as an iPad app in a window: kiosk mode hides the controls, but macOS always lets people close or quit the window, so use it for presenting rather than unattended kiosks.</p>

<h2>Privacy and night mode</h2>
<h3>What's the difference between private browsing and "Don't remember my browsing"?</h3>
<p>Private browsing keeps no cookies, logins or history once a page closes. "Don't remember my browsing" keeps you signed in to sites but adds nothing to history.</p>
<h3>Face ID isn't asking when I come back.</h3>
<p>Turn on <em>Lock with Face ID</em> in FreeView's Settings, and make sure FreeView is allowed in iOS Settings → Face ID &amp; Passcode → Other Apps.</p>
<h3>Night mode looks too bright on a white web page.</h3>
<p>Turn on <em>Darken web pages</em> under Night mode in Settings.</p>

<h2>FreeView Pro</h2>
<h3>What does Pro add?</h3>
<p>Your whole history. Free keeps the three most recent items; everything else in FreeView is free.</p>
<h3>How do I restore my purchase?</h3>
<p>Settings → <em>Restore Purchases</em>, on a device signed in to the same Apple Account.</p>
<h3>How do I cancel or get a refund?</h3>
<p>Cancel in iOS Settings → Apple Account → Subscriptions (or <em>Manage Subscription</em> in FreeView's Settings). Refunds are handled by Apple at <a href="https://reportaproblem.apple.com">reportaproblem.apple.com</a>.</p>

<h2>Your data</h2>
<p>Everything stays on your device. Swipe an item to remove it, or use <em>Clear History</em> in Settings to remove everything, including imported files. See the <a href="privacy.html">privacy policy</a>.</p>
</article>
"""

pages = {
  "index.html": page("FreeView: view and present anything, full screen",
    "FreeView shows web pages, PDFs, videos, photos and prototypes full screen on iPhone and iPad, with presentations, kiosk mode and a red night mode.",
    index_body, PAGER_JS),
  "privacy.html": page("Privacy Policy · FreeView", "How FreeView handles your data: it stays on your device.", privacy_body),
  "terms.html": page("Terms of Use · FreeView", "Terms of use for FreeView and FreeView Pro.", terms_body),
  "support.html": page("Support · FreeView", "Help with FreeView: opening files, presentations, kiosk mode, night mode and FreeView Pro.", support_body),
}
for name, html in pages.items():
    (OUT / name).write_text(html)
    print("wrote", name, len(html))
