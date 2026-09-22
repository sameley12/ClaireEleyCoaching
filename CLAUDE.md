# CLAUDE.md — Career Change Coaching Website

> Project context for Claude Code. Read this fully before writing or changing any code.
> Items marked `TODO` are unconfirmed — ask before assuming, and never invent facts about the business owner.

---

## 1. Project summary

A marketing website for a new coaching and consulting business that helps people who are **considering a career change**. The owner is completing her coaching course and will take on paying clients **once accreditation is granted**.

The site has two phases:

| Phase | When | Primary goal |
|---|---|---|
| **Phase 1 — Pre-launch** | Now → accreditation | Build credibility, capture interest (waitlist / "register interest"), start SEO |
| **Phase 2 — Live** | Post-accreditation | Convert visitors into booked discovery calls |

Build Phase 1 first, but structure everything so Phase 2 is a content/config switch, not a rebuild.

- **Business name:** `TODO`
- **Owner name:** `TODO`
- **Domain:** `TODO`
- **Location / service area:** `TODO` (UK-based; confirm whether sessions are online, in-person, or both)
- **Accrediting body:** `TODO` (e.g. ICF, EMCC, AC — affects wording, see §7)
- **Expected accreditation date:** `TODO`

---

## 2. Audience

**Primary:** Mid-career professionals (roughly late 20s–50s) who feel stuck, unfulfilled or burnt out in their current career and are *thinking about* a change but don't know what to change to, whether it's realistic, or how to start.

Common states of mind:
- "I know I don't want this, but I don't know what I do want."
- Fear of wasting years of experience or taking a pay cut.
- Pressure from finances, family, or age ("is it too late?").
- Overwhelmed by options, or paralysed by having none.

**Secondary (confirm `TODO`):**
- People returning to work (e.g. after parental leave or a career break)
- People facing redundancy
- Organisations wanting career transition support for staff (the "consulting" side)

The site should make these visitors feel **understood first, sold to second.**

---

## 3. Business goals & conversion

1. **Phase 1:** Register-interest / waitlist sign-ups (email capture).
2. **Phase 2:** Booked free discovery calls (primary CTA).
3. Secondary: newsletter sign-ups, lead magnet downloads (`TODO` — e.g. "Career Change Readiness Checklist").

Every page should have one clear primary CTA. Don't clutter pages with competing asks.

---

## 4. Services (placeholder — confirm with owner)

`TODO` — replace with real offering. Likely shape:

- **Free discovery call** (20–30 min) — fit check, no obligation
- **1:1 coaching programme** — e.g. 6 sessions over ~3 months
- **Single session / clarity session**
- **Consulting / organisational offering** — `TODO` scope

Pricing: `TODO` — decide whether to show prices publicly. Default in code: pricing section hidden behind a config flag.

---

## 5. Sitemap

```
/                   Home
/about              About [Owner] — story, approach, credentials
/how-it-works       Coaching process, what to expect, session format
/services           Services & (optional) pricing
/faq                FAQs
/contact            Contact form + booking (Phase 2)
/resources          Blog / articles (optional, add when content exists)
/privacy            Privacy policy
/cookies            Cookie policy (only if non-essential cookies used)
```

### Home page sections (in order)
1. Hero — empathetic headline speaking to the visitor's situation + primary CTA
2. "Does this sound like you?" — 3–5 relatable pain points
3. How coaching helps — outcomes, not features
4. How it works — 3–4 simple steps
5. About teaser — photo + short intro + link to /about
6. Testimonials — **hidden until real ones exist** (see §7)
7. FAQ teaser
8. Final CTA

---

## 6. Brand, tone & design

### Tone of voice
- Warm, calm, grounded, reassuring. Professional but human — not corporate, not "hustle".
- Speak directly to the reader ("you"). Short sentences. Plain English.
- **UK English** spelling throughout (organisation, programme, colour, realise).
- Avoid: hype, guarantees, "unlock your potential", "dream job in 30 days", excessive exclamation marks, jargon.

### Visual direction (`TODO` confirm with owner)
- Clean, spacious, lots of white space. Feels calm and trustworthy.
- Soft, natural palette (placeholder until brand colours are chosen — keep all colours as CSS variables / design tokens so they can be swapped in one place).
- One serif for headings (warmth), one clean sans for body (readability).
- Real photography of the owner strongly preferred over stock.
- Logo: `TODO`

---

## 7. Compliance & honesty rules (IMPORTANT)

- **Do not claim accreditation or certification before it is granted.** Pre-launch wording should be accurate, e.g. "completing [course name] training" or "accreditation expected [month year]". Use a single config value for credential status so it updates everywhere at once.
- **No fabricated testimonials, stats, client counts, or case studies.** Testimonials component stays hidden until real, consented testimonials are supplied.
- **No outcome guarantees** (e.g. "guaranteed new job", salary promises).
- Coaching is not therapy — include a short, non-alarming note (FAQ or footer) that coaching isn't a substitute for mental health support.
- **UK GDPR:** forms must state what data is collected and why, link to the privacy policy, and use explicit opt-in (unticked checkbox) for marketing emails. No pre-checked boxes.
- **Cookies (PECR):** if analytics or any non-essential cookies are used, show a consent banner that blocks them until accepted. Prefer cookieless analytics (e.g. Plausible) to avoid needing a banner at all.
- Accessibility target: **WCAG 2.2 AA** (contrast, alt text, keyboard navigation, focus states, form labels).

---

## 8. Tech stack (proposed — confirm or override)

| Concern | Choice | Notes |
|---|---|---|
| Framework | `TODO` — suggest **Astro** (static, fast, simple content editing) or **Next.js** | Mostly static content site |
| Styling | Tailwind CSS | Brand values as tokens in config |
| Content | Markdown/MDX files in `/src/content` | So copy can be edited without touching components |
| Forms | `TODO` — e.g. Formspree / Netlify Forms / Tally | Must be GDPR-compliant |
| Email list | `TODO` — e.g. MailerLite / Kit (ConvertKit) | Double opt-in |
| Booking (Phase 2) | `TODO` — e.g. Cal.com / Calendly embed | |
| Hosting | `TODO` — e.g. Vercel / Netlify | Free tier fine |
| Analytics | Plausible (cookieless) or none | |

### Config flags (single source of truth, e.g. `src/config/site.ts`)
```ts
export const site = {
  phase: "prelaunch",            // "prelaunch" | "live"
  credentialStatus: "in-training", // "in-training" | "accredited"
  showPricing: false,
  showTestimonials: false,
  bookingUrl: "",                // set in Phase 2
};
```
Components must read from this — no hard-coded phase-dependent copy.

---

## 9. SEO

- Target intent: people searching for career change help, e.g. "career change coach UK", "career change coaching [location]", "how to change career at 30/40", "unhappy in my career what next".
- Unique `<title>` and meta description per page; one H1 per page.
- Open Graph images, sitemap.xml, robots.txt, canonical URLs.
- Schema.org `ProfessionalService` / `Person` structured data (no ratings/reviews markup until real reviews exist).
- Fast by default: optimised images (WebP/AVIF), minimal JS, good Core Web Vitals.

---

## 10. Working rules for Claude Code

- Ask before adding new dependencies or services.
- Keep copy in content files, not buried in components.
- Use placeholder text clearly marked `[PLACEHOLDER]` — never write fake bios, credentials, testimonials, or prices as if they were real.
- Mobile-first; test layouts at 375px, 768px and 1280px.
- Keep components small and reusable (Hero, Section, CTA, FAQItem, TestimonialCard, etc.).
- Commit in small, descriptive steps.
- When unsure about anything in a `TODO`, stop and ask.

---

## 11. Open questions (to fill in)

- [ ] Business name, domain, logo
- [ ] Owner's name, story, photo, and why she's doing this
- [ ] Course name and accrediting body; expected accreditation date
- [ ] Exact services, session format (online/in-person), and whether to show pricing
- [ ] Is the "consulting" side B2B (organisations) or 1:1?
- [ ] Specific niche within career changers, if any (e.g. women 40+, corporate → purpose-led, returners)
- [ ] Tool choices: forms, email list, booking, hosting
- [ ] Brand colours and fonts, or free rein?
- [ ] Lead magnet idea for Phase 1
