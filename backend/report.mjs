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

export function renderReport(report) {
  if (report.status !== 'analysed') throw new Error('report_not_analysed');
  const subject = 'Ihr KALDER Website-Check';
  const intro = 'Vielen Dank für Ihre Anfrage. Hier ist die technische Ersteinschätzung Ihrer Website.';
  const disclaimer = 'Automatisierte Momentaufnahme des Quell-HTML, kein vollständiger SEO-, Sicherheits-, Barrierefreiheits- oder Rechtsaudit. Ein erkannter Link bestätigt keine rechtliche Konformität. Die Antwortzeit ist keine Browser-Ladezeit. JavaScript-Inhalte können fehlen.';
  const checks = Object.entries(labels).map(([key, label]) => [label,
    report.checks[key] === true ? 'Ja' : report.checks[key] === false ? 'Nein' : 'Unbekannt']);
  const findings = report.findings.map(item => hints[item.code]).filter(Boolean);
  const next = findings.length ? findings : ['Bei diesen einfachen Prüfungen wurden keine Auffälligkeiten erkannt.'];
  const details = [
    ['Website', report.url], ['Geprüft am (UTC)', report.checkedAt],
    ['Seitentitel', report.pageTitle || 'Nicht erkannt'],
    ['HTTP-Status', report.response.statusCode],
    ['Antwortzeit', `${report.response.responseTimeMs ?? 'Unbekannt'} ms`],
    ['Heuristischer Indikator (kein Lighthouse-Score)', `${report.score}/100`],
    ...checks,
  ];
  return {
    subject,
    text: ['KALDER Website-Check', intro, '', ...details.map(([k, v]) => `${k}: ${v}`),
      '', 'Hinweise und nächste Schritte', ...next.map(line => `- ${line}`), '', disclaimer,
      '', 'Dieser Bericht wurde von Ihnen angefordert. Sie wurden keiner Marketingliste hinzugefügt.'].join('\n'),
    html: `<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body>
      <h1>KALDER Website-Check</h1><p>${escapeHtml(intro)}</p>
      <table>${details.map(([k, v]) => `<tr><th scope="row" align="left">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('')}</table>
      <h2>Hinweise und nächste Schritte</h2><ul>${next.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
      <p>${escapeHtml(disclaimer)}</p><p>Dieser Bericht wurde von Ihnen angefordert. Sie wurden keiner Marketingliste hinzugefügt.</p>
      </body></html>`,
  };
}
