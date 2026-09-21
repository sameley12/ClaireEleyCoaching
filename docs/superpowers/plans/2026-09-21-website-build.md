# Claire Eley Coaching Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fast, professional single-page coaching website whose one job is to get visitors to book a free discovery call.

**Architecture:** A hand-built static site (HTML, one CSS file, one small JS file) with no build step. Booking uses a lazily-loaded Calendly pop-up; the lead magnet is an embedded GHL form. A small Python check script acts as the "test suite" (links, alt text, headings, placeholders).

**Tech Stack:** HTML5, CSS3 (custom properties, grid, flexbox), vanilla JS, Python 3 (check script only), Cloudflare Pages or Netlify for hosting.

Spec: `docs/superpowers/specs/2026-09-21-website-design.md`

## Global Constraints

- Site root is `/Users/sameley/Desktop/Claire Eley Consulting & Coaching` (paths below are relative to it).
- No frameworks, no build tools, no npm dependencies in the site itself.
- Brand: warm and personal. Colours and fonts live ONLY as CSS variables at the top of `css/styles.css`.
- Fonts: system font stacks only (no Google Fonts). This avoids a UK GDPR issue and keeps the site fast.
- Mobile first: base styles are for phones; widen with `@media (min-width: 800px)`.
- The "Book a call" button is visible in the header at every width and repeated in the hero and final section.
- No invented facts: no accreditation badges, no fake testimonials, no statistics. Unknown facts appear as `[Bracketed placeholders]` in copy and as `REPLACE_...` tokens in config. `python3 scripts/check.py --launch` fails while any remain.
- Tone: warm, plain-spoken, confident. Avoid jargon such as "unlock your potential".
- No tracking cookies. Calendly's script loads only when a visitor clicks a booking button.
- Language: `lang="en-GB"`, British spelling.
- Commit messages end with the trailer `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` (added as a second `-m`).
- Deviation from spec section 4: the FAQ uses native `<details>` (no JS), and the mobile header collapses to logo plus "Book a call" (no menu JS). So `js/main.js` only contains the booking pop-up. Task 1 amends the spec to match.

## File Structure

```
index.html              Homepage: header, 9 sections, footer
privacy.html            Privacy and cookie notice
thank-you.html          Lead-magnet confirmation
css/styles.css          Tokens, base, layout, all section styles
js/main.js              Calendly pop-up loader (only behaviour)
images/placeholder-portrait.svg   Stand-in until Claire's photos are added
robots.txt, sitemap.xml
scripts/check.py        Static checks (the site's test suite)
.gitignore
```

---

### Task 1: Scaffold, check script, design tokens

**Files:**
- Create: `.gitignore`, `scripts/check.py`, `index.html`, `css/styles.css`, `js/main.js`
- Modify: `docs/superpowers/specs/2026-09-21-website-design.md` (section 4 note)

**Interfaces:**
- Produces: CSS variables `--cream --sand --ink --muted --terracotta --terracotta-dark --white`, `--serif`, `--sans`; layout classes `.container`, `.section`, `.section--alt`, `.btn`, `.btn--primary`, `.btn--ghost`, `.eyebrow`; `index.html` with `<main id="top">…</main>` (later tasks insert content before `</main>`); `scripts/check.py [--launch] [page ...]`.

- [ ] **Step 1: Initialise git and ignore tooling folders**

```bash
cd "/Users/sameley/Desktop/Claire Eley Consulting & Coaching"
git init
printf '.superpowers/\n.DS_Store\nnode_modules/\n' > .gitignore
mkdir -p css js images scripts
```

- [ ] **Step 2: Write the check script (the failing test)**

Create `scripts/check.py`:

```python
#!/usr/bin/env python3
"""Static site checks.

Usage: python3 scripts/check.py [--launch] [page.html ...]
Without page arguments all pages are checked. --launch also fails on
unreplaced placeholders such as REPLACE_DOMAIN or [Offer name].
"""
import pathlib
import re
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ["index.html", "privacy.html", "thank-you.html"]
LAUNCH_FILES = PAGES + ["js/main.js", "robots.txt", "sitemap.xml"]
EXTERNAL = ("http://", "https://", "mailto:", "tel:", "javascript:", "//")
PLACEHOLDER = re.compile(r"REPLACE_[A-Z_]+|\[[A-Za-z][^\]\n]*\]")


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.ids, self.errors = [], set(), []
        self.h1 = 0
        self.title = False
        self.desc = False
        self.lang = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "html" and a.get("lang"):
            self.lang = True
        if tag == "h1":
            self.h1 += 1
        if tag == "title":
            self.title = True
        if tag == "meta" and a.get("name") == "description" and a.get("content"):
            self.desc = True
        if tag == "img" and "alt" not in a:
            self.errors.append("img without alt: %s" % a.get("src"))
        for key in ("href", "src"):
            if a.get(key):
                self.refs.append(a[key])


def check_page(name):
    path = ROOT / name
    if not path.exists():
        return ["%s: file is missing" % name]
    page = Page()
    page.feed(path.read_text(encoding="utf-8"))
    errors = ["%s: %s" % (name, e) for e in page.errors]
    if not page.lang:
        errors.append("%s: <html> needs a lang attribute" % name)
    if not page.title:
        errors.append("%s: missing <title>" % name)
    if not page.desc:
        errors.append("%s: missing meta description" % name)
    if page.h1 != 1:
        errors.append("%s: expected exactly one <h1>, found %d" % (name, page.h1))
    for ref in page.refs:
        if ref.startswith(EXTERNAL):
            continue
        if ref.startswith("#"):
            if len(ref) > 1 and ref[1:] not in page.ids:
                errors.append("%s: broken anchor %s" % (name, ref))
            continue
        target = ref.split("#")[0].split("?")[0].lstrip("/")
        if target and not (ROOT / target).exists():
            errors.append("%s: broken link or file %s" % (name, ref))
    return errors


def check_launch():
    errors = []
    for name in LAUNCH_FILES:
        path = ROOT / name
        if path.exists():
            for hit in sorted(set(PLACEHOLDER.findall(path.read_text(encoding="utf-8")))):
                errors.append("%s: unreplaced placeholder %s" % (name, hit))
    return errors


def main(argv):
    launch = "--launch" in argv
    pages = [a for a in argv if not a.startswith("--")] or PAGES
    errors = []
    for name in pages:
        errors += check_page(name)
    if launch:
        errors += check_launch()
    for e in errors:
        print("FAIL", e)
    print("%d problem(s)" % len(errors) if errors else "OK")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
```

- [ ] **Step 3: Run it to verify it fails**

Run: `python3 scripts/check.py index.html`
Expected: `FAIL index.html: file is missing` and exit code 1.

- [ ] **Step 4: Write the skeleton and design tokens**

Create `index.html`:

```html
<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Career Change Coach UK | Claire Eley Consulting &amp; Coaching</title>
  <meta name="description" content="Career change coaching in the UK with Claire Eley. Get clarity, confidence and a plan for work that fits you. Book a free discovery call.">
  <link rel="stylesheet" href="css/styles.css">
  <script src="js/main.js" defer></script>
</head>
<body>
<main id="top">
<h1>Claire Eley Consulting &amp; Coaching</h1>
</main>
</body>
</html>
```

Create `js/main.js` (empty for now, one comment line):

```js
// Booking pop-up is added in Task 2.
```

Create `css/styles.css`:

```css
/* ==========================================================
   Claire Eley Consulting & Coaching
   To rebrand: change only the variables in :root.
   ========================================================== */
:root {
  --cream: #f6efe6;
  --sand: #e2cdb5;
  --ink: #2b2a28;
  --muted: #6b5f52;
  --terracotta: #b5573b;
  --terracotta-dark: #9a4830;
  --white: #ffffff;
  --serif: Georgia, "Times New Roman", serif;
  --sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --radius: 14px;
  --maxw: 1080px;
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--cream);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 1.0625rem;
  line-height: 1.65;
}
img { max-width: 100%; display: block; }
a { color: var(--terracotta-dark); }
h1, h2, h3 { font-family: var(--serif); font-weight: 400; line-height: 1.2; margin: 0 0 .6em; }
h1 { font-size: clamp(2rem, 6vw, 3.25rem); }
h2 { font-size: clamp(1.6rem, 4vw, 2.4rem); }
h3 { font-size: 1.3rem; }
p { margin: 0 0 1em; }
:focus-visible { outline: 3px solid var(--terracotta); outline-offset: 3px; }

.container { width: min(100% - 2rem, var(--maxw)); margin-inline: auto; }
.section { padding: 4rem 0; }
.section--alt { background: var(--white); }
.eyebrow {
  font-family: var(--sans); font-size: .8rem; letter-spacing: .12em;
  text-transform: uppercase; color: var(--muted); margin-bottom: .75rem;
}
.lead { font-size: 1.15rem; color: var(--muted); }

.btn {
  display: inline-block; padding: .85rem 1.5rem; border-radius: 999px;
  font-weight: 600; text-decoration: none; text-align: center; cursor: pointer;
  border: 2px solid transparent; font-size: 1rem; font-family: var(--sans);
}
.btn--primary { background: var(--terracotta); color: var(--white); }
.btn--primary:hover { background: var(--terracotta-dark); }
.btn--ghost { border-color: var(--terracotta); color: var(--terracotta-dark); background: transparent; }
.btn--ghost:hover { background: var(--terracotta); color: var(--white); }
.btn--small { padding: .5rem 1rem; font-size: .9rem; }

@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
```

- [ ] **Step 5: Run the check to verify it passes**

Run: `python3 scripts/check.py index.html`
Expected: `OK`

- [ ] **Step 6: Amend the spec and commit**

Edit `docs/superpowers/specs/2026-09-21-website-design.md` section 4: change the `/js/main.js` line to `Booking pop-up loader (FAQ uses native <details>; mobile header collapses to logo and button)`.

```bash
git add -A
git commit -m "chore: scaffold site, design tokens and check script" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Header, hero and booking pop-up

**Files:**
- Modify: `index.html`, `css/styles.css`, `js/main.js`
- Create: `images/placeholder-portrait.svg`

**Interfaces:**
- Consumes: Task 1 classes and variables.
- Produces: any element with class `js-book` opens the Calendly pop-up (JS sets its `href`); anchors `#about`, `#coaching`, `#faq`, `#final-cta` are targeted by nav links (defined in Tasks 3-5); `.arch-photo` class for portrait images.

- [ ] **Step 1: Add the failing check for a broken anchor**

Insert the header (below) and run the check. The nav links point at `#about`, `#coaching`, `#faq`, which do not exist yet.

Replace `<body>\n<main id="top">` in `index.html` with:

```html
<body>
<header class="site-header">
  <div class="container site-header__inner">
    <a class="logo" href="#top">Claire Eley</a>
    <nav class="site-nav" aria-label="Main">
      <a href="#about">About</a>
      <a href="#coaching">Coaching</a>
      <a href="#faq">FAQ</a>
    </nav>
    <a class="btn btn--primary btn--small js-book" href="#final-cta">Book a call</a>
  </div>
</header>
<main id="top">
```

Run: `python3 scripts/check.py index.html`
Expected: `FAIL index.html: broken anchor #about` (and `#coaching`, `#faq`, `#final-cta`). These are fixed in Tasks 3-5.

- [ ] **Step 2: Create the placeholder portrait**

Create `images/placeholder-portrait.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" role="img" aria-label="Photo placeholder">
  <rect width="400" height="500" fill="#e2cdb5"/>
  <circle cx="200" cy="190" r="70" fill="#c9b08f"/>
  <path d="M60 500c0-110 62-170 140-170s140 60 140 170z" fill="#c9b08f"/>
</svg>
```

- [ ] **Step 3: Add the hero**

Insert after `<main id="top">`, replacing the temporary `<h1>` line:

```html
<section class="hero">
  <div class="container hero__inner">
    <div class="hero__text">
      <p class="eyebrow">Career change coaching</p>
      <h1>Ready for work that actually fits you?</h1>
      <p class="lead">Career change coaching from someone who has made the leap. Get clear on what you want, and a practical plan to get there.</p>
      <p><a class="btn btn--primary js-book" href="#final-cta">Book a free discovery call</a></p>
      <p class="hero__note">Free, 20 minutes, no pressure.</p>
    </div>
    <div class="hero__photo">
      <img class="arch-photo" src="images/placeholder-portrait.svg" width="400" height="500" alt="Claire Eley, career change coach">
    </div>
  </div>
</section>
```

- [ ] **Step 4: Add the booking pop-up script**

Replace `js/main.js`:

```js
// Calendly is loaded only when a visitor clicks a booking button,
// so no third-party script runs (or sets cookies) before they choose to book.
var CALENDLY_URL = "REPLACE_CALENDLY_URL";

function loadCalendly() {
  return new Promise(function (resolve, reject) {
    if (window.Calendly) { resolve(); return; }
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://assets.calendly.com/assets/external/widget.css";
    document.head.appendChild(css);
    var script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

document.querySelectorAll(".js-book").forEach(function (button) {
  button.setAttribute("href", CALENDLY_URL);
  button.addEventListener("click", function (event) {
    event.preventDefault();
    loadCalendly()
      .then(function () { window.Calendly.initPopupWidget({ url: CALENDLY_URL }); })
      .catch(function () { window.location.href = CALENDLY_URL; });
  });
});
```

- [ ] **Step 5: Style the header and hero**

Append to `css/styles.css`:

```css
/* Header */
.site-header {
  position: sticky; top: 0; z-index: 10;
  background: rgba(246, 239, 230, .96); backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--sand);
}
.site-header__inner { display: flex; align-items: center; justify-content: space-between; padding: .7rem 0; gap: 1rem; }
.logo { font-family: var(--serif); font-size: 1.3rem; color: var(--ink); text-decoration: none; }
.site-nav { display: none; }
.site-nav a { color: var(--muted); text-decoration: none; margin-right: 1.5rem; }
.site-nav a:hover { color: var(--terracotta-dark); }

/* Hero */
.hero { padding: 2.5rem 0 3.5rem; }
.hero__inner { display: grid; gap: 2rem; align-items: center; }
.hero__photo { order: -1; max-width: 320px; margin-inline: auto; }
.arch-photo { width: 100%; height: auto; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 999px 999px 14px 14px; background: var(--sand); }
.hero__note { font-size: .9rem; color: var(--muted); }

@media (min-width: 800px) {
  .site-nav { display: block; }
  .hero { padding: 4.5rem 0 5rem; }
  .hero__inner { grid-template-columns: 1.3fr 1fr; gap: 4rem; }
  .hero__photo { order: 0; max-width: none; }
}
```

- [ ] **Step 6: Verify in a browser**

Run: `python3 -m http.server 8000` (background), then open `http://localhost:8000`.
Expected: sticky header with "Book a call" at every width; nav links visible only at 800px and wider; the hero shows the photo above the text on a phone and beside it on desktop. Clicking "Book a call" with the `REPLACE_CALENDLY_URL` token will not open a real page yet (expected until the real link is set).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: header, hero and Calendly pop-up" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: "Is this you?", coaching offers, how it works

**Files:**
- Modify: `index.html` (insert before `</main>`), `css/styles.css`

**Interfaces:**
- Consumes: `.section`, `.section--alt`, `.eyebrow`, `.btn`.
- Produces: anchor `#coaching` (resolves the Task 2 nav link).

- [ ] **Step 1: Add the three sections**

Insert before `</main>`:

```html
<section class="section section--alt" id="recognise">
  <div class="container narrow">
    <p class="eyebrow">Is this you?</p>
    <h2>You know something needs to change.</h2>
    <ul class="ticks">
      <li>You're good at your job, but it no longer feels right.</li>
      <li>You know you want a change, but not what to change to.</li>
      <li>You're worried it's too late, too risky or too much upheaval.</li>
      <li>You've thought about it for months, maybe years, and haven't moved.</li>
    </ul>
    <p class="lead">You don't have to work it out alone. A good conversation is often where it starts.</p>
  </div>
</section>

<section class="section" id="coaching">
  <div class="container">
    <p class="eyebrow">Coaching</p>
    <h2>Ways we can work together</h2>
    <div class="cards">
      <article class="card">
        <h3>[Offer one name]</h3>
        <p class="card__outcome">[One-line outcome, e.g. Get clear on the career you actually want.]</p>
        <p>[Who it suits, and what's included.]</p>
        <p class="card__meta">[Format and length, e.g. 4 sessions over 8 weeks]</p>
      </article>
      <article class="card">
        <h3>[Offer two name]</h3>
        <p class="card__outcome">[One-line outcome.]</p>
        <p>[Who it suits, and what's included.]</p>
        <p class="card__meta">[Format and length]</p>
      </article>
      <article class="card">
        <h3>[Offer three name]</h3>
        <p class="card__outcome">[One-line outcome.]</p>
        <p>[Who it suits, and what's included.]</p>
        <p class="card__meta">[Format and length]</p>
      </article>
    </div>
    <p class="price-note">[Investment starts from £X. Add her price line here.]</p>
  </div>
</section>

<section class="section section--alt" id="how-it-works">
  <div class="container">
    <p class="eyebrow">How it works</p>
    <h2>Three simple steps</h2>
    <ol class="steps">
      <li><h3>Book a free call</h3><p>Choose a time that suits you. It takes a minute.</p></li>
      <li><h3>Talk it through</h3><p>We spend 20 minutes on where you are and what you want. You'll leave with something useful, whether or not we work together.</p></li>
      <li><h3>Decide together</h3><p>If it feels like a fit, we agree a plan. If not, no hard feelings and no pressure.</p></li>
    </ol>
    <p><a class="btn btn--primary js-book" href="#final-cta">Book a free discovery call</a></p>
  </div>
</section>
```

- [ ] **Step 2: Style them**

Append to `css/styles.css`:

```css
.narrow { max-width: 720px; }
.ticks { list-style: none; padding: 0; margin: 0 0 1.5rem; }
.ticks li { padding-left: 2rem; position: relative; margin-bottom: .8rem; }
.ticks li::before { content: "✓"; position: absolute; left: 0; color: var(--terracotta); font-weight: 700; }

.cards { display: grid; gap: 1.25rem; margin: 2rem 0 1.5rem; }
.card { background: var(--white); border: 1px solid var(--sand); border-radius: var(--radius); padding: 1.75rem; }
.card__outcome { font-family: var(--serif); font-size: 1.1rem; }
.card__meta { color: var(--muted); font-size: .95rem; margin: 0; }
.price-note { color: var(--muted); }

.steps { list-style: none; padding: 0; margin: 2rem 0; display: grid; gap: 1.5rem; counter-reset: step; }
.steps li { position: relative; padding-left: 3.5rem; counter-increment: step; }
.steps li::before {
  content: counter(step); position: absolute; left: 0; top: 0;
  width: 2.5rem; height: 2.5rem; border-radius: 50%;
  background: var(--terracotta); color: var(--white);
  display: grid; place-items: center; font-family: var(--serif); font-size: 1.2rem;
}

@media (min-width: 800px) {
  .cards { grid-template-columns: repeat(3, 1fr); }
  .steps { grid-template-columns: repeat(3, 1fr); }
}
```

- [ ] **Step 3: Verify**

Run: `python3 scripts/check.py index.html`
Expected: `#about`, `#faq` and `#final-cta` anchors still fail; `#coaching` no longer does. Check in the browser at 375px and 1280px that cards and steps stack on the phone and sit in three columns on desktop.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: recognition, offers and how-it-works sections" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: About, testimonials (hidden), FAQ

**Files:**
- Modify: `index.html` (before `</main>`), `css/styles.css`

**Interfaces:**
- Produces: anchors `#about` and `#faq`; testimonials section `#testimonials` carrying the `hidden` attribute (remove the attribute when real quotes exist).

- [ ] **Step 1: Add the sections**

Insert before `</main>`:

```html
<section class="section" id="about">
  <div class="container about">
    <div class="about__photo">
      <img class="arch-photo" src="images/placeholder-portrait.svg" width="400" height="500" alt="Claire Eley smiling" loading="lazy">
    </div>
    <div>
      <p class="eyebrow">About Claire</p>
      <h2>I've stood where you're standing.</h2>
      <p>[Claire's career story in her own words: where she started, the change she made, and what she learned.]</p>
      <p>[Why she coaches career changers, and what working with her feels like.]</p>
      <p class="credential">[Currently training towards ICF/EMCC accreditation, completing 2027. Confirm body and date before launch.]</p>
    </div>
  </div>
</section>

<!-- Remove the hidden attribute once 2-3 real client quotes (with permission) are in. -->
<section class="section section--alt" id="testimonials" hidden>
  <div class="container">
    <p class="eyebrow">Kind words</p>
    <h2>What clients say</h2>
    <div class="cards">
      <blockquote class="quote"><p>[Real client quote.]</p><footer>[First name, role]</footer></blockquote>
      <blockquote class="quote"><p>[Real client quote.]</p><footer>[First name, role]</footer></blockquote>
    </div>
  </div>
</section>

<section class="section" id="faq">
  <div class="container narrow">
    <p class="eyebrow">Questions</p>
    <h2>Things people often ask</h2>
    <details>
      <summary>What if I don't know what I want to do?</summary>
      <p>That's the most common starting point, and it's exactly what we work on. You don't need a plan to begin. You need a willingness to explore.</p>
    </details>
    <details>
      <summary>Am I too old to change career?</summary>
      <p>No. People change careers in their 30s, 40s, 50s and beyond. Your experience is an asset, and we'll work out how to use it.</p>
    </details>
    <details>
      <summary>How much does it cost?</summary>
      <p>[Add her pricing summary. The discovery call itself is always free.]</p>
    </details>
    <details>
      <summary>How long does it take?</summary>
      <p>[Typical length of her programmes.] Everyone's different, so we'll agree a pace that fits your life.</p>
    </details>
    <details>
      <summary>Is coaching online or in person?</summary>
      <p>[Her format, e.g. online by video call, with in-person options in her area.]</p>
    </details>
  </div>
</section>
```

- [ ] **Step 2: Style them**

Append to `css/styles.css`:

```css
.about { display: grid; gap: 2rem; align-items: center; }
.about__photo { max-width: 280px; }
.credential { color: var(--muted); font-size: .95rem; border-left: 3px solid var(--sand); padding-left: 1rem; }

.quote { margin: 0; background: var(--cream); border-radius: var(--radius); padding: 1.75rem; font-family: var(--serif); font-size: 1.1rem; }
.quote footer { font-family: var(--sans); font-size: .9rem; color: var(--muted); margin-top: .75rem; }

details { border-bottom: 1px solid var(--sand); padding: 1rem 0; }
summary { cursor: pointer; font-weight: 600; list-style: none; padding-right: 2rem; position: relative; }
summary::-webkit-details-marker { display: none; }
summary::after { content: "+"; position: absolute; right: 0; color: var(--terracotta); font-size: 1.4rem; line-height: 1; }
details[open] summary::after { content: "–"; }
details p { margin: .75rem 0 0; color: var(--muted); }

@media (min-width: 800px) {
  .about { grid-template-columns: 1fr 1.6fr; gap: 4rem; }
}
```

The `hidden` attribute must beat `.section` display rules. Also append:

```css
[hidden] { display: none !important; }
```

- [ ] **Step 3: Verify**

Run: `python3 scripts/check.py index.html`
Expected: only `#final-cta` still fails. In the browser, the testimonials section must not be visible; FAQ items open and close with the keyboard (Tab, Enter/Space).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: about, hidden testimonials and FAQ sections" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Final call-to-action, lead-magnet form, footer

**Files:**
- Modify: `index.html`, `css/styles.css`

**Interfaces:**
- Produces: anchor `#final-cta`; a `.form-slot` container that holds the GHL embed; footer links to `privacy.html`.
- Consumes: Claire's GHL form embed code (until then a labelled fallback sits in the slot).

- [ ] **Step 1: Add the CTA and footer**

Insert before `</main>`:

```html
<section class="section cta" id="final-cta">
  <div class="container narrow">
    <h2>Let's talk about what's next.</h2>
    <p class="lead">A free 20-minute call. No pressure, and you'll leave with clearer next steps.</p>
    <p><a class="btn btn--primary js-book" href="#final-cta">Book a free discovery call</a></p>

    <div class="magnet">
      <h3>Not ready to book?</h3>
      <p>Get my free career-change checklist: [what's in it, e.g. 10 questions to ask before you switch careers].</p>
      <div class="form-slot">
        <!-- Paste the GHL form embed code here. It must redirect to thank-you.html and include the consent tickbox linking to privacy.html. -->
        <p class="form-slot__fallback">[GHL form goes here]</p>
      </div>
    </div>
  </div>
</section>
```

Then insert immediately after `</main>`:

```html
<footer class="site-footer">
  <div class="container site-footer__inner">
    <p class="logo">Claire Eley</p>
    <p>Career change coaching &amp; consulting</p>
    <p><a href="mailto:REPLACE_EMAIL">REPLACE_EMAIL</a> · <a href="REPLACE_LINKEDIN_URL">LinkedIn</a></p>
    <p class="site-footer__small"><a href="privacy.html">Privacy notice</a> · © 2026 Claire Eley Consulting &amp; Coaching</p>
  </div>
</footer>
```

- [ ] **Step 2: Style them**

Append to `css/styles.css`:

```css
.cta { background: var(--sand); text-align: center; }
.cta .narrow { margin-inline: auto; }
.magnet { background: var(--cream); border-radius: var(--radius); padding: 1.75rem; margin-top: 2.5rem; text-align: left; }
.form-slot { margin-top: 1rem; }
.form-slot iframe { width: 100%; border: 0; }
.form-slot__fallback { color: var(--muted); font-style: italic; margin: 0; }

.site-footer { background: var(--ink); color: var(--cream); padding: 2.5rem 0; }
.site-footer a { color: var(--cream); }
.site-footer .logo { color: var(--cream); margin-bottom: .25rem; }
.site-footer__small { font-size: .85rem; opacity: .8; margin: 1rem 0 0; }
```

- [ ] **Step 3: Verify**

Run: `python3 scripts/check.py index.html`
Expected: `OK` for links and anchors (`privacy.html` will still be missing, so expect `FAIL index.html: broken link or file privacy.html`, which Task 6 fixes). Read the page top to bottom in the browser at 375px and 1280px.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: final call-to-action, lead-magnet slot and footer" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Privacy notice and thank-you page

**Files:**
- Create: `privacy.html`, `thank-you.html`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: shared stylesheet; header/footer pattern from `index.html` (links back to `index.html#...`).

- [ ] **Step 1: Create the privacy page**

Create `privacy.html`:

```html
<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Privacy Notice | Claire Eley Consulting &amp; Coaching</title>
  <meta name="description" content="How Claire Eley Consulting &amp; Coaching collects, uses and protects your personal information.">
  <meta name="robots" content="noindex">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
<header class="site-header">
  <div class="container site-header__inner">
    <a class="logo" href="index.html">Claire Eley</a>
    <a class="btn btn--ghost btn--small" href="index.html">Back to site</a>
  </div>
</header>
<main class="section">
  <div class="container narrow legal">
    <h1>Privacy notice</h1>
    <p>Last updated: [date]</p>

    <h2>Who I am</h2>
    <p>Claire Eley Consulting &amp; Coaching is run by Claire Eley. You can contact me at <a href="mailto:REPLACE_EMAIL">REPLACE_EMAIL</a>.</p>

    <h2>What I collect and why</h2>
    <ul>
      <li><strong>When you book a call:</strong> your name, email and any details you enter. I use these to arrange and hold the call. Bookings are handled by Calendly.</li>
      <li><strong>When you request the free checklist:</strong> your name and email. I use these to send the checklist and, if you agree, occasional helpful emails. This is handled through GoHighLevel.</li>
      <li><strong>When you email me:</strong> your message and address, so I can reply.</li>
    </ul>

    <h2>Legal basis</h2>
    <p>Booking a call: taking steps at your request before a contract. Checklist and emails: your consent, which you can withdraw at any time.</p>

    <h2>Who else sees it</h2>
    <p>Calendly and GoHighLevel process data on my behalf. Your details may be stored on servers outside the UK under standard safeguards. I never sell your data.</p>

    <h2>Cookies</h2>
    <p>This site does not set tracking cookies. Calendly's booking window loads only when you click a booking button, and may set its own cookies.</p>

    <h2>Your rights</h2>
    <p>You can ask to see, correct or delete your data, or unsubscribe at any time, by emailing me. You can also complain to the Information Commissioner's Office at ico.org.uk.</p>
  </div>
</main>
</body>
</html>
```

- [ ] **Step 2: Create the thank-you page**

Create `thank-you.html`:

```html
<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Thank You | Claire Eley Consulting &amp; Coaching</title>
  <meta name="description" content="Your free career-change checklist is on its way.">
  <meta name="robots" content="noindex">
  <link rel="stylesheet" href="css/styles.css">
  <script src="js/main.js" defer></script>
</head>
<body>
<header class="site-header">
  <div class="container site-header__inner">
    <a class="logo" href="index.html">Claire Eley</a>
    <a class="btn btn--primary btn--small js-book" href="index.html#final-cta">Book a call</a>
  </div>
</header>
<main class="section">
  <div class="container narrow">
    <h1>Thank you, it's on its way.</h1>
    <p class="lead">Check your inbox for your free career-change checklist. If it isn't there in a few minutes, look in your spam folder.</p>
    <p>If you'd like to talk it through, I'd love to hear where you are.</p>
    <p><a class="btn btn--primary js-book" href="index.html#final-cta">Book a free discovery call</a></p>
  </div>
</main>
</body>
</html>
```

- [ ] **Step 3: Style the legal page**

Append to `css/styles.css`:

```css
.legal h2 { font-size: 1.4rem; margin-top: 2rem; }
.legal ul { padding-left: 1.2rem; }
```

- [ ] **Step 4: Verify**

Run: `python3 scripts/check.py`
Expected: `OK` (all three pages, no broken links or anchors).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: privacy notice and thank-you page" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: SEO, sharing metadata, quality pass

**Files:**
- Modify: `index.html` (head)
- Create: `robots.txt`, `sitemap.xml`

**Interfaces:**
- Consumes: final domain (token `REPLACE_DOMAIN`, e.g. `claireeley.co.uk`) and a share image `images/share.jpg` (1200x630) once Claire's photo is chosen.

- [ ] **Step 1: Add Open Graph and structured data**

Insert before `</head>` in `index.html`:

```html
  <link rel="canonical" href="https://REPLACE_DOMAIN/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Career Change Coach UK | Claire Eley">
  <meta property="og:description" content="Clarity, confidence and a plan for work that fits you. Book a free discovery call.">
  <meta property="og:url" content="https://REPLACE_DOMAIN/">
  <meta property="og:image" content="https://REPLACE_DOMAIN/images/share.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Claire Eley Consulting & Coaching",
    "url": "https://REPLACE_DOMAIN/",
    "description": "Career change coaching in the UK.",
    "areaServed": "GB"
  }
  </script>
```

- [ ] **Step 2: Create robots.txt and sitemap.xml**

`robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://REPLACE_DOMAIN/sitemap.xml
```

`sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://REPLACE_DOMAIN/</loc></url>
</urlset>
```

- [ ] **Step 3: Run the checks, including launch mode**

Run: `python3 scripts/check.py && python3 scripts/check.py --launch`
Expected: first command `OK`. Second command fails and lists every unreplaced placeholder (`REPLACE_CALENDLY_URL`, `REPLACE_DOMAIN`, `REPLACE_EMAIL`, `REPLACE_LINKEDIN_URL`, all `[Bracketed]` copy). This list is the launch to-do list.

- [ ] **Step 4: Lighthouse and accessibility pass**

Run (with the local server running): `npx lighthouse http://localhost:8000 --only-categories=performance,accessibility,seo,best-practices --view`
Expected: 90+ in performance, accessibility and SEO. Fix anything below target (typical fixes: add `width`/`height` to images, improve contrast, add missing labels). Also check by keyboard alone: Tab reaches every link and button in a sensible order and focus is always visible.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: SEO metadata, robots and sitemap" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Real content, deploy and launch

**Files:**
- Modify: `index.html`, `privacy.html`, `js/main.js`, `robots.txt`, `sitemap.xml`; add `images/*` (Claire's photos, `images/share.jpg`)

This task happens when Claire's content arrives (spec section 7) and needs her accounts, so it runs with you present.

- [ ] **Step 1: Replace content and config**

Work through `python3 scripts/check.py --launch` until it prints `OK`. Specifically:
- Set `CALENDLY_URL` in `js/main.js` to her real discovery call link.
- Paste the GHL form embed into `.form-slot` (replace the fallback paragraph); confirm its redirect is `thank-you.html` and its consent text links to `privacy.html`.
- Replace `REPLACE_DOMAIN`, `REPLACE_EMAIL`, `REPLACE_LINKEDIN_URL`.
- Fill in her offers, story, pricing, FAQ answers and accreditation wording.
- Swap `placeholder-portrait.svg` for her photos (compress to under 200 KB each, keep `width`/`height`, update `alt`); add `images/share.jpg`.
- If she has 2-3 real quotes, fill in `#testimonials` and remove its `hidden` attribute.

- [ ] **Step 2: End-to-end tests on real devices**

- Book a test call from the header, hero, how-it-works and final buttons: each opens the Calendly pop-up, and the booking appears in Calendly and (once synced) GHL.
- Submit the lead-magnet form with a test email: the redirect lands on `thank-you.html`, the contact appears in GHL, and the checklist email arrives.
- Open the site on a real phone and a laptop; read every section; click every link.

- [ ] **Step 3: Register domain and deploy**

- Register the domain in Claire's name (Cloudflare, Namecheap or 123-reg).
- Create a Cloudflare Pages or Netlify project from this folder (drag-and-drop upload works, or connect a GitHub repo), publish directory is the project root, no build command.
- Attach the domain, confirm HTTPS works, and set up her business email (Google Workspace or GHL).

- [ ] **Step 4: Final verification and commit**

Run: `python3 scripts/check.py --launch`
Expected: `OK`. Re-run Lighthouse against the live URL; targets remain 90+. Then:

```bash
git add -A
git commit -m "chore: launch content and config" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** goal, honesty rules (hidden testimonials, honest accreditation wording), file structure, all 10 homepage sections (header/hero Task 2; recognise/offers/how Task 3; about/testimonials/FAQ Task 4; CTA/footer Task 5), Calendly, GHL, GDPR/cookies (Tasks 2, 5, 6), accessibility and SEO (Task 7), hosting and launch (Task 8). Open items in spec section 7 are surfaced as placeholders and listed by `--launch`.
- **Known deviation:** FAQ via `<details>` and no mobile menu JS, recorded in Global Constraints and applied to the spec in Task 1.
- **Placeholders:** the `[Bracketed]` and `REPLACE_` tokens are deliberate content gaps that only Claire can fill, and Task 8 gates launch on them being gone.
