const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,
  char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const labels = {
  viewport: 'Viewport-Metadaten vorhanden', title: 'Aussagekräftiger Seitentitel',
  ogImage: 'Vorschaubild für Social Media', pdfMenuLink: 'PDF-Speisekarte verlinkt',
  impressumLink: 'Impressum-Link erkannt', privacyLink: 'Datenschutz-Link erkannt',
};
const hints = {
  http_transport: 'Die geprüfte Seite wurde über HTTP ausgeliefert. HTTPS prüfen.',
  viewport_missing: 'Keine Viewport-Metadaten im HTML erkannt. Mobile Darstellung prüfen.',
  title_weak: 'Seitentitel fehlt oder ist sehr allgemein. Einen passenden Titel ergänzen.',
  og_image_missing: 'Kein Social-Media-Vorschaubild in den Metadaten erkannt.',
  pdf_menu_link: 'Ein PDF-Menü ist verlinkt. Zusätzlich ein gut lesbares HTML-Menü prüfen.',
  impressum_link_missing: 'Kein erkennbarer Impressum-Link auf dieser Seite gefunden.',
  privacy_link_missing: 'Kein erkennbarer Datenschutz-Link auf dieser Seite gefunden.',
  slow_response: 'Dieser Abruf dauerte über 2,5 Sekunden. Ladeverhalten gesondert untersuchen.',
};

// Email clients ignore stylesheets, so the dark layout is inline styles on tables only.
const C = { night: '#0C0E0D', panel: '#171B1A', border: '#272C2A', cream: '#F3F0E9',
  muted: '#A9ADA6', faint: '#747973', accent: '#8FB3A0', signal: '#E0875B', warn: '#D9B36A' };
const mono = "'JetBrains Mono',Menlo,Consolas,monospace";
const sans = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const host = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return String(url); } };
const answer = value => value === true ? 'Ja' : value === false ? 'Nein' : 'Unbekannt';
// A linked PDF menu is a hint to review, not an achievement.
const tone = (key, value) => typeof value !== 'boolean' ? C.faint :
  key === 'pdfMenuLink' ? (value ? C.warn : C.muted) : value ? C.accent : C.signal;

export function renderReport(report) {
  if (report.status !== 'analysed') throw new Error('report_not_analysed');
  const subject = 'Ihr KALDER Website-Check';
  const intro = 'Vielen Dank für Ihre Anfrage. Hier ist die technische Ersteinschätzung Ihrer Website.';
  const disclaimer = 'Automatisierte Momentaufnahme des Quell-HTML, kein vollständiger SEO-, Sicherheits-, Barrierefreiheits- oder Rechtsaudit. Ein erkannter Link bestätigt keine rechtliche Konformität. Die Antwortzeit ist keine Browser-Ladezeit. JavaScript-Inhalte können fehlen.';
  const optOut = 'Dieser Bericht wurde von Ihnen angefordert. Sie wurden keiner Marketingliste hinzugefügt.';
  const checks = Object.entries(labels).map(([key, label]) => [label, answer(report.checks[key]), tone(key, report.checks[key])]);
  const findings = report.findings.map(item => hints[item.code]).filter(Boolean);
  const next = findings.length ? findings : ['Bei diesen einfachen Prüfungen wurden keine Auffälligkeiten erkannt.'];
  const details = [
    ['Website', report.url], ['Geprüft am (UTC)', report.checkedAt],
    ['Seitentitel', report.pageTitle || 'Nicht erkannt'],
    ['HTTP-Status', report.response.statusCode],
    ['Antwortzeit', `${report.response.responseTimeMs ?? 'Unbekannt'} ms`],
    ['Heuristischer Indikator (kein Lighthouse-Score)', `${report.score}/100`],
  ];

  // Side-by-side comparison with the websites the visitor named.
  const others = Array.isArray(report.competitors) ? report.competitors.slice(0, 2) : [];
  const sites = [report, ...others];
  const ok = site => site.status === 'analysed';
  const compareRows = others.length ? [
    ['HTTPS', site => [site.response.transport === 'https' ? 'Ja' : 'Nein', site.response.transport === 'https' ? C.accent : C.signal]],
    ...Object.entries(labels).map(([key, label]) => [label, site => [answer(site.checks[key]), tone(key, site.checks[key])]]),
    ['Antwortzeit', site => [`${site.response.responseTimeMs ?? '–'} ms`, C.cream]],
    ['Indikator', site => [`${site.score}/100`, C.cream]],
  ].map(([label, read]) => [label, sites.map(site => ok(site) ? read(site) : ['nicht abrufbar', C.faint])]) : [];
  const compareNote = 'Vergleich derselben einfachen Prüfungen zum selben Zeitpunkt. Er bewertet nicht die Qualität der Betriebe.';

  const cell = `padding:11px 0;border-bottom:1px solid ${C.border};font:14px/1.5 ${sans};`;
  const label = text => `<p style="margin:0 0 10px;font:11px/1.4 ${mono};letter-spacing:.12em;text-transform:uppercase;color:${C.accent};">${escapeHtml(text)}</p>`;
  const rows = items => items.map(([k, v, color]) => `<tr><th scope="row" align="left" style="${cell}font-weight:400;color:${C.muted};">${escapeHtml(k)}</th><td align="right" style="${cell}color:${color ?? C.cream};word-break:break-word;">${escapeHtml(v)}</td></tr>`).join('');
  const comparison = others.length ? `<tr><td style="padding:32px 32px 0;">${label('Sie im Vergleich')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td style="${cell}"></td>${sites.map((site, index) => `<th align="right" style="${cell}font:12px/1.4 ${mono};color:${index ? C.muted : C.cream};word-break:break-all;padding-left:12px;">${escapeHtml(index ? host(site.url) : 'Ihre Website')}</th>`).join('')}</tr>
      ${compareRows.map(([name, values]) => `<tr><th scope="row" align="left" style="${cell}font-weight:400;color:${C.muted};">${escapeHtml(name)}</th>${values.map(([text, color]) => `<td align="right" style="${cell}color:${color};padding-left:12px;">${escapeHtml(text)}</td>`).join('')}</tr>`).join('')}
      </table><p style="margin:12px 0 0;font:12px/1.6 ${sans};color:${C.faint};">${escapeHtml(compareNote)}</p></td></tr>` : '';

  return {
    subject,
    text: ['KALDER Website-Check', intro, '', ...[...details, ...checks].map(([k, v]) => `${k}: ${v}`),
      ...(others.length ? ['', 'Sie im Vergleich', `(${['Ihre Website', ...others.map(site => host(site.url))].join(' | ')})`,
        ...compareRows.map(([name, values]) => `${name}: ${values.map(([text]) => text).join(' | ')}`), compareNote] : []),
      '', 'Hinweise und nächste Schritte', ...next.map(line => `- ${line}`), '', disclaimer,
      '', optOut].join('\n'),
    html: `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${escapeHtml(subject)}</title></head>
      <body style="margin:0;padding:0;background:${C.night};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.night}" style="background:${C.night};"><tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.panel}" style="max-width:640px;background:${C.panel};border:1px solid ${C.border};">
      <tr><td style="padding:32px 32px 28px;border-bottom:1px solid ${C.border};">${label('KALDER / Website-Check')}
        <h1 style="margin:0 0 14px;font:500 30px/1.1 ${sans};letter-spacing:-.02em;color:${C.cream};word-break:break-word;">${escapeHtml(host(report.url))}</h1>
        <p style="margin:0;font:15px/1.6 ${sans};color:${C.muted};">${escapeHtml(intro)}</p></td></tr>
      <tr><td style="padding:28px 32px 0;">${label('Indikator')}
        <p style="margin:0;font:500 44px/1 ${sans};letter-spacing:-.03em;color:${C.cream};">${escapeHtml(report.score)}<span style="font-size:18px;color:${C.faint};"> / 100</span></p>
        <p style="margin:8px 0 0;font:12px/1.6 ${sans};color:${C.faint};">Heuristischer Indikator aus den Prüfungen unten, kein Lighthouse-Score.</p></td></tr>
      <tr><td style="padding:32px 32px 0;">${label('Prüfungen')}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows(checks)}</table></td></tr>
      ${comparison}
      <tr><td style="padding:32px 32px 0;">${label('Hinweise und nächste Schritte')}
        ${next.map(line => `<p style="margin:0 0 10px;padding-left:14px;border-left:2px solid ${C.signal};font:14px/1.6 ${sans};color:${C.cream};">${escapeHtml(line)}</p>`).join('')}</td></tr>
      <tr><td style="padding:32px 32px 0;">${label('Details')}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows(details)}</table></td></tr>
      <tr><td style="padding:28px 32px 32px;"><p style="margin:0 0 10px;font:12px/1.6 ${sans};color:${C.faint};">${escapeHtml(disclaimer)}</p>
        <p style="margin:0;font:12px/1.6 ${sans};color:${C.faint};">${escapeHtml(optOut)}</p></td></tr>
      </table></td></tr></table></body></html>`,
  };
}
