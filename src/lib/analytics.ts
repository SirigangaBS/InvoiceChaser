/**
 * Privacy-First Telemetry & Analytics Helper
 * Strictly prohibits transmitting invoice descriptions, client personal identities, or financial credentials.
 */

export function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  if (typeof window === "undefined") return;

  try {
    let distinctId = localStorage.getItem("ic_anon_id");
    if (!distinctId) {
      distinctId = `anon_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
      localStorage.setItem("ic_anon_id", distinctId);
    }

    // Fire non-blocking beacon or fetch
    fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        distinctId,
        properties,
      }),
    }).catch(() => {
      // Fail silently to never disrupt customer UX
    });
  } catch (err) {
    // Ignore storage/tracking errors
  }
}
