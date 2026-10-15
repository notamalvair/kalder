// Lightweight source-HTML checks, not a browser, legal or accessibility audit.
// Network fetching and email delivery are separate stages.
const UNKNOWN = 'unknown';

function attributes(tag) {
  const result = {};
  const pattern = /([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(pattern)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4];
  }
  return result;
}

function sourceTags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))]
    .map(([tag]) => attributes(tag));
}

/**
 * Input is the bounded response of a future safe fetcher.
 * A failed request never becomes a low website quality score.
 * Returned fields contain observations, not a claim of legal compliance.
 */
export function analysePage({ url, statusCode, html = '', contentType = '',
  responseTimeMs = null, error = null }) {
  const checkedAt = new Date().toISOString();
  const transport = new URL(url).protocol === 'https:' ? 'https' : 'http';
  const base = {
    version: 1, url, checkedAt,
    response: { statusCode: statusCode ?? null, responseTimeMs, transport },
    checks: {
      viewport: UNKNOWN, title: UNKNOWN, ogImage: UNKNOWN,
      pdfMenuLink: UNKNOWN, impressumLink: UNKNOWN, privacyLink: UNKNOWN,
    },
    pageTitle: null, score: null, findings: [],
  };
  if (error || !Number.isInteger(statusCode) || statusCode < 200 || statusCode >= 300) {
    return { ...base, status: 'unavailable', error: error ? 'fetch_failed' : 'http_error' };
  }
  if (!/^text\/html(?:\s*;|$)/i.test(contentType) || !html.trim()) {
    return { ...base, status: 'unsupported', error: 'no_html' };
  }

  // Ignore comments and inline script/style text to reduce false positives.
  const source = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const meta = sourceTags(source, 'meta');
  const links = sourceTags(source, 'a').map(({ href }) => {
    try {
      const target = new URL(href, url);
      return ['http:', 'https:'].includes(target.protocol) ? target : null;
    } catch { return null; }
  }).filter(Boolean);
  const title = (source.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? '')
    .replace(/\s+/g, ' ').trim();
  const descriptiveTitle = title.length >= 3 &&
    !['home', 'главная', 'willkommen', 'startseite'].includes(title.toLowerCase());
  const checks = {
    viewport: meta.some(m => m.name?.toLowerCase() === 'viewport' && m.content?.trim()),
    title: descriptiveTitle,
    ogImage: meta.some(m => m.property?.toLowerCase() === 'og:image' && m.content?.trim()),
    pdfMenuLink: links.some(link => /(?:menu|speisekarte|karte)[^/]*\.pdf$/i.test(link.pathname)),
    impressumLink: links.some(link => /(?:^|\/)(?:impressum|imprint)(?:[/._-]|$)/i.test(link.pathname)),
    privacyLink: links.some(link => /(?:^|\/)(?:datenschutz|privacy)(?:[/._-]|$)/i.test(link.pathname)),
  };
  const findings = [];
  const add = (code, message) => findings.push({ code, message });
  if (transport === 'http') add('http_transport', 'The final page was served over HTTP.');
  if (!checks.viewport) add('viewport_missing', 'No nonempty viewport meta tag found in source HTML.');
  if (!checks.title) add('title_weak', 'The page title is missing or generic.');
  if (!checks.ogImage) add('og_image_missing', 'No nonempty og:image meta tag found.');
  if (checks.pdfMenuLink) add('pdf_menu_link', 'A PDF menu link was found; an HTML menu may also exist.');
  if (!checks.impressumLink) add('impressum_link_missing', 'No recognizable Impressum link found on this page.');
  if (!checks.privacyLink) add('privacy_link_missing', 'No recognizable privacy link found on this page.');
  if (responseTimeMs !== null && responseTimeMs > 2500) {
    add('slow_response', 'This request took over 2.5 seconds; this is not a browser speed measurement.');
  }
  return {
    ...base, status: 'analysed', checks, pageTitle: title,
    // Heuristic indicator only; not a Lighthouse or legal-compliance score.
    score: Math.max(0, 100 - findings.length * 15), findings,
  };
}
