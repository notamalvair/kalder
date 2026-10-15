# KALDER A/B Test Notes

## Variant A
Original Qwen iteration from `workspace (2).tar`.

## Variant B
ChatGPT-coded alternative based on the same 5-page architecture and brand system.

### Hypothesis
Variant B should increase the share of visitors who reach the Website Check and continue to contact because it:

- moves Website Check directly below the hero;
- reduces generic studio copy in the hero;
- turns the audit UI into a clearer branded demo;
- makes the Website Check an actual frontend journey;
- prefills the website on the contact page;
- removes unsupported 24-hour promises;
- makes contact details/config centralized;
- adds legal placeholders rather than invented company data;
- removes grayscale-to-color portfolio gimmicks;
- improves keyboard/focus states;
- adds route-specific metadata;
- removes unused direct dependencies from package.json.

### Primary metrics
Compare A and B on:

1. `hero_cta` / hero CTA click-through rate
2. `website_check_started`
3. `website_check_ready`
4. `website_check_continue`
5. `contact_submit_attempt`
6. `contact_valid`

Variant B emits these events to `window.dataLayer` when available and also dispatches a `kalder:analytics` CustomEvent. This makes it easy to connect GTM/GA4/Matomo/Plausible later without coupling the UI to a provider now.

### Recommended test rule
Do not judge from 20 visits. If traffic is still tiny, use the variants sequentially and record qualified actions manually. Once there is meaningful traffic, split comparable sources roughly 50/50 and compare Website Check -> contact conversion, not raw page views.

### Before production launch
- replace/confirm `hallo@kalder.de` in `src/config/site.ts`;
- add real Impressum and Datenschutz content;
- connect the contact form to the real backend/mail/CRM endpoint;
- self-host or deliberately configure fonts if desired;
- replace concept/Unsplash images with licensed production assets;
- run final Lighthouse/Core Web Vitals and cross-browser QA;
- connect analytics and consent logic appropriate to the final stack.

## Local run
```bash
npm install
npm run dev
```

Production:
```bash
npm run typecheck
npm run build
```
