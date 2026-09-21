# Claire Eley Consulting & Coaching: Website Design

Date: 2026-09-21
Status: Draft for review (first pass)

## 1. Goal and audience

A professional, seamless website for a new coaching and consulting practice that initially focuses on people changing careers (UK).

**Single primary action:** book a free discovery call.
**Secondary action:** download a free career-change checklist (lead magnet) for visitors not ready to book.

## 2. Key decisions

| Topic | Decision |
|---|---|
| Build approach | Hand-built static site (HTML, CSS, small JS). No framework. Can migrate to a framework later if a blog or many pages are added. |
| Maintainer | The user maintains the site. Claire sends change requests. |
| Visual direction | "Warm and personal": cream background, terracotta accent, serif headings, sans-serif body. Her photo is prominent. First pass, easy to change. |
| Photos | Claire has professional photos. |
| Booking | Calendly (discovery call event), opened as a pop-up from every "Book a call" button, with a plain-link fallback. |
| CRM / email | GoHighLevel (GHL). Lead-magnet form is a GHL embed. Calendly to GHL sync method to be confirmed at build time. |
| Domain | Not yet registered. Register in Claire's own name and account (e.g. claireeley.co.uk). |
| Hosting | Cloudflare Pages or Netlify, HTTPS on. |
| Blog, press logos, proof statistics | Out of scope for launch. No invented statistics. |

## 3. Proof and credibility (honesty rules)

- Claire is coaching now and is training towards accreditation, completing next year. **No accreditation badge is shown until held.** Wording such as "training towards [ICF/EMCC] accreditation, completing 2027" is acceptable.
- Her career background and career-change story is the main proof, placed near the top and in About.
- Testimonials: collect 2-3 real quotes from current clients (with permission). The testimonials section stays **hidden** until real quotes exist. No fabricated quotes or figures.

## 4. Structure and files

```
/index.html          Homepage (all 10 sections)
/privacy.html        Privacy and cookie notice
/thank-you.html      Shown after lead-magnet signup
/css/styles.css      All styling; colours and fonts as variables at top
/js/main.js          Booking pop-up loader (FAQ uses native <details>; mobile header collapses to logo and button)
/images/             Optimised photos
```

Principles:
- Brand colours and fonts defined once as CSS variables.
- Mobile first, then widened for desktop.
- "Book a call" button persistent in the header at every width, repeated in the hero and final section.
- Each homepage section is a clearly labelled block so wording changes are quick.
- Compressed images, no heavy libraries.

## 5. Homepage content plan

Placeholders in [brackets] must be supplied by Claire.

1. **Header:** Claire Eley, About, Coaching, FAQ, Book a call.
2. **Hero:** benefit headline (e.g. "Ready for work that actually fits you?"), subline (career change coaching from someone who has made the leap), button "Book a free discovery call", her photo.
3. **Is this you?:** 4-5 short statements naming the visitor's situation.
4. **Coaching / services:** 2-3 named offers, each with a one-line outcome, who it suits, and duration. [Offers, format, session lengths]
5. **How it works:** three steps ending with what happens on the discovery call. No pressure.
6. **About Claire:** career story in her own words [background, why she coaches] and honest credentials.
7. **Testimonials:** 2-3 real quotes. Hidden until available.
8. **FAQ:** cost, time, "what if I don't know what I want?", "am I too old?", online or in person.
9. **Final call-to-action:** booking button plus softer option: free checklist via GHL form.
10. **Footer:** email, LinkedIn, privacy link, business details.

Pricing: show a "from £X" or "investment starts at" line. [Figure to be decided by Claire.]
Tone: warm, plain-spoken, confident; no jargon such as "unlock your potential".

## 6. Integrations, compliance and launch

**Calendly:** needs Claire's Calendly link and a discovery call event (15-30 minutes typical).

**GHL lead magnet:** embedded GHL form, redirecting to `thank-you.html`. Claire must attach the checklist and a welcome email inside GHL. The form includes a consent tickbox linking to the privacy notice.

**UK GDPR and cookies:** `privacy.html` covers what is collected (form and booking details), why, where it is stored (GHL, Calendly), and how to request deletion. Claire should check it against her real setup; it is not legal advice. No tracking cookies by default. If analytics is added, use a privacy-friendly tool (Plausible or Cloudflare Web Analytics). Google Analytics or a Meta pixel would require a consent banner.

**Accessibility:** verified colour contrast on the cream/terracotta palette, keyboard-friendly navigation, alt text on all images, readable phone font sizes.

**SEO:** page title and description, Open Graph tags, structured data for a professional service. Target search intent such as "career change coach UK".

**Quality targets:** Lighthouse 90+ for performance, accessibility and SEO.

**Hosting and launch:** Cloudflare Pages or Netlify, on Claire's domain with HTTPS. Business email on her domain (Google Workspace or GHL).

**Testing:** run locally, check at phone, tablet and desktop widths, run Lighthouse, test booking and signup end to end, check every link, confirm thank-you and privacy pages.

## 7. Open items (needed from Claire, not blocking the build)

- Business domain registration
- Calendly link and discovery call event
- Her offers, formats, durations and price figure
- Her career story and "why I coach" wording
- 2-3 client testimonials with permission
- Accreditation body and expected completion date
- Checklist content for the lead magnet
- GHL form embed code and consent wording
- Photos selected and supplied

## 8. Out of scope for first pass

Blog, press logos, proof statistics, multi-page service pages, online payments, client portal.
