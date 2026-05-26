const GA_MEASUREMENT_ID = String(import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();

function canUseAnalytics() {
  return typeof window !== "undefined" && Boolean(GA_MEASUREMENT_ID);
}

export function getGaMeasurementId() {
  return GA_MEASUREMENT_ID;
}

export function initializeAnalytics() {
  if (!canUseAnalytics()) return;
  if (window.__viapetAnalyticsInitialized) return;

  const scriptId = "viapet-google-analytics";
  if (!document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(script);
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
  });

  window.__viapetAnalyticsInitialized = true;
}

export function trackPageView(path) {
  if (!canUseAnalytics() || typeof window.gtag !== "function") return;

  window.gtag("event", "page_view", {
    page_title: document.title,
    page_path: path,
    page_location: window.location.href,
  });
}
