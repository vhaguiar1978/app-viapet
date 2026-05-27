const prefetchedKeys = new Set();

const routePrefetchers = [
  {
    match: (path) => path === "/dashboard" || path === "/admin" || path.startsWith("/admin/"),
    load: () => import("../features/dashboard/DashboardPageView.jsx"),
  },
  {
    match: (path) => path.startsWith("/mensagens"),
    load: () => import("../features/messages/MessagesRoutePage.jsx"),
  },
  {
    match: (path) => path.startsWith("/financeiro"),
    // Prefetch apenas as views mais usadas; cada view agora vive em seu
    // próprio chunk, então não precisamos puxar o monolito inteiro.
    load: () => Promise.all([
      import("../features/finance/views/FinanceSummaryView.jsx"),
      import("../features/finance/views/FinanceSalesView.jsx"),
      import("../features/finance/views/FinancePurchasesView.jsx"),
    ]),
  },
  {
    match: (path) => path.startsWith("/configuracao"),
    load: () => Promise.all([
      import("../features/settings/SettingsShell.jsx"),
      import("../features/settings/SettingsPages.jsx"),
    ]),
  },
  {
    match: (path) => path.startsWith("/venda"),
    load: () => import("../features/sales/SalesPageView.jsx"),
  },
];

function normalizePath(path) {
  return String(path || "").trim();
}

export function prefetchRoute(path) {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) return;

  const prefetcher = routePrefetchers.find((item) => item.match(normalizedPath));
  if (!prefetcher) return;
  if (prefetchedKeys.has(normalizedPath)) return;

  prefetchedKeys.add(normalizedPath);
  Promise.resolve(prefetcher.load()).catch(() => {
    prefetchedKeys.delete(normalizedPath);
  });
}

export function prefetchRoutes(paths = []) {
  for (const path of paths) {
    prefetchRoute(path);
  }
}

export function scheduleLikelyRoutePrefetch(paths = []) {
  if (typeof window === "undefined") return;
  const uniquePaths = [...new Set((Array.isArray(paths) ? paths : []).filter(Boolean))];
  if (!uniquePaths.length) return;

  const run = () => prefetchRoutes(uniquePaths);
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 1200 });
    return;
  }
  window.setTimeout(run, 250);
}
