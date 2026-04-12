let cachedScreenDetails = null;
let screenDetailsPrimed = false;

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function toPositiveNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function getCurrentScreenSnapshot() {
  if (typeof window === "undefined") {
    return {
      left: 0,
      top: 0,
      width: 1366,
      height: 768,
    };
  }

  return {
    left: Number(window.screenX ?? window.screenLeft ?? 0) || 0,
    top: Number(window.screenY ?? window.screenTop ?? 0) || 0,
    width: toPositiveNumber(window.screen?.availWidth, toPositiveNumber(window.innerWidth, 1366)),
    height: toPositiveNumber(window.screen?.availHeight, toPositiveNumber(window.innerHeight, 768)),
  };
}

function toScreenSnapshot(screen) {
  if (!screen) return null;

  return {
    left: Number(screen.availLeft ?? screen.left ?? 0) || 0,
    top: Number(screen.availTop ?? screen.top ?? 0) || 0,
    width: toPositiveNumber(screen.availWidth ?? screen.width, 1366),
    height: toPositiveNumber(screen.availHeight ?? screen.height, 768),
  };
}

function getTargetScreenSnapshot(screenIndex = 1) {
  const screens = Array.isArray(cachedScreenDetails?.screens)
    ? cachedScreenDetails.screens.map(toScreenSnapshot).filter(Boolean)
    : [];

  if (screens.length > screenIndex) {
    return screens[screenIndex];
  }

  const current = getCurrentScreenSnapshot();
  if (typeof window !== "undefined" && window.screen?.isExtended === false) {
    return current;
  }

  return {
    left: current.left + current.width,
    top: current.top,
    width: current.width,
    height: current.height,
  };
}

function buildPlacement({
  screenIndex = 1,
  width,
  height,
  widthRatio = 0.94,
  heightRatio = 0.92,
  margin = 24,
} = {}) {
  const targetScreen = getTargetScreenSnapshot(screenIndex);
  const usableWidth = Math.max(targetScreen.width - margin * 2, 720);
  const usableHeight = Math.max(targetScreen.height - margin * 2, 540);
  const resolvedWidth = clamp(
    toPositiveNumber(width, Math.round(targetScreen.width * widthRatio)),
    720,
    usableWidth,
  );
  const resolvedHeight = clamp(
    toPositiveNumber(height, Math.round(targetScreen.height * heightRatio)),
    540,
    usableHeight,
  );

  return {
    left: Math.round(targetScreen.left + (targetScreen.width - resolvedWidth) / 2),
    top: Math.round(targetScreen.top + (targetScreen.height - resolvedHeight) / 2),
    width: Math.round(resolvedWidth),
    height: Math.round(resolvedHeight),
  };
}

function buildFeatureString(
  placement,
  {
    popup = true,
    resizable = true,
    scrollbars = true,
    noopener = true,
    noreferrer = true,
  } = {},
) {
  const features = [
    `left=${placement.left}`,
    `top=${placement.top}`,
    `width=${placement.width}`,
    `height=${placement.height}`,
    `resizable=${resizable ? "yes" : "no"}`,
    `scrollbars=${scrollbars ? "yes" : "no"}`,
  ];

  if (popup) {
    features.push("popup=yes");
  }
  if (noopener) {
    features.push("noopener");
  }
  if (noreferrer) {
    features.push("noreferrer");
  }

  return features.join(",");
}

export function primeScreenDetails() {
  if (
    screenDetailsPrimed ||
    typeof window === "undefined" ||
    typeof window.getScreenDetails !== "function"
  ) {
    return;
  }

  screenDetailsPrimed = true;

  void window
    .getScreenDetails()
    .then((details) => {
      cachedScreenDetails = details;
    })
    .catch(() => {
      cachedScreenDetails = null;
    });
}

export function openExternalUrl(url, options = {}) {
  if (!url || typeof window === "undefined") return null;

  primeScreenDetails();

  const placement = buildPlacement(options);
  const features = buildFeatureString(placement, options);
  const target = options.target || "_blank";
  const openedWindow = window.open(url, target, features);

  if (openedWindow && typeof openedWindow.focus === "function") {
    openedWindow.focus();
  }

  return openedWindow;
}

export function openPrintWindow(options = {}) {
  if (typeof window === "undefined") return null;

  primeScreenDetails();

  const placement = buildPlacement({
    width: 1180,
    height: 820,
    widthRatio: 0.82,
    heightRatio: 0.82,
    ...options,
  });

  const printWindow = window.open(
    "",
    options.target || "_blank",
    buildFeatureString(placement, {
      popup: true,
      resizable: true,
      scrollbars: true,
      noopener: false,
      noreferrer: false,
    }),
  );

  if (printWindow && typeof printWindow.focus === "function") {
    printWindow.focus();
  }

  return printWindow;
}

export function installPreferredExternalLinkRouting(options = {}) {
  if (typeof document === "undefined") {
    return () => {};
  }

  primeScreenDetails();

  const handleClick = (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target?.closest?.('a[target="_blank"]');
    if (!link || link.hasAttribute("download")) {
      return;
    }

    const href = link.href;
    if (!href || href.startsWith("javascript:")) {
      return;
    }

    event.preventDefault();
    openExternalUrl(href, options);
  };

  document.addEventListener("click", handleClick, true);

  return () => {
    document.removeEventListener("click", handleClick, true);
  };
}
