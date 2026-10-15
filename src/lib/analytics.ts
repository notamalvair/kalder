type EventPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackEvent(name: string, payload: EventPayload = {}) {
  const event = { event: name, variant: 'B', ...payload };
  window.dataLayer?.push(event);
  window.dispatchEvent(new CustomEvent('kalder:analytics', { detail: event }));
}
