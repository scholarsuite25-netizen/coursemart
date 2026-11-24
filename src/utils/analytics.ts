/**
 * Analytics util (client-side). Events are sent to the server endpoint
 * `POST /api/track/event` which ingests them into KV and will emit to
 * PostHog if a server-side key is configured (created for paid analytics —
 * the self-hosted base infra stays open).
 */

export interface TrackEventPayload {
  event: string;
  properties?: Record<string, unknown>;
}

export async function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  if (typeof event !== 'string' || event.trim().length === 0) return;
  try {
    await fetch('/api/track/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: event.trim(),
        properties: properties || {},
        ts: Date.now(),
      }),
      // Fire-and-forget for analytics; never blocks on response.
      keepalive: true,
    });
  } catch {
    // Analytics must never break the app.
  }
}

export function trackPageView(path: string, title?: string): Promise<void> {
  return trackEvent('page_view', {
    path,
    ...(title ? { title } : {}),
  });
}
