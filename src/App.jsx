import { createContext, useContext, useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useMemo } from "react";
import { Field, EditableField, EditableSelectField, EditableSuggestField, EditableSuggestTextArea, EditableTextArea } from "./components/fields.jsx";
import { AgendaAppointmentModal } from "./features/agenda/AgendaAppointmentModal.jsx";
import { DashboardPageView } from "./features/dashboard/DashboardPageView.jsx";
import { FinanceCommissionsView, FinancePaymentsView, FinancePurchasesView, FinanceSalesView, FinanceSummaryView } from "./features/finance/FinancePages.jsx";
import { SalesPageView } from "./features/sales/SalesPageView.jsx";
import { SettingsShell } from "./features/settings/SettingsShell.jsx";
import { SettingsAccountPageView, SettingsAgendaPageView, SettingsPrintPageView, SettingsProfilePageView, SettingsResourcesPageView, SettingsTaxesPageView } from "./features/settings/SettingsPages.jsx";
import { getAgendaStatusMeta, getAgendaStatusOptions, writeAgendaStatusLabelsOverride } from "./features/settings/agendaStatusConfig.js";
import {
  agendaEvents,
  agendaTabs,
  appMenu,
  appointmentDraft,
  bathAgendaList,
  dashboardAdminBanner,
  dashboardBirthdayBoard,
  dashboardHelperLinks,
  dashboardHighlights,
  dashboardModules,
  dashboardPayables,
  dashboardQuickTiles,
  driverAgendaList,
  examsOverview,
  financeSummary,
  modules,
  queueOverview,
  registersPreview,
} from "./data/mockAgenda.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4003";
const LazyMessagesRoutePage = lazy(
  () => import("./features/messages/MessagesRoutePage.jsx"),
);
const AUTH_STORAGE_KEY = "viapet.auth.token";
const DEMO_AUTH_TOKEN = "viapet-demo-token";
const DEMO_AGENDA_STORAGE_KEY = "viapet.demo.agenda";
const DEMO_AGENDA_BANNERS_STORAGE_KEY = "viapet.demo.agenda-banners";
const DEMO_CUSTOMERS_STORAGE_KEY = "viapet.demo.customers";
const CUSTOMER_PHOTOS_STORAGE_KEY = "viapet.customer.photos";
const PET_PHOTOS_STORAGE_KEY = "viapet.pet.photos";
const DEMO_PETS_STORAGE_KEY = "viapet.demo.pets";
const DEMO_PRODUCTS_STORAGE_KEY = "viapet.demo.products";
const DEMO_SERVICES_STORAGE_KEY = "viapet.demo.services";
const ACCOUNT_SETTINGS_STORAGE_KEY = "viapet.settings.account";
const SETTINGS_UI_STORAGE_KEY = "viapet.settings.ui";
const SETTINGS_UPDATED_EVENT = "viapet:settings-updated";
const CRM_DATA_UPDATED_EVENT = "viapet:crm-data-updated";
const RESOURCE_SETTINGS_STORAGE_KEY = "viapet.settings.resources";
const AGENDA_PACKAGE_STORAGE_KEY = "viapet.agenda.packages";
const DRIVER_DELIVERY_STORAGE_KEY = "viapet.driver.delivery";
const MEDICAL_CATALOG_BOOTSTRAP_PREFIX = "viapet.medical-catalog.bootstrap";
const DEMO_USER_EMAIL = "teste@viapet.app";
const DEMO_USER_PASSWORD = "123456";
const DEFAULT_EXAM_SERVICE_NAMES = [
  "Bacteriológico",
  "Bioquímico",
  "Bioquímico Cão",
  "Bioquímico Gato",
  "Ecografia",
  "Funcional de Amostra Fecal",
  "Hemograma",
  "Hemograma Cão",
  "Hemograma Gato",
  "Parasitológico de Fezes",
  "Parasitológico de Pele",
  "Qualitativo de Urina",
  "RX",
  "Sorológico",
];
const DEFAULT_VACCINE_SERVICE_NAMES = [
  "Antirrábica",
  "Giardia",
  "Gripe",
  "Leishmaniose",
  "Leptospirose",
  "Polivalente",
  "Quádrupla",
  "Quíntupla",
  "Tríplice",
];
const AuthContext = createContext(null);

function buildDefaultMedicalCatalogServices() {
  return [
    ...DEFAULT_EXAM_SERVICE_NAMES.map((name) => ({
      name,
      category: "Exames",
      description: "",
      price: "0",
      duration: null,
      cost: 0,
      observation: "Setor: Exames",
    })),
    ...DEFAULT_VACCINE_SERVICE_NAMES.map((name) => ({
      name,
      category: "Vacinas",
      description: "",
      price: "0",
      duration: null,
      cost: 0,
      observation: "",
    })),
  ];
}

function getMedicalCatalogKey(item) {
  return `${String(item?.category || "")
    .trim()
    .toLowerCase()}::${String(item?.name || "")
    .trim()
    .toLowerCase()}`;
}

const BROKEN_TEXT_REPLACEMENTS = [
  ["â€¢", "•"],
  ["Â·", "•"],
  ["Ã—", "×"],
  ["Ã¡", "á"],
  ["Ã¢", "â"],
  ["Ã£", "ã"],
  ["Ã¤", "ä"],
  ["Ã©", "é"],
  ["Ãª", "ê"],
  ["Ã­", "í"],
  ["Ã³", "ó"],
  ["Ã´", "ô"],
  ["Ãµ", "õ"],
  ["Ãº", "ú"],
  ["Ã§", "ç"],
  ["Ã�", "Á"],
  ["Ã‰", "É"],
  ["Ã“", "Ó"],
  ["Ãš", "Ú"],
  ["Ã‡", "Ç"],
  ["Â", ""],
];

function repairDisplayText(value) {
  if (value == null) return "";

  let normalized = String(value);
  for (const [broken, fixed] of BROKEN_TEXT_REPLACEMENTS) {
    normalized = normalized.split(broken).join(fixed);
  }

  return normalized.replace(/\s+•\s+/g, " • ").trim();
}

function normalizeSearchableText(value) {
  return repairDisplayText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeAgendaSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, " ")
    .toLowerCase()
    .trim();
}

function buildDemoUser() {
  return {
    id: "demo-user",
    name: "Usuario Teste ViaPet",
    email: DEMO_USER_EMAIL,
    establishment: "demo-establishment",
    phone: "11994167999",
    role: "proprietario",
  };
}

function normalizeAccountSettings(rawSettings = {}, authUser = null) {
  const cachedSettings = readStoredUiSettings();
  return {
    establishmentName: rawSettings?.establishmentName || cachedSettings?.storeName || authUser?.name || "Pet Shop Dog House",
    naming: rawSettings?.naming || "Pet e Responsavel",
    contactEmail: rawSettings?.contactEmail || authUser?.email || "",
    contactPhone: rawSettings?.contactPhone || authUser?.phone || "11",
    crmAccessWhatsapp: rawSettings?.crmAccessWhatsapp || rawSettings?.supportWhatsapp || "551120977579",
    driverWhatsappRecipients: rawSettings?.driverWhatsappRecipients || "",
    bankName: rawSettings?.bankName || "",
    debitFee: rawSettings?.debitFee || "1,99",
    creditFee: rawSettings?.creditFee || "3,49",
    installmentFee: rawSettings?.installmentFee || "4,99",
    pixFee: rawSettings?.pixFee || "0",
    cashFee: rawSettings?.cashFee || "0",
    electronicSignatureUrl: rawSettings?.electronicSignatureUrl || "",
    electronicSignatureName: rawSettings?.electronicSignatureName || "",
    expirationDate: rawSettings?.expirationDate || authUser?.expirationDate || "",
  };
}

function readAccountSettings() {
  try {
    const stored = localStorage.getItem(ACCOUNT_SETTINGS_STORAGE_KEY);
    if (stored) {
      return normalizeAccountSettings(JSON.parse(stored));
    }
  } catch {}

  return normalizeAccountSettings();
}

function writeAccountSettings(settings) {
  try {
    const normalized = normalizeAccountSettings(settings);
    localStorage.setItem(ACCOUNT_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: normalized }));
  } catch {}
}

function readStoredUiSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_UI_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return {};
}

function writeStoredUiSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_UI_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: settings }));
  } catch {}
}

function getBannerStageFromDates(banner = {}) {
  const now = new Date();
  const startDate = banner?.startDate ? new Date(banner.startDate) : null;
  const endDate = banner?.endDate ? new Date(banner.endDate) : null;

  if (banner?.isActive === false) return "inactive";
  if (startDate && startDate > now) return "scheduled";
  if (endDate && endDate < now) return "expired";
  return "active";
}

function resolveApiAssetUrl(rawUrl) {
  if (!rawUrl) return "";

  const value = String(rawUrl).trim();
  if (!value) return "";
  if (value.startsWith("data:") || value.startsWith("blob:")) return value;

  try {
    const apiOrigin = new URL(API_BASE_URL, window.location.origin);

    if (value.startsWith("/")) {
      return new URL(value, apiOrigin.origin).toString();
    }

    const parsed = new URL(value, apiOrigin.origin);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      parsed.protocol = apiOrigin.protocol;
      parsed.host = apiOrigin.host;
    }
    return parsed.toString();
  } catch {
    return value;
  }
}

function resolveExternalLink(rawUrl) {
  if (!rawUrl) return "";

  const value = String(rawUrl).trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
}

function normalizeAgendaBannerRecord(record = {}) {
  return {
    id: record.id || `agenda-banner-${Date.now()}`,
    title: record.title || "Banner da agenda",
    placement: record.placement || "agenda_sidebar",
    url: resolveApiAssetUrl(record.url || ""),
    link: record.link || "",
    startDate: record.startDate || "",
    endDate: record.endDate || "",
    isActive: record.isActive !== false,
    reminderDays: Number(record.reminderDays || 7),
    notes: record.notes || "",
    order: Number(record.order || 0),
    stage: record.stage || getBannerStageFromDates(record),
    daysUntilEnd:
      record.endDate
        ? Math.ceil((new Date(record.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null,
  };
}

function readDemoAgendaBanners() {
  try {
    const stored = localStorage.getItem(DEMO_AGENDA_BANNERS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map(normalizeAgendaBannerRecord);
  } catch {
    return [];
  }
}

function writeDemoAgendaBanners(banners) {
  try {
    localStorage.setItem(
      DEMO_AGENDA_BANNERS_STORAGE_KEY,
      JSON.stringify((banners || []).map(normalizeAgendaBannerRecord)),
    );
  } catch {}
}

function getActiveAgendaSidebarBanner(banners = []) {
  return [...banners]
    .map(normalizeAgendaBannerRecord)
    .filter((item) => item.placement === "agenda_sidebar" && item.stage === "active")
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    })[0] || null;
}

function getPlanNoticeState(user) {
  const expirationValue = user?.expirationDate;
  if (!expirationValue) {
    return {
      isVisible: false,
      isExpired: false,
      daysUntilExpiry: null,
      formattedDate: "",
    };
  }

  const expirationDate = new Date(expirationValue);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(expirationDate);
  compareDate.setHours(0, 0, 0, 0);
  const daysUntilExpiry = Math.ceil((compareDate - today) / (1000 * 60 * 60 * 24));

  return {
    isVisible: daysUntilExpiry <= 7,
    isExpired: daysUntilExpiry < 0,
    daysUntilExpiry,
    formattedDate: formatDateBr(expirationValue),
  };
}

const RESOURCE_ITEMS = [
  { key: "clinica", label: "Clínica" },
  { key: "estetica", label: "Estética" },
  { key: "vacinas", label: "Vacinas" },
  { key: "exames", label: "Exames" },
  { key: "internacao", label: "Internação" },
  { key: "crmIa", label: "Doutor Basinho (IA)" },
  { key: "fila", label: "Fila de Atendimento" },
  { key: "caixa", label: "Usar Controle de Caixa" },
];

const RESOURCE_LABEL_TO_KEY = Object.fromEntries(RESOURCE_ITEMS.map((item) => [item.label, item.key]));
const DEFAULT_RESOURCE_KEYS = RESOURCE_ITEMS.map((item) => item.key);

function normalizeStoredResources(value) {
  const entries = Array.isArray(value) ? value : [];
  const keys = entries
    .map((item) => RESOURCE_LABEL_TO_KEY[item] || item)
    .filter((item) => DEFAULT_RESOURCE_KEYS.includes(item));
  return keys.length ? Array.from(new Set(keys)) : [...DEFAULT_RESOURCE_KEYS];
}

function readSelectedResources() {
  try {
    const stored = localStorage.getItem(RESOURCE_SETTINGS_STORAGE_KEY);
    return normalizeStoredResources(stored ? JSON.parse(stored) : DEFAULT_RESOURCE_KEYS);
  } catch {
    return [...DEFAULT_RESOURCE_KEYS];
  }
}

function writeSelectedResources(value) {
  try {
    localStorage.setItem(
      RESOURCE_SETTINGS_STORAGE_KEY,
      JSON.stringify(normalizeStoredResources(value)),
    );
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
  } catch {}
}

function isResourceEnabled(resourceKeys, key) {
  return resourceKeys.includes(key);
}

function getVisibleAppMenuItems(resourceKeys) {
  return appMenu.filter((item) => {
    if (item.path === "/exames") return isResourceEnabled(resourceKeys, "exames");
    if (item.path === "/fila") return isResourceEnabled(resourceKeys, "fila");
    if (item.path === "/financeiro") return isResourceEnabled(resourceKeys, "caixa");
    return true;
  });
}

function getVisibleSideModules(resourceKeys) {
  return [...modules, "Configurar"].filter((module) => {
    const normalized = String(module || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (normalized.includes("exame")) return isResourceEnabled(resourceKeys, "exames");
    if (normalized.includes("fila")) return isResourceEnabled(resourceKeys, "fila");
    if (normalized.includes("intern")) return isResourceEnabled(resourceKeys, "internacao");
    if (normalized.includes("financeiro") || normalized.includes("venda")) return isResourceEnabled(resourceKeys, "caixa");
    return true;
  });
}

function isRouteAllowedByResources(pathname, resourceKeys) {
  if (pathname.startsWith("/exames")) return isResourceEnabled(resourceKeys, "exames");
  if (pathname.startsWith("/fila")) return isResourceEnabled(resourceKeys, "fila");
  if (pathname.startsWith("/internacao") || pathname.startsWith("/agenda/internacao")) return isResourceEnabled(resourceKeys, "internacao");
  if (pathname.startsWith("/financeiro") || pathname.startsWith("/venda")) return isResourceEnabled(resourceKeys, "caixa");
  if (pathname.startsWith("/agenda/clinica")) return isResourceEnabled(resourceKeys, "clinica");
  return true;
}

function isDashboardTileVisible(title, resourceKeys) {
  const normalized = String(title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("exame")) return isResourceEnabled(resourceKeys, "exames");
  if (normalized === "fila") return isResourceEnabled(resourceKeys, "fila");
  if (normalized.includes("intern")) return isResourceEnabled(resourceKeys, "internacao");
  if (normalized.includes("financeiro") || normalized.includes("venda")) return isResourceEnabled(resourceKeys, "caixa");
  return true;
}

function getVisibleAgendaTabs(resourceKeys) {
  return ["Estética", "Clínica", "Internação", "Fila"].filter((tab) => {
    if (tab === "Estética") return isResourceEnabled(resourceKeys, "estetica");
    if (tab === "Clínica") return isResourceEnabled(resourceKeys, "clinica");
    if (tab === "Internação") return isResourceEnabled(resourceKeys, "internacao");
    if (tab === "Fila") return isResourceEnabled(resourceKeys, "fila");
    return true;
  });
}

function buildWorkingDaysFromPreset(preset) {
  const base = {
    sunday: false,
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
  };

  switch (preset) {
    case "all":
      return { ...base, sunday: true, monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true };
    case "monday-friday":
      return { ...base, monday: true, tuesday: true, wednesday: true, thursday: true, friday: true };
    case "monday-saturday":
      return { ...base, monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true };
    case "tuesday-saturday":
      return { ...base, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true };
    default:
      return { ...base, monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true };
  }
}

function getWorkingDaysPreset(workingDays = {}) {
  const map = {
    all: buildWorkingDaysFromPreset("all"),
    "monday-friday": buildWorkingDaysFromPreset("monday-friday"),
    "monday-saturday": buildWorkingDaysFromPreset("monday-saturday"),
    "tuesday-saturday": buildWorkingDaysFromPreset("tuesday-saturday"),
  };
  return (
    Object.entries(map).find(([, value]) => JSON.stringify(value) === JSON.stringify({
      sunday: Boolean(workingDays.sunday),
      monday: Boolean(workingDays.monday),
      tuesday: Boolean(workingDays.tuesday),
      wednesday: Boolean(workingDays.wednesday),
      thursday: Boolean(workingDays.thursday),
      friday: Boolean(workingDays.friday),
      saturday: Boolean(workingDays.saturday),
    }))?.[0] || "monday-saturday"
  );
}

function getWorkingDaysPresetLabel(preset) {
  return {
    all: "Todos os dias",
    "monday-friday": "Segunda a Sexta",
    "monday-saturday": "Segunda a Sábado",
    "tuesday-saturday": "Terça a Sábado",
  }[preset] || "Segunda a Sábado";
}

function getWeekdayKeyFromDate(dateString) {
  const weekday = new Date(`${dateString}T12:00:00`).getDay();
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][weekday];
}

const BRAZIL_FIXED_NATIONAL_HOLIDAYS = {
  "01-01": "Confraternizacao Universal",
  "04-21": "Tiradentes",
  "05-01": "Dia do Trabalhador",
  "09-07": "Independencia do Brasil",
  "10-12": "Nossa Senhora Aparecida",
  "11-02": "Finados",
  "11-15": "Proclamacao da Republica",
  "11-20": "Dia da Consciencia Negra",
  "12-25": "Natal",
};

function getNationalHolidayName(dateString) {
  const normalized = String(dateString || "").slice(5, 10);
  return BRAZIL_FIXED_NATIONAL_HOLIDAYS[normalized] || "";
}

function getCalendarDayMeta(dateString, selectedDate, workingDays) {
  const weekdayKey = getWeekdayKeyFromDate(dateString);
  const isWorkingDay = Boolean(workingDays?.[weekdayKey]);
  const holidayName = getNationalHolidayName(dateString);
  const isHoliday = Boolean(holidayName);
  const isSelected = dateString === selectedDate;

  return {
    weekdayKey,
    isWorkingDay,
    holidayName,
    isHoliday,
    isSelected,
    isBlocked: !isWorkingDay || isHoliday,
  };
}

function normalizeThemeHex(value, fallback = "#ca9aea") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const normalized = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
}

function hexToRgb(hex) {
  const normalized = normalizeThemeHex(hex).slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function hexToRgba(hex, alpha = 1) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shiftHexColor(hex, amount = 0) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (value) => Math.max(0, Math.min(255, value));
  const toHex = (value) => clamp(value).toString(16).padStart(2, "0");
  return `#${toHex(r + amount)}${toHex(g + amount)}${toHex(b + amount)}`;
}

function getPaymentFeePercentage(paymentMethod, settings = readAccountSettings()) {
  const normalized = String(paymentMethod || "").toLowerCase();
  if (normalized.includes("deb")) return Number(String(settings.debitFee || 0).replace(",", ".")) || 0;
  if (normalized.includes("parc")) return Number(String(settings.installmentFee || 0).replace(",", ".")) || 0;
  if (normalized.includes("cred")) return Number(String(settings.creditFee || 0).replace(",", ".")) || 0;
  if (normalized.includes("pix")) return Number(String(settings.pixFee || 0).replace(",", ".")) || 0;
  if (normalized.includes("din") || normalized.includes("cash")) return Number(String(settings.cashFee || 0).replace(",", ".")) || 0;
  return 0;
}

function calculateFeeBreakdown(grossAmount, paymentMethod, settings = readAccountSettings()) {
  const gross = Number(grossAmount || 0) || 0;
  const feePercentage = getPaymentFeePercentage(paymentMethod, settings);
  const feeAmount = Number(((gross * feePercentage) / 100).toFixed(2));
  const netAmount = Number((gross - feeAmount).toFixed(2));
  return { grossAmount: gross, feePercentage, feeAmount, netAmount };
}

const PAYMENT_METHOD_OPTIONS = [
  { value: "Pix", label: "Pix" },
  { value: "Dinheiro", label: "Dinheiro" },
  { value: "Debito", label: "Debito" },
  { value: "Credito", label: "Credito" },
  { value: "Credito parcelado", label: "Credito parcelado" },
  { value: "Transferencia", label: "Transferencia" },
];

async function apiRequest(path, options = {}) {
  const { headers: optionHeaders = {}, ...restOptions } = options;
  const isFormDataBody = typeof FormData !== "undefined" && restOptions.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: isFormDataBody
      ? { ...optionHeaders }
      : {
          "Content-Type": "application/json",
          ...optionHeaders,
        },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || "Nao foi possivel concluir a operacao.";
    const requestError = new Error(message);
    requestError.details = data?.error || "";
    requestError.payload = data || null;
    throw requestError;
  }

  return data;
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) || "");
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [pendingFirstAccess, setPendingFirstAccess] = useState(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!token) {
        if (active) {
          setUser(null);
          setPendingFirstAccess(null);
          setIsReady(true);
        }
        return;
      }

      if (token === DEMO_AUTH_TOKEN) {
        if (active) {
          setUser(buildDemoUser());
          setIsReady(true);
        }
        return;
      }

      try {
        const account = await apiRequest("/account", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (active) {
          setUser(account);
          setPendingFirstAccess(null);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        if (active) {
          setToken("");
          setUser(null);
          setPendingFirstAccess(null);
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, [token]);

  async function login(email, password) {
    setIsAuthenticating(true);
    try {
      let result;
      try {
        result = await apiRequest("/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
      } catch (error) {
        if (email === DEMO_USER_EMAIL && password === DEMO_USER_PASSWORD) {
          localStorage.setItem(AUTH_STORAGE_KEY, DEMO_AUTH_TOKEN);
          setToken(DEMO_AUTH_TOKEN);
          setUser(buildDemoUser());
          return { token: DEMO_AUTH_TOKEN, demo: true };
        }
        throw error;
      }

      if (result?.requiresPasswordChange) {
        setPendingFirstAccess({
          email: result.email || email,
          name: result.name || "",
          token: result.firstAccessToken,
          expiresAt: result.firstAccessExpiresAt || null,
        });
        setToken("");
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return result;
      }

      localStorage.setItem(AUTH_STORAGE_KEY, result.token);
      setToken(result.token);
      setPendingFirstAccess(null);
      setUser(
        buildProvisionalUserFromToken(result.token, {
          email,
          role: result.role,
        }),
      );
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  }

  function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setToken("");
    setUser(null);
    setPendingFirstAccess(null);
  }

  async function completeFirstAccess(password) {
    setIsAuthenticating(true);
    try {
      if (!pendingFirstAccess?.token) {
        throw new Error("Nenhum primeiro acesso pendente foi encontrado.");
      }

      const result = await apiRequest("/login/complete-first-access", {
        method: "POST",
        body: JSON.stringify({
          token: pendingFirstAccess.token,
          password,
        }),
      });

      localStorage.setItem(AUTH_STORAGE_KEY, result.token);
      setToken(result.token);
      setPendingFirstAccess(null);
      setUser(
        buildProvisionalUserFromToken(result.token, {
          email: pendingFirstAccess?.email || "",
          name: pendingFirstAccess?.name || "",
          role: result.role,
        }),
      );
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function changePassword(password) {
    if (!token) {
      throw new Error("Sessao expirada. Entre novamente.");
    }

    if (token === DEMO_AUTH_TOKEN) {
      return { message: "Senha de demonstracao atualizada localmente." };
    }

    return apiRequest("/changepassword", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });
  }

  async function refreshAccount(currentToken = token) {
    if (!currentToken || currentToken === DEMO_AUTH_TOKEN) {
      return null;
    }

    const account = await apiRequest("/account", {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    setUser(account);
    return account;
  }

  async function requestPasswordReset(email) {
    if (!email) {
      throw new Error("Informe o e-mail para recuperar a senha.");
    }

    if (email === DEMO_USER_EMAIL) {
      return {
        message: "Modo demonstracao: o reset por e-mail nao esta ativo para a conta demo.",
      };
    }

    return apiRequest("/resetPassToken", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async function resetPasswordWithToken(resetToken, password) {
    if (!resetToken) {
      throw new Error("Token de redefinicao nao encontrado.");
    }

    return apiRequest("/resetpass", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resetToken}`,
      },
      body: JSON.stringify({ password }),
    });
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isReady,
        isAuthenticating,
        isAuthenticated: Boolean(token && user),
        pendingFirstAccess,
        login,
        logout,
        changePassword,
        refreshAccount,
        completeFirstAccess,
        requestPasswordReset,
        resetPasswordWithToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}

function ProtectedAppShell() {
  const auth = useAuth();

  if (!auth.isReady) {
    return <AuthLoadingPage />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/redefinir-senha" element={<LoginPage />} />
        <Route path="/agenda/motorista/compartilhar" element={<SharedDriverChecklistPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/*" element={<ProtectedAppShell />} />
      </Routes>
    </AuthProvider>
  );
}

function AppShell() {
  const auth = useAuth();
  const location = useLocation();
  const [uiSettings, setUiSettings] = useState(() => normalizeSettingsData(readStoredUiSettings(), auth.user));
  const [resourceKeys, setResourceKeys] = useState(() => readSelectedResources());
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeUserModal, setActiveUserModal] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState("");
  const [supportForm, setSupportForm] = useState({
    subject: "",
    message: "",
  });
  const [billingPixState, setBillingPixState] = useState({
    loading: false,
    error: "",
    data: null,
    copied: false,
  });
  const supportWhatsapp = (readAccountSettings().crmAccessWhatsapp || "551120977579").replace(/\D/g, "");
  const printablePage =
    location.pathname === "/agenda/motorista" || location.pathname === "/agenda/banho-tosa";
  const showSidePanel = location.pathname !== "/dashboard" && !printablePage;
  const isMainDashboardPage = location.pathname === "/" || location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/");
  const currentWatermarkScope = (() => {
    if (isMainDashboardPage) return "dashboard";
    if (location.pathname.startsWith("/agenda")) return "agenda";
    if (location.pathname.startsWith("/financeiro")) return "financeiro";
    if (location.pathname.startsWith("/mensagens")) return "crm";
    if (location.pathname.startsWith("/cadastros")) return "cadastros";
    if (location.pathname.startsWith("/viacentral")) return "viacentral";
    if (location.pathname.startsWith("/pesquisa")) return "pesquisa";
    if (location.pathname.startsWith("/configuracao")) return "configuracao";
    if (location.pathname.startsWith("/admin")) return "admin";
    return "all";
  })();

  useEffect(() => {
    setUiSettings(normalizeSettingsData(readStoredUiSettings(), auth.user));

    const syncSettings = (event) => {
      if (event?.type === "storage" && event.key && event.key !== SETTINGS_UI_STORAGE_KEY) {
        return;
      }
      const payload =
        event?.type === SETTINGS_UPDATED_EVENT && event?.detail
          ? event.detail
          : readStoredUiSettings();
      setUiSettings(normalizeSettingsData(payload, auth.user));
    };

    window.addEventListener("storage", syncSettings);
    window.addEventListener(SETTINGS_UPDATED_EVENT, syncSettings);
    return () => {
      window.removeEventListener("storage", syncSettings);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, syncSettings);
    };
  }, [auth.user]);

  useEffect(() => {
    const syncResources = () => {
      setResourceKeys(readSelectedResources());
    };

    window.addEventListener("storage", syncResources);
    window.addEventListener(SETTINGS_UPDATED_EVENT, syncResources);
    return () => {
      window.removeEventListener("storage", syncResources);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, syncResources);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function hydrateSharedSettings() {
      if (!auth.token) {
        return;
      }

      if (auth.token === DEMO_AUTH_TOKEN) {
        return;
      }

      try {
        const [accountResponse, resourcesResponse, uiResponse] = await Promise.all([
          apiRequest("/settings/account", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
          apiRequest("/settings/resources", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
          apiRequest("/settings/extended", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
        ]);

        if (!active) return;

        const currentUser = auth.user;
        const nextAccountSettings = normalizeAccountSettings(accountResponse?.data || accountResponse || {}, currentUser);
        const nextUiSettings = normalizeSettingsData(uiResponse?.data || uiResponse || {}, currentUser);
        writeAccountSettings(nextAccountSettings);
        writeStoredUiSettings(nextUiSettings);
        writeSelectedResources(resourcesResponse?.data?.selected || resourcesResponse?.selected || []);
      } catch {
        // keep local fallback
      }
    }

    hydrateSharedSettings();

    return () => {
      active = false;
    };
  }, [auth.token, auth.user]);

  useEffect(() => {
    let active = true;
    let bootstrapTimeout = null;

    async function ensureDefaultMedicalCatalog() {
      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        return;
      }

      if (!auth.user?.establishment) {
        return;
      }

      if (auth.user?.role === "funcionario") {
        return;
      }

      const bootstrapKey = `${MEDICAL_CATALOG_BOOTSTRAP_PREFIX}:${auth.user.establishment}`;
      if (localStorage.getItem(bootstrapKey)) {
        return;
      }

      try {
        const servicesResponse = await apiRequest("/services", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        if (!active) return;

        const existingServices = normalizeListResponse(servicesResponse);
        const existingKeys = new Set(existingServices.map((item) => getMedicalCatalogKey(item)));
        const missingServices = buildDefaultMedicalCatalogServices().filter(
          (item) => !existingKeys.has(getMedicalCatalogKey(item)),
        );

        for (const item of missingServices) {
          if (!active) return;
          await apiRequest("/services", {
            method: "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify(item),
          });
        }

        localStorage.setItem(bootstrapKey, new Date().toISOString());
      } catch {
        // keep account usable even if the bootstrap catalog fails
      }
    }

    bootstrapTimeout = setTimeout(() => {
      ensureDefaultMedicalCatalog();
    }, 1200);

    return () => {
      active = false;
      if (bootstrapTimeout) {
        clearTimeout(bootstrapTimeout);
      }
    };
  }, [auth.token, auth.user?.establishment, auth.user?.role]);

  async function handlePasswordSubmit() {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordFeedback("Preencha a nova senha e a confirmacao.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback("A confirmacao da senha nao confere.");
      return;
    }

    try {
      await auth.changePassword(passwordForm.newPassword);
      setPasswordFeedback("Senha atualizada com sucesso.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordFeedback(error.message);
    }
  }

  const openSupportWhatsapp = () => {
    const composedMessage = encodeURIComponent(
      `Ola ViaPet!%0A%0AAssunto: ${supportForm.subject || "Suporte no sistema"}%0A%0AMensagem: ${supportForm.message || "Preciso de ajuda no sistema."}`,
    );
    window.open(`https://wa.me/${supportWhatsapp}?text=${composedMessage}`, "_blank", "noopener,noreferrer");
  };

  const closeUserModal = () => {
    setActiveUserModal(null);
    setPasswordFeedback("");
  };

  const copyPixCode = async () => {
    const code = billingPixState.data?.qrCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setBillingPixState((current) => ({
        ...current,
        copied: true,
      }));
    } catch {
      setBillingPixState((current) => ({
        ...current,
        error: "Nao foi possivel copiar o codigo PIX.",
      }));
    }
  };

  const displayUserName = auth.user?.name || "Usuario";
  const displayStoreName = uiSettings.storeName || auth.user?.storeName || "ViaPet";
  const visibleSideModules = getVisibleSideModules(resourceKeys);
  const routeAllowed = isRouteAllowedByResources(location.pathname, resourceKeys);
  const billingNotice = getPlanNoticeState(auth.user);
  const watermarkEnabled =
    Boolean(uiSettings.backgroundLogoUrl) &&
    (uiSettings.backgroundLogoScope.includes("all") || uiSettings.backgroundLogoScope.includes(currentWatermarkScope));
  const themeColor = normalizeThemeHex(uiSettings.theme);
  const shellStyle = {
    "--brand": themeColor,
    "--brand-strong": shiftHexColor(themeColor, -28),
    "--shell-topbar-bg": `linear-gradient(135deg, ${hexToRgba(themeColor, 0.16)} 0%, ${hexToRgba(shiftHexColor(themeColor, -32), 0.28)} 100%)`,
    "--shell-footer-bg": `linear-gradient(135deg, ${themeColor} 0%, ${shiftHexColor(themeColor, -28)} 100%)`,
    "--shell-footer-shadow": hexToRgba(themeColor, 0.24),
    "--watermark-image": watermarkEnabled ? `url("${uiSettings.backgroundLogoUrl}")` : "none",
    "--watermark-opacity": String(Number(uiSettings.backgroundLogoOpacity || 0.08) || 0.08),
  };

  const sendSupportMessage = () => {
    if (!supportForm.subject && !supportForm.message) {
      return;
    }
    openSupportWhatsapp();
    setSupportForm({ subject: "", message: "" });
  };

  const logoutUser = () => {
    auth.logout();
    setUserMenuOpen(false);
  };

  const openModal = (modalName) => {
    setActiveUserModal(modalName);
    setUserMenuOpen(false);
    setPasswordFeedback("");
  };

  const openBillingPixModal = async () => {
    setActiveUserModal("billing-pix");
    setUserMenuOpen(false);
    setBillingPixState({
      loading: true,
      error: "",
      data: null,
      copied: false,
    });

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setBillingPixState({
        loading: false,
        error: "Entre com a conta real para gerar a cobranca PIX.",
        data: null,
        copied: false,
      });
      return;
    }

    try {
      const response = await apiRequest("/account/billing/pix", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      setBillingPixState({
        loading: false,
        error: "",
        data: response?.data || response || null,
        copied: false,
      });
    } catch (error) {
      setBillingPixState({
        loading: false,
        error: error.message || "Nao foi possivel gerar o PIX agora.",
        data: null,
        copied: false,
      });
    }
  };

  return (
    <div className={watermarkEnabled ? "app-shell app-shell-watermark" : "app-shell"} style={shellStyle}>
      <header className="topbar">
        <div className="brand-wrap">
          <div className={`brand ${uiSettings.logoUrl ? "brand-has-image" : ""}`}>
            {uiSettings.logoUrl ? (
              <img className="brand-logo" src={uiSettings.logoUrl} alt={displayStoreName} />
            ) : (
              displayStoreName
            )}
          </div>
          <NavLink to="/dashboard" className="top-btn top-btn-home">
            Inicio
          </NavLink>
        </div>

        <div className="search search-compact">Pesquisar pet, tutor, atendimento ou telefone</div>

        <div className="topbar-actions">
          <NavLink to="/cadastros/novo-paciente" className="top-btn">
            Novo Pet
          </NavLink>
          <NavLink to="/venda" className="top-btn top-btn-alt">
            Nova Venda
          </NavLink>
          <div className="user-menu-wrap">
            <button className="top-btn top-btn-user" onClick={() => setUserMenuOpen((value) => !value)}>
              {displayUserName}
            </button>
            {userMenuOpen ? (
              <div className="user-dropdown">
                <button
                  className="user-dropdown-item"
                  onClick={() => openModal("password")}
                >
                  Redefinir Senha
                </button>
                <button
                  className="user-dropdown-item"
                  onClick={() => openModal("support")}
                >
                  Fale com Via Pet
                </button>
                <button
                  className="user-dropdown-item"
                  onClick={() => openModal("tutorials")}
                >
                  Tutoriais Via Pet
                </button>
                <button className="user-dropdown-item user-dropdown-item-danger" onClick={logoutUser}>
                  Sair
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {billingNotice.isVisible ? (
        <div className={billingNotice.isExpired ? "plan-notice-banner plan-notice-banner-danger" : "plan-notice-banner"}>
          <div>
            <strong>
              {billingNotice.isExpired
                ? `O acesso do ViaPet venceu em ${billingNotice.formattedDate}.`
                : `Seu ViaPet vence em ${billingNotice.formattedDate}.`}
            </strong>
            <span>
              {billingNotice.isExpired
                ? "Regularize o pagamento para voltar a usar o sistema sem bloqueio."
                : `Faltam ${billingNotice.daysUntilExpiry} dia(s) para o vencimento. Regularize o pagamento para nao ter o sistema travado.`}
            </span>
          </div>
          <div className="plan-notice-actions">
            <NavLink to="/configuracao/conta" className="soft-btn">
              Ver validade
            </NavLink>
            <button type="button" className="soft-btn" onClick={openBillingPixModal}>
              Pagar agora
            </button>
            <button type="button" className="soft-btn" onClick={() => openModal("support")}>
              Falar com suporte
            </button>
          </div>
        </div>
      ) : null}

      {isMainDashboardPage && billingNotice.isVisible && !billingNotice.isExpired ? (
        <div className="plan-notice-floating">
          <span className="section-kicker">Aviso de vencimento</span>
          <strong>Seu ViaPet vence em {billingNotice.formattedDate}</strong>
          <span>Faltam {billingNotice.daysUntilExpiry} dia(s). Regularize para não ter o sistema travado.</span>
          <div className="plan-notice-actions">
            <NavLink to="/configuracao/conta" className="soft-btn">
              Ver conta
            </NavLink>
            <button type="button" className="soft-btn" onClick={openBillingPixModal}>
              Pagar agora
            </button>
          </div>
        </div>
      ) : null}

      <div className="workspace layout-shell">
        {billingNotice.isExpired ? (
          <div className="plan-blocked-card">
            <span className="crm-header-kicker">Assinatura vencida</span>
            <h2>O acesso ao ViaPet esta temporariamente bloqueado</h2>
            <p>
              O vencimento aconteceu em {billingNotice.formattedDate}. Assim que o pagamento for confirmado,
              o admin pode liberar o sistema manualmente ou pela cobranca ativa.
            </p>
            <div className="plan-notice-actions">
              <NavLink to="/configuracao/conta" className="soft-btn">
                Ver conta
              </NavLink>
              <button type="button" className="soft-btn" onClick={openBillingPixModal}>
                Pagar agora
              </button>
              <button type="button" className="soft-btn" onClick={() => openModal("support")}>
                Solicitar regularizacao
              </button>
              <button type="button" className="soft-btn danger-btn" onClick={logoutUser}>
                Sair
              </button>
            </div>
          </div>
        ) : !routeAllowed ? (
          <div className="plan-blocked-card">
            <span className="crm-header-kicker">Recurso desativado</span>
            <h2>Esse modulo nao esta liberado para este usuario</h2>
            <p>Va em Configuracao &gt; Recursos e marque este recurso para voltar a usa-lo no dia a dia.</p>
            <div className="plan-notice-actions">
              <NavLink to="/configuracao/recursos" className="soft-btn">
                Abrir recursos
              </NavLink>
              <NavLink to="/dashboard" className="soft-btn">
                Ir para inicio
              </NavLink>
            </div>
          </div>
        ) : (
        <div className="page-content">
          <Routes>
            <Route path="/dashboard" element={<DashboardPageConnected />} />
            <Route path="/admin" element={<AdminControlPageConnected />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/agenda/clinica" element={<ClinicMainPage />} />
            <Route path="/agenda/internacao" element={<HospitalizationMainPageConnected />} />
            <Route path="/internacao" element={<HospitalizationMainPageConnected />} />
            <Route path="/exames" element={<ExamsMainPageConnected />} />
            <Route path="/fila" element={<QueueMainPageConnected />} />
            <Route
              path="/mensagens"
              element={
                <Suspense fallback={<div className="section-card">Carregando mensagens...</div>}>
                  <LazyMessagesRoutePage
                    auth={auth}
                    apiRequest={apiRequest}
                    isDemo={auth.token === DEMO_AUTH_TOKEN}
                  />
                </Suspense>
              }
            />
            <Route path="/pesquisa" element={<SearchMainPageConnected />} />
            <Route path="/viacentral" element={<ViaCentralMainPageConnected />} />
            <Route path="/venda" element={<SalesMainPageConnected />} />
            <Route path="/configuracao" element={<SettingsProfilePageConnected />} />
            <Route path="/configuracao/recursos" element={<SettingsResourcesPageConnected />} />
            <Route path="/configuracao/agenda" element={<SettingsAgendaPageConnected />} />
            <Route path="/configuracao/taxas" element={<SettingsTaxesPageConnected />} />
            <Route path="/configuracao/impressao" element={<SettingsPrintPageConnected />} />
            <Route path="/configuracao/conta" element={<SettingsAccountPageConnected />} />
            <Route path="/receita" element={<PrescriptionPrintPage />} />
            <Route path="/agenda/motorista" element={<DriverRoutePageConnected />} />
            <Route path="/agenda/motorista/compartilhar" element={<SharedDriverChecklistPage />} />
            <Route path="/agenda/banho-tosa" element={<BathSchedulePageConnected />} />
            <Route path="/financeiro" element={<FinancePage />} />
            <Route path="/financeiro/compras" element={<FinancePurchasesPage />} />
            <Route path="/financeiro/compras/novo" element={<FinancePurchaseNewPage />} />
            <Route path="/financeiro/pagamentos" element={<FinancePaymentsPage />} />
            <Route path="/financeiro/comissoes" element={<FinanceCommissionsPage />} />
            <Route path="/financeiro/resumo" element={<FinanceSummaryPage />} />
            <Route path="/cadastros" element={<RegistersModernPageConnected />} />
            <Route path="/cadastros/novo-paciente" element={<NewPatientFormPage />} />
            <Route path="/cadastros/nova-pessoa" element={<NewPersonFormPage />} />
            <Route path="/cadastros/novo-produto" element={<NewProductFormPageConnected />} />
            <Route path="/cadastros/novo-servico" element={<NewServiceFormPageConnected />} />
            <Route path="/cadastros/novo-exame" element={<NewExamFormPageConnected />} />
            <Route path="/cadastros/nova-vacina" element={<NewVaccineFormPageConnected />} />
            <Route path="/cadastros/vacinas" element={<RegistersVaccinesPageConnected />} />
          </Routes>
        </div>
        )}

          {showSidePanel && !billingNotice.isExpired ? (
            <aside className="right-panel app-side-panel">
                {visibleSideModules.map((module, index) => (
                <NavLink
                  key={module}
                  to={resolveModulePath(module)}
                  className={`module-btn module-${index % 6}`}
                >
                  {formatModuleLabel(module)}
                </NavLink>
              ))}
            </aside>
            ) : null}
        </div>

      <footer className="app-footer-bar">
        <span>{displayStoreName}</span>
      </footer>

      {activeUserModal === "password" ? (
        <div className="user-modal-overlay">
          <div className="user-modal-card user-modal-password">
            <h2>Redefinir Senha</h2>
            <div className="user-modal-fields">
              <input
                className="user-input"
                type="password"
                placeholder="Senha Atual"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
              />
              <input
                className="user-input"
                type="password"
                placeholder="Nova senha"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
              />
              <input
                className="user-input"
                type="password"
                placeholder="Repita a nova senha"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </div>
            {passwordFeedback ? <div className="user-feedback">{passwordFeedback}</div> : null}
            <div className="user-modal-actions">
              <button className="footer-btn footer-btn-green" onClick={handlePasswordSubmit}>
                OK
              </button>
              <button className="user-modal-cancel" onClick={closeUserModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeUserModal === "support" ? (
        <div className="user-modal-overlay">
          <div className="user-modal-card user-modal-support">
            <h2>Fale com Via Pet</h2>
            <div className="user-modal-fields">
              <input
                className="user-input"
                type="text"
                placeholder="Assunto"
                value={supportForm.subject}
                onChange={(event) =>
                  setSupportForm((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
              />
              <textarea
                className="user-textarea"
                placeholder="Descreva aqui sua dúvida ou o suporte que você precisa."
                value={supportForm.message}
                onChange={(event) =>
                  setSupportForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
              />
            </div>
            <div className="user-modal-actions">
              <button className="footer-btn footer-btn-green" onClick={sendSupportMessage}>
                Enviar
              </button>
              <button className="user-modal-cancel" onClick={closeUserModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeUserModal === "billing-pix" ? (
        <div className="user-modal-overlay">
          <div className="user-modal-card billing-pix-modal">
            <h2>Pagar ViaPet por PIX</h2>
            <p className="billing-pix-copy">
              O codigo abaixo foi gerado pela cobranca configurada no admin para agilizar a regularizacao.
            </p>

            {billingPixState.loading ? (
              <div className="billing-pix-loading">Gerando codigo PIX...</div>
            ) : billingPixState.error ? (
              <div className="user-feedback">{billingPixState.error}</div>
            ) : billingPixState.data ? (
              <div className="billing-pix-body">
                <div className="billing-pix-summary">
                  <span>Valor</span>
                  <strong>{formatCurrencyBr(billingPixState.data.amount || 0)}</strong>
                  <span>
                    Vencimento atual:{" "}
                    {billingPixState.data.expirationDate
                      ? formatDateBr(billingPixState.data.expirationDate)
                      : "nao informado"}
                  </span>
                </div>

                {billingPixState.data.qrCodeBase64 ? (
                  <div className="billing-pix-qr-wrap">
                    <img
                      className="billing-pix-qr"
                      src={`data:image/png;base64,${billingPixState.data.qrCodeBase64}`}
                      alt="QR Code PIX"
                    />
                  </div>
                ) : null}

                <textarea
                  className="billing-pix-code"
                  readOnly
                  value={billingPixState.data.qrCode || ""}
                />

                <div className="user-modal-actions">
                  <button className="footer-btn footer-btn-green" type="button" onClick={copyPixCode}>
                    {billingPixState.copied ? "Codigo copiado" : "Copiar codigo PIX"}
                  </button>
                  {billingPixState.data.ticketUrl ? (
                    <button
                      className="soft-btn"
                      type="button"
                      onClick={() =>
                        window.open(
                          billingPixState.data.ticketUrl,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      Abrir cobranca
                    </button>
                  ) : null}
                  <button className="user-modal-cancel" onClick={closeUserModal}>
                    Fechar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeUserModal === "tutorials" ? (
        <div className="user-modal-overlay">
          <div className="user-modal-card user-modal-tutorials">
            <div className="tutorials-header">
              <h2>Tutoriais do ViaPet</h2>
            </div>
            <div className="tutorials-grid">
              <section className="tutorial-card tutorial-green">
                <h3>Cadastro de Animais</h3>
                <div className="tutorial-list">
                  <span>Cadastrando Pacientes</span>
                  <span>Anotando Eventos Clínicos</span>
                  <span>Emitindo Prescrições</span>
                  <span>Emitindo Documentos Padronizados</span>
                </div>
              </section>
              <section className="tutorial-card tutorial-purple">
                <h3>Produtos e Serviços</h3>
                <div className="tutorial-list">
                  <span>Cadastrando Produtos</span>
                  <span>Cadastrando Serviços</span>
                  <span>Cadastrando Meios de Pagamento</span>
                  <span>Controlando Estoque</span>
                </div>
              </section>
              <section className="tutorial-card tutorial-gold">
                <h3>Controle Financeiro</h3>
                <div className="tutorial-list">
                  <span>Realizando o Controle Financeiro</span>
                  <span>Controlando o Caixa</span>
                  <span>Utilizando o Painel ViaCentral</span>
                  <span>Pesquisando Devedores</span>
                </div>
              </section>
              <section className="tutorial-card tutorial-blue">
                <h3>Vacinas e Exames</h3>
                <div className="tutorial-list">
                  <span>Cadastrando Planos de Vacinação</span>
                </div>
              </section>
              <section className="tutorial-card tutorial-navy">
                <h3>Outros Tutoriais</h3>
                <div className="tutorial-list">
                  <span>Cadastrando Usuários</span>
                </div>
              </section>
            </div>
            <div className="user-modal-actions">
              <button className="footer-btn footer-btn-green" onClick={closeUserModal}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function resolveModulePath(module) {
  switch (module) {
    case "Agenda":
      return "/agenda";
    case "Cadastros":
      return "/cadastros";
    case "Exames":
      return "/exames";
    case "Fila":
      return "/fila";
    case "Financeiro":
      return "/financeiro";
    case "Mensagens":
      return "/mensagens";
    case "Pesquisa":
      return "/pesquisa";
    case "Configurar":
      return "/configuracao";
    case "Internação":
      return "/internacao";
    case "SuperVet":
      return "/viacentral";
    case "Venda":
      return "/venda";
    default:
      return "/agenda";
  }
}

function formatModuleLabel(module) {
  if (module === "SuperVet") {
    return "ViaCentral";
  }

  return module;
}

function getAgendaTabPath(tab) {
  switch (tab) {
    case "Estética":
      return "/agenda";
    case "Clínica":
      return "/agenda/clinica";
    case "Internação":
      return "/agenda/internacao";
    case "Fila":
      return "/fila";
    default:
      return "/agenda";
  }
}

function AuthLoadingPage() {
  return (
    <div className="auth-page">
      <div className="auth-card auth-loading-card">
        <strong>Carregando sua sessao...</strong>
      </div>
    </div>
  );
}

function LoginPage() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loginSubmitArmed, setLoginSubmitArmed] = useState(false);
  const resetToken = new URLSearchParams(location.search).get("token") || "";

  useEffect(() => {
    auth.logout();
    setPassword("");
  }, []);

  useEffect(() => {
    const loginState = location.state;
    if (!loginState || typeof loginState !== "object") {
      return;
    }

    if (loginState.prefillEmail) {
      setEmail(loginState.prefillEmail);
    }

    if (loginState.infoMessage) {
      setInfoMessage(loginState.infoMessage);
    }

    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (!loginSubmitArmed) {
      setInfoMessage("Clique em Entrar para acessar o sistema.");
      return;
    }

    try {
      const result = await auth.login(email, password);
      if (!result?.requiresPasswordChange) {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoginSubmitArmed(false);
    }
  }

  async function handleFirstAccessSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Preencha a nova senha e a confirmacao.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("As senhas nao coincidem.");
      return;
    }

    try {
      await auth.completeFirstAccess(newPassword);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleForgotPasswordSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await auth.requestPasswordReset(email);
      setInfoMessage(response?.message || "Enviamos um link para redefinir sua senha.");
      setForgotMode(false);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleResetPasswordSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Preencha a nova senha e a confirmacao.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("As senhas nao coincidem.");
      return;
    }

    try {
      const response = await auth.resetPasswordWithToken(resetToken, newPassword);
      setInfoMessage(response?.message || "Senha redefinida com sucesso.");
      setNewPassword("");
      setConfirmPassword("");
      navigate("/login", { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  const isFirstAccessMode = Boolean(auth.pendingFirstAccess?.token);
  const isResetPasswordMode = Boolean(resetToken);
  const formMode = isFirstAccessMode ? "first-access" : isResetPasswordMode ? "reset-password" : forgotMode ? "forgot-password" : "login";
  const isPasswordMode = formMode === "first-access" || formMode === "reset-password";

  return (
    <div className="auth-page">
      <form
        className="auth-card"
        autoComplete="off"
        onSubmit={
          formMode === "first-access"
            ? handleFirstAccessSubmit
            : formMode === "reset-password"
              ? handleResetPasswordSubmit
              : formMode === "forgot-password"
                ? handleForgotPasswordSubmit
                : handleSubmit
        }
      >
        <div className="auth-brand">ViaPet</div>
        <div className="auth-copy">
          <h1>
            {formMode === "first-access"
              ? "Primeiro acesso"
              : formMode === "reset-password"
                ? "Redefinir senha"
                : formMode === "forgot-password"
                  ? "Esqueci minha senha"
                  : "Entrar no sistema"}
          </h1>
          <p>
            {formMode === "first-access"
              ? `Defina a nova senha para liberar a conta ${auth.pendingFirstAccess?.email || ""}.`
              : formMode === "reset-password"
                ? "Crie sua nova senha para voltar a acessar o sistema."
                : formMode === "forgot-password"
                  ? "Informe seu e-mail para receber o link de redefinicao."
                  : "Use seu e-mail e senha para acessar agenda, cadastros, financeiro e operacao."}
          </p>
        </div>

        <div className="auth-fields">
          {isPasswordMode ? (
            <>
              {formMode === "first-access" ? (
                <input
                  className="auth-input"
                  type="email"
                  placeholder="E-mail"
                  value={auth.pendingFirstAccess?.email || ""}
                  disabled
                />
              ) : null}
              <input
                className="auth-input"
                type="password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <input
                className="auth-input"
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </>
          ) : formMode === "forgot-password" ? (
            <input
              className="auth-input"
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          ) : (
            <>
              <input
                className="auth-input"
                type="email"
                name="email"
                autoComplete="username"
                placeholder="E-mail"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setLoginSubmitArmed(false);
                }}
              />
              <input
                className="auth-input"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Senha"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setLoginSubmitArmed(false);
                }}
              />
            </>
          )}
        </div>

        {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}
        {infoMessage ? <div className="feedback-banner">{infoMessage}</div> : null}

        <button
          className="auth-submit"
          type="submit"
          disabled={auth.isAuthenticating}
          onClick={() => {
            if (formMode === "login") {
              setLoginSubmitArmed(true);
            }
          }}
        >
          {auth.isAuthenticating
            ? "Processando..."
            : formMode === "first-access" || formMode === "reset-password"
              ? "Salvar nova senha"
              : formMode === "forgot-password"
                ? "Enviar link"
                : "Entrar"}
        </button>

        {formMode === "login" ? (
          <>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setForgotMode(true);
                setErrorMessage("");
                setInfoMessage("");
              }}
            >
              Esqueci minha senha
            </button>
            <button type="button" className="auth-link-btn" onClick={() => navigate("/register")}>
              Criar conta gratis
            </button>
          </>
        ) : null}

        {formMode === "forgot-password" ? (
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => {
              setForgotMode(false);
              setErrorMessage("");
              setInfoMessage("");
            }}
          >
            Voltar para o login
          </button>
        ) : null}
      </form>
    </div>
  );
}

function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (auth.isReady && auth.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      setErrorMessage("Preencha nome, e-mail, telefone e senha.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage("As senhas nao coincidem.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest("/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });
      navigate("/login", {
        replace: true,
        state: {
          prefillEmail: form.email.trim(),
          infoMessage:
            response?.message || "Conta criada com sucesso. Agora voce ja pode entrar no sistema.",
        },
      });
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel criar a conta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">ViaPet</div>
        <div className="auth-copy">
          <h1>Criar conta gratis</h1>
          <p>Cadastre seu pet shop ou clinica e comece o teste gratis do sistema.</p>
        </div>

        <div className="auth-fields">
          <input
            className="auth-input"
            type="text"
            placeholder="Nome do responsavel ou empresa"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
          <input
            className="auth-input"
            type="email"
            placeholder="E-mail"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
          <input
            className="auth-input"
            type="text"
            placeholder="Telefone / WhatsApp"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Confirmar senha"
            value={form.confirmPassword}
            onChange={(event) => updateField("confirmPassword", event.target.value)}
          />
        </div>

        {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}
        {infoMessage ? <div className="feedback-banner">{infoMessage}</div> : null}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </button>

        <button type="button" className="auth-link-btn" onClick={() => navigate("/login")}>
          Ja tenho conta, quero entrar
        </button>
      </form>
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="page-grid dashboard-page">
      <section className="dashboard-stage">
        <div className="dashboard-left-zone">
          <div className="welcome-block dashboard-welcome">
            <h1 className="hero-title">Boa tarde, Vitor!</h1>
          </div>

          <div className="dashboard-entry-row">
            <div className="dashboard-action-stack">
              <div className="dashboard-cta-card">
                <strong>Novo Pet</strong>
                <span>Cadastro rapido</span>
              </div>
              <div className="dashboard-cta-card secondary">
                <strong>Novo Responsavel</strong>
                <span>Cadastro rapido</span>
              </div>
            </div>

            <div className="dashboard-search-stack">
              <div className="dashboard-search-box">Pets</div>
              <div className="dashboard-search-box">Responsaveis</div>
            </div>
          </div>

          <div className="dashboard-lower-left">
            <div className="dashboard-helper-list">
              {dashboardHelperLinks.map((item) => (
                <div key={item} className="helper-pill">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-center-zone">
          <div className="dashboard-birthday-panel">
            <div className="section-head dashboard-inline-head">
              <div>
                <span className="section-kicker">Aniversariantes</span>
                <h2>Todos do dia</h2>
              </div>
              <span className="chip chip-green">Auto aviso</span>
            </div>

            <div className="birthday-board birthday-board-list">
              {dashboardBirthdayBoard.map((entry) => (
                <article key={`${entry.type}-${entry.name}`} className={`birthday-card birthday-row birthday-${entry.tone}`}>
                  <div className="birthday-row-main">
                    <div className="birthday-type">{entry.type}</div>
                    <div className="birthday-text">
                      <strong>{entry.name}</strong>
                      <p>{entry.owner}</p>
                    </div>
                    <span className="birthday-when">{entry.when}</span>
                  </div>
                  <a
                    className="birthday-whatsapp"
                    href={`https://wa.me/${entry.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={entry.whatsappLabel}
                  >
                    WhatsApp
                  </a>
                </article>
              ))}
            </div>

            <div className="payables-panel">
              <div className="payables-head">
                <span className="section-kicker">Contas a pagar</span>
                <span className="chip chip-warn">{dashboardPayables.length} contas</span>
              </div>

              <div className="payables-list">
                {dashboardPayables.map((item) => (
                  <article key={`${item.title}-${item.due}`} className="payable-card">
                    <div>
                      <strong>{item.title}</strong>
                      <p>Vencimento {item.due}</p>
                    </div>
                    <div className="payable-side">
                      <span>{item.amount}</span>
                      <small>{item.status}</small>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-right-zone">
          <div className="dashboard-tiles dashboard-tiles-stage">
            {dashboardQuickTiles.map((tile) => (
              <div key={tile.title} className={`quick-tile ${tile.tone} ${tile.size === "sm" ? "quick-tile-sm" : ""}`}>
                <strong>{tile.title}</strong>
              </div>
            ))}
          </div>

          <div className="admin-banner dashboard-ad-banner">
            <div className="admin-banner-track">
              {dashboardAdminBanner.slides.map((slide, index) => (
                <article
                  key={slide.title}
                  className={`admin-banner-slide ${index === 0 ? "active" : ""} admin-banner-${slide.accent}`}
                >
                  <div className="admin-banner-copy">
                    <strong>{slide.title}</strong>
                    <p>{slide.description}</p>
                    <button className="soft-btn">{slide.cta}</button>
                  </div>
                </article>
              ))}
            </div>

            <div className="admin-banner-dots">
              {dashboardAdminBanner.slides.map((slide, index) => (
                <span key={slide.title} className={index === 0 ? "banner-dot active" : "banner-dot"} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatCurrencyBr(value) {
  return Number(value || 0).toFixed(2).replace(".", ",");
}

function parseCurrencyLike(value) {
  const numeric = Number(String(value ?? 0).replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatDateBr(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("pt-BR");
}

function formatDateIsoLocal(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createEmptyFinanceModuleState({ loading = true, feedback = "" } = {}) {
  return {
    loading,
    feedback,
    salesRows: [],
    purchasesRows: [],
    paymentRows: [],
    commissionRows: [],
    salesTotal: "Bruto R$ 0,00 | Total com taxas R$ 0,00",
    purchasesTotal: "Compras R$ 0,00",
    paymentsTotals: "Bruto R$ 0,00 | Taxas R$ 0,00 | Liquido R$ 0,00",
    commissionsTotal: "Comissoes R$ 0,00",
    summaryTotals: "Bruto R$ 0,00 | Taxas R$ 0,00 | Liquido R$ 0,00 | Custos R$ 0,00 | Lucro R$ 0,00",
    summaryCards: [
      { label: "Entrada bruta", value: "R$ 0,00" },
      { label: "Taxas de maquininha", value: "R$ 0,00" },
      { label: "Entrada liquida", value: "R$ 0,00" },
      { label: "Custos operacionais", value: "R$ 0,00" },
    ],
    summaryMetrics: {
      salesGross: 0,
      salesNet: 0,
      salesFees: 0,
      purchasesTotal: 0,
      paymentsGross: 0,
      paymentsNet: 0,
      paymentFees: 0,
      commissionsTotal: 0,
    },
  };
}

function decodeJwtPayload(token) {
  try {
    const payload = String(token || "").split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "="));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function buildProvisionalUserFromToken(token, fallback = {}) {
  const payload = decodeJwtPayload(token) || {};
  const fallbackId = fallback.establishment || fallback.id || "";

  return {
    id: payload.establishment || payload.id || fallbackId,
    userId: payload.id || fallback.userId || fallbackId,
    establishment: payload.establishment || fallback.establishment || payload.id || "",
    role: payload.role || fallback.role || "",
    name: fallback.name || "",
    email: fallback.email || "",
    plan: fallback.plan || "",
    expirationDate: fallback.expirationDate || null,
    establishmentOwnerId: payload.establishment || fallback.establishmentOwnerId || payload.id || "",
  };
}

function useFinanceModuleData() {
  const auth = useAuth();
  const location = useLocation();
  const [state, setState] = useState(() => createEmptyFinanceModuleState());
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadFinance() {
      if (!auth.token) {
        setState(
          createEmptyFinanceModuleState({
            loading: false,
            feedback: "Sessao expirada. Entre novamente para carregar as vendas.",
          }),
        );
        return;
      }

      if (auth.token === DEMO_AUTH_TOKEN) {
        setState({
          ...createEmptyFinanceModuleState({ loading: false }),
          salesRows: financeSummary.salesRows,
          purchasesRows: financeSummary.purchasesRows,
          paymentRows: financeSummary.paymentRows,
          commissionRows: financeSummary.commissionRows,
          salesTotal: financeSummary.salesTotal,
          purchasesTotal: financeSummary.purchasesTotal,
          paymentsTotals: financeSummary.paymentsTotals,
          commissionsTotal: financeSummary.commissionsTotal,
          summaryTotals: financeSummary.summaryTotals,
          summaryCards: financeSummary.cards,
          feedback: "Vendas usa somente dados reais. Entre com a conta real para visualizar o PDV.",
        });
        return;
      }

      try {
        setState((current) => ({ ...current, loading: true, feedback: "" }));
        const referenceDate = formatDateIsoLocal();

        const [salesResponse, dayFinanceResponse, summaryResponse] = await Promise.all([
          apiRequest("/sales", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
          apiRequest(`/finance/day/${referenceDate}`, {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
          apiRequest("/finance/summary", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
        ]);

        if (!active) return;

        const salesData = salesResponse?.data || [];
        const financeData = dayFinanceResponse?.data || [];
        const summaryData = summaryResponse?.data || {};
        const accountSettings = readAccountSettings();

        const mappedSalesRows = salesData.map((sale) => {
          const paymentMethod = sale.paymentMethod || "pix";
          const breakdown = calculateFeeBreakdown(sale.total, paymentMethod, accountSettings);
          const customerName =
            sale.Custumer?.name ||
            sale.Customer?.name ||
            sale.customer?.name ||
            sale.customerName ||
            "Cliente";
          const saleLines = Array.isArray(sale.SaleItems) && sale.SaleItems.length
            ? sale.SaleItems.map((item) => `${item.productName || item.name || "Produto"} R$${formatCurrencyBr(item.subTotal || item.price)}`)
            : ["Sem itens detalhados"];

          return {
            id: sale.id,
            date: formatDateBr(sale.createdAt),
            rawDate: sale.createdAt || null,
            sale: `Venda ${sale.id}` ,
            customer: customerName,
            clientTop: customerName,
            clientBottom: paymentMethod ? `Pagamento: ${String(paymentMethod).replace(/^\w/, (char) => char.toUpperCase())}` : "Venda registrada",
            lines: [
              `Cliente: ${customerName}`,
              ...saleLines,
            ],
            value: formatCurrencyBr(breakdown.netAmount),
            grossAmount: breakdown.grossAmount,
            feeAmount: breakdown.feeAmount,
            netAmount: breakdown.netAmount,
            grossDisplay: `R$ ${formatCurrencyBr(breakdown.grossAmount)}` ,
            feeDisplay: `R$ ${formatCurrencyBr(breakdown.feeAmount)}` ,
            netDisplay: `R$ ${formatCurrencyBr(breakdown.netAmount)}` ,
            paymentMethodLabel: String(paymentMethod).replace(/^\w/, (char) => char.toUpperCase()),
          };
        });

        const purchaseRows = financeData
          .filter((item) => item.type === "saida")
          .map((item) => ({
            id: item.id,
            date: formatDateBr(item.dueDate || item.date),
            description: item.description,
            value: formatCurrencyBr(item.amount),
          }));

        const paymentRows = financeData
          .filter((item) => item.type === "entrada")
          .map((item) => {
          const grossAmount = Number(item.grossAmount ?? item.amount ?? 0) || 0;
          const netAmount =
            item.netAmount != null
              ? Number(item.netAmount || 0)
              : calculateFeeBreakdown(grossAmount, item.paymentMethod, accountSettings).netAmount;
          const feeAmount =
            item.feeAmount != null
              ? Number(item.feeAmount || 0)
              : Number((grossAmount - netAmount).toFixed(2));

          return {
            id: item.id,
            date: formatDateBr(item.dueDate || item.date),
            description: `${item.description}${item.paymentMethod ? ` | ${item.paymentMethod}` : ""}` ,
            value: formatCurrencyBr(netAmount),
            grossAmount,
            feeAmount,
            netAmount,
            grossDisplay: `R$ ${formatCurrencyBr(grossAmount)}` ,
            feeDisplay: `R$ ${formatCurrencyBr(feeAmount)}` ,
            netDisplay: `R$ ${formatCurrencyBr(netAmount)}` ,
          };
        });

        const commissionRows = financeData
          .filter((item) => String(item.category || "").toLowerCase().includes("comiss") || String(item.description || "").toLowerCase().includes("comiss"))
          .map((item) => ({
            id: item.id,
            date: formatDateBr(item.dueDate || item.date),
            description: item.description,
            value: formatCurrencyBr(item.amount),
          }));

        const totalSalesGross = mappedSalesRows.reduce((sum, row) => sum + (row.grossAmount || 0), 0);
        const totalSalesNet = mappedSalesRows.reduce((sum, row) => sum + (row.netAmount || 0), 0);
        const totalSalesFees = mappedSalesRows.reduce((sum, row) => sum + (row.feeAmount || 0), 0);
        const totalPurchases = purchaseRows.reduce((sum, row) => sum + Number(String(row.value).replace(",", ".")), 0);
        const totalCommissions = commissionRows.reduce((sum, row) => sum + Number(String(row.value).replace(",", ".")), 0);
        const totalPaymentsGross = paymentRows.reduce((sum, row) => sum + (row.grossAmount || 0), 0);
        const totalPaymentsNet = paymentRows.reduce((sum, row) => sum + (row.netAmount || 0), 0);
        const totalPaymentsFees = paymentRows.reduce((sum, row) => sum + (row.feeAmount || 0), 0);

        setState({
          loading: false,
          feedback: "",
          salesRows: mappedSalesRows,
          purchasesRows: purchaseRows,
          paymentRows,
          commissionRows,
          salesTotal: `Bruto ${formatCurrencyBr(totalSalesGross)} | Total com taxas ${formatCurrencyBr(totalSalesNet)}` ,
          purchasesTotal: `Compras ${formatCurrencyBr(totalPurchases)}` ,
          paymentsTotals: `Bruto ${formatCurrencyBr(totalPaymentsGross)} | Taxas ${formatCurrencyBr(totalPaymentsFees)} | Liquido ${formatCurrencyBr(totalPaymentsNet)}` ,
          commissionsTotal: `Comissoes ${formatCurrencyBr(totalCommissions)}` ,
          summaryTotals: `Bruto ${formatCurrencyBr(totalSalesGross)} | Taxas ${formatCurrencyBr(totalSalesFees)} | Liquido ${formatCurrencyBr(totalSalesNet)} | Custos ${formatCurrencyBr(summaryData.saidas?.total)} | Lucro ${formatCurrencyBr(summaryData.saldo)}` ,
          summaryCards: [
            { label: "Entrada bruta", value: `R$ ${formatCurrencyBr(totalSalesGross)}` },
            { label: "Taxas de maquininha", value: `R$ ${formatCurrencyBr(totalSalesFees)}` },
            { label: "Entrada liquida", value: `R$ ${formatCurrencyBr(totalSalesNet)}` },
            { label: "Saidas", value: `R$ ${formatCurrencyBr(summaryData.saidas?.total)}` },
            { label: "Saldo", value: `R$ ${formatCurrencyBr(totalSalesNet - totalPurchases - totalCommissions)}` },
            { label: "Despesas variaveis", value: `R$ ${formatCurrencyBr(summaryData.saidas?.variaveis)}` },
          ],
        });
      } catch (error) {
        if (active) {
          setState(
            createEmptyFinanceModuleState({
              loading: false,
              feedback: error.message || "Nao foi possivel carregar o financeiro.",
            }),
          );
        }
      }
    }

    loadFinance();

    return () => {
      active = false;
    };
  }, [auth.token, reloadKey]);

  const financeSearchParams = new URLSearchParams(location.search);
  const vendorFilter = (financeSearchParams.get("vendor") || "").trim().toLowerCase();
  const productServiceFilter = (financeSearchParams.get("productService") || "").trim().toLowerCase();
  const petPersonFilter = (financeSearchParams.get("petPerson") || "").trim().toLowerCase();
  const originFilter = (financeSearchParams.get("origin") || "").trim().toLowerCase();
  const typeOnly = financeSearchParams.get("type") === "1";

  const matchesFinanceFilters = (values, { originLabel = "" } = {}) => {
    const normalizedValues = values.filter(Boolean).map((value) => String(value).toLowerCase());
    if (vendorFilter && !normalizedValues.some((value) => value.includes(vendorFilter))) return false;
    if (productServiceFilter && !normalizedValues.some((value) => value.includes(productServiceFilter))) return false;
    if (petPersonFilter && !normalizedValues.some((value) => value.includes(petPersonFilter))) return false;
    if (originFilter && originLabel && !String(originLabel).toLowerCase().includes(originFilter)) return false;
    if (typeOnly && !normalizedValues.some((value) => value.includes("produto") || value.includes("servico") || value.includes("banho") || value.includes("tosa"))) return false;
    return true;
  };

  const filteredSalesRows = state.salesRows.filter((row) =>
    matchesFinanceFilters([row.date, row.sale, row.customer, ...(row.lines || [])], { originLabel: "vendas" }),
  );
  const filteredPurchasesRows = state.purchasesRows.filter((row) =>
    matchesFinanceFilters([row.date, row.description, row.value], { originLabel: "compras" }),
  );
  const filteredPaymentRows = state.paymentRows.filter((row) =>
    matchesFinanceFilters([row.date, row.description, row.value], { originLabel: "pagamentos" }),
  );
  const filteredCommissionRows = state.commissionRows.filter((row) =>
    matchesFinanceFilters([row.date, row.description, row.value], { originLabel: "comissoes" }),
  );

  const summaryMetrics = {
    salesGross: filteredSalesRows.reduce((sum, row) => sum + (row.grossAmount ?? parseCurrencyLike(row.value)), 0),
    salesNet: filteredSalesRows.reduce((sum, row) => sum + (row.netAmount ?? parseCurrencyLike(row.value)), 0),
    salesFees: filteredSalesRows.reduce((sum, row) => sum + (row.feeAmount || 0), 0),
    purchasesTotal: filteredPurchasesRows.reduce((sum, row) => sum + parseCurrencyLike(row.value), 0),
    paymentsGross: filteredPaymentRows.reduce((sum, row) => sum + (row.grossAmount ?? parseCurrencyLike(row.value)), 0),
    paymentsNet: filteredPaymentRows.reduce((sum, row) => sum + (row.netAmount ?? parseCurrencyLike(row.value)), 0),
    paymentFees: filteredPaymentRows.reduce((sum, row) => sum + (row.feeAmount || 0), 0),
    commissionsTotal: filteredCommissionRows.reduce((sum, row) => sum + parseCurrencyLike(row.value), 0),
  };

  return {
    ...state,
    salesRows: filteredSalesRows,
    purchasesRows: filteredPurchasesRows,
    paymentRows: filteredPaymentRows,
    commissionRows: filteredCommissionRows,
    salesTotal: `Bruto ${formatCurrencyBr(summaryMetrics.salesGross)} | Total com taxas ${formatCurrencyBr(summaryMetrics.salesNet)}` ,
    purchasesTotal: `Compras ${formatCurrencyBr(summaryMetrics.purchasesTotal)}` ,
    paymentsTotals: `Bruto ${formatCurrencyBr(summaryMetrics.paymentsGross)} | Taxas ${formatCurrencyBr(summaryMetrics.paymentFees)} | Liquido ${formatCurrencyBr(summaryMetrics.paymentsNet)}` ,
    commissionsTotal: `Comissoes ${formatCurrencyBr(summaryMetrics.commissionsTotal)}` ,
    summaryTotals: `Bruto ${formatCurrencyBr(summaryMetrics.salesGross)} | Taxas ${formatCurrencyBr(summaryMetrics.salesFees)} | Liquido ${formatCurrencyBr(summaryMetrics.salesNet)} | Custos ${formatCurrencyBr(summaryMetrics.purchasesTotal)} | Lucro ${formatCurrencyBr(summaryMetrics.salesNet - summaryMetrics.purchasesTotal - summaryMetrics.commissionsTotal)}` ,
    summaryCards: [
      { label: "Entrada bruta", value: `R$ ${formatCurrencyBr(summaryMetrics.salesGross)}` },
      { label: "Taxas de maquininha", value: `R$ ${formatCurrencyBr(summaryMetrics.salesFees)}` },
      { label: "Entrada liquida", value: `R$ ${formatCurrencyBr(summaryMetrics.salesNet)}` },
      { label: "Custos operacionais", value: `R$ ${formatCurrencyBr(summaryMetrics.purchasesTotal)}` },
    ],
    summaryMetrics,
    reload: () => setReloadKey((current) => current + 1),
  };
}

function normalizeSettingsData(rawSettings, authUser) {
  const cachedUiSettings = readStoredUiSettings();
  const rawScope = rawSettings?.backgroundLogoScope ?? cachedUiSettings.backgroundLogoScope ?? ["all"];
  const backgroundLogoScope = Array.isArray(rawScope)
    ? rawScope
    : rawScope === "all"
      ? ["all"]
      : rawScope
        ? [rawScope]
        : ["all"];
  return {
    theme: normalizeThemeHex(rawSettings?.themeColor || rawSettings?.theme || cachedUiSettings.theme || "#ca9aea"),
    storeName: rawSettings?.storeName || cachedUiSettings.storeName || authUser?.storeName || authUser?.name || "ViaPet",
    textColor: rawSettings?.textColor || cachedUiSettings.textColor || "#000000",
    logoUrl: rawSettings?.logoUrl || cachedUiSettings.logoUrl || "",
    backgroundLogoUrl: rawSettings?.backgroundLogoUrl || cachedUiSettings.backgroundLogoUrl || "",
    backgroundLogoOpacity: String(rawSettings?.backgroundLogoOpacity || cachedUiSettings.backgroundLogoOpacity || "0.08"),
    backgroundLogoScope,
    signatureImageUrl: rawSettings?.signatureImageUrl || cachedUiSettings.signatureImageUrl || "",
    expirationDate: rawSettings?.expirationDate || cachedUiSettings.expirationDate || authUser?.expirationDate || "",
    intervalClinic: String(rawSettings?.intervalClinic || 60),
    intervalAesthetics: String(rawSettings?.intervalAesthetics || 60),
    openingTime: rawSettings?.openingTime?.slice?.(0, 5) || "08:00",
    closingTime: rawSettings?.closingTime?.slice?.(0, 5) || "18:00",
    breakStartTime: rawSettings?.breakStartTime?.slice?.(0, 5) || "12:00",
    breakEndTime: rawSettings?.breakEndTime?.slice?.(0, 5) || "13:00",
    workingDays: rawSettings?.workingDays || {
      sunday: false,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
    },
    email: authUser?.email || "",
    phone: authUser?.phone || "",
  };
}

function useSettingsModuleData() {
  const auth = useAuth();
  const [state, setState] = useState({
    loading: true,
    saving: false,
    feedback: "",
    settings: normalizeSettingsData(null, auth.user),
  });

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      if (!auth.token) {
        const normalized = normalizeSettingsData(readStoredUiSettings(), auth.user);
        writeStoredUiSettings(normalized);
        setState({
          loading: false,
          saving: false,
          feedback: "Sessao expirada. Entre novamente para carregar a configuracao.",
          settings: normalized,
        });
        return;
      }

      if (auth.token === DEMO_AUTH_TOKEN) {
        const normalized = normalizeSettingsData(readStoredUiSettings(), auth.user);
        writeStoredUiSettings(normalized);
        setState({
          loading: false,
          saving: false,
          feedback: "Configuracao usa dados reais. Entre com a conta real para editar os dados do sistema.",
          settings: normalized,
        });
        return;
      }

      try {
        setState((current) => ({ ...current, loading: true, feedback: "" }));
        const response = await apiRequest("/settings/extended", {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });

        if (!active) return;

        const normalized = normalizeSettingsData(response?.data, auth.user);
        writeStoredUiSettings(normalized);
        setState({
          loading: false,
          saving: false,
          feedback: "",
          settings: normalized,
        });
      } catch (error) {
        if (active) {
          const normalized = normalizeSettingsData(null, auth.user);
          writeStoredUiSettings(normalized);
          setState({
            loading: false,
            saving: false,
            feedback:
              String(error.message || "").toLowerCase().includes("nao encontradas") ||
              String(error.message || "").toLowerCase().includes("não encontradas")
                ? "Nenhuma configuracao salva ainda. Ajuste os campos e clique em salvar."
                : error.message || "Não foi possível carregar as configurações.",
            settings: normalized,
          });
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [auth.token, auth.user]);

  async function saveSettings(partialSettings) {
    const mergedSettings = {
      ...state.settings,
      ...partialSettings,
    };

    writeStoredUiSettings(mergedSettings);

    if (!auth.token) {
      setState((current) => ({
        ...current,
        settings: mergedSettings,
        feedback: "Sessao expirada. Entre novamente para salvar a configuracao.",
      }));
      return { ok: false };
    }

    if (auth.token === DEMO_AUTH_TOKEN) {
      setState((current) => ({
        ...current,
        settings: mergedSettings,
        feedback: "Configuracao usa dados reais. Entre com a conta real para salvar.",
      }));
      return { ok: false };
    }

    setState((current) => ({
      ...current,
      saving: true,
      feedback: "",
      settings: mergedSettings,
    }));

    try {
      const formData = new FormData();
      formData.append(
        "settings",
        JSON.stringify({
          theme: mergedSettings.theme,
          storeName: mergedSettings.storeName,
          textColor: mergedSettings.textColor,
          intervalClinic: Number(mergedSettings.intervalClinic),
          intervalAesthetics: Number(mergedSettings.intervalAesthetics),
          openingTime: mergedSettings.openingTime,
          closingTime: mergedSettings.closingTime,
          breakStartTime: mergedSettings.breakStartTime,
          breakEndTime: mergedSettings.breakEndTime,
          workingDays: mergedSettings.workingDays,
          backgroundLogoUrl: mergedSettings.backgroundLogoUrl,
          backgroundLogoOpacity: mergedSettings.backgroundLogoOpacity,
          backgroundLogoScope: mergedSettings.backgroundLogoScope,
          signatureImageUrl: mergedSettings.signatureImageUrl,
          logoUrl: mergedSettings.logoUrl,
          statusLabels: mergedSettings.statusLabels,
        }),
      );

      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: formData,
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || "Não foi possível salvar as configurações.");
      }

      setState((current) => ({
        ...current,
        saving: false,
        feedback: data?.message || "Configurações atualizadas com sucesso.",
        settings: mergedSettings,
      }));
      return { ok: true };
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        feedback: error.message || "Não foi possível salvar as configurações.",
      }));
      return { ok: false };
    }
  }

  return {
    ...state,
    updateSettings(partialSettings) {
      setState((current) => {
        const mergedSettings = {
          ...current.settings,
          ...partialSettings,
        };
        writeStoredUiSettings(mergedSettings);
        return {
          ...current,
          settings: mergedSettings,
        };
      });
    },
    saveSettings,
  };
}

function normalizeListResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function formatAgendaHeaderDate(value) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeCep(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 8);
}

async function fetchCepAddressData(cep) {
  const normalizedCep = normalizeCep(cep);
  if (normalizedCep.length !== 8) {
    return null;
  }
  const response = await fetch(`https://viacep.com.br/ws/${normalizedCep}/json/`);
  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o CEP agora.");
  }
  const data = await response.json();
  if (data?.erro) {
    throw new Error("CEP nao encontrado.");
  }
  return {
    cep: normalizedCep,
    address: data.logradouro || "",
    bairro: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
  };
}

function readDriverDeliveryState(dateKey) {
  try {
    const payload = JSON.parse(localStorage.getItem(DRIVER_DELIVERY_STORAGE_KEY) || "{}");
    return payload?.[dateKey] || {};
  } catch {
    return {};
  }
}

function writeDriverDeliveryState(dateKey, state) {
  try {
    const payload = JSON.parse(localStorage.getItem(DRIVER_DELIVERY_STORAGE_KEY) || "{}");
    payload[dateKey] = state;
    localStorage.setItem(DRIVER_DELIVERY_STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

function buildDriverShareLink(rows, selectedDate) {
  try {
    const payload = {
      date: selectedDate,
      rows: rows.map((item) => ({
        id: item.id,
        hour: item.hour,
        tutor: item.tutor,
        pet: item.pet,
        address: item.address,
      })),
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    return `${window.location.origin}/agenda/motorista/compartilhar?data=${encodeURIComponent(encoded)}`;
  } catch {
    return `${window.location.origin}/agenda/motorista`;
  }
}

function parseDriverShareLinkPayload(search) {
  try {
    const params = new URLSearchParams(search || "");
    const encoded = params.get("data");
    if (!encoded) return null;
    const decoded = decodeURIComponent(escape(atob(encoded)));
    const payload = JSON.parse(decoded);
    return {
      date: payload?.date || getLocalDateString(),
      rows: Array.isArray(payload?.rows) ? payload.rows : [],
    };
  } catch {
    return null;
  }
}

function formatShortDate(value) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function formatCrmConversationMoment(value) {
  if (!value) return "";

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const timeLabel = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

    if (target.getTime() === today.getTime()) {
      return timeLabel;
    }

    if (target.getTime() === yesterday.getTime()) {
      return "Ontem";
    }

    if (date.getFullYear() === now.getFullYear()) {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }).format(date);
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function getAvatarLabel(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return "?";
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function SearchMiniIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M10.5 3a7.5 7.5 0 1 0 4.73 13.32l4.72 4.73 1.06-1.06-4.73-4.72A7.5 7.5 0 0 0 10.5 3Zm0 1.5A6 6 0 1 1 4.5 10.5a6.01 6.01 0 0 1 6-6Z"
      />
    </svg>
  );
}

function PersonMiniIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 12a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12Zm0 1.5c-4.01 0-7.25 2.21-7.25 4.94V20h14.5v-1.56c0-2.73-3.24-4.94-7.25-4.94Z"
      />
    </svg>
  );
}

function PetMiniIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M7 10.5c-1.38 0-2.5-1.34-2.5-3S5.62 4.5 7 4.5s2.5 1.34 2.5 3-1.12 3-2.5 3Zm10 0c-1.38 0-2.5-1.34-2.5-3s1.12-3 2.5-3 2.5 1.34 2.5 3-1.12 3-2.5 3Zm-5-1.5c1.52 0 2.75-1.57 2.75-3.5S13.52 2 12 2 9.25 3.57 9.25 5.5 10.48 9 12 9Zm-5.75 5c0-1.52 1.12-2.75 2.5-2.75.83 0 1.57.46 2.03 1.17.34.53.92.83 1.55.83h.34c.63 0 1.21-.3 1.55-.83.46-.71 1.2-1.17 2.03-1.17 1.38 0 2.5 1.23 2.5 2.75 0 3.42-3.66 6-8.25 6s-8.25-2.58-8.25-6Z"
      />
    </svg>
  );
}

function CloseMiniIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="m6.53 5.47 5.47 5.47 5.47-5.47 1.06 1.06L13.06 12l5.47 5.47-1.06 1.06L12 13.06l-5.47 5.47-1.06-1.06L10.94 12 5.47 6.53Z"
      />
    </svg>
  );
}

function ClearMiniIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.24 3.56 21 8.32l-8.9 8.89H7.34L3 12.88Zm-8.28 12.15h3.52l7.4-7.39-2.64-2.64-7.39 7.39ZM5.12 14.38l2.5 2.5H3.5v-2.5Z"
      />
    </svg>
  );
}

function WhatsappMiniIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M19.05 4.94A9.77 9.77 0 0 0 12.07 2C6.68 2 2.3 6.37 2.3 11.77c0 1.73.45 3.42 1.31 4.91L2 22l5.48-1.57a9.7 9.7 0 0 0 4.59 1.17h.01c5.39 0 9.77-4.37 9.77-9.77a9.7 9.7 0 0 0-2.8-6.89Zm-6.98 15.02h-.01a8.1 8.1 0 0 1-4.12-1.13l-.29-.17-3.25.93.95-3.17-.19-.33a8.09 8.09 0 0 1-1.23-4.3c0-4.47 3.66-8.12 8.15-8.12a8.08 8.08 0 0 1 5.75 2.39 8.05 8.05 0 0 1 2.37 5.74c0 4.48-3.65 8.16-8.13 8.16Zm4.46-6.08c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.27.18-.5.06-.24-.12-1-.37-1.9-1.17-.7-.63-1.17-1.4-1.31-1.64-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.31-.74-1.8-.2-.47-.4-.41-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.57 4.1 3.6.57.25 1.02.4 1.36.51.57.18 1.09.16 1.5.1.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.05-.11-.2-.17-.44-.29Z"
      />
    </svg>
  );
}

function normalizeWhatsappPhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function buildMessagesRoute({
  search = "",
  customerId = "",
  petId = "",
  phone = "",
  customerName = "",
  petName = "",
  title = "",
  source = "",
  status = "",
} = {}) {
  const params = new URLSearchParams();

  if (search) params.set("search", search);
  if (customerId) params.set("customerId", customerId);
  if (petId) params.set("petId", petId);
  if (phone) params.set("phone", normalizeWhatsappPhone(phone));
  if (customerName) params.set("customerName", customerName);
  if (petName) params.set("petName", petName);
  if (title) params.set("title", title);
  if (source) params.set("source", source);
  if (status) params.set("status", status);

  const queryString = params.toString();
  return `/mensagens${queryString ? `?${queryString}` : ""}`;
}

function WhatsappIconMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="agenda-inline-svg">
      <path
        fill="currentColor"
        d="M20.52 3.48A11.82 11.82 0 0 0 12.11 0C5.6 0 .3 5.29.3 11.79c0 2.08.54 4.11 1.58 5.89L0 24l6.49-1.7a11.86 11.86 0 0 0 5.62 1.43h.01c6.5 0 11.79-5.29 11.79-11.79 0-3.15-1.22-6.11-3.39-8.46Zm-8.4 18.25h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.85 1.01 1.03-3.75-.24-.39A9.82 9.82 0 0 1 2.3 11.79c0-5.41 4.4-9.8 9.81-9.8 2.62 0 5.08 1.02 6.93 2.88a9.72 9.72 0 0 1 2.86 6.93c0 5.4-4.4 9.79-9.79 9.79Zm5.37-7.35c-.29-.14-1.73-.86-2-.95-.27-.1-.47-.15-.67.14-.19.29-.76.95-.93 1.14-.17.19-.34.22-.63.07-.29-.14-1.22-.45-2.32-1.43-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.19 0-.51.07-.77.36-.27.29-1.02 1-1.02 2.43 0 1.43 1.04 2.81 1.18 3 .14.19 2.03 3.1 4.92 4.35.69.3 1.23.47 1.65.6.69.22 1.31.19 1.8.12.55-.08 1.73-.71 1.97-1.39.24-.69.24-1.28.17-1.4-.07-.12-.26-.19-.55-.33Z"
      />
    </svg>
  );
}

function buildHourSlots(openingTime = "08:00", closingTime = "18:00", interval = 60) {
  const [openingHour, openingMinute] = openingTime.split(":").map((part) => Number(part) || 0);
  const [closingHour, closingMinute] = closingTime.split(":").map((part) => Number(part) || 0);
  const start = openingHour * 60 + openingMinute;
  const end = closingHour * 60 + closingMinute;
  const step = Math.max(Number(interval) || 60, 10);
  const slots = [];

  for (let current = start; current <= end; current += step) {
    const hour = String(Math.floor(current / 60)).padStart(2, "0");
    const minute = String(current % 60).padStart(2, "0");
    slots.push(`${hour}:${minute}`);
  }

  return slots;
}

function buildAgendaItemRow(item = {}) {
  const quantity = String(item.quantity || 1);
  const unitPrice = String(item.unitPrice ?? item.price ?? 0);
  const total = String(item.total ?? Number(quantity) * Number(unitPrice || 0));

  return {
    id: item.id || `item-${Math.random().toString(36).slice(2, 10)}`,
    itemId: item.itemId || item.id || "",
    kind: item.kind || item.type || "service",
    referenceId: String(item.referenceId || item.serviceId || item.productId || ""),
    description: item.description || "",
    quantity,
    unitPrice,
    total,
    lockedPrimary: Boolean(item.lockedPrimary),
  };
}

function buildAgendaPaymentRow(payment = {}, fallbackDate = "") {
  const grossAmount = Number(payment.grossAmount ?? payment.amount ?? 0) || 0;
  const presetFeePercentage = payment.feePercentage != null ? Number(payment.feePercentage || 0) : null;
  const presetFeeAmount =
    payment.feeAmount != null
      ? Number(payment.feeAmount || 0)
      : Number(((grossAmount * (presetFeePercentage || 0)) / 100).toFixed(2));
  const presetNetAmount =
    payment.netAmount != null
      ? Number(payment.netAmount || 0)
      : Number((grossAmount - presetFeeAmount).toFixed(2));
  const breakdown =
    presetFeePercentage != null
      ? {
          grossAmount,
          feePercentage: presetFeePercentage,
          feeAmount: presetFeeAmount,
          netAmount: presetNetAmount,
        }
      : calculateFeeBreakdown(grossAmount, payment.paymentMethod, readAccountSettings());

  return {
    id: payment.id || `payment-${Math.random().toString(36).slice(2, 10)}`,
    paymentId: payment.paymentId || payment.id || "",
    dueDate: (payment.dueDate || payment.paidAt || fallbackDate || "").slice(0, 10),
    paymentMethod: payment.paymentMethod || "",
    details: payment.details || "",
    amount: String(breakdown.grossAmount),
    grossAmount: String(breakdown.grossAmount),
    feePercentage: String(breakdown.feePercentage || 0),
    feeAmount: String(breakdown.feeAmount || 0),
    netAmount: String(breakdown.netAmount || 0),
    status: payment.status || "pago",
    paidAt: payment.paidAt || null,
  };
}

function getPersistableAgendaPaymentRows(paymentRows = []) {
  return (paymentRows || [])
    .map((row) => ({
      ...row,
      normalizedAmount: parseCurrencyLike(row.amount),
    }))
    .filter((row) => row.paymentMethod && row.normalizedAmount > 0);
}

function calculateAgendaItemTotal(row) {
  const explicitTotal = Number(row.total || 0) || 0;
  const calculatedTotal = (Number(row.quantity || 0) || 0) * (Number(row.unitPrice || 0) || 0);
  return Math.max(explicitTotal || calculatedTotal, 0);
}

function calculateAgendaRowsTotal(rows = []) {
  return rows.reduce((sum, row) => sum + calculateAgendaItemTotal(row), 0);
}

function calculateAgendaPaymentsTotal(rows = []) {
  return rows.reduce((sum, row) => {
    if (!row.paymentMethod || row.amount === "") return sum;
    return sum + (Number(row.amount || 0) || 0);
  }, 0);
}

function isFullyPaidAgendaFinance({ totalAmount = 0, paidAmount = 0, outstandingAmount, financeStatus = "" } = {}) {
  const normalizedTotal = Number(totalAmount || 0) || 0;
  const normalizedPaid = Number(paidAmount || 0) || 0;
  const explicitOutstanding = Number(outstandingAmount);
  const normalizedOutstanding = Number.isFinite(explicitOutstanding)
    ? Math.max(explicitOutstanding, 0)
    : Math.max(normalizedTotal - normalizedPaid, 0);

  if (normalizedTotal > 0) {
    return normalizedPaid > 0 && normalizedOutstanding <= 0.009;
  }

  return String(financeStatus || "").toLowerCase() === "pago" && normalizedPaid > 0;
}

function isAgendaEventFullyPaid(event = {}) {
  return isFullyPaidAgendaFinance({
    totalAmount: event.amount ?? event.totalAmount ?? 0,
    paidAmount: event.paidAmount ?? 0,
    outstandingAmount: event.outstandingAmount,
    financeStatus: event.financeStatus,
  });
}

function stripAgendaCatalogPrefix(value) {
  return String(value || "")
    .replace(/^servico:\s*/i, "")
    .replace(/^produto:\s*/i, "")
    .trim();
}

function resolveAgendaServiceReference(value, catalogs) {
  const services = catalogs.services || [];
  const rawValue = String(value || "").trim();
  const directReference = rawValue.includes(":")
    ? rawValue.split(":").pop()
    : rawValue;
  const directMatch = services.find(
    (item) => String(item.id) === String(directReference),
  );

  if (directMatch) {
    return String(directMatch.id);
  }

  const normalizedValue = normalizeAgendaSearch(stripAgendaCatalogPrefix(rawValue));
  if (!normalizedValue) {
    return "";
  }

  const exactMatch = services.find(
    (item) => normalizeAgendaSearch(item.name) === normalizedValue,
  );
  if (exactMatch) {
    return String(exactMatch.id);
  }

  const fuzzyMatch = services.find((item) => {
    const itemName = normalizeAgendaSearch(item.name);
    return (
      itemName.startsWith(normalizedValue) ||
      normalizedValue.startsWith(itemName)
    );
  });

  return fuzzyMatch ? String(fuzzyMatch.id) : "";
}

function resolveAgendaCatalogRowReference(row, catalogs) {
  const source =
    row.kind === "product" ? catalogs.products || [] : catalogs.services || [];
  const rawReference = String(row.referenceId || "").trim();
  const directReference = rawReference.includes(":")
    ? rawReference.split(":").pop()
    : rawReference;
  const directMatch = source.find(
    (item) => String(item.id) === String(directReference),
  );

  if (directMatch) {
    const resolvedUnitPrice = Number(row.unitPrice || directMatch.price || 0) || 0;
    return {
      ...row,
      referenceId: String(directMatch.id),
      description: directMatch.name || row.description,
      unitPrice: String(resolvedUnitPrice),
      total: String(
        calculateAgendaItemTotal({
          ...row,
          quantity: row.quantity || 1,
          unitPrice: resolvedUnitPrice,
        }),
      ),
    };
  }

  const candidates = [
    stripAgendaCatalogPrefix(row.description),
    stripAgendaCatalogPrefix(rawReference),
  ]
    .map(normalizeAgendaSearch)
    .filter(Boolean);

  if (!candidates.length) {
    return row;
  }

  const exactMatch = source.find((item) =>
    candidates.includes(normalizeAgendaSearch(item.name)),
  );
  if (exactMatch) {
    const resolvedUnitPrice = Number(row.unitPrice || exactMatch.price || 0) || 0;
    return {
      ...row,
      referenceId: String(exactMatch.id),
      description: exactMatch.name || row.description,
      unitPrice: String(resolvedUnitPrice),
      total: String(
        calculateAgendaItemTotal({
          ...row,
          quantity: row.quantity || 1,
          unitPrice: resolvedUnitPrice,
        }),
      ),
    };
  }

  const fuzzyMatch = source.find((item) => {
    const itemName = normalizeAgendaSearch(item.name);
    return candidates.some(
      (candidate) =>
        itemName.startsWith(candidate) || candidate.startsWith(itemName),
    );
  });

  if (!fuzzyMatch) {
    return row;
  }

  const resolvedUnitPrice = Number(row.unitPrice || fuzzyMatch.price || 0) || 0;
  return {
    ...row,
    referenceId: String(fuzzyMatch.id),
    description: fuzzyMatch.name || row.description,
    unitPrice: String(resolvedUnitPrice),
    total: String(
      calculateAgendaItemTotal({
        ...row,
        quantity: row.quantity || 1,
        unitPrice: resolvedUnitPrice,
      }),
    ),
  };
}

function resolveAgendaCustomerReference(value, catalogs) {
  const customers = catalogs?.customers || [];
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  const directMatch = customers.find((item) => String(item.id) === rawValue);
  if (directMatch) {
    return String(directMatch.id);
  }

  const normalizedValue = normalizeAgendaSearch(rawValue);
  if (!normalizedValue) return "";

  const exactMatch = customers.find((item) => {
    const haystacks = [item.name, item.phone, item.email]
      .map(normalizeAgendaSearch)
      .filter(Boolean);
    return haystacks.includes(normalizedValue);
  });
  if (exactMatch) {
    return String(exactMatch.id);
  }

  const fuzzyMatch = customers.find((item) => {
    const haystacks = [item.name, item.phone, item.email]
      .map(normalizeAgendaSearch)
      .filter(Boolean);
    return haystacks.some(
      (candidate) =>
        candidate.startsWith(normalizedValue) ||
        normalizedValue.startsWith(candidate),
    );
  });

  return fuzzyMatch ? String(fuzzyMatch.id) : "";
}

function resolveAgendaPetMatchFromCatalogs(searchValue, catalogs) {
  const normalizedSearch = normalizeSearchableText(searchValue).trim();
  if (!normalizedSearch) return null;

  const pets = catalogs?.pets || [];
  const customers = catalogs?.customers || [];

  const candidatePets = pets
    .map((pet) => {
      const tutor = customers.find((customer) => String(customer.id) === getPetCustomerId(pet));
      return {
        pet,
        tutor,
        searchText: normalizeSearchableText(`${pet.name} ${tutor?.name || ""}`),
      };
    })
    .filter((entry) => entry.searchText.includes(normalizedSearch));

  if (!candidatePets.length) {
    return null;
  }

  return (
    candidatePets.find((entry) => normalizeSearchableText(entry.pet.name) === normalizedSearch) ||
    candidatePets[0]
  );
}

function resolveAgendaAppointmentType(service, form = {}) {
  const explicitType = normalizeAgendaSearch(form.type || form.appointmentType || "");
  if (["estetica", "clinica", "internacao"].includes(explicitType)) {
    return explicitType;
  }

  const category = normalizeAgendaSearch(service?.category || service?.type || "");
  if (
    category.includes("clinica") ||
    category.includes("consulta") ||
    category.includes("exame") ||
    category.includes("vacina")
  ) {
    return "clinica";
  }

  return "estetica";
}

function normalizeAgendaSaveForm(form, catalogs) {
  const matchedPet = resolveAgendaPetMatchFromCatalogs(form.petSearch, catalogs);
  const resolvedPetId = String(form.petId || matchedPet?.pet?.id || "").trim();
  const resolvedPet = catalogs.pets.find((pet) => String(pet.id) === resolvedPetId) || matchedPet?.pet || null;
  const resolvedCustomerId = String(
    form.customerId ||
      (resolvedPet ? getPetCustomerId(resolvedPet) : "") ||
      (matchedPet?.pet ? getPetCustomerId(matchedPet.pet) : "") ||
      resolveAgendaCustomerReference(form.customerSearch || form.petSearch, catalogs) ||
      "",
  ).trim();
  const resolvedCustomer =
    catalogs.customers.find((customer) => String(customer.id) === resolvedCustomerId) || matchedPet?.tutor || null;
  const validItemRows = (form.itemRows || [])
    .filter((row) => row.referenceId || row.description)
    .map((row) => resolveAgendaCatalogRowReference(row, catalogs));
  const mainServiceRow = validItemRows.find((row) => row.kind === "service" && row.referenceId);
  const mainServiceId =
    resolveAgendaServiceReference(form.serviceId, catalogs) ||
    mainServiceRow?.referenceId ||
    "";
  const mainService =
    catalogs.services.find((item) => String(item.id) === String(mainServiceId)) || null;

  return {
    form: {
      ...form,
      petId: resolvedPetId,
      customerId: resolvedCustomerId,
      serviceId: String(mainServiceId || ""),
      petSearch: resolvedPet
        ? `${resolvedPet.name}${resolvedCustomer ? ` (${resolvedCustomer.name})` : ""}`
        : form.petSearch,
      itemRows: validItemRows,
    },
    validItemRows,
    mainServiceId: String(mainServiceId || ""),
    mainService,
    appointmentType: resolveAgendaAppointmentType(mainService, form),
  };
}

function getAgendaSaveErrorMessage(error, fallbackMessage) {
  const genericMessages = new Set([
    "Erro ao criar agendamento",
    "Erro ao atualizar agendamento",
    "Nao foi possivel concluir a operacao.",
  ]);
  const message = String(error?.message || "").trim();
  const details = String(error?.details || error?.payload?.error || "").trim();

  if (details && details !== message) {
    return details;
  }
  if (message && !genericMessages.has(message)) {
    return message;
  }
  return fallbackMessage;
}

function scheduleAgendaRefresh(refreshFn, onError) {
  Promise.resolve()
    .then(() => refreshFn())
    .catch((error) => {
      onError?.(error);
    });
}

function isAgendaServiceCompleted(status) {
  return String(status || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase() === "entregue";
}

function getAgendaPackageProgress(items = [], event) {
  if (!event?.packageGroupId || Number(event.packageTotal || 0) <= 1) {
    return {
      completedCount: 0,
      nextPendingId: "",
      isNextPending: false,
    };
  }

  const packageItems = items
    .filter((item) => String(item.packageGroupId || "") === String(event.packageGroupId))
    .sort((left, right) => {
      const leftKey = `${left.date || ""} ${left.hour || ""} ${String(left.packageIndex || 0).padStart(4, "0")}`;
      const rightKey = `${right.date || ""} ${right.hour || ""} ${String(right.packageIndex || 0).padStart(4, "0")}`;
      return leftKey.localeCompare(rightKey);
    });

  const completedCount = packageItems.filter((item) => isAgendaServiceCompleted(item.status)).length;
  const nextPending = packageItems.find((item) => !isAgendaServiceCompleted(item.status));

  return {
    completedCount,
    nextPendingId: nextPending?.id || "",
    isNextPending: String(nextPending?.id || "") === String(event.id),
  };
}

function readDemoAgendaItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_AGENDA_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeDemoAgendaItems(items) {
  localStorage.setItem(DEMO_AGENDA_STORAGE_KEY, JSON.stringify(items));
}

function readAgendaPackageMeta() {
  try {
    const stored = JSON.parse(localStorage.getItem(AGENDA_PACKAGE_STORAGE_KEY) || "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function writeAgendaPackageMeta(meta) {
  localStorage.setItem(AGENDA_PACKAGE_STORAGE_KEY, JSON.stringify(meta || {}));
}

function mergeAgendaPackageMeta(event) {
  const packageMeta = readAgendaPackageMeta();
  const meta = packageMeta[String(event.id)] || null;
  if (!meta) {
    return event;
  }
  return {
    ...event,
    packageGroupId: meta.packageGroupId || "",
    packageIndex: Number(meta.packageIndex || 0) || 0,
    packageTotal: Number(meta.packageTotal || 0) || 0,
    packageDates: Array.isArray(meta.packageDates) ? meta.packageDates : [],
  };
}

function writeAgendaPackageOccurrences(entries = []) {
  const current = readAgendaPackageMeta();
  entries.forEach((entry) => {
    if (!entry?.appointmentId) return;
    current[String(entry.appointmentId)] = {
      packageGroupId: entry.packageGroupId || "",
      packageIndex: Number(entry.packageIndex || 0) || 0,
      packageTotal: Number(entry.packageTotal || 0) || 0,
      packageDates: Array.isArray(entry.packageDates) ? entry.packageDates : [],
    };
  });
  writeAgendaPackageMeta(current);
}

function removeAgendaPackageOccurrences({ appointmentIds = [], packageGroupId = "" } = {}) {
  const current = readAgendaPackageMeta();
  const next = { ...current };

  appointmentIds.forEach((appointmentId) => {
    delete next[String(appointmentId)];
  });

  if (packageGroupId) {
    Object.keys(next).forEach((key) => {
      if (String(next[key]?.packageGroupId || "") === String(packageGroupId)) {
        delete next[key];
      }
    });
  }

  writeAgendaPackageMeta(next);
}

function normalizePackageDates(dates = [], fallbackDate = "") {
  const base = [...dates.filter(Boolean)];
  if (fallbackDate && !base.includes(fallbackDate)) {
    base.push(fallbackDate);
  }
  return [...new Set(base)].sort((left, right) => String(left).localeCompare(String(right)));
}

function extractObservationValue(observation, label) {
  const parts = String(observation || "")
    .split("|")
    .map((item) => item.trim());
  const match = parts.find((item) => item.toLowerCase().startsWith(`${String(label).toLowerCase()}:`));
  return match ? match.split(":").slice(1).join(":").trim() : "";
}

function isLegacyPositivePriceValidationError(message) {
  const normalized = normalizeSearchableText(message || "");
  return (
    normalized.includes("preco invalido") ||
    normalized.includes("preencha todos os campos obrigatorios nome e preco") ||
    normalized.includes("nome e preco")
  );
}

function buildPatientSuggestionOptions(pets = []) {
  const buckets = {
    breed: new Set(),
    secondaryBreed: new Set(),
    size: new Set(),
    color: new Set(),
    secondaryColor: new Set(),
    coat: new Set(),
    pedigree: new Set(),
    microchip: new Set(),
    group: new Set(),
    allergies: new Set(),
    bloodType: new Set(),
    veterinarian: new Set(),
    feedBrand: new Set(),
    hygienicCarpet: new Set(),
    favoriteTreat: new Set(),
    observation: new Set(),
  };

  pets.forEach((pet) => {
    const breeds = String(pet.breed || "")
      .split("/")
      .map((item) => item.trim())
      .filter(Boolean);
    const colors = String(pet.color || "")
      .split("/")
      .map((item) => item.trim())
      .filter(Boolean);
    const observation = pet.observation || "";

    if (breeds[0]) buckets.breed.add(breeds[0]);
    if (breeds[1]) buckets.secondaryBreed.add(breeds[1]);
    if (colors[0]) buckets.color.add(colors[0]);
    if (colors[1]) buckets.secondaryColor.add(colors[1]);

    [
      ["size", extractObservationValue(observation, "Porte")],
      ["coat", extractObservationValue(observation, "Pelo")],
      ["pedigree", extractObservationValue(observation, "Pedigree")],
      ["microchip", extractObservationValue(observation, "Microchip")],
      ["group", extractObservationValue(observation, "Grupo")],
      ["allergies", extractObservationValue(observation, "Alergias")],
      ["bloodType", extractObservationValue(observation, "Tipo sanguineo")],
      ["veterinarian", extractObservationValue(observation, "Veterinario")],
      ["feedBrand", pet.feedBrand],
      ["hygienicCarpet", pet.hygienicCarpet],
      ["favoriteTreat", pet.favoriteTreat],
    ].forEach(([key, value]) => {
      if (value) {
        buckets[key].add(String(value).trim());
      }
    });

    const freeObservation = String(observation || "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean)
      .find((item) => !item.includes(":"));

    if (freeObservation) {
      buckets.observation.add(freeObservation);
    }
  });

  return Object.fromEntries(
    Object.entries(buckets).map(([key, values]) => [key, [...values].sort((left, right) => left.localeCompare(right))]),
  );
}

function rankCustomerMatches(customers = [], query = "") {
  const normalizedQuery = normalizeSearchableText(query).trim();

  return [...customers]
    .map((customer) => {
      const name = String(customer.name || "");
      const phone = String(customer.phone || "");
      const email = String(customer.email || "");
      const normalizedName = normalizeSearchableText(name);
      const normalizedPhone = normalizeSearchableText(phone);
      const normalizedEmail = normalizeSearchableText(email);

      let score = 0;

      if (!normalizedQuery) {
        score = 1;
      } else if (normalizedName === normalizedQuery || normalizedPhone === normalizedQuery || normalizedEmail === normalizedQuery) {
        score = 5;
      } else if (normalizedName.startsWith(normalizedQuery)) {
        score = 4;
      } else if (normalizedPhone.startsWith(normalizedQuery) || normalizedEmail.startsWith(normalizedQuery)) {
        score = 3;
      } else if (normalizedName.includes(normalizedQuery) || normalizedPhone.includes(normalizedQuery) || normalizedEmail.includes(normalizedQuery)) {
        score = 2;
      }

      return {
        customer,
        score,
        name,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.name.localeCompare(right.name);
    });
}

function resolveCustomerSelection(customers = [], query = "", selectedCustomerId = "") {
  if (selectedCustomerId) {
    const selected = customers.find((customer) => String(customer.id) === String(selectedCustomerId));
    if (selected) {
      return selected;
    }
  }

  const matches = rankCustomerMatches(customers, query);
  return matches[0]?.customer || null;
}

function readDemoCustomers() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_CUSTOMERS_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeDemoCustomers(customers = []) {
  localStorage.setItem(DEMO_CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
  window.dispatchEvent(new CustomEvent(CRM_DATA_UPDATED_EVENT));
}

function normalizeCustomerPhotoKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function readCustomerPhotos() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_PHOTOS_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeCustomerPhotos(map = {}) {
  localStorage.setItem(CUSTOMER_PHOTOS_STORAGE_KEY, JSON.stringify(map));
}

function buildCustomerPhotoKeys(customer = {}) {
  const keys = [];
  if (customer.id) keys.push(`id:${customer.id}`);
  if (customer.name) keys.push(`name:${normalizeCustomerPhotoKey(customer.name)}`);
  if (customer.phone) keys.push(`phone:${normalizeWhatsappPhone(customer.phone)}`);
  return Array.from(new Set(keys.filter(Boolean)));
}

function persistCustomerPhoto(customer, photoUrl) {
  const normalizedPhoto = String(photoUrl || "").trim();
  if (!normalizedPhoto) return;
  const keys = buildCustomerPhotoKeys(customer);
  if (!keys.length) return;
  const current = readCustomerPhotos();
  const next = { ...current };
  keys.forEach((key) => {
    next[key] = normalizedPhoto;
  });
  writeCustomerPhotos(next);
}

function resolveCustomerPhoto(customer = {}) {
  const map = readCustomerPhotos();
  const keys = buildCustomerPhotoKeys(customer);
  for (const key of keys) {
    if (map[key]) return map[key];
  }
  return "";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Nao foi possivel carregar a imagem."));
    reader.readAsDataURL(file);
  });
}

function readPetPhotos() {
  try {
    return JSON.parse(localStorage.getItem(PET_PHOTOS_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writePetPhotos(map = {}) {
  localStorage.setItem(PET_PHOTOS_STORAGE_KEY, JSON.stringify(map));
}

function buildPetPhotoKeys(pet = {}) {
  const keys = [];
  if (pet.id) keys.push(`id:${pet.id}`);
  if (pet.name) keys.push(`name:${normalizeCustomerPhotoKey(pet.name)}`);
  const customerId = getPetCustomerId(pet);
  if (customerId) keys.push(`customer:${customerId}:${normalizeCustomerPhotoKey(pet.name)}`);
  return Array.from(new Set(keys.filter(Boolean)));
}

function getPetCustomerId(pet = {}) {
  return String(pet.customerId || pet.custumerId || "").trim();
}

function persistPetPhoto(pet, photoUrl) {
  const normalizedPhoto = String(photoUrl || "").trim();
  if (!normalizedPhoto) return;
  const keys = buildPetPhotoKeys(pet);
  if (!keys.length) return;
  const current = readPetPhotos();
  const next = { ...current };
  keys.forEach((key) => {
    next[key] = normalizedPhoto;
  });
  writePetPhotos(next);
}

function resolvePetPhoto(pet = {}) {
  const map = readPetPhotos();
  const keys = buildPetPhotoKeys(pet);
  for (const key of keys) {
    if (map[key]) return map[key];
  }
  return "";
}

function readDemoPets() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_PETS_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeDemoPets(pets = []) {
  localStorage.setItem(DEMO_PETS_STORAGE_KEY, JSON.stringify(pets));
  window.dispatchEvent(new CustomEvent(CRM_DATA_UPDATED_EVENT));
}

function readDemoProducts() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_PRODUCTS_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeDemoProducts(products = []) {
  localStorage.setItem(DEMO_PRODUCTS_STORAGE_KEY, JSON.stringify(products));
}

function readDemoServices() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_SERVICES_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeDemoServices(services = []) {
  localStorage.setItem(DEMO_SERVICES_STORAGE_KEY, JSON.stringify(services));
}

function createDemoCustomerFromForm(form) {
  return {
    id: form.id || `demo-customer-${Date.now()}`,
    name: form.name,
    phone: form.phone,
    email: form.email,
    instagram: form.instagram,
    address: form.address,
    city: form.city,
    bairro: form.bairro,
    state: form.state,
    photoUrl: form.photoUrl || "",
  };
}

function persistDemoCustomer(form) {
  const demoCustomer = createDemoCustomerFromForm(form);
  const nextCustomers = [demoCustomer, ...readDemoCustomers().filter((item) => String(item.id) !== String(demoCustomer.id))];
  writeDemoCustomers(nextCustomers);
  if (demoCustomer.photoUrl) {
    persistCustomerPhoto(demoCustomer, demoCustomer.photoUrl);
  }
  return demoCustomer;
}

function persistDemoPet(form, customers = []) {
  const customer = customers.find((item) => String(item.id) === String(form.customerId));
  const demoPet = {
    id: form.id || `demo-pet-${Date.now()}`,
    name: form.name,
    species: form.species,
    breed: [form.breed, form.secondaryBreed].filter(Boolean).join(" / "),
    color: [form.color, form.secondaryColor].filter(Boolean).join(" / "),
    sex: form.sex,
    birthdate: form.birthdate || null,
    customerId: form.customerId,
    customerName: customer?.name || "",
    customerPhone: customer?.phone || "",
    photoUrl: form.photoUrl || "",
    feedBrand: form.feedBrand,
    hygienicCarpet: form.hygienicCarpet,
    favoriteTreat: form.favoriteTreat,
    observation: [
      form.observation,
      form.size ? `Porte: ${form.size}` : "",
      form.coat ? `Pelo: ${form.coat}` : "",
      form.pedigree ? `Pedigree: ${form.pedigree}` : "",
      form.microchip ? `Microchip: ${form.microchip}` : "",
      form.group ? `Grupo: ${form.group}` : "",
      form.allergies ? `Alergias: ${form.allergies}` : "",
      form.bloodType ? `Tipo sanguineo: ${form.bloodType}` : "",
      form.veterinarian ? `Veterinario: ${form.veterinarian}` : "",
      form.registered ? "Registrado" : "",
      form.reproductionReady ? "Apto a reproducao" : "",
    ]
      .filter(Boolean)
      .join(" | "),
  };
  const nextPets = [demoPet, ...readDemoPets().filter((item) => String(item.id) !== String(demoPet.id))];
  writeDemoPets(nextPets);
  if (demoPet.photoUrl) {
    persistPetPhoto(demoPet, demoPet.photoUrl);
  }
  return demoPet;
}

function persistDemoProduct(payload) {
  const demoProduct = { id: payload.id || `demo-product-${Date.now()}`, ...payload };
  const nextProducts = [demoProduct, ...readDemoProducts().filter((item) => String(item.id) !== String(demoProduct.id))];
  writeDemoProducts(nextProducts);
  return demoProduct;
}

function persistDemoService(payload) {
  const demoService = { id: payload.id || `demo-service-${Date.now()}`, ...payload };
  const nextServices = [demoService, ...readDemoServices().filter((item) => String(item.id) !== String(demoService.id))];
  writeDemoServices(nextServices);
  return demoService;
}

function getAgendaDemoCatalogs() {
  const baseCustomers = [
    { id: "demo-customer-1", name: "Amanda Lima" },
    { id: "demo-customer-2", name: "Marcia Regina" },
    { id: "demo-customer-3", name: "Erica Baby" },
  ];
  const storedCustomers = readDemoCustomers();
  const mergedCustomers = [...baseCustomers];

  storedCustomers.forEach((customer) => {
    if (!mergedCustomers.some((item) => String(item.id) === String(customer.id))) {
      mergedCustomers.unshift(customer);
    }
  });

  const basePets = [
    { id: "demo-pet-1", name: "Luna", breed: "Poodle", customerId: "demo-customer-1" },
    { id: "demo-pet-2", name: "Liza", breed: "Maltes", customerId: "demo-customer-2" },
    { id: "demo-pet-3", name: "Tobby", breed: "Yorkshire", customerId: "demo-customer-3" },
  ];
  const storedPets = readDemoPets();
  const mergedPets = [...basePets];

  storedPets.forEach((pet) => {
    if (!mergedPets.some((item) => String(item.id) === String(pet.id))) {
      mergedPets.unshift(pet);
    }
  });

  return {
    customers: mergedCustomers,
    pets: mergedPets,
    services: [
      { id: "demo-service-1", name: "Banho Higienico", price: 70, category: "Estetica" },
      { id: "demo-service-2", name: "Banho e tosa geral", price: 95, category: "Estetica" },
      { id: "demo-service-3", name: "Hidratacao", price: 30, category: "Estetica" },
      ...readDemoServices(),
    ],
    products: [
      { id: "demo-product-1", name: "Perfume Pet", price: 18 },
      { id: "demo-product-2", name: "Laco Premium", price: 7 },
      { id: "demo-product-3", name: "Shampoo Especial", price: 24 },
      ...readDemoProducts(),
    ],
  };
}

function getEmptyAgendaCatalogs() {
  return {
    customers: [],
    pets: [],
    services: [],
    products: [],
  };
}

function createAgendaFormState({ selectedDate, selectedHour, event, catalogs, details }) {
  const appointment = details?.appointment || null;
  const items = details?.items?.length ? details.items : details?.legacyItems || event?.itemRows || [];
  const payments = details?.payments || event?.paymentRows || [];
  const firstPayment = payments[0] || null;
  const selectedService =
    catalogs.services.find((service) => String(service.id) === String(appointment?.serviceId || event?.serviceId)) || null;
  const primaryRow = buildAgendaItemRow({
    kind: "service",
    serviceId: appointment?.serviceId || event?.serviceId || "",
    referenceId: appointment?.serviceId || event?.serviceId || "",
    description: selectedService?.name || event?.tags?.[0] || "",
    quantity: 1,
    unitPrice:
      selectedService?.price ||
      firstPayment?.grossAmount ||
      firstPayment?.amount ||
      details?.summary?.total ||
      event?.amount ||
      0,
    total:
      selectedService?.price ||
      firstPayment?.grossAmount ||
      firstPayment?.amount ||
      details?.summary?.total ||
      event?.amount ||
      0,
    lockedPrimary: true,
  });
  const itemRows = items.length
    ? items.map((item, index) =>
        buildAgendaItemRow({
          ...item,
          referenceId: item.serviceId || item.productId || "",
          kind: item.type || "service",
          lockedPrimary: index === 0 && item.type === "service",
        }),
      )
    : [primaryRow];
  const itemRowsTotal = calculateAgendaRowsTotal(itemRows);
  const paymentRows = payments.length
    ? payments.map((payment) => buildAgendaPaymentRow(payment, appointment?.date || selectedDate))
    : [buildAgendaPaymentRow({ ...(firstPayment || {}), amount: itemRowsTotal }, appointment?.date || selectedDate)];
  const selectedPetId = String(appointment?.petId || event?.petId || "");
  const selectedPet = catalogs.pets.find((pet) => String(pet.id) === selectedPetId);

  return {
    customerId: String(appointment?.customerId || event?.customerId || ""),
    petId: selectedPetId,
    responsibleId: String(appointment?.responsibleId || event?.responsibleId || ""),
    petSearch: selectedPet ? `${selectedPet.name} (${catalogs.customers.find((customer) => String(customer.id) === getPetCustomerId(selectedPet))?.name || ""})` : "",
    serviceId: String(appointment?.serviceId || event?.serviceId || ""),
    originalDate: appointment?.date || event?.date || selectedDate,
    date: appointment?.date || event?.date || selectedDate,
    time: (appointment?.time || event?.hour || selectedHour || "08:00").slice(0, 5),
    endTime: appointment?.endTime?.slice?.(0, 5) || "",
    weight: appointment?.weight || "",
    sellerName:
      appointment?.responsible?.name ||
      appointment?.sellerName ||
      appointment?.responsibleName ||
      event?.sellerName ||
      "",
    status: appointment?.status || event?.status || "aguardando",
    observation: appointment?.observation || event?.note || "",
    paymentAmount: String(
      firstPayment?.grossAmount ||
        firstPayment?.amount ||
        details?.summary?.total ||
        itemRowsTotal ||
        selectedService?.price ||
        event?.amount ||
        ""
    ),
    paymentMethod: firstPayment?.paymentMethod || event?.paymentMethod || "",
    paymentDetails: firstPayment?.details || "",
    paymentStatus: firstPayment?.status || (event?.financeStatus === "pago" ? "pago" : "pendente"),
    paymentDate: (firstPayment?.paidAt || firstPayment?.dueDate || appointment?.date || selectedDate || "").slice(0, 10),
    paymentId: firstPayment?.id || "",
    paymentFee: String(firstPayment?.feePercentage || 0),
    packageGroupId: appointment?.packageGroupId || event?.packageGroupId || "",
    packageIndex: Number(appointment?.packageIndex || event?.packageIndex || 0) || 0,
    packageTotal: Number(appointment?.packageTotal || event?.packageTotal || 0) || 0,
    packageDates: normalizePackageDates(appointment?.packageDates || event?.packageDates || [], appointment?.date || event?.date || selectedDate),
    itemRows,
    paymentRows,
  };
}

function getAgendaEventSaleLines(appointment) {
  const detailedItems =
    Array.isArray(appointment?.itemsList) && appointment.itemsList.length
      ? appointment.itemsList
      : Array.isArray(appointment?.legacyItemsList) && appointment.legacyItemsList.length
        ? appointment.legacyItemsList
        : Array.isArray(appointment?.itemRows)
          ? appointment.itemRows
          : [];

  if (!detailedItems.length) {
    return (appointment?.tags || [])
      .map((description) => ({ description: String(description || "").trim(), total: 0 }))
      .filter((item) => item.description);
  }

  return detailedItems
    .map((item) => {
      const quantity = Number(item.quantity || 1) || 1;
      const unitPrice = Number(item.unitPrice ?? item.price ?? 0) || 0;
      const total = Number(item.total ?? quantity * unitPrice) || 0;

      return {
        description: String(item.description || item.name || "").trim(),
        total,
      };
    })
    .filter((item) => item.description);
}

function getAgendaEventTagsFromAppointment(appointment) {
  const detailedItemTags = getAgendaEventSaleLines(appointment)
    .map((item) => item.description)
    .filter(Boolean);

  if (detailedItemTags.length) {
    return Array.from(new Set(detailedItemTags));
  }

  return [
    appointment.Service?.name || appointment.type || "Servico",
    appointment.secondaryService?.name,
    appointment.tertiaryService?.name,
  ].filter(Boolean);
}

function getAppointmentFinancialSnapshot(appointment) {
  const finance = appointment?.finance || {};
  const paymentsList = Array.isArray(appointment?.paymentsList) ? appointment.paymentsList : [];
  const summary = appointment?.summary || {};
  const normalizeFinanceStatus = (value) => String(value || "").trim().toLowerCase();
  const summaryOutstanding = Number(summary.balance);
  const paidAmount = paymentsList
    .filter((payment) => normalizeFinanceStatus(payment?.status) === "pago")
    .reduce((sum, payment) => sum + (Number(payment.grossAmount || payment.amount || 0) || 0), 0);
  const totalAmount =
    Number(summary.total || finance.grossAmount || appointment?.totalAmount || appointment?.total || 0) ||
    (Number.isFinite(summaryOutstanding) ? summaryOutstanding + paidAmount : 0) ||
    paidAmount ||
    Number(finance.amount || 0) ||
    0;
  const outstandingAmount = Number.isFinite(summaryOutstanding)
    ? Math.max(summaryOutstanding, 0)
    : Math.max(totalAmount - paidAmount, 0);
  const summaryStatus = normalizeFinanceStatus(summary.financialStatus);
  const financeStatus =
    summaryStatus === "pago" || summaryStatus === "parcial" || summaryStatus === "pendente" || summaryStatus === "sem_cobranca"
      ? summaryStatus
      : paidAmount > 0 && outstandingAmount > 0
      ? "parcial"
      : paidAmount > 0 || finance.status === "pago"
        ? "pago"
        : finance.status || "";

  return {
    finance,
    paymentsList,
    summary,
    paidAmount,
    totalAmount,
    outstandingAmount,
    financeStatus,
  };
}

function filterAgendaServicesByType(services = [], agendaType = "estetica") {
  const normalizedType = normalizeAgendaSearch(agendaType);
  if (normalizedType === "clinica") {
    return services.filter((service) =>
      /clin|consulta|exame|vacina|procedimento|cirurgia/i.test(`${service.category || ""} ${service.name || ""}`),
    );
  }

  return services.filter((service) =>
    /est|banho|tosa/i.test(`${service.category || ""} ${service.name || ""}`),
  );
}

async function loadAppointmentDetailsList(appointments, authToken) {
  if (!Array.isArray(appointments) || !appointments.length || !authToken || authToken === DEMO_AUTH_TOKEN) {
    return Array.isArray(appointments) ? appointments : [];
  }

  return Promise.all(
    appointments.map(async (appointment) => {
      try {
        const detailsResponse = await apiRequest(`/appointments/${appointment.id}/details`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const detailsPayload = detailsResponse?.data?.data || detailsResponse?.data || {};
        return {
          ...appointment,
          paymentsList: normalizeListResponse(detailsPayload?.payments),
          itemsList: normalizeListResponse(detailsPayload?.items),
          legacyItemsList: normalizeListResponse(detailsPayload?.legacyItems),
          summary: detailsPayload?.summary || null,
          finance: detailsPayload?.finance || appointment?.finance || {},
        };
      } catch {
        return appointment;
      }
    }),
  );
}

async function loadCustomerOutstandingHistoryMap(customerIds, authToken) {
  const uniqueCustomerIds = Array.from(new Set((customerIds || []).map((customerId) => String(customerId || "").trim()).filter(Boolean)));

  if (!uniqueCustomerIds.length || !authToken || authToken === DEMO_AUTH_TOKEN) {
    return {};
  }

  const entries = await Promise.all(
    uniqueCustomerIds.map(async (customerId) => {
      try {
        const response = await apiRequest(`/customer-data/${customerId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const payload = response?.data?.data || response?.data || {};
        const customerAppointments = normalizeListResponse(payload?.appointments);
        const detailedAppointments = await loadAppointmentDetailsList(customerAppointments, authToken);
        const outstandingFromHistory = detailedAppointments.reduce((sum, appointment) => {
          const snapshot = getAppointmentFinancialSnapshot(appointment);
          return sum + (Number(snapshot.outstandingAmount || 0) || 0);
        }, 0);
        const fallbackOutstanding =
          Number(payload?.customer?.debt ?? payload?.customer?.pendingAmount ?? payload?.customer?.balance ?? 0) || 0;

        return [customerId, outstandingFromHistory || fallbackOutstanding];
      } catch {
        return [customerId, 0];
      }
    }),
  );

  return Object.fromEntries(entries);
}

function mapAppointmentToAgendaEvent(appointment) {
  const { finance, paymentsList, totalAmount, paidAmount, outstandingAmount, financeStatus } = getAppointmentFinancialSnapshot(appointment);
  const eventTags = getAgendaEventTagsFromAppointment(appointment);
  const saleLines = getAgendaEventSaleLines(appointment);
  const isFullyPaid = isFullyPaidAgendaFinance({ totalAmount, paidAmount, outstandingAmount, financeStatus });
  const paidDate = finance.status === "pago" ? formatShortDate(finance.date || finance.dueDate) : "";
  const paymentEntries = paymentsList.map((payment) => {
        const paymentDate = formatShortDate(payment.paidAt || payment.dueDate);
        return `${paymentDate} ${payment.paymentMethod || "Pagamento"} R$${Number(payment.grossAmount || payment.amount || 0).toFixed(2)}`;
      });
  const paymentLine =
    financeStatus === "pago"
      ? `✓ Pago${paidDate ? ` em ${paidDate}` : ""}${finance.paymentMethod ? ` • ${finance.paymentMethod}` : ""}`
      : financeStatus === "parcial"
        ? `Pago parcial • Falta ${formatCurrencyBr(outstandingAmount)}`
        : financeStatus === "pendente"
        ? `Pagamento pendente${outstandingAmount > 0 ? ` • ${formatCurrencyBr(outstandingAmount)}` : ""}`
        : "";

  return mergeAgendaPackageMeta({
    id: appointment.id,
    date: appointment.date,
    hour: appointment.time?.slice(0, 5) || "00:00",
    pet: appointment.Pet?.name || appointment.petName || "Pet",
    owner: appointment.Custumer?.name || appointment.customerName || "Tutor",
    breed: appointment.Pet?.breed || "",
    note: appointment.observation || appointment.description || "Sem observacoes",
    tags: eventTags,
    saleLines,
    payments: paymentEntries.length ? paymentEntries : paymentLine ? [paymentLine] : [],
    status: appointment.status || "agendado",
    financeStatus,
    financeDate: finance.date || finance.dueDate || "",
    paymentMethod: finance.paymentMethod || "",
    customerId: appointment.customerId,
    petId: appointment.petId,
    responsibleId: appointment.responsibleId,
    serviceId: appointment.serviceId,
    phone: appointment.Custumer?.phone || appointment.customerPhone || "",
    sellerName: appointment.responsible?.name || appointment.sellerName || appointment.responsibleName || "",
    amount: totalAmount,
    paidAmount,
    outstandingAmount,
    isFullyPaid,
    customerOutstandingAmount: Number(appointment.customerOutstandingAmount || 0) || 0,
  });
}

function buildDefaultDemoAgendaItems(selectedDate, demoCatalogs) {
  return agendaEvents.map((item) => ({
    ...item,
    date: selectedDate,
    customerId: demoCatalogs.customers.find((customer) => item.owner.includes(customer.name.split(" ")[0]))?.id || "",
    petId: demoCatalogs.pets.find((pet) => pet.name === item.pet)?.id || "",
    serviceId: demoCatalogs.services.find((service) => service.name === item.tags?.[0])?.id || "",
    financeStatus: /Pago/i.test((item.payments || []).join(" ")) ? "pago" : "pendente",
  }));
}

function buildDemoAgendaItemsForDate(selectedDate, demoCatalogs) {
  const defaults = buildDefaultDemoAgendaItems(selectedDate, demoCatalogs);
  const stored = readDemoAgendaItems().filter((item) => item.date === selectedDate);
  return [...defaults, ...stored].sort((left, right) => String(left.hour || "").localeCompare(String(right.hour || "")));
}

function buildDemoAgendaEventFromForm({ form, catalogs, appointmentId }) {
  const customer = catalogs.customers.find((item) => String(item.id) === String(form.customerId));
  const pet = catalogs.pets.find((item) => String(item.id) === String(form.petId));
  const validItemRows = (form.itemRows || []).filter((row) => row.referenceId || row.description);
  const validPaymentRows = getPersistableAgendaPaymentRows(form.paymentRows || []);
  const itemTotal = calculateAgendaRowsTotal(validItemRows);
  const paymentTotal = validPaymentRows.reduce((sum, row) => sum + (Number(row.amount || 0) || 0), 0);
  const outstandingAmount = Math.max(itemTotal - paymentTotal, 0);
  const tags = validItemRows
    .map((row) => row.description)
    .filter(Boolean);
  const saleLines = validItemRows.map((row) => ({
    description: row.description || "Item",
    total: Number(row.total || calculateAgendaItemTotal(row)) || 0,
  }));
  const payments = validPaymentRows.map((row) => {
    const paymentDate = formatShortDate(row.paidAt || row.dueDate || form.date);
    return `${paymentDate} ${row.paymentMethod || "Pagamento"} R$${Number(row.amount || 0).toFixed(2)}`;
  });
  const hasPaidPayment = validPaymentRows.some((row) => row.status === "pago");
  const hasPayment = validPaymentRows.length > 0;
  const financeStatus = hasPaidPayment && outstandingAmount > 0 ? "parcial" : hasPaidPayment ? "pago" : hasPayment ? "pendente" : "";

  return {
    id: appointmentId || `demo-agenda-${Date.now()}`,
    date: form.date,
    hour: String(form.time || "").slice(0, 5),
    pet: pet?.name || "Pet",
    owner: customer?.name || "Tutor",
    breed: pet?.breed || "",
    phone: customer?.phone || "",
    note: form.observation || "Sem observacoes",
    tags: tags.length ? tags : ["Servico"],
    saleLines,
    payments,
    sellerName: form.sellerName || "",
    itemRows: validItemRows.map((row) => ({
      ...row,
      referenceId: String(row.referenceId || ""),
      quantity: String(row.quantity || 1),
      unitPrice: String(row.unitPrice || 0),
      total: String(row.total || calculateAgendaItemTotal(row)),
    })),
    paymentRows: validPaymentRows.map((row) => ({
      ...row,
      amount: String(row.amount || 0),
      feePercentage: String(row.feePercentage || 0),
    })),
    status: form.status || "aguardando",
    financeStatus,
    financeDate: validPaymentRows[0]?.dueDate || form.date,
    paymentMethod: validPaymentRows[0]?.paymentMethod || "",
    customerId: form.customerId,
    petId: form.petId,
    responsibleId: form.responsibleId || "",
    serviceId: form.serviceId || validItemRows.find((row) => row.kind === "service")?.referenceId || "",
    amount: itemTotal || paymentTotal || 0,
    paidAmount: paymentTotal,
    outstandingAmount,
    customerOutstandingAmount: 0,
    packageGroupId: form.packageGroupId || "",
    packageIndex: Number(form.packageIndex || 0) || 0,
    packageTotal: Number(form.packageTotal || 0) || 0,
    packageDates: Array.isArray(form.packageDates) ? form.packageDates : [],
  };
}

function buildDriverRowsFromAgendaItems(items = []) {
  return items
    .slice()
    .sort((left, right) => String(left.hour || "").localeCompare(String(right.hour || "")))
    .map((item) => ({
      id: item.id,
      hour: item.hour || "--:--",
      tutor: item.owner || "Tutor nao informado",
      pet: item.pet || "Pet nao informado",
      address: item.address || "Endereco nao informado",
      completed: isAgendaServiceCompleted(item.status),
    }));
}

function buildBathRowsFromAgendaItems(items = []) {
  return items
    .filter((item) => {
      const labels = [...(item.tags || []), item.note || ""].join(" ");
      return /banho|tosa|estetica|hidrata/i.test(labels);
    })
    .slice()
    .sort((left, right) => String(left.hour || "").localeCompare(String(right.hour || "")))
    .map((item) => ({
      id: item.id,
      hour: item.hour || "--:--",
      pet: item.pet || "Pet nao informado",
    service: item.tags?.join(" • ") || "Servico nao informado",
      note: item.note || "-",
      sellerName: item.sellerName || item.responsibleName || "-",
      completed: isAgendaServiceCompleted(item.status),
    }));
}

function CustomerHistoryModal({ historyState, onClose, onOpenCustomerRegister, onOpenCustomerSalesHistory, onOpenCustomerMessages }) {
  if (!historyState?.isOpen) {
    return null;
  }

  const payload = historyState.payload || {};
  const customer = payload.customer || {};
  const pets = payload.pets || [];
  const appointments = payload.appointments || [];
  const sales = payload.sales || [];

  return (
    <div className="agenda-editor-overlay">
      <section className="modal-card customer-history-modal">
        <div className="customer-history-head">
          <div>
            <span className="section-kicker">Historico do cliente</span>
            <h2>{customer.name || historyState.customerName || "Cliente"}</h2>
            <p>{customer.phone || historyState.phone || "Telefone nao informado"}</p>
          </div>
          <div className="customer-history-actions">
            <button type="button" className="ghost-btn customer-history-action-btn" onClick={onOpenCustomerRegister}>
              Abrir cadastro
            </button>
            <button type="button" className="soft-btn customer-history-action-btn" onClick={onOpenCustomerMessages}>
              Atendimento
            </button>
            <button type="button" className="soft-btn customer-history-action-btn" onClick={onOpenCustomerSalesHistory}>
              Historico de vendas
            </button>
          </div>
          <button type="button" className="agenda-legacy-top-close" onClick={onClose}>
            ×
          </button>
        </div>

        {historyState.loading ? <div className="timeline-loading">Carregando historico...</div> : null}
        {historyState.feedback ? <div className="registers-feedback">{historyState.feedback}</div> : null}

        <div className="customer-history-summary">
          <div className="customer-history-summary-card">
            <span>Pets</span>
            <strong>{pets.length}</strong>
          </div>
          <div className="customer-history-summary-card">
            <span>Agendamentos</span>
            <strong>{appointments.length}</strong>
          </div>
          <div className="customer-history-summary-card">
            <span>Compras</span>
            <strong>{sales.length}</strong>
          </div>
        </div>

        <div className="customer-history-grid">
          <section className="settings-card customer-history-section">
            <div className="customer-history-section-head">
              <strong>Pets cadastrados</strong>
              <span>{pets.length}</span>
            </div>
            <div className="customer-history-list">
              {pets.length ? (
                pets.map((pet) => (
                  <div key={pet.id} className="customer-history-entry">
                    <strong>{pet.name}</strong>
                    <span>{pet.breed ? `${pet.breed}` : "Raca nao informada"}</span>
                  </div>
                ))
              ) : (
                <div className="customer-history-empty">Nenhum pet encontrado.</div>
              )}
            </div>
          </section>

          <section className="settings-card customer-history-section">
            <div className="customer-history-section-head">
              <strong>Ultimos agendamentos</strong>
              <span>{appointments.length}</span>
            </div>
            <div className="customer-history-list">
              {appointments.length ? (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="customer-history-entry">
                    <strong>{appointment.Service?.name || appointment.serviceName || appointment.type || "Servico"}</strong>
          <span>{formatShortDate(appointment.date)} • {(appointment.time || "").slice(0, 5)}</span>
                  </div>
                ))
              ) : (
                <div className="customer-history-empty">Nenhum agendamento encontrado.</div>
              )}
            </div>
          </section>

          <section className="settings-card customer-history-sales-card customer-history-section">
            <div className="customer-history-section-head">
              <strong>Historico de compras</strong>
              <span>{sales.length}</span>
            </div>
            <div className="customer-history-list">
              {sales.length ? (
                sales.map((sale) => (
                  <div key={sale.id} className="customer-history-sale-row">
                    <div>
                      <strong>{formatShortDate(sale.createdAt || sale.date)}</strong>
                  <div>{sale.products?.length ? sale.products.map((item) => `${item.name} x${item.quantity}`).join(" • ") : sale.description || "Venda registrada"}</div>
                    </div>
                    <span>{formatCurrencyBr(sale.total || sale.amount || 0)}</span>
                  </div>
                ))
              ) : (
                <div className="customer-history-empty">Nenhuma compra encontrada.</div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function AgendaPage({ agendaType = "estetica", activeTab = "Estética" } = {}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const todayDate = getLocalDateString();
  const normalizedAgendaType = normalizeAgendaSearch(agendaType) === "clinica" ? "clinica" : "estetica";
  const isClinicAgenda = normalizedAgendaType === "clinica";
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [visibleAgendaMonth, setVisibleAgendaMonth] = useState(`${todayDate.slice(0, 7)}-01`);
  const [agendaItems, setAgendaItems] = useState([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [agendaFeedback, setAgendaFeedback] = useState("");
  const [agendaBanner, setAgendaBanner] = useState(null);
  const [statusMenuEventId, setStatusMenuEventId] = useState("");
  const [responsibleMenuEventId, setResponsibleMenuEventId] = useState("");
  const [historyState, setHistoryState] = useState({ isOpen: false, loading: false, feedback: "", payload: null, customerName: "", phone: "" });
  const [settings, setSettings] = useState({
    openingTime: "08:00",
    closingTime: "18:00",
    intervalAesthetics: 60,
    intervalClinic: 60,
    workingDays: buildWorkingDaysFromPreset("monday-saturday"),
  });
  const [catalogs, setCatalogs] = useState(() => getEmptyAgendaCatalogs());
  const [agendaCatalogsLoaded, setAgendaCatalogsLoaded] = useState(false);
  const [responsibleOptions, setResponsibleOptions] = useState([]);
  const [responsibleOptionsLoaded, setResponsibleOptionsLoaded] = useState(false);
  const [editor, setEditor] = useState({
    isOpen: false,
    loading: false,
    saving: false,
    appointmentId: "",
    feedback: "",
    form: createAgendaFormState({
      selectedDate: getLocalDateString(),
      selectedHour: "08:00",
      catalogs: getEmptyAgendaCatalogs(),
    }),
  });

  useEffect(() => {
    const now = getLocalDateString();
    setSelectedDate(now);
    setVisibleAgendaMonth(`${now.slice(0, 7)}-01`);
  }, []);

  async function ensureAgendaCatalogs(force = false) {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const demoCatalogs = getAgendaDemoCatalogs();
      setCatalogs(demoCatalogs);
      setAgendaCatalogsLoaded(true);
      return demoCatalogs;
    }

    if (!force && agendaCatalogsLoaded) {
      return catalogs;
    }

    const [customersResponse, petsResponse, servicesResponse, productsResponse] = await Promise.all([
      apiRequest("/customers", {
        headers: { Authorization: `Bearer ${auth.token}` },
      }),
      apiRequest("/pets", {
        headers: { Authorization: `Bearer ${auth.token}` },
      }),
      apiRequest("/services", {
        headers: { Authorization: `Bearer ${auth.token}` },
      }),
      apiRequest("/products", {
        headers: { Authorization: `Bearer ${auth.token}` },
      }).catch(() => ({ data: [] })),
    ]);

    const allServices = normalizeListResponse(servicesResponse);
    const nextCatalogs = {
      customers: normalizeListResponse(customersResponse),
      pets: normalizeListResponse(petsResponse),
      services: filterAgendaServicesByType(allServices, normalizedAgendaType),
      products: normalizeListResponse(productsResponse),
    };

    setCatalogs(nextCatalogs);
    setAgendaCatalogsLoaded(true);
    return nextCatalogs;
  }

  async function ensureAgendaResponsibles(force = false) {
    const ownerOption = auth.user?.id
      ? [{ value: String(auth.user.id), label: String(auth.user.name || "Proprietario") }]
      : [];

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const demoOptions = ownerOption;
      setResponsibleOptions(demoOptions);
      setResponsibleOptionsLoaded(true);
      return demoOptions;
    }

    if (!force && responsibleOptionsLoaded) {
      return responsibleOptions;
    }

    const employeesResponse = await apiRequest("/employees", {
      headers: { Authorization: `Bearer ${auth.token}` },
    }).catch(() => []);
    const employees = normalizeListResponse(employeesResponse);
    const nextOptions = [
      ...ownerOption,
      ...employees
        .map((item) => ({
          value: String(item.id || "").trim(),
          label: String(item.name || "").trim(),
        }))
        .filter((item) => item.value && item.label && !ownerOption.some((owner) => owner.value === item.value)),
    ];

    setResponsibleOptions(nextOptions);
    setResponsibleOptionsLoaded(true);
    return nextOptions;
  }

  async function loadAgendaData() {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const demoCatalogs = getAgendaDemoCatalogs();
      setCatalogs(demoCatalogs);
      setAgendaCatalogsLoaded(true);
      setAgendaItems(buildDemoAgendaItemsForDate(selectedDate, demoCatalogs));
      setAgendaBanner(getActiveAgendaSidebarBanner(readDemoAgendaBanners()));
      const storedSettings = normalizeSettingsData(readStoredUiSettings(), auth.user);
      setSettings((current) => ({
        ...current,
        openingTime: storedSettings.openingTime || current.openingTime,
        closingTime: storedSettings.closingTime || current.closingTime,
        intervalAesthetics: Number(storedSettings.intervalAesthetics || current.intervalAesthetics || 60),
        intervalClinic: Number(storedSettings.intervalClinic || current.intervalClinic || 60),
        workingDays: storedSettings.workingDays || current.workingDays,
      }));
      setAgendaFeedback(auth.token === DEMO_AUTH_TOKEN ? "Agenda em modo demonstracao local." : "");
      return;
    }

    try {
      setLoadingAgenda(true);
      setAgendaFeedback("");

      const [appointmentsResponse, agendaSettingsResponse, bannersResponse] = await Promise.all([
        apiRequest(`/appointments?date=${selectedDate}&type=${normalizedAgendaType}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        }),
        apiRequest("/agenda/settings", {
          headers: { Authorization: `Bearer ${auth.token}` },
        }).catch(() => ({ data: null })),
        apiRequest("/banners?placement=agenda_sidebar&activeOnly=true", {
          headers: { Authorization: `Bearer ${auth.token}` },
        }).catch(() => []),
      ]);

      setSettings((current) => ({
        ...current,
        openingTime: agendaSettingsResponse?.data?.openingTime?.slice?.(0, 5) || current.openingTime,
        closingTime: agendaSettingsResponse?.data?.closingTime?.slice?.(0, 5) || current.closingTime,
        intervalClinic: Number(agendaSettingsResponse?.data?.intervalClinic || current.intervalClinic || 60),
        intervalAesthetics: Number(agendaSettingsResponse?.data?.intervalAesthetics || current.intervalAesthetics || 60),
        workingDays:
          agendaSettingsResponse?.data?.workingDays ||
          normalizeSettingsData(readStoredUiSettings(), auth.user).workingDays ||
          current.workingDays,
      }));

      const appointments = normalizeListResponse(appointmentsResponse);
      const loadedBanners = Array.isArray(bannersResponse)
        ? bannersResponse
        : normalizeListResponse(bannersResponse);
      setAgendaBanner(getActiveAgendaSidebarBanner(loadedBanners));
      const appointmentsWithDetails = await loadAppointmentDetailsList(appointments, auth.token);
      setAgendaItems(
        appointmentsWithDetails
          .map((appointment) => ({
            ...appointment,
            customerOutstandingAmount: 0,
          }))
          .map(mapAppointmentToAgendaEvent)
          .map(mergeAgendaPackageMeta),
      );

      const customerIds = appointmentsWithDetails.map((appointment) => appointment.customerId);
      loadCustomerOutstandingHistoryMap(customerIds, auth.token)
        .then((customerOutstandingMap) => {
          setAgendaItems((current) =>
            current.map((event) => ({
              ...event,
              customerOutstandingAmount:
                Number(customerOutstandingMap[String(event.customerId || "")] || 0) || 0,
            })),
          );
        })
        .catch(() => null);

      if (!agendaCatalogsLoaded) {
        ensureAgendaCatalogs().catch(() => null);
      }
    } catch (error) {
      setAgendaFeedback(error.message || "Nao foi possivel carregar a agenda.");
      setAgendaItems([]);
      setAgendaBanner(null);
    } finally {
      setLoadingAgenda(false);
    }
  }

  useEffect(() => {
    setAgendaCatalogsLoaded(false);
    setResponsibleOptionsLoaded(false);
  }, [auth.token, normalizedAgendaType]);

  useEffect(() => {
    loadAgendaData();
  }, [auth.token, selectedDate, normalizedAgendaType]);

  async function openNewEditor(hour) {
    setEditor({
      isOpen: true,
      loading: true,
      saving: false,
      appointmentId: "",
      feedback: "",
      form: createAgendaFormState({
        selectedDate,
        selectedHour: hour,
        catalogs,
      }),
    });
    await ensureAgendaResponsibles().catch(() => []);
    const nextCatalogs = await ensureAgendaCatalogs();
    setEditor({
      isOpen: true,
      loading: false,
      saving: false,
      appointmentId: "",
      feedback: "",
      form: createAgendaFormState({
        selectedDate,
        selectedHour: hour,
        catalogs: nextCatalogs,
      }),
    });
  }

  async function openExistingEditor(event) {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setEditor({
        isOpen: true,
        loading: false,
        saving: false,
        appointmentId: event.id,
        feedback: auth.token === DEMO_AUTH_TOKEN ? "Edicao em modo demonstracao local." : "",
        form: createAgendaFormState({
          selectedDate,
          selectedHour: event.hour,
          event,
          catalogs,
        }),
      });
      return;
    }

    setEditor((current) => ({
      ...current,
      isOpen: true,
      loading: true,
      appointmentId: event.id,
      feedback: "",
      form: createAgendaFormState({
        selectedDate,
        selectedHour: event.hour,
        event,
        catalogs,
      }),
    }));

    try {
      const [nextCatalogsBase, detailsResponse] = await Promise.all([
        ensureAgendaCatalogs(),
        ensureAgendaResponsibles(),
        apiRequest(`/appointments/${event.id}/details`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        }),
      ]);
      const detailsPayload = detailsResponse?.data?.data || detailsResponse?.data || {};
      const serviceCatalog = normalizeListResponse(detailsPayload?.catalogs?.services);
      const nextCatalogs = {
        ...nextCatalogsBase,
        services: serviceCatalog.length ? serviceCatalog : nextCatalogsBase.services,
      };
      setCatalogs(nextCatalogs);
      setEditor({
        isOpen: true,
        loading: false,
        saving: false,
        appointmentId: event.id,
        feedback: "",
        form: createAgendaFormState({
          selectedDate,
          selectedHour: event.hour,
          event,
          catalogs: nextCatalogs,
          details: detailsPayload,
        }),
      });
    } catch (error) {
      setEditor((current) => ({
        ...current,
        loading: false,
        feedback: error.message || "Nao foi possivel abrir o cadastro.",
      }));
    }
  }

  function closeEditor() {
    setEditor((current) => ({ ...current, isOpen: false, feedback: "" }));
  }

  function closeCustomerHistory() {
    setHistoryState({ isOpen: false, loading: false, feedback: "", payload: null, customerName: "", phone: "" });
  }

  function openCustomerRegisterFromHistory() {
    const customerName = historyState?.payload?.customer?.name || historyState.customerName || "";
    closeCustomerHistory();
    navigate(`/cadastros?tab=Pessoas&search=${encodeURIComponent(customerName)}`);
  }

  function openCustomerMessagesFromHistory() {
    const customer = historyState?.payload?.customer || {};
    const firstPet = historyState?.payload?.pets?.[0] || {};
    const customerName = customer.name || historyState.customerName || "";
    const phone = customer.phone || historyState.phone || "";
    closeCustomerHistory();
    navigate(
      buildMessagesRoute({
        search: phone || customerName,
        customerId: customer.id || "",
        petId: firstPet.id || "",
        phone,
        customerName,
        petName: firstPet.name || "",
        title: customerName || firstPet.name || phone,
        source: "agenda",
      }),
    );
  }

  function openCustomerSalesHistoryFromHistory() {
    const customerName = historyState?.payload?.customer?.name || historyState.customerName || "";
    closeCustomerHistory();
    navigate(`/venda?customer=${encodeURIComponent(customerName)}`);
  }

  async function openCustomerHistory(event) {
    const fallbackCustomer = catalogs.customers.find((customer) => String(customer.id) === String(event.customerId));
    const fallbackPayload = {
      customer: fallbackCustomer || { name: event.owner, phone: event.phone || "" },
      pets: catalogs.pets.filter((pet) => String(pet.customerId || pet.custumerId) === String(event.customerId)),
      appointments: agendaItems
        .filter((item) => String(item.customerId) === String(event.customerId))
        .map((item) => ({
          id: item.id,
          date: item.date,
          time: item.hour,
          serviceName: item.tags?.[0] || "Servico",
        })),
      sales: agendaItems
        .filter((item) => String(item.customerId) === String(event.customerId) && Number(item.amount || 0) > 0)
        .map((item) => ({
          id: item.id,
          date: item.date,
          amount: item.amount,
        description: item.tags?.join(" • "),
        })),
    };

    setHistoryState({
      isOpen: true,
      loading: true,
      feedback: "",
      payload: fallbackPayload,
      customerName: event.owner,
      phone: event.phone || fallbackCustomer?.phone || "",
    });

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN || !event.customerId) {
      setHistoryState((current) => ({
        ...current,
        loading: false,
        feedback: auth.token === DEMO_AUTH_TOKEN ? "Historico em modo demonstracao local." : "",
      }));
      return;
    }

    try {
      const response = await apiRequest(`/customer-data/${event.customerId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const payload = response?.data?.data || response?.data || fallbackPayload;
      setHistoryState({
        isOpen: true,
        loading: false,
        feedback: "",
        payload,
        customerName: payload?.customer?.name || event.owner,
        phone: payload?.customer?.phone || event.phone || "",
      });
    } catch (error) {
      setHistoryState((current) => ({
        ...current,
        loading: false,
        feedback: `${error.message || "Nao foi possivel carregar o historico."} Exibindo dados locais.`,
      }));
    }
  }

  function openCustomerWhatsapp(event) {
    const fallbackCustomer = catalogs.customers.find((customer) => String(customer.id) === String(event.customerId));
    const phone = normalizeWhatsappPhone(event.phone || fallbackCustomer?.phone || "");
    const customerName = fallbackCustomer?.name || event.owner || "";
    if (!phone && !event.customerId) {
      setAgendaFeedback("Cliente sem telefone ou cadastro para abrir o atendimento.");
      return;
    }
    navigate(
      buildMessagesRoute({
        search: phone || customerName,
        customerId: event.customerId || fallbackCustomer?.id || "",
        petId: event.petId || "",
        phone,
        customerName,
        petName: event.pet || "",
        title: customerName || event.pet || phone,
        source: "agenda",
      }),
    );
  }

  async function updateAgendaEventStatus(event, nextStatus) {
    const previousItems = agendaItems;
    const nextItems = agendaItems.map((item) =>
      String(item.id) === String(event.id)
        ? {
            ...item,
            status: nextStatus,
          }
        : item,
    );

    setStatusMenuEventId("");
    setAgendaItems(nextItems);

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const storedItems = readDemoAgendaItems();
      const nextStoredItems = storedItems.map((item) =>
        String(item.id) === String(event.id)
          ? {
              ...item,
              status: nextStatus,
            }
          : item,
      );
      writeDemoAgendaItems(nextStoredItems);
      return;
    }

    try {
      await apiRequest(`/appointments/${event.id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (error) {
      setAgendaItems(previousItems);
      setAgendaFeedback(error.message || "Nao foi possivel atualizar a situacao do cadastro.");
    }
  }

  async function updateAgendaEventResponsible(event, nextResponsibleId) {
    const normalizedResponsibleId = String(nextResponsibleId || "").trim();
    const selectedResponsible = responsibleOptions.find((item) => String(item.value) === normalizedResponsibleId);
    const previousItems = agendaItems;
    const nextSellerName = selectedResponsible?.label || "";
    const nextItems = agendaItems.map((item) =>
      String(item.id) === String(event.id)
        ? {
            ...item,
            responsibleId: normalizedResponsibleId,
            sellerName: nextSellerName,
          }
        : item,
    );

    setAgendaItems(nextItems);
    setResponsibleMenuEventId("");

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const nextStoredItems = readDemoAgendaItems().map((item) =>
        String(item.id) === String(event.id)
          ? {
              ...item,
              responsibleId: normalizedResponsibleId,
              sellerName: nextSellerName,
            }
          : item,
      );
      writeDemoAgendaItems(nextStoredItems);
      return;
    }

    try {
      await apiRequest(`/appointments/${event.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          responsibleId: normalizedResponsibleId || null,
        }),
      });
    } catch (error) {
      setAgendaItems(previousItems);
      setAgendaFeedback(error.message || "Nao foi possivel atualizar o responsavel.");
    }
  }

  async function deleteAppointmentFromEditor() {
    if (!editor.appointmentId) {
      closeEditor();
      return;
    }

    const confirmed = window.confirm("Deseja excluir este lancamento da agenda?");
    if (!confirmed) return;

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const nextStoredItems = readDemoAgendaItems().filter((item) => String(item.id) !== String(editor.appointmentId));
      writeDemoAgendaItems(nextStoredItems);
      removeAgendaPackageOccurrences({
        appointmentIds: [editor.appointmentId],
        packageGroupId: editor.form.packageGroupId || "",
      });
      setAgendaItems(buildDemoAgendaItemsForDate(selectedDate, catalogs));
      closeEditor();
      return;
    }

    setEditor((current) => ({ ...current, saving: true, feedback: "" }));

    try {
      await apiRequest(`/appointments/${editor.appointmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      removeAgendaPackageOccurrences({
        appointmentIds: [editor.appointmentId],
        packageGroupId: editor.form.packageGroupId || "",
      });
      await loadAgendaData();
      closeEditor();
    } catch (error) {
      setEditor((current) => ({
        ...current,
        saving: false,
        feedback: error.message || "Nao foi possivel excluir o cadastro da agenda.",
      }));
      return;
    }

    setEditor((current) => ({ ...current, saving: false }));
  }

  function updateEditorField(field, value) {
    setEditor((current) => {
      const nextForm = { ...current.form, [field]: value };

      if (field === "responsibleId") {
        const selectedResponsible = responsibleOptions.find((item) => String(item.value) === String(value));
        nextForm.responsibleId = String(value || "");
        nextForm.sellerName = selectedResponsible?.label || "";
      }

      if (field === "customerId" && nextForm.petId) {
        const currentPet = catalogs.pets.find((pet) => String(pet.id) === String(nextForm.petId));
        if (currentPet && getPetCustomerId(currentPet) !== String(value)) {
          nextForm.petId = "";
        }
      }

      if (field === "petId") {
        const selectedPet = catalogs.pets.find((pet) => String(pet.id) === String(value));
        if (selectedPet) {
          const selectedPetCustomerId = getPetCustomerId(selectedPet);
          nextForm.customerId = String(selectedPetCustomerId || nextForm.customerId || "");
          const tutor = catalogs.customers.find((customer) => String(customer.id) === selectedPetCustomerId);
          nextForm.petSearch = `${selectedPet.name}${tutor ? ` (${tutor.name})` : ""}`;
          if (!nextForm.weight && selectedPet.weight) {
            nextForm.weight = String(selectedPet.weight);
          }
        }
      }

      if (field === "petSearch") {
        const matchedPet = resolveAgendaPetMatchFromCatalogs(value, catalogs);
        if (matchedPet) {
          nextForm.petId = String(matchedPet.pet.id || "");
          nextForm.customerId = String(getPetCustomerId(matchedPet.pet) || nextForm.customerId || "");
        } else if (!String(value || "").trim()) {
          nextForm.petId = "";
        }
      }

      if (field === "serviceId" && (!current.form.paymentAmount || current.form.paymentAmount === "0")) {
        const resolvedServiceId = resolveAgendaServiceReference(value, catalogs);
        const service = catalogs.services.find((item) => String(item.id) === String(resolvedServiceId));
        if (service?.price) {
          nextForm.paymentAmount = String(service.price);
        }
      }

      if (field === "serviceId") {
        const resolvedServiceId = resolveAgendaServiceReference(value, catalogs);
        nextForm.serviceId = resolvedServiceId;
        const service = catalogs.services.find((item) => String(item.id) === String(resolvedServiceId));
        const itemRows = [...(nextForm.itemRows || [])];
        const primaryRow = itemRows[0] || buildAgendaItemRow({ lockedPrimary: true });
        itemRows[0] = {
          ...primaryRow,
          lockedPrimary: true,
          kind: "service",
          referenceId: String(resolvedServiceId || ""),
          description: service?.name || "",
          quantity: primaryRow.quantity || "1",
          unitPrice: String(service?.price || 0),
          total: String(calculateAgendaItemTotal({ quantity: primaryRow.quantity || "1", unitPrice: service?.price || 0 })),
        };
        nextForm.itemRows = itemRows;
        const itemsTotal = calculateAgendaRowsTotal(itemRows);
        nextForm.paymentAmount = String(itemsTotal);
        if ((nextForm.paymentRows || []).length === 1) {
          nextForm.paymentRows = nextForm.paymentRows.map((paymentRow, index) =>
            index === 0 ? buildAgendaPaymentRow({ ...paymentRow, amount: String(itemsTotal) }, nextForm.date) : paymentRow,
          );
        }
      }

      return {
        ...current,
        form: nextForm,
      };
    });
  }

  function updateEditorItemRow(rowId, field, value) {
    setEditor((current) => {
      const itemRows = (current.form.itemRows || []).map((row) => {
        if (row.id !== rowId) return row;

        let nextRow = { ...row, [field]: value };

        if (field === "referenceId") {
          const [kind, referenceId] = String(value || "").split(":");
          nextRow.kind = kind || row.kind;
          nextRow.referenceId = referenceId || "";

          if (kind === "service") {
            const service = catalogs.services.find((item) => String(item.id) === String(referenceId));
            nextRow.description = service?.name || "";
            nextRow.unitPrice = String(service?.price || 0);
          }

          if (kind === "product") {
            const product = (catalogs.products || []).find((item) => String(item.id) === String(referenceId));
            nextRow.description = product?.name || "";
            nextRow.unitPrice = String(product?.price || 0);
          }
        }

        if (field === "quantity" || field === "unitPrice" || field === "referenceId") {
          nextRow.total = String(calculateAgendaItemTotal(nextRow));
        }

        return nextRow;
      });

      const itemsTotal = calculateAgendaRowsTotal(itemRows);
      const paymentRows =
        (current.form.paymentRows || []).length === 1
          ? current.form.paymentRows.map((paymentRow, index) =>
              index === 0 ? buildAgendaPaymentRow({ ...paymentRow, amount: String(itemsTotal) }, current.form.date) : paymentRow,
            )
          : current.form.paymentRows;
      const primaryServiceRow = itemRows.find((row) => row.kind === "service" && row.referenceId);

      return {
        ...current,
        form: {
          ...current.form,
          itemRows,
          paymentRows,
          paymentAmount: String(itemsTotal),
          serviceId: primaryServiceRow ? String(primaryServiceRow.referenceId || "") : "",
        },
      };
    });
  }

  function addEditorItemRow() {
    setEditor((current) => ({
      ...current,
      form: {
        ...current.form,
        itemRows: [
          ...(current.form.itemRows || []),
          buildAgendaItemRow({ kind: "service", quantity: 1, unitPrice: 0, total: 0 }),
        ],
      },
    }));
  }

  function removeEditorItemRow(rowId) {
    setEditor((current) => {
      let itemRows = (current.form.itemRows || []).filter((row) => row.id !== rowId);

      if (!itemRows.length) {
        itemRows = [buildAgendaItemRow({ lockedPrimary: true, kind: "service" })];
      }

      const itemsTotal = calculateAgendaRowsTotal(itemRows);
      const paymentRows =
        (current.form.paymentRows || []).length === 1
          ? current.form.paymentRows.map((paymentRow, index) =>
              index === 0 ? buildAgendaPaymentRow({ ...paymentRow, amount: String(itemsTotal) }, current.form.date) : paymentRow,
            )
          : current.form.paymentRows;

      return {
        ...current,
        form: {
          ...current.form,
          itemRows,
          paymentRows,
          paymentAmount: String(itemsTotal),
          serviceId: itemRows[0]?.kind === "service" ? String(itemRows[0].referenceId || "") : current.form.serviceId,
        },
      };
    });
  }

  function updateEditorPaymentRow(rowId, field, value) {
    setEditor((current) => {
      const paymentRows = (current.form.paymentRows || []).map((row) => {
        if (row.id !== rowId) return row;
        const nextRow = { ...row, [field]: value };
        if (field === "paymentMethod" || field === "amount") {
          const breakdown = calculateFeeBreakdown(nextRow.amount, nextRow.paymentMethod, readAccountSettings());
          nextRow.grossAmount = String(breakdown.grossAmount);
          nextRow.feePercentage = String(breakdown.feePercentage);
          nextRow.feeAmount = String(breakdown.feeAmount);
          nextRow.netAmount = String(breakdown.netAmount);
        }
        return nextRow;
      });

      return {
        ...current,
        form: {
          ...current.form,
          paymentRows,
        },
      };
    });
  }

  function addEditorPaymentRow() {
    setEditor((current) => {
      const totalAmount = calculateAgendaRowsTotal(current.form.itemRows || []);
      const paidAmount = calculateAgendaPaymentsTotal(current.form.paymentRows || []);
      const remainingAmount = Math.max(totalAmount - paidAmount, 0);

      return {
        ...current,
        form: {
          ...current.form,
          paymentRows: [
            ...(current.form.paymentRows || []),
            buildAgendaPaymentRow({ amount: remainingAmount }, current.form.date),
          ],
        },
      };
    });
  }

  function removeEditorPaymentRow(rowId) {
    setEditor((current) => {
      let paymentRows = (current.form.paymentRows || []).filter((row) => row.id !== rowId);
      if (!paymentRows.length) {
        paymentRows = [buildAgendaPaymentRow({}, current.form.date)];
      }
      return {
        ...current,
        form: {
          ...current.form,
          paymentRows,
        },
      };
    });
  }

  async function saveAppointmentFromEditor() {
    const {
      form,
      validItemRows,
      mainServiceId,
      appointmentType,
    } = normalizeAgendaSaveForm(editor.form, catalogs);
    const hasExistingPackage = Boolean(form.packageGroupId) || Number(form.packageTotal || 0) > 1;
    const originalOccurrenceDate = String(form.originalDate || "").slice(0, 10);
    const currentFormDate = String(form.date || "").slice(0, 10);
    let packageDatesSource = hasExistingPackage ? [...(form.packageDates || [])] : [];

    if (hasExistingPackage && originalOccurrenceDate && currentFormDate && originalOccurrenceDate !== currentFormDate) {
      packageDatesSource = packageDatesSource.map((occurrenceDate) =>
        String(occurrenceDate || "").slice(0, 10) === originalOccurrenceDate ? currentFormDate : occurrenceDate,
      );
    }

    const packageDates = hasExistingPackage ? normalizePackageDates(packageDatesSource, form.date) : [form.date];
    const packageEnabled = hasExistingPackage && packageDates.length > 1;
    const packageGroupId = packageEnabled ? form.packageGroupId || `pkg-${Date.now()}` : "";

    if (!form.customerId || !form.petId || !mainServiceId || !form.date || !form.time) {
      setEditor((current) => ({
        ...current,
        form,
        feedback: "Selecione pet e servico na lista antes de salvar o cadastro.",
      }));
      return;
    }

    setEditor((current) => ({
      ...current,
      form,
      saving: true,
      feedback: "",
    }));

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const storedItems = readDemoAgendaItems();
      const baseTimestamp = Date.now();
      const nextDemoEvents = (packageEnabled ? packageDates : [form.date]).map((occurrenceDate, index) =>
        buildDemoAgendaEventFromForm({
          form: {
            ...form,
            date: occurrenceDate,
            paymentRows: index === 0 ? form.paymentRows : [],
            packageGroupId,
            packageIndex: packageEnabled ? index + 1 : 0,
            packageTotal: packageEnabled ? packageDates.length : 0,
            packageDates,
          },
          catalogs,
          appointmentId: editor.appointmentId && index === 0 ? editor.appointmentId : `demo-agenda-${baseTimestamp}-${index}`,
        }),
      );
      const nextStoredItems = [
        ...storedItems.filter(
          (item) =>
            String(item.id) !== String(editor.appointmentId || "") &&
            (!form.packageGroupId || String(item.packageGroupId || "") !== String(form.packageGroupId)),
        ),
        ...nextDemoEvents,
      ];
      writeDemoAgendaItems(nextStoredItems);
      if (packageEnabled) {
        writeAgendaPackageOccurrences(
          nextDemoEvents.map((event) => ({
            appointmentId: event.id,
            packageGroupId,
            packageIndex: event.packageIndex,
            packageTotal: event.packageTotal,
            packageDates,
          })),
        );
      } else {
        removeAgendaPackageOccurrences({
          appointmentIds: [editor.appointmentId],
          packageGroupId: form.packageGroupId || "",
        });
      }
      setAgendaItems(buildDemoAgendaItemsForDate(selectedDate, catalogs));
      setEditor((current) => ({
        ...current,
        feedback: "Modo demonstracao: cadastro salvo na agenda local.",
      }));
      closeEditor();
      return;
    }

    try {
      const occurrenceDates = packageEnabled ? packageDates : [form.date];
      const validPaymentRows = getPersistableAgendaPaymentRows(form.paymentRows || []);
      const syncWarnings = [];
      const baseAppointmentPayload = {
        customerId: form.customerId,
        petId: form.petId,
        serviceId: mainServiceId,
        type: appointmentType,
        time: form.time,
        status: form.status || "aguardando",
      };
      if (form.responsibleId) {
        baseAppointmentPayload.responsibleId = form.responsibleId;
      } else if (form.responsibleId === "") {
        baseAppointmentPayload.responsibleId = null;
      } else if (auth.user?.id) {
        baseAppointmentPayload.responsibleId = auth.user.id;
      }
      if (form.observation) {
        baseAppointmentPayload.observation = form.observation;
      }
      if (form.sellerName) {
        baseAppointmentPayload.sellerName = form.sellerName;
      }
      const savedPackageEntries = [];

      async function syncAppointmentOccurrence({ appointmentId, occurrenceDate, includePayments, index, shouldReuseOnly = false }) {
        const appointmentPayload = {
          ...baseAppointmentPayload,
          date: occurrenceDate,
        };

        let resolvedAppointmentId = String(appointmentId || "").trim();

        if (resolvedAppointmentId && !shouldReuseOnly) {
          await apiRequest(`/appointments/${resolvedAppointmentId}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify(appointmentPayload),
          });
        }

        if (!resolvedAppointmentId) {
          const created = await apiRequest("/appointments", {
            method: "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify(appointmentPayload),
          });

          resolvedAppointmentId =
            created?.data?.id ||
            created?.data?.data?.id ||
            created?.id ||
            "";
        }

        if (!resolvedAppointmentId) {
          throw new Error("Nao foi possivel obter o identificador do agendamento salvo.");
        }

        let existingDetailsPayload = null;

        if (!shouldReuseOnly) {
          const existingDetails = await apiRequest(`/appointments/${resolvedAppointmentId}/details`, {
            headers: { Authorization: `Bearer ${auth.token}` },
          }).catch(() => ({ data: { items: [], payments: [] } }));
          existingDetailsPayload = existingDetails?.data?.data || existingDetails?.data || { items: [], payments: [] };

          const existingItems = normalizeListResponse(existingDetailsPayload?.items);
          const existingPayments = normalizeListResponse(existingDetailsPayload?.payments);

          await Promise.all(
            existingItems.map((item) =>
              apiRequest(`/appointments/${resolvedAppointmentId}/items/${item.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${auth.token}` },
              }).catch(() => null),
            ),
          );

          await Promise.all(
            existingPayments.map((payment) =>
              apiRequest(`/appointments/${resolvedAppointmentId}/payments/${payment.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${auth.token}` },
              }).catch(() => null),
            ),
          );
        }

        for (const row of validItemRows) {
          if (row.kind === "service" && row.referenceId) {
            const serviceExists = catalogs.services.some((item) => String(item.id) === String(row.referenceId));
            if (!serviceExists) {
              syncWarnings.push(`Servico ignorado: ${row.description || row.referenceId}`);
              continue;
            }

            try {
              await apiRequest(`/appointments/${resolvedAppointmentId}/items`, {
                method: "POST",
                headers: { Authorization: `Bearer ${auth.token}` },
                body: JSON.stringify({
                  type: "service",
                  serviceId: row.referenceId,
                  quantity: Number(row.quantity || 1),
                  unitPrice: Number(row.unitPrice || 0),
                  description: row.description,
                }),
              });
            } catch (error) {
              syncWarnings.push(error.message || `Nao foi possivel adicionar o servico ${row.description || ""}.`);
            }
          }

          if (row.kind === "product" && row.referenceId) {
            const productExists = (catalogs.products || []).some((item) => String(item.id) === String(row.referenceId));
            if (!productExists) {
              syncWarnings.push(`Produto ignorado: ${row.description || row.referenceId}`);
              continue;
            }

            try {
              await apiRequest(`/appointments/${resolvedAppointmentId}/items`, {
                method: "POST",
                headers: { Authorization: `Bearer ${auth.token}` },
                body: JSON.stringify({
                  type: "product",
                  productId: row.referenceId,
                  quantity: Number(row.quantity || 1),
                  unitPrice: Number(row.unitPrice || 0),
                  description: row.description,
                }),
              });
            } catch (error) {
              syncWarnings.push(error.message || `Nao foi possivel adicionar o produto ${row.description || ""}.`);
            }
          }
        }

        if (includePayments) {
          for (const paymentRow of validPaymentRows) {
            try {
              await apiRequest(`/appointments/${resolvedAppointmentId}/payments`, {
                method: "POST",
                headers: { Authorization: `Bearer ${auth.token}` },
                body: JSON.stringify({
                  dueDate: paymentRow.dueDate || occurrenceDate,
                  paymentMethod: paymentRow.paymentMethod,
                  details: paymentRow.details,
                  amount: paymentRow.normalizedAmount,
                  feePercentage: Number(paymentRow.feePercentage || 0),
                  status: paymentRow.status || "pendente",
                  paidAt:
                    paymentRow.status === "pago"
                      ? `${paymentRow.dueDate || occurrenceDate}T12:00:00`
                      : null,
                }),
              });
            } catch (error) {
              syncWarnings.push(error.message || "Nao foi possivel adicionar um pagamento da agenda.");
            }
          }
        }

        const shouldJoinGeneralQueue = appointmentType === "clinica";
        const isAlreadyInGeneralQueue = Boolean(existingDetailsPayload?.appointment?.queue);

        if (shouldJoinGeneralQueue && (!isAlreadyInGeneralQueue || shouldReuseOnly)) {
          try {
            await apiRequest(`/appointments/queue/geral/add/${resolvedAppointmentId}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${auth.token}` },
            });
          } catch (error) {
            syncWarnings.push(error.message || "Nao foi possivel adicionar o agendamento na fila.");
          }
        }

        if (packageEnabled) {
          savedPackageEntries.push({
            appointmentId: resolvedAppointmentId,
            packageGroupId,
            packageIndex: index + 1,
            packageTotal: occurrenceDates.length,
            packageDates: occurrenceDates,
          });
        }

        return resolvedAppointmentId;
      }

      const shouldUseFastCreateFlow = !editor.appointmentId && !packageEnabled;

      if (shouldUseFastCreateFlow) {
        const created = await apiRequest("/appointments", {
          method: "POST",
          headers: { Authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({
            ...baseAppointmentPayload,
            date: form.date,
          }),
        });

        const createdAppointmentId =
          created?.data?.id ||
          created?.data?.data?.id ||
          created?.id ||
          "";

        if (!createdAppointmentId) {
          throw new Error("Nao foi possivel obter o identificador do agendamento salvo.");
        }

        const optimisticEvent = buildDemoAgendaEventFromForm({
          form,
          catalogs,
          appointmentId: createdAppointmentId,
        });

        if (String(form.date) === String(selectedDate)) {
          setAgendaItems((current) =>
            [...current.filter((item) => String(item.id) !== String(createdAppointmentId)), optimisticEvent]
              .map(mergeAgendaPackageMeta),
          );
        }

        setEditor((current) => ({
          ...current,
          isOpen: false,
          saving: false,
          feedback: "",
          appointmentId: "",
        }));

        scheduleAgendaRefresh(async () => {
          await syncAppointmentOccurrence({
            appointmentId: createdAppointmentId,
            occurrenceDate: form.date,
            includePayments: true,
            index: 0,
            shouldReuseOnly: true,
          });
          await loadAgendaData();
        }, (error) => {
          setAgendaFeedback(
            getAgendaSaveErrorMessage(
              error,
              "O agendamento foi salvo, mas a agenda demorou para atualizar.",
            ),
          );
        });
        return;
      }

      for (const [index, occurrenceDate] of occurrenceDates.entries()) {
        await syncAppointmentOccurrence({
          appointmentId: editor.appointmentId && index === 0 ? editor.appointmentId : "",
          occurrenceDate,
          includePayments: index === 0,
          index,
        });
      }

      if (packageEnabled) {
        writeAgendaPackageOccurrences(savedPackageEntries);
      } else {
        removeAgendaPackageOccurrences({
          appointmentIds: [editor.appointmentId],
          packageGroupId: form.packageGroupId || "",
        });
      }

      if (syncWarnings.length) {
        setEditor((current) => ({
          ...current,
          saving: false,
          feedback: syncWarnings[0],
        }));
        return;
      }
      setEditor((current) => ({
        ...current,
        isOpen: false,
        saving: false,
        feedback: "",
      }));
      scheduleAgendaRefresh(loadAgendaData, (error) => {
        setAgendaFeedback(error?.message || "O agendamento foi salvo, mas a agenda demorou para atualizar.");
      });
    } catch (error) {
      setEditor((current) => ({
        ...current,
        saving: false,
        form,
        feedback: getAgendaSaveErrorMessage(
          error,
          "Nao foi possivel salvar o cadastro da agenda.",
        ),
      }));
      return;
    }

    setEditor((current) => ({ ...current, saving: false }));
  }

  const timeSlots = buildHourSlots(
    settings.openingTime,
    settings.closingTime,
    isClinicAgenda ? settings.intervalClinic : settings.intervalAesthetics,
  );
  const visibleAgendaItems = useMemo(
    () => agendaItems.filter((event) => !isAgendaEventFullyPaid(event)),
    [agendaItems],
  );
  const paidAgendaItems = useMemo(
    () =>
      agendaItems
        .filter((event) => isAgendaEventFullyPaid(event))
        .sort((left, right) => String(left.hour || "").localeCompare(String(right.hour || ""))),
    [agendaItems],
  );
  const selectedDateRef = new Date(`${selectedDate}T12:00:00`);
  const selectedDay = Number(selectedDate.split("-")[2]);
  const visibleCalendarDate = new Date(`${visibleAgendaMonth}T12:00:00`);
  const visibleYear = visibleCalendarDate.getFullYear();
  const visibleMonthIndex = visibleCalendarDate.getMonth();
  const visibleCalendarMonth = {
    key: `${visibleYear}-${String(visibleMonthIndex + 1).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(visibleCalendarDate),
    year: visibleYear,
    monthIndex: visibleMonthIndex,
    totalDays: new Date(visibleYear, visibleMonthIndex + 1, 0).getDate(),
    leadingBlanks: visibleCalendarDate.getDay(),
  };

  function moveAgendaCalendarMonth(direction) {
    const nextBase = new Date(visibleYear, visibleMonthIndex + direction, 1);
    setVisibleAgendaMonth(`${nextBase.getFullYear()}-${String(nextBase.getMonth() + 1).padStart(2, "0")}-01`);
  }

  function selectAgendaCalendarDate(monthDate) {
    setSelectedDate(monthDate);
    setVisibleAgendaMonth(`${monthDate.slice(0, 7)}-01`);
  }

  function resetAgendaCalendarToToday() {
    const now = getLocalDateString();
    setSelectedDate(now);
    setVisibleAgendaMonth(`${now.slice(0, 7)}-01`);
  }

  return (
    <div className="agenda-layout">
      <aside className="left-panel">
        <div className="panel-header panel-header-accent">
          <strong>Agenda</strong>
          <span>Hoje</span>
        </div>
        <div className="panel-body agenda-sidebar-stack">
          <section className="agenda-sidebar-card agenda-sidebar-calendar-card">
            <div className="agenda-sidebar-card-head">
              <strong>Calendario</strong>
            </div>
            <div className="calendar-header">
              <button type="button" className="calendar-nav-btn" onClick={() => moveAgendaCalendarMonth(-1)}>
                {"<"}
              </button>
              <span className="calendar-header-main">{visibleCalendarMonth.label} {visibleCalendarMonth.year}</span>
              <button type="button" className="calendar-nav-btn" onClick={() => moveAgendaCalendarMonth(1)}>
                {">"}
              </button>
              <button
                type="button"
                className="calendar-today-btn"
                onClick={resetAgendaCalendarToToday}
              >
                Hoje
              </button>
            </div>
            <div className="calendar-month-block">
              <div className="calendar-grid">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
                  <div key={`${visibleCalendarMonth.key}-${day}`} className="weekday">
                    {day}
                  </div>
                ))}
                {Array.from({ length: visibleCalendarMonth.leadingBlanks }, (_, index) => (
                  <div key={`${visibleCalendarMonth.key}-blank-${index}`} className="day day-empty" />
                ))}
                {Array.from({ length: visibleCalendarMonth.totalDays }, (_, index) => {
                  const day = index + 1;
                  const monthDate = `${visibleCalendarMonth.year}-${String(visibleCalendarMonth.monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayMeta = getCalendarDayMeta(monthDate, selectedDate, settings.workingDays);
                  const dayClassName = [
                    "day",
                    dayMeta.isSelected ? "day-active" : "",
                    !dayMeta.isWorkingDay ? "day-disabled day-off" : "",
                    dayMeta.isHoliday ? "day-holiday" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <button
                      key={`${visibleCalendarMonth.key}-${day}`}
                      type="button"
                      className={dayClassName}
                      onClick={() => {
                        if (dayMeta.isBlocked) return;
                        selectAgendaCalendarDate(monthDate);
                      }}
                      disabled={dayMeta.isBlocked}
                      title={dayMeta.isHoliday ? dayMeta.holidayName : !dayMeta.isWorkingDay ? "Dia fora da escala de trabalho" : ""}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="agenda-sidebar-card agenda-sidebar-sponsored-card">
            <div className="agenda-sidebar-card-head">
              <strong>Patrocinado</strong>
            </div>
            {agendaBanner ? (
              <button
                type="button"
                className="agenda-sidebar-banner agenda-sidebar-banner-image-only"
                onClick={() => {
                  const normalizedLink = resolveExternalLink(agendaBanner.link);
                  if (normalizedLink) {
                    window.open(normalizedLink, "_blank", "noopener,noreferrer");
                  }
                }}
                title={agendaBanner.title || "Banner patrocinado"}
              >
                {agendaBanner.url ? (
                  <img
                    src={agendaBanner.url}
                    alt={agendaBanner.title || "Banner da agenda"}
                    className="agenda-sidebar-banner-image"
                  />
                ) : (
                  <div className="agenda-sidebar-banner-empty-copy">
                    <strong>{agendaBanner.title || "Banner da agenda"}</strong>
                    <span>Envie novamente a imagem no Admin ViaPet.</span>
                  </div>
                )}
              </button>
            ) : (
              <div className="agenda-sidebar-banner agenda-sidebar-banner-empty">
                <div className="agenda-sidebar-banner-label">Espaco patrocinado</div>
                <strong>Area comercial disponivel</strong>
                <span>Suba um banner no Admin ViaPet para anunciar aqui.</span>
              </div>
            )}
          </section>
        </div>
      </aside>

      <main className="center-panel">
        <AgendaTabbar activeTab={activeTab} />

        <section className="agenda-board">
          <div className="agenda-toolbar">
            <div className="toolbar-group">
              {isClinicAgenda ? (
                <>
                  <button type="button" className="soft-btn" onClick={() => openNewEditor(timeSlots[0] || "08:00")}>
                    Novo Evento
                  </button>
                  <NavLink to="/receita?origem=clinica" className="soft-btn toolbar-link">
                    Receita
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/agenda/motorista" className="soft-btn toolbar-link">
                    Motorista
                  </NavLink>
                  <NavLink to="/agenda/banho-tosa" className="soft-btn toolbar-link">
                    Banho e tosa
                  </NavLink>
                </>
              )}
            </div>
            <div className="toolbar-group">
              <div className="soft-counter">{agendaItems.length} cadastros</div>
              <button type="button" className="soft-counter" onClick={() => window.print()}>
                Imprimir
              </button>
            </div>
          </div>

          {agendaFeedback ? <div className="registers-feedback">{agendaFeedback}</div> : null}

          <div className="timeline">
            <div className="timeline-head">
              <div>Hora</div>
              <div>{formatAgendaHeaderDate(selectedDate)}</div>
            </div>

            {loadingAgenda ? <div className="timeline-loading">Carregando agenda...</div> : null}

            {timeSlots.flatMap((slot) => {
              const slotEvents = visibleAgendaItems.filter((event) => event.hour === slot);
              const isEmpty = slotEvents.length === 0;

              if (isEmpty) {
                return (
                  <div key={slot} className="timeline-slot timeline-slot-empty">
                    <div className="timeline-hour">{slot}</div>
                    <div className="timeline-card">
                      <button className="agenda-new-button" onClick={() => openNewEditor(slot)}>
                        Novo Cadastro
                      </button>
                    </div>
                  </div>
                );
              }

              return slotEvents.map((event, index) => {
                const serviceStatus = getAgendaStatusMeta(event.status);
                const isCompleted = isAgendaServiceCompleted(event.status);
                const isFullyPaid = isAgendaEventFullyPaid(event);
                const packageProgress = getAgendaPackageProgress(agendaItems, event);
                const saleLines = Array.isArray(event.saleLines) && event.saleLines.length
                  ? event.saleLines
                  : (event.tags || []).map((description) => ({ description, total: 0 }));
                return (
                  <div key={`${slot}-${event.id}`} className="timeline-slot timeline-slot-grouped">
                    <div className="timeline-hour">{slot}</div>
                    <div className="timeline-card">
                      <div className="agenda-slot-stack">
                        {index === 0 ? (
                          <button className="agenda-new-button agenda-new-button-inline" onClick={() => openNewEditor(slot)}>
                            Novo Cadastro
                          </button>
                        ) : null}
                        <div
                          className={packageProgress.isNextPending && !isCompleted ? "agenda-existing-card agenda-existing-card-next-package" : "agenda-existing-card"}
                          onClick={() => openExistingEditor(event)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="agenda-card-top">
                            <div className="agenda-card-main">
                              <div className="agenda-card-title-row">
                                <div className="event-title">
                                  {event.pet} ({event.owner}) {event.breed}
                                </div>
                                <div className="agenda-card-icons" onClick={(eventClick) => eventClick.stopPropagation()}>
                                  <button
                                    type="button"
                                    className="agenda-mini-icon"
                                    aria-label={`Historico de ${event.owner}`}
                                    onClick={() => openCustomerHistory(event)}
                                  >
                                    <SearchMiniIcon className="crm-conversation-whatsapp-icon" />
                                  </button>
                                  <button
                                    type="button"
                                    className="agenda-mini-icon"
                                    aria-label={`WhatsApp de ${event.owner}`}
                                    onClick={() => openCustomerWhatsapp(event)}
                                  >
                                    <WhatsappMiniIcon className="crm-conversation-whatsapp-icon" />
                                  </button>
                                </div>
                              </div>
                              <div className="event-note">{event.note}</div>
                              <div className="agenda-card-tag-line">
                                {event.tags.slice(0, 1).map((tag) => (
                                  <span key={`${event.id}-${tag}`} className="badge badge-green">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="agenda-card-side">
                              <div className="agenda-card-status-picker" onClick={(eventClick) => eventClick.stopPropagation()}>
                                <button
                                  type="button"
                                  className="badge agenda-status-badge agenda-card-status-trigger"
                                  style={{ background: serviceStatus.background, color: serviceStatus.color }}
                                  onClick={() => setStatusMenuEventId((current) => (String(current) === String(event.id) ? "" : String(event.id)))}
                                >
                                  {serviceStatus.label}
                                </button>
                                {String(statusMenuEventId) === String(event.id) ? (
                                  <div className="agenda-card-status-menu">
                                    {getAgendaStatusOptions().map((statusOption) => (
                                      <button
                                        key={`${event.id}-${statusOption.key}`}
                                        type="button"
                                        className="agenda-card-status-option"
                                        onClick={() => updateAgendaEventStatus(event, statusOption.key)}
                                      >
                                        <span
                                          className="agenda-card-status-option-pill"
                                          style={{ background: statusOption.background, color: statusOption.color }}
                                        >
                                          {statusOption.label}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              <div className="agenda-card-responsible" onClick={(eventClick) => eventClick.stopPropagation()}>
                                <button
                                  type="button"
                                  className="agenda-card-handler-name agenda-card-handler-btn"
                                  onClick={async () => {
                                    await ensureAgendaResponsibles().catch(() => []);
                                    setResponsibleMenuEventId((current) => (String(current) === String(event.id) ? "" : String(event.id)));
                                  }}
                                >
                                  {event.sellerName || "Sem responsavel"}
                                </button>
                                {String(responsibleMenuEventId) === String(event.id) ? (
                                  <select
                                    className="agenda-card-responsible-select"
                                    value={String(event.responsibleId || "")}
                                    onChange={(eventChange) => updateAgendaEventResponsible(event, eventChange.target.value)}
                                  >
                                    <option value="">Sem responsavel</option>
                                    {responsibleOptions.map((item) => (
                                      <option key={`${event.id}-${item.value}`} value={item.value}>
                                        {item.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : null}
                              </div>
                              {isCompleted ? <span className="agenda-card-completed">Feito</span> : null}
                            </div>
                          </div>
                          <div className="agenda-card-bottom">
                            <div className="agenda-card-sale">
                              <span className="badge badge-orange">Venda {event.id}</span>
                              {event.packageTotal > 1 ? (
                                <span className="badge badge-package">Pacote {event.packageIndex || 1}/{event.packageTotal}</span>
                              ) : null}
                              {packageProgress.isNextPending && !isCompleted ? (
                                <span className="badge badge-next-package">Proximo</span>
                              ) : null}
                              <div className="agenda-card-sale-lines">
                                {event.packageTotal > 1 ? (
                                  <div className="agenda-package-progress-line">
                                    Concluidos {packageProgress.completedCount}/{event.packageTotal}
                                  </div>
                                ) : null}
                                {saleLines.map((line, saleLineIndex) => (
                                  <div key={`${event.id}-${line.description}-${saleLineIndex}`}>
                                    {line.description || "Servico"} {line.total > 0 ? formatCurrencyBr(line.total) : ""}
                                  </div>
                                ))}
                                {event.amount > 0 && saleLines.length > 1 ? (
                                  <div className="agenda-card-sale-total">Total da comanda {formatCurrencyBr(event.amount)}</div>
                                ) : null}
                              </div>
                            </div>
                            <div className="agenda-card-payment">
                              <span className="badge badge-purple">Pagamento</span>
                              <div className="payment-lines">
                                {isFullyPaid ? <div className="agenda-card-paid-indicator">✓ Pago</div> : null}
                                {event.payments.length ? event.payments.map((payment) => <div key={`${event.id}-${payment}`}>{payment}</div>) : <div>Pagamento ainda nao registrado.</div>}
                                {event.amount > 0 ? <div className="agenda-card-payment-total">Total da comanda {formatCurrencyBr(event.amount)}</div> : null}
                                {event.financeStatus === "parcial" && event.outstandingAmount > 0 ? (
                                  <div className="agenda-card-remaining">Falta pagar {formatCurrencyBr(event.outstandingAmount)}</div>
                                ) : null}
                                {event.customerOutstandingAmount > 0 ? (
                                  <div className="agenda-card-history-balance">Historico em aberto {formatCurrencyBr(event.customerOutstandingAmount)}</div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })}
          </div>

          {paidAgendaItems.length ? (
            <section className="agenda-paid-section">
              <div className="agenda-paid-section-head">
                <div>
                  <h3>Pagos do dia</h3>
                  <p>{paidAgendaItems.length} {paidAgendaItems.length === 1 ? "lancamento quitado" : "lancamentos quitados"}</p>
                </div>
                <span className="badge badge-paid">✓ Pago</span>
              </div>
              <div className="agenda-paid-list">
                {paidAgendaItems.map((event) => {
                  const packageProgress = getAgendaPackageProgress(agendaItems, event);
                  const saleLines = Array.isArray(event.saleLines) && event.saleLines.length
                    ? event.saleLines
                    : (event.tags || []).map((description) => ({ description, total: 0 }));
                  return (
                    <button
                      key={`paid-${event.id}`}
                      type="button"
                      className="agenda-paid-card"
                      onClick={() => openExistingEditor(event)}
                    >
                      <div className="agenda-paid-card-top">
                        <div className="agenda-paid-card-hour">{event.hour}</div>
                        <div className="agenda-paid-card-main">
                          <strong>{event.pet} ({event.owner})</strong>
                          <span>{event.note}</span>
                        </div>
                        <div className="agenda-paid-card-status">✓ Pago</div>
                      </div>
                      <div className="agenda-paid-card-meta">
                        {(event.tags || []).slice(0, 1).map((tag) => (
                          <span key={`paid-tag-${event.id}-${tag}`} className="badge badge-green">
                            {tag}
                          </span>
                        ))}
                        {event.packageTotal > 1 ? (
                          <span className="badge badge-package">Pacote {event.packageIndex || 1}/{event.packageTotal}</span>
                        ) : null}
                        {packageProgress.isNextPending ? (
                          <span className="badge badge-next-package">Proximo</span>
                        ) : null}
                      </div>
                      <div className="agenda-paid-card-lines">
                        {saleLines.map((line, saleLineIndex) => (
                          <div key={`paid-line-${event.id}-${saleLineIndex}`}>
                            {line.description || "Servico"} {line.total > 0 ? formatCurrencyBr(line.total) : ""}
                          </div>
                        ))}
                        {event.payments.length ? (
                          <div className="agenda-paid-card-payment-line">{event.payments[0]}</div>
                        ) : null}
                        {event.amount > 0 ? (
                          <div className="agenda-card-payment-total">Total da comanda {formatCurrencyBr(event.amount)}</div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
          <PrintSignatureFooter />
        </section>
      </main>

      {editor.isOpen ? (
        <AgendaAppointmentModal
          editor={editor}
          customers={catalogs.customers}
          pets={catalogs.pets}
          services={catalogs.services}
          products={catalogs.products || []}
          responsibleOptions={responsibleOptions}
          onClose={closeEditor}
          onFieldChange={updateEditorField}
          onItemChange={updateEditorItemRow}
          onAddItem={addEditorItemRow}
          onRemoveItem={removeEditorItemRow}
          onPaymentChange={updateEditorPaymentRow}
          onAddPayment={addEditorPaymentRow}
          onRemovePayment={removeEditorPaymentRow}
          onSave={saveAppointmentFromEditor}
          onDelete={deleteAppointmentFromEditor}
        />
      ) : null}

      <CustomerHistoryModal
        historyState={historyState}
        onClose={closeCustomerHistory}
        onOpenCustomerRegister={openCustomerRegisterFromHistory}
        onOpenCustomerMessages={openCustomerMessagesFromHistory}
        onOpenCustomerSalesHistory={openCustomerSalesHistoryFromHistory}
      />
    </div>
  );
}

function PrintSignatureFooter() {
  const accountSettings = readAccountSettings();
  const signatureUrl = accountSettings?.electronicSignatureUrl || "";
  const signatureName = accountSettings?.electronicSignatureName || "";

  if (!signatureUrl && !signatureName) {
    return null;
  }

  return (
    <div className="print-signature-footer">
      <div className="print-signature-box">
        {signatureUrl ? (
          <img className="print-signature-image" src={signatureUrl} alt="Assinatura eletronica" />
        ) : (
          <div className="print-signature-spacer" />
        )}
        <div className="print-signature-line" />
        <div className="print-signature-name">{signatureName || "Assinatura autorizada"}</div>
      </div>
    </div>
  );
}

function PrescriptionPrintPage() {
  const location = useLocation();
  const accountSettings = readAccountSettings();
  const params = new URLSearchParams(location.search);
  const origin = String(params.get("origem") || "geral").toLowerCase();
  const originLabelMap = {
    clinica: "Clinica",
    internacao: "Internacao",
    exames: "Exames",
    geral: "Sistema",
  };
  const originLabel = originLabelMap[origin] || "Sistema";
  const storeName = accountSettings.establishmentName || accountSettings.name || "ViaPet";
  const today = getLocalDateString();
  const [form, setForm] = useState({
    date: today,
    patientName: "",
    tutorName: "",
    veterinarianName: accountSettings.electronicSignatureName || "",
    documentTitle: origin === "exames" ? "Solicitacao / Receita" : "Receita",
    medication: "",
    dosage: "",
    treatmentTime: "",
    guidance: "",
    notes: "",
  });

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <section className="print-page prescription-page">
      <div className="print-toolbar">
        <div>
          <span className="section-kicker">{originLabel}</span>
          <h2>{form.documentTitle}</h2>
        </div>
        <div className="print-actions">
          <NavLink to={origin === "clinica" ? "/agenda/clinica" : origin === "internacao" ? "/internacao" : origin === "exames" ? "/exames" : "/dashboard"} className="ghost-btn toolbar-link print-link">
            Voltar
          </NavLink>
          <button className="soft-btn" type="button" onClick={() => window.print()}>
            Imprimir receita
          </button>
        </div>
      </div>

      <div className="prescription-sheet">
        <div className="prescription-brand">
          {accountSettings.logoUrl ? (
            <div className="prescription-brand-logo">
              <img src={accountSettings.logoUrl} alt={storeName} />
            </div>
          ) : null}
          <div className="prescription-brand-copy">
            <span className="section-kicker">{originLabel}</span>
            <h3>{storeName}</h3>
            <p>{form.documentTitle || "Receita Veterinaria"}</p>
          </div>
        </div>

        <div className="prescription-grid">
          <EditableField label="Data" value={form.date} onChange={(value) => updateField("date", value)} />
          <EditableField label="Paciente / Pet" value={form.patientName} onChange={(value) => updateField("patientName", value)} />
          <EditableField label="Tutor / Responsavel" value={form.tutorName} onChange={(value) => updateField("tutorName", value)} />
          <EditableField label="Veterinario / Responsavel" value={form.veterinarianName} onChange={(value) => updateField("veterinarianName", value)} />
        </div>

        <div className="prescription-grid prescription-grid-single">
          <EditableField label="Titulo do documento" value={form.documentTitle} onChange={(value) => updateField("documentTitle", value)} />
        </div>

        <div className="prescription-section-title">Prescricao</div>

        <div className="prescription-grid prescription-grid-triple">
          <EditableField label="Medicacao" value={form.medication} onChange={(value) => updateField("medication", value)} />
          <EditableField label="Dosagem" value={form.dosage} onChange={(value) => updateField("dosage", value)} />
          <EditableField label="Tempo de uso" value={form.treatmentTime} onChange={(value) => updateField("treatmentTime", value)} />
        </div>

        <div className="prescription-grid prescription-grid-single">
          <EditableTextArea
            label="Orientacoes"
            value={form.guidance}
            onChange={(value) => updateField("guidance", value)}
            placeholder="Explique como usar, horarios, cuidados e observacoes importantes."
          />
        </div>

        <div className="prescription-grid prescription-grid-single">
          <EditableTextArea
            label="Observacoes adicionais"
            value={form.notes}
            onChange={(value) => updateField("notes", value)}
            placeholder="Informacoes extras para o tutor ou para o prontuario."
          />
        </div>

        <PrintSignatureFooter />
      </div>
    </section>
  );
}

function DriverRoutePageConnected() {
  const auth = useAuth();
  const [feedback, setFeedback] = useState("");
  const [rows, setRows] = useState(driverAgendaList);
  const [recipientMenuOpen, setRecipientMenuOpen] = useState(false);
  const selectedDate = getLocalDateString();
  const [newDriverRecipient, setNewDriverRecipient] = useState("");
  const [driverWhatsappRecipients, setDriverWhatsappRecipients] = useState(() => {
    try {
      const accountSettings = JSON.parse(localStorage.getItem("viapet.settings.account") || "{}");
      return String(accountSettings.driverWhatsappRecipients || "")
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  });

  function buildDriverShareText() {
    const header = `Lista do Motorista - ${formatAgendaHeaderDate(selectedDate)}`;
    const lines = rows.map((item) => `${item.hour} | ${item.tutor} | ${item.pet} | ${item.address}`);
    return [header, ...lines].join("\n");
  }

  function buildDriverChecklistRows(baseRows) {
    const deliveryState = readDriverDeliveryState(selectedDate);
    return baseRows.map((item) => ({
      ...item,
      deliveredChecked: Boolean(deliveryState[item.id]),
    }));
  }

  function persistDriverChecklist(nextRows) {
    const nextState = nextRows.reduce((accumulator, item) => {
      if (item.deliveredChecked) {
        accumulator[item.id] = true;
      }
      return accumulator;
    }, {});
    writeDriverDeliveryState(selectedDate, nextState);
    setRows(nextRows);
  }

  function toggleDriverDelivered(rowId) {
    persistDriverChecklist(
      rows.map((item) =>
        String(item.id) === String(rowId)
          ? { ...item, deliveredChecked: !item.deliveredChecked }
          : item,
      ),
    );
  }

  function handleSendDriverWhatsapp(phone) {
    const normalized = String(phone || "").replace(/\D/g, "");
    if (!normalized) {
      setFeedback("Cadastre um numero valido em Configuracao > Conta.");
      return;
    }
    const sharedLink = buildDriverShareLink(rows, selectedDate);
    const message = `Lista do motorista - ${formatAgendaHeaderDate(selectedDate)}\n${sharedLink}`;
    const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setRecipientMenuOpen(false);
  }

  async function syncDriverWhatsappRecipients(nextRecipients) {
    const mergedSettings = normalizeAccountSettings({
      ...readAccountSettings(),
      driverWhatsappRecipients: nextRecipients.join("\n"),
    }, auth.user);
    writeAccountSettings(mergedSettings);

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      return;
    }

    await apiRequest("/settings/account", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({
        establishmentName: mergedSettings.establishmentName,
        naming: mergedSettings.naming,
        contactEmail: mergedSettings.contactEmail,
        contactPhone: mergedSettings.contactPhone,
        driverWhatsappRecipients: mergedSettings.driverWhatsappRecipients,
      }),
    });
  }

  async function handleAddDriverWhatsappRecipient() {
    const normalized = String(newDriverRecipient || "").replace(/\D/g, "");
    if (!normalized) {
      setFeedback("Digite um numero valido para envio.");
      return;
    }
    if (driverWhatsappRecipients.includes(normalized)) {
      setFeedback("Esse numero ja esta cadastrado.");
      return;
    }
    const nextRecipients = [...driverWhatsappRecipients, normalized];
    setDriverWhatsappRecipients(nextRecipients);
    setNewDriverRecipient("");
    try {
      await syncDriverWhatsappRecipients(nextRecipients);
      setFeedback("Numero salvo para envio rapido no WhatsApp.");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar o numero para envio.");
    }
  }

  async function handleRemoveDriverWhatsappRecipient(phone) {
    const nextRecipients = driverWhatsappRecipients.filter((item) => item !== phone);
    setDriverWhatsappRecipients(nextRecipients);
    try {
      await syncDriverWhatsappRecipients(nextRecipients);
      setFeedback("Numero removido da lista de envio.");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel remover o numero da lista.");
    }
  }

  useEffect(() => {
    let active = true;

    async function loadDriverAgenda() {
      try {
        if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
          const demoCatalogs = getAgendaDemoCatalogs();
          const demoAgenda = buildDemoAgendaItemsForDate(selectedDate, demoCatalogs);
          if (active) {
            setRows(buildDriverChecklistRows(buildDriverRowsFromAgendaItems(demoAgenda)));
          }
          if (auth.token === DEMO_AUTH_TOKEN) {
            setFeedback("Agenda do motorista em modo demonstracao local.");
          }
          return;
        }

        const response = await apiRequest("/appointments", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        if (!active) return;

        const mapped = (response?.data || [])
          .filter((item) => item.driverId || item.driver || String(item.type || "").toLowerCase().includes("taxi") || String(item.description || "").toLowerCase().includes("retirada"))
          .map((item) => ({
            id: item.id,
            hour: item.time || item.hour || "--:--",
            tutor: item?.Custumer?.name || item.customerName || "Tutor nao informado",
            pet: item?.Pet?.name || item.petName || "Pet nao informado",
            address: item?.Custumer?.address || item.customerAddress || "Endereco nao informado",
            completed: isAgendaServiceCompleted(item.status),
          }));

        setRows(buildDriverChecklistRows(mapped.length ? mapped : buildDriverRowsFromAgendaItems(buildDemoAgendaItemsForDate(selectedDate, getAgendaDemoCatalogs()))));
      } catch (error) {
        if (!active) return;
        setFeedback(`${error.message || "Nao foi possivel carregar a agenda do motorista."} Exibindo demonstracao local.`);
        setRows(buildDriverChecklistRows(buildDriverRowsFromAgendaItems(buildDemoAgendaItemsForDate(selectedDate, getAgendaDemoCatalogs()))));
      }
    }

    loadDriverAgenda();

    return () => {
      active = false;
    };
    }, [auth.token, selectedDate]);

  return (
    <section className="print-page">
      <div className="print-toolbar">
        <div>
          <span className="section-kicker">Agenda do motorista</span>
          <h2>Rotas de retirada e entrega</h2>
        </div>
        <div className="print-actions">
          <NavLink to="/agenda" className="ghost-btn toolbar-link print-link">
            Voltar para agenda
          </NavLink>
          <div className="bath-share-wrap">
            <button className="soft-btn" type="button" onClick={() => setRecipientMenuOpen((current) => !current)}>
              Enviar link WhatsApp
            </button>
            {recipientMenuOpen ? (
              <div className="bath-share-menu">
                <div className="driver-recipient-inline-form">
                  <input
                    type="text"
                    className="driver-recipient-inline-input"
                    placeholder="Cadastrar numero"
                    value={newDriverRecipient}
                    onChange={(event) => setNewDriverRecipient(event.target.value)}
                  />
                  <button type="button" className="bath-share-option driver-recipient-save-btn" onClick={handleAddDriverWhatsappRecipient}>
                    Salvar
                  </button>
                </div>
                {driverWhatsappRecipients.length ? (
                  driverWhatsappRecipients.map((phone) => (
                    <div key={phone} className="driver-recipient-row">
                      <button type="button" className="bath-share-option driver-recipient-send-btn" onClick={() => handleSendDriverWhatsapp(phone)}>
                        {phone}
                      </button>
                      <button type="button" className="driver-recipient-remove-btn" onClick={() => handleRemoveDriverWhatsappRecipient(phone)} aria-label={`Excluir ${phone}`}>
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <button type="button" className="bath-share-option" onClick={() => setFeedback("Cadastre os numeros em Configuracao > Conta.")}>
                    Nenhum numero cadastrado
                  </button>
                )}
              </div>
            ) : null}
          </div>
          <button className="soft-btn" onClick={() => window.print()}>
            Imprimir lista
          </button>
        </div>
      </div>

      <div className="print-meta">
          <span>Data: {formatAgendaHeaderDate(selectedDate)}</span>
          <span>{rows.length} agendamentos com transporte</span>
        </div>

      {feedback ? <div className="registers-feedback">{feedback}</div> : null}

      <div className="print-table-wrap">
        <div className="print-table print-driver-grid print-head">
          <div className="driver-check-col no-print">OK</div>
          <div>Horario</div>
          <div>Tutor</div>
          <div>Pet</div>
          <div>Endereco</div>
        </div>

      {rows.map((item) => (
          <div key={item.id} className={item.deliveredChecked ? "print-table print-driver-grid print-driver-row-done" : "print-table print-driver-grid"}>
            <div className="driver-check-col no-print">
              <input type="checkbox" checked={Boolean(item.deliveredChecked)} onChange={() => toggleDriverDelivered(item.id)} />
            </div>
            <div>{item.hour}</div>
            <div>{item.tutor}</div>
            <div>{item.pet}</div>
            <div>{item.address}</div>
          </div>
        ))}
      </div>
      <PrintSignatureFooter />
    </section>
  );
}

function SharedDriverChecklistPage() {
  const location = useLocation();
  const sharedPayload = parseDriverShareLinkPayload(location.search);
  const [rows, setRows] = useState(
    (sharedPayload?.rows || []).map((item) => ({
      ...item,
      deliveredChecked: false,
    })),
  );

  function toggleSharedDelivered(rowId) {
    setRows((current) =>
      current.map((item) =>
        String(item.id) === String(rowId)
          ? { ...item, deliveredChecked: !item.deliveredChecked }
          : item,
      ),
    );
  }

  return (
    <section className="print-page shared-driver-page">
      <div className="print-toolbar">
        <div>
          <span className="section-kicker">Checklist do motorista</span>
          <h2>Lista compartilhada de entregas</h2>
        </div>
      </div>

      <div className="print-meta">
        <span>Data: {formatAgendaHeaderDate(sharedPayload?.date || getLocalDateString())}</span>
        <span>{rows.length} entregas</span>
      </div>

      <div className="print-table-wrap">
        <div className="print-table print-driver-grid print-head">
          <div className="driver-check-col">OK</div>
          <div>Horario</div>
          <div>Tutor</div>
          <div>Pet</div>
          <div>Endereco</div>
        </div>

      {rows.map((item) => (
          <div key={item.id} className={item.deliveredChecked ? "print-table print-driver-grid print-driver-row-done" : "print-table print-driver-grid"}>
            <div className="driver-check-col">
              <input type="checkbox" checked={Boolean(item.deliveredChecked)} onChange={() => toggleSharedDelivered(item.id)} />
            </div>
            <div>{item.hour}</div>
            <div>{item.tutor}</div>
            <div>{item.pet}</div>
            <button type="button" className="driver-address-btn" onClick={() => toggleSharedDelivered(item.id)}>
              {item.address}
            </button>
          </div>
        ))}
      </div>
      <PrintSignatureFooter />
    </section>
  );
}

function BathSchedulePageConnected() {
  const auth = useAuth();
  const [feedback, setFeedback] = useState("");
  const [rows, setRows] = useState(bathAgendaList);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const selectedDate = getLocalDateString();

  function buildBathShareText() {
    const header = `Lista de Banho e Tosa - ${formatAgendaHeaderDate(selectedDate)}`;
    const lines = rows.map(
      (item) =>
        `${item.hour} | ${item.pet} | ${item.service} | ${item.note} | Responsavel: ${item.sellerName || "-"} | ${item.completed ? "Feito" : "Pendente"}`,
    );
    return [header, ...lines].join("\n");
  }

  async function handleShareBathList(mode) {
    const shareText = buildBathShareText();
    if (mode === "copy") {
      await navigator.clipboard.writeText(shareText);
      setFeedback("Lista copiada para a area de transferencia.");
      setShareMenuOpen(false);
      return;
    }
    if (mode === "whatsapp") {
      const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setShareMenuOpen(false);
      return;
    }
    if (mode === "system") {
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Lista de Banho e Tosa",
            text: shareText,
          });
        } catch {}
      } else {
        setFeedback("Seu navegador nao oferece compartilhamento direto. Use Copiar ou WhatsApp.");
      }
      setShareMenuOpen(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadBathAgenda() {
      try {
        if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
          const demoCatalogs = getAgendaDemoCatalogs();
          const demoAgenda = buildDemoAgendaItemsForDate(selectedDate, demoCatalogs);
          if (active) {
            setRows(buildBathRowsFromAgendaItems(demoAgenda));
          }
          if (auth.token === DEMO_AUTH_TOKEN) {
            setFeedback("Banho e tosa em modo demonstracao local.");
          }
          return;
        }

        const response = await apiRequest("/appointments", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        if (!active) return;

          const mapped = (response?.data || [])
            .filter((item) => {
              const serviceName = item?.Service?.name || "";
              const typeName = item.type || "";
              return /banho|tosa|estetica/i.test(`${serviceName} ${typeName}`);
            })
            .map((item) => ({
              id: item.id,
              hour: item.time || item.hour || "--:--",
              pet: item?.Pet?.name || item.petName || "Pet nao informado",
              service: item?.Service?.name || item.serviceName || item.type || "Servico nao informado",
              note: item.observation || item.description || "-",
              sellerName: item.sellerName || item.responsibleName || "-",
              completed: isAgendaServiceCompleted(item.status),
            }));

        setRows(mapped.length ? mapped : buildBathRowsFromAgendaItems(buildDemoAgendaItemsForDate(selectedDate, getAgendaDemoCatalogs())));
      } catch (error) {
        if (!active) return;
        setFeedback(`${error.message || "Nao foi possivel carregar banho e tosa."} Exibindo demonstracao local.`);
        setRows(buildBathRowsFromAgendaItems(buildDemoAgendaItemsForDate(selectedDate, getAgendaDemoCatalogs())));
      }
    }

    loadBathAgenda();

    return () => {
      active = false;
    };
    }, [auth.token, selectedDate]);

  return (
    <section className="print-page">
      <div className="print-toolbar">
        <div>
          <span className="section-kicker">Agenda de banho e tosa</span>
          <h2>Pets agendados do dia</h2>
        </div>
        <div className="print-actions">
          <NavLink to="/agenda" className="ghost-btn toolbar-link print-link">
            Voltar para agenda
          </NavLink>
          <div className="bath-share-wrap">
            <button className="soft-btn" type="button" onClick={() => setShareMenuOpen((current) => !current)}>
              Compartilhar lista
            </button>
            {shareMenuOpen ? (
              <div className="bath-share-menu">
                <button type="button" className="bath-share-option" onClick={() => handleShareBathList("system")}>
                  Compartilhar
                </button>
                <button type="button" className="bath-share-option" onClick={() => handleShareBathList("whatsapp")}>
                  WhatsApp
                </button>
                <button type="button" className="bath-share-option" onClick={() => handleShareBathList("copy")}>
                  Copiar texto
                </button>
              </div>
            ) : null}
          </div>
          <button className="soft-btn" onClick={() => window.print()}>
            Imprimir lista
          </button>
        </div>
      </div>

      <div className="print-meta">
          <span>Data: {formatAgendaHeaderDate(selectedDate)}</span>
          <span>{rows.length} pets no banho e tosa</span>
        </div>

      {feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="print-table-wrap">
          <div className="print-table print-bath-grid print-head">
            <div>Horario</div>
            <div>Pet</div>
            <div>Servico</div>
            <div>Observacao</div>
            <div>Responsavel</div>
            <div>Status</div>
          </div>

          {rows.map((item) => (
            <div key={item.id} className={item.completed ? "print-table print-bath-grid print-bath-row-done" : "print-table print-bath-grid"}>
              <div>{item.hour}</div>
              <div>{item.pet}</div>
              <div>{item.service}</div>
              <div>{item.note}</div>
              <div>{item.sellerName || "-"}</div>
              <div>{item.completed ? <span className="bath-done-badge">Feito</span> : "-"}</div>
            </div>
          ))}
        </div>
      <PrintSignatureFooter />
    </section>
  );
}

function FinancePage() {
  const auth = useAuth();
  const financeData = useFinanceModuleData();
  const [deleteFeedback, setDeleteFeedback] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });

  function requestDeleteSale(row) {
    setDeleteFeedback("");
    setDeleteDialog({ open: true, row });
  }

  function closeDeleteSaleDialog() {
    if (deleteSubmitting) return;
    setDeleteDialog({ open: false, row: null });
  }

  async function confirmDeleteSale() {
    if (!deleteDialog.row?.id) {
      setDeleteFeedback("Nao foi possivel identificar a venda para exclusao.");
      setDeleteDialog({ open: false, row: null });
      return;
    }

    if (auth.token === DEMO_AUTH_TOKEN) {
      setDeleteFeedback("Modo demonstracao: a exclusao de venda nao altera os dados locais.");
      setDeleteDialog({ open: false, row: null });
      return;
    }

    try {
      setDeleteSubmitting(true);
      await apiRequest(`/sales/${deleteDialog.row.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setDeleteFeedback("Venda excluida com sucesso.");
      setDeleteDialog({ open: false, row: null });
      financeData.reload?.();
    } catch (error) {
      setDeleteFeedback(error.message || "Nao foi possivel excluir a venda.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <FinanceSalesView
      financeData={{
        ...financeData,
        feedback: deleteFeedback || financeData.feedback,
        deleteDialog,
        deleteSubmitting,
        deleteTargetLabel: deleteDialog.row?.sale || deleteDialog.row?.customer || "esta venda",
        deleteTargetType: "venda",
        onRequestDeleteSale: requestDeleteSale,
        onCancelDelete: closeDeleteSaleDialog,
        onConfirmDelete: confirmDeleteSale,
      }}
    />
  );
}

function FinancePurchasesPage() {
  return <FinancePurchasesContent showModal={false} />;
}

function FinancePurchaseNewPage() {
  return <FinancePurchasesContent showModal />;
}

function FinancePurchasesContent({ showModal }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const financeData = useFinanceModuleData();
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [form, setForm] = useState({
    date: "2026-03-26",
    description: "",
    value: "",
  });

  async function handlePurchaseSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!form.date || !form.description || !form.value) {
      setFeedback("Preencha data, descricao e valor.");
      return;
    }

    if (auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("Modo demonstracao: a compra nao e enviada ao backend.");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest("/finance", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          type: "saida",
          description: form.description,
          amount: Number(String(form.value).replace(",", ".")),
          date: form.date,
          dueDate: form.date,
          category: "Compras",
          subCategory: "Operacional",
          expenseType: "variavel",
          frequency: "unico",
          paymentMethod: "Nao informado",
          status: "pendente",
        }),
      });

      navigate("/financeiro/compras");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar a compra.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function requestDeletePurchase(row) {
    setFeedback("");
    setDeleteDialog({ open: true, row });
  }

  function closeDeletePurchaseDialog() {
    if (deleteSubmitting) return;
    setDeleteDialog({ open: false, row: null });
  }

  async function confirmDeletePurchase() {
    if (!deleteDialog.row?.id) {
      setFeedback("Nao foi possivel identificar a compra para exclusao.");
      setDeleteDialog({ open: false, row: null });
      return;
    }

    if (auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("Modo demonstracao: a exclusao de compra nao altera os dados locais.");
      setDeleteDialog({ open: false, row: null });
      return;
    }

    try {
      setDeleteSubmitting(true);
      await apiRequest(`/finance/${deleteDialog.row.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setFeedback("Compra excluida com sucesso.");
      setDeleteDialog({ open: false, row: null });
      financeData.reload?.();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel excluir a compra.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <FinancePurchasesView
      showModal={showModal}
      financeData={{
        ...financeData,
        deleteDialog,
        deleteSubmitting,
        deleteTargetLabel: deleteDialog.row?.description || "esta compra",
        deleteTargetType: "compra",
        onRequestDeletePurchase: requestDeletePurchase,
        onCancelDelete: closeDeletePurchaseDialog,
        onConfirmDelete: confirmDeletePurchase,
      }}
      feedback={feedback}
      isSubmitting={isSubmitting}
      form={form}
      setForm={setForm}
      handlePurchaseSubmit={handlePurchaseSubmit}
    />
  );
}

function FinancePaymentsPage() {
  const auth = useAuth();
  const financeData = useFinanceModuleData();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [paymentForm, setPaymentForm] = useState({
    date: "2026-03-26",
    description: "Lancamento financeiro",
    value: "",
    paymentMethod: "pix",
  });

  async function handleSubmitPayment(event) {
    event.preventDefault();
    setPaymentFeedback("");

    if (!paymentForm.date || !paymentForm.description || !paymentForm.value) {
      setPaymentFeedback("Preencha data, descricao e valor do pagamento.");
      return;
    }

    if (auth.token === DEMO_AUTH_TOKEN) {
      setPaymentFeedback("Modo demonstracao: pagamento registrado localmente.");
      setShowPaymentModal(false);
      return;
    }

    try {
      setPaymentSubmitting(true);
      await apiRequest("/finance", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          type: "entrada",
          description: paymentForm.description,
          amount: Number(String(paymentForm.value).replace(",", ".")),
          date: paymentForm.date,
          dueDate: paymentForm.date,
          category: "Pagamentos",
          subCategory: "Financeiro",
          expenseType: "variavel",
          frequency: "unico",
          paymentMethod: paymentForm.paymentMethod,
          status: "pago",
        }),
      });
      setPaymentFeedback("Pagamento registrado com sucesso.");
      setShowPaymentModal(false);
    } catch (error) {
      setPaymentFeedback(error.message || "Nao foi possivel registrar o pagamento.");
    } finally {
      setPaymentSubmitting(false);
    }
  }

  function requestDeletePayment(paymentRow) {
    setPaymentFeedback("");
    setDeleteDialog({ open: true, row: paymentRow });
  }

  function closeDeletePaymentDialog() {
    if (deleteSubmitting) return;
    setDeleteDialog({ open: false, row: null });
  }

  async function confirmDeletePayment() {
    if (!deleteDialog.row?.id) {
      setPaymentFeedback("Nao foi possivel identificar o pagamento para exclusao.");
      setDeleteDialog({ open: false, row: null });
      return;
    }

    if (auth.token === DEMO_AUTH_TOKEN) {
      setPaymentFeedback("Modo demonstracao: a exclusao de pagamento nao altera os dados locais.");
      setDeleteDialog({ open: false, row: null });
      return;
    }

    try {
      setDeleteSubmitting(true);
      setPaymentFeedback("");
      await apiRequest(`/finance/${deleteDialog.row.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setPaymentFeedback("Pagamento excluido com sucesso.");
      setDeleteDialog({ open: false, row: null });
      financeData.reload?.();
    } catch (error) {
      setPaymentFeedback(error.message || "Nao foi possivel excluir o pagamento.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <FinancePaymentsView
      financeData={{
        ...financeData,
        showPaymentModal,
        paymentFeedback,
        paymentSubmitting,
        paymentForm,
        setPaymentForm,
        deleteDialog,
        deleteSubmitting,
        deleteTargetLabel: deleteDialog.row?.description || "este pagamento",
        deleteTargetType: "pagamento",
        onOpenPaymentModal: () => setShowPaymentModal(true),
        onClosePaymentModal: () => setShowPaymentModal(false),
        onSubmitPayment: handleSubmitPayment,
        onDeletePayment: requestDeletePayment,
        onCancelDelete: closeDeletePaymentDialog,
        onConfirmDelete: confirmDeletePayment,
      }}
    />
  );
}

function FinanceCommissionsPage() {
  const financeData = useFinanceModuleData();
  const auth = useAuth();
  const [feedback, setFeedback] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });

  function requestDeleteCommission(row) {
    setFeedback("");
    setDeleteDialog({ open: true, row });
  }

  function closeDeleteCommissionDialog() {
    if (deleteSubmitting) return;
    setDeleteDialog({ open: false, row: null });
  }

  async function confirmDeleteCommission() {
    if (!deleteDialog.row?.id) {
      setFeedback("Nao foi possivel identificar a comissao para exclusao.");
      setDeleteDialog({ open: false, row: null });
      return;
    }

    if (auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("Modo demonstracao: a exclusao de comissao nao altera os dados locais.");
      setDeleteDialog({ open: false, row: null });
      return;
    }

    try {
      setDeleteSubmitting(true);
      await apiRequest(`/finance/${deleteDialog.row.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setFeedback("Comissao excluida com sucesso.");
      setDeleteDialog({ open: false, row: null });
      financeData.reload?.();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel excluir a comissao.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <FinanceCommissionsView
      financeData={{
        ...financeData,
        feedback: feedback || financeData.feedback,
        deleteDialog,
        deleteSubmitting,
        deleteTargetLabel: deleteDialog.row?.description || "esta comissao",
        deleteTargetType: "comissao",
        onRequestDeleteCommission: requestDeleteCommission,
        onCancelDelete: closeDeleteCommissionDialog,
        onConfirmDelete: confirmDeleteCommission,
      }}
    />
  );
}

function FinanceSummaryPage() {
  const financeData = useFinanceModuleData();
  return <FinanceSummaryView financeData={financeData} />;
}

function SearchMainPageConnected() {
  return <SearchMainPage />;
}

function ViaCentralMainPageConnected() {
  return <ViaCentralMainPage />;
}

function SalesMainPage() {
  const financeData = useFinanceModuleData();
  const salesRows = financeData.salesRows;
  /*
    {
      clientTop: "EugÃªnica",
      clientBottom: "Chloe",
      badge: "Venda 15831",
      lines: ["banho tosa tesoura R$130,00"],
      value: "Venda 130,00",
    },
    {
      clientTop: "Erica Baby e tobby",
      clientBottom: "Tobby",
      badge: "Venda 15830",
      lines: ["Banho Tosa Geral R$95,00"],
      value: "Venda 95,00",
    },
    {
      clientTop: "marcia regina",
      clientBottom: "Liza",
      badge: "Venda 15829",
      lines: [
        "Banho e Tosa HigiÃªnica R$70,00",
        "Taxi Dog R$7,00",
        "HidrataÃ§Ã£o R$30,00",
        "EscovaÃ§Ã£o Dentaria R$10,00",
      ],
      value: "Venda 117,00",
    },
  ];

  */
  return (
    <div className="sales-main-layout">
      <div className="sales-titlebar">
        <strong>PDV</strong>
      </div>

      <div className="sales-date-box">
        <small>Data</small>
        <span>26.03.2026</span>
      </div>

      <section className="sales-board">
        <div className="sales-toolbar">
          <div className="toolbar-group">
            <button className="soft-btn">Venda</button>
            <button className="soft-btn">Pagamento</button>
            <button className="soft-btn">Fechar Caixa</button>
            <span className="sales-warning">Caixa aberto em 25.09.2020</span>
          </div>
          <div className="toolbar-group">
            <div className="soft-counter finance-total-chip">
              {financeData.paymentsTotals} | {financeData.salesTotal}
            </div>
          </div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}

        <div className="sales-head">
          <div>Cliente</div>
          <div>DescriÃ§Ã£o</div>
          <div>Valor</div>
        </div>

        <div className="sales-body">
          {financeData.loading ? <div className="registers-row">Carregando vendas...</div> : null}
          {!financeData.loading && salesRows.map((row) => (
            <div key={row.badge} className="sales-row">
              <div className="sales-client">
                <span>{row.clientTop}</span>
                <strong>{row.clientBottom}</strong>
                <span className="queue-search-icon">Q</span>
              </div>
              <div className="sales-desc">
                <span className="badge badge-orange">{row.badge}</span>
                <div className="payment-lines">
                  {row.lines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
              <div className="sales-value">{row.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SalesMainPageConnected() {
  const auth = useAuth();
  const location = useLocation();
  const financeData = useFinanceModuleData();
  const accountSettings = readAccountSettings();
  const [activeModal, setActiveModal] = useState("");
  const [salesHistoryClient, setSalesHistoryClient] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [localSalesRows, setLocalSalesRows] = useState([]);
  const [saleForm, setSaleForm] = useState({
    customerId: "",
    productId: "",
    quantity: "1",
    price: "",
    paymentMethod: "pix",
    observation: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    date: "2026-03-26",
    description: "Recebimento no PDV",
    value: "",
    paymentMethod: "pix",
  });

  useEffect(() => {
    setLocalSalesRows(financeData.salesRows);
  }, [financeData.salesRows]);

  const salesSearchParams = new URLSearchParams(location.search);
  const customerFilter = salesSearchParams.get("customer") || "";
  const normalizedCustomerFilter = customerFilter.trim().toLowerCase();
  const visibleSalesRows = normalizedCustomerFilter
    ? localSalesRows.filter((row) =>
        [row.clientTop, row.clientBottom, row.customer]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedCustomerFilter)),
      )
    : localSalesRows;

  useEffect(() => {
    let active = true;

    async function loadPdvCatalogs() {
      if (!auth.token) {
        return;
      }

      if (auth.token === DEMO_AUTH_TOKEN) {
        if (active) {
          setCustomers([]);
          setProducts([]);
          setFeedback("O PDV usa somente dados reais. Entre com a conta real para carregar clientes e produtos.");
        }
        return;
      }

      try {
        const [customersResponse, productsResponse] = await Promise.all([
          apiRequest("/customers", {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }),
          apiRequest("/products", {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }),
        ]);

        if (!active) {
          return;
        }

        setCustomers(customersResponse?.data || []);
        setProducts(Array.isArray(productsResponse) ? productsResponse : []);
      } catch (error) {
        if (active) {
          setFeedback(error.message || "Nao foi possivel carregar clientes e produtos do PDV.");
        }
      }
    }

    loadPdvCatalogs();

    return () => {
      active = false;
    };
  }, [auth.token]);

  function closeModal() {
    setActiveModal("");
    setIsSubmitting(false);
  }

  function openSalesHistory(row) {
    const customerName = row.customer || row.clientTop || "";
    const historyRows = localSalesRows.filter((item) => String(item.customer || item.clientTop || "").trim() === String(customerName).trim());
    const customerRecord = customers.find((item) => String(item.name || "").trim() === String(customerName).trim());
    const totalSpent = historyRows.reduce((sum, item) => sum + Number(item.grossAmount || item.netAmount || 0), 0);
    const latestPurchase = [...historyRows]
      .sort((left, right) => new Date(right.rawDate || 0).getTime() - new Date(left.rawDate || 0).getTime())[0] || null;
    const outstandingAmount = Number(
      customerRecord?.debt ??
      customerRecord?.pendingAmount ??
      customerRecord?.balance ??
      0,
    ) || 0;
    setSalesHistoryClient({
      customerName,
      phone: customerRecord?.phone || "",
      latestPurchaseDate: latestPurchase?.date || "",
      totalSpent,
      outstandingAmount,
      rows: historyRows,
    });
  }

  function closeSalesHistory() {
    setSalesHistoryClient(null);
  }

  function handleProductChange(productId) {
    const selected = products.find((product) => String(product.id) === String(productId));
    setSaleForm((current) => ({
      ...current,
      productId,
      price: selected ? String(selected.salePrice || selected.price || "") : current.price,
    }));
  }

  async function handleSaleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!saleForm.customerId || !saleForm.productId || !saleForm.quantity || !saleForm.price) {
      setFeedback("Preencha cliente, produto, quantidade e valor.");
      return;
    }

    const customer = customers.find((item) => String(item.id) === String(saleForm.customerId));
    const product = products.find((item) => String(item.id) === String(saleForm.productId));
    const numericPrice = Number(String(saleForm.price).replace(",", "."));
    const numericQuantity = Number(String(saleForm.quantity).replace(",", "."));
    const grossValue = numericPrice * numericQuantity;
    const breakdown = calculateFeeBreakdown(grossValue, saleForm.paymentMethod, accountSettings);

    if (!product || !customer || !numericPrice || !numericQuantity) {
      setFeedback("Os dados da venda estao incompletos.");
      return;
    }

    const newRow = {
      clientTop: customer.name,
      clientBottom: product.name,
      badge: `Venda ${Date.now()}`,
      lines: [
        `${product.name} R$${formatCurrencyBr(grossValue)}`,
          `Bruto R$${formatCurrencyBr(breakdown.grossAmount)} • Taxa R$${formatCurrencyBr(breakdown.feeAmount)} • Liquido R$${formatCurrencyBr(breakdown.netAmount)}`,
      ],
      value: `Liquido R$${formatCurrencyBr(breakdown.netAmount)}`,
      grossAmount: breakdown.grossAmount,
      feeAmount: breakdown.feeAmount,
      netAmount: breakdown.netAmount,
      grossDisplay: `R$ ${formatCurrencyBr(breakdown.grossAmount)}`,
      feeDisplay: `R$ ${formatCurrencyBr(breakdown.feeAmount)}`,
      netDisplay: `R$ ${formatCurrencyBr(breakdown.netAmount)}`,
      paymentMethodLabel: saleForm.paymentMethod,
    };

    if (auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("O PDV usa somente dados reais. Entre com a conta real para registrar vendas.");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest("/sales", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          custumerId: String(saleForm.customerId),
          paymentMethod: saleForm.paymentMethod,
          observation: saleForm.observation,
          items: [
            {
              productId: String(saleForm.productId),
              quantify: numericQuantity,
              price: numericPrice,
            },
          ],
        }),
      });

      setLocalSalesRows((current) => [newRow, ...current]);
      setFeedback("Venda registrada com sucesso.");
      closeModal();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar a venda.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePaymentSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!paymentForm.date || !paymentForm.description || !paymentForm.value) {
      setFeedback("Preencha data, descricao e valor do pagamento.");
      return;
    }

    if (auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("O PDV usa somente dados reais. Entre com a conta real para registrar pagamentos.");
      return;
    }

    try {
      setIsSubmitting(true);
      const breakdown = calculateFeeBreakdown(
        Number(String(paymentForm.value).replace(",", ".")),
        paymentForm.paymentMethod,
        accountSettings,
      );
      await apiRequest("/finance", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          type: "entrada",
          description: paymentForm.description,
          amount: breakdown.grossAmount,
          grossAmount: breakdown.grossAmount,
          feePercentage: breakdown.feePercentage,
          feeAmount: breakdown.feeAmount,
          netAmount: breakdown.netAmount,
          date: paymentForm.date,
          dueDate: paymentForm.date,
          category: "Pagamentos",
          subCategory: "PDV",
          expenseType: "variavel",
          frequency: "unico",
          paymentMethod: paymentForm.paymentMethod,
          status: "pago",
        }),
      });
      setFeedback("Pagamento registrado com sucesso.");
      closeModal();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel registrar o pagamento.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCloseCash() {
    if (auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("O PDV usa somente dados reais. Entre com a conta real para fechar o caixa.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiRequest("/finance/close-cash", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          referenceDate: "2026-03-26",
        }),
      });

      const balance = response?.data?.balance ?? 0;
      setFeedback(`Caixa fechado com sucesso. Saldo do dia: ${formatCurrencyBr(balance)}.`);
      closeModal();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel fechar o caixa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const customerOptions = customers.map((customer) => ({
    value: String(customer.id),
    label: customer.name,
  }));

  const productOptions = products.map((product) => ({
    value: String(product.id),
    label: product.name,
    searchText: `${product.name} ${product.category || ""} ${product.barcode || product.barCode || ""}`,
  }));

  const saleBreakdown = calculateFeeBreakdown(
    (Number(String(saleForm.price || "0").replace(",", ".")) || 0) * (Number(String(saleForm.quantity || "0").replace(",", ".")) || 0),
    saleForm.paymentMethod,
    accountSettings,
  );
  const paymentBreakdown = calculateFeeBreakdown(
    Number(String(paymentForm.value || "0").replace(",", ".")) || 0,
    paymentForm.paymentMethod,
    accountSettings,
  );

  return (
    <SalesPageView
      financeData={financeData}
      activeModal={activeModal}
      customerFilter={customerFilter}
      feedback={feedback}
      isSubmitting={isSubmitting}
      customerOptions={customerOptions}
      productOptions={productOptions}
      saleForm={saleForm}
      paymentForm={paymentForm}
      setActiveModal={setActiveModal}
      setSaleForm={setSaleForm}
      setPaymentForm={setPaymentForm}
      handleProductChange={handleProductChange}
      handleSaleSubmit={handleSaleSubmit}
      handlePaymentSubmit={handlePaymentSubmit}
      handleCloseCash={handleCloseCash}
      closeModal={closeModal}
      salesHistoryClient={salesHistoryClient}
      openSalesHistory={openSalesHistory}
      closeSalesHistory={closeSalesHistory}
      rows={visibleSalesRows}
      saleBreakdown={{
        grossDisplay: formatCurrencyBr(saleBreakdown.grossAmount),
        feeDisplay: formatCurrencyBr(saleBreakdown.feeAmount),
        netDisplay: formatCurrencyBr(saleBreakdown.netAmount),
      }}
      paymentBreakdown={{
        grossDisplay: formatCurrencyBr(paymentBreakdown.grossAmount),
        feeDisplay: formatCurrencyBr(paymentBreakdown.feeAmount),
        netDisplay: formatCurrencyBr(paymentBreakdown.netAmount),
      }}
    />
  );
}

function SettingsProfilePageConnected() {
  const auth = useAuth();
  const { settings, feedback, saving, updateSettings, saveSettings } = useSettingsModuleData();
  const [profileFeedback, setProfileFeedback] = useState("");
  const [renewingPlan, setRenewingPlan] = useState(false);

  const handleLogoChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateSettings({ logoUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateSettings({ signatureImageUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundLogoChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateSettings({ backgroundLogoUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };

  const renewMainSubscription = async () => {
    if (!auth.user?.id) {
      setProfileFeedback("Nao foi possivel identificar o usuario para renovar o ViaPet.");
      return;
    }

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const nextExpiration = new Date();
      nextExpiration.setDate(nextExpiration.getDate() + 30);
      const iso = nextExpiration.toISOString();
      updateSettings({ expirationDate: iso });
      setProfileFeedback("Validade do ViaPet renovada por 30 dias no modo demonstracao.");
      return;
    }

    setRenewingPlan(true);
    setProfileFeedback("");
    try {
      const response = await apiRequest(`/admin/clients/${auth.user.id}/renew-plan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      const newExpirationDate = response?.data?.expirationDate || "";
      updateSettings({ expirationDate: newExpirationDate });
      setProfileFeedback("Validade do ViaPet renovada por 30 dias com sucesso.");
    } catch (error) {
      setProfileFeedback(error.message || "Nao foi possivel renovar a validade do ViaPet.");
    } finally {
      setRenewingPlan(false);
    }
  };

  return (
    <SettingsProfilePageView
      settings={settings}
      feedback={profileFeedback || feedback}
      saving={saving}
      renewingPlan={renewingPlan}
      onSelectTheme={(theme) => updateSettings({ theme })}
      onLogoChange={handleLogoChange}
      onRemoveLogo={() => updateSettings({ logoUrl: "" })}
      onBackgroundLogoChange={handleBackgroundLogoChange}
      onRemoveBackgroundLogo={() => updateSettings({ backgroundLogoUrl: "" })}
      onBackgroundOpacityChange={(backgroundLogoOpacity) => updateSettings({ backgroundLogoOpacity })}
      onBackgroundScopeChange={(scope) => {
        const currentScopes = Array.isArray(settings.backgroundLogoScope) ? settings.backgroundLogoScope : ["all"];
        let nextScopes;

        if (scope === "all") {
          nextScopes = currentScopes.includes("all") ? ["dashboard"] : ["all"];
        } else if (currentScopes.includes("all")) {
          nextScopes = [scope];
        } else if (currentScopes.includes(scope)) {
          nextScopes = currentScopes.filter((item) => item !== scope);
        } else {
          nextScopes = [...currentScopes, scope];
        }

        if (!nextScopes.length) {
          nextScopes = ["dashboard"];
        }

        updateSettings({ backgroundLogoScope: nextScopes });
      }}
      onSignatureChange={handleSignatureChange}
      onRemoveSignature={() => updateSettings({ signatureImageUrl: "" })}
      onRenewPlan={renewMainSubscription}
      saveProfileSettings={() =>
        saveSettings({
          theme: settings.theme,
          storeName: settings.storeName,
          textColor: settings.textColor,
          logoUrl: settings.logoUrl,
          backgroundLogoUrl: settings.backgroundLogoUrl,
          backgroundLogoOpacity: settings.backgroundLogoOpacity,
          backgroundLogoScope: settings.backgroundLogoScope,
          signatureImageUrl: settings.signatureImageUrl,
          expirationDate: settings.expirationDate,
        })
      }
    />
  );
}

function SettingsResourcesPage() {
  const items = [
    "Clínica",
    "Estética",
    "Vacinas",
    "Exames",
    "Internação",
    "Doutor Basinho (IA)",
    "Fila de Atendimento",
    "Usar Controle de Caixa",
  ];

  return (
    <SettingsShell activeTab="Recursos">
      <section className="settings-card settings-resource-card">
        <h3>Marque os recursos que deseja utilizar</h3>
        <div className="settings-resource-list">
          {items.map((item) => (
            <label key={item} className="settings-checkline settings-checkline-large">
              <span className="settings-check-fill">✓</span>
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>
    </SettingsShell>
  );
}

function SettingsAgendaPageConnected() {
  const { settings, feedback, saving, updateSettings, saveSettings } = useSettingsModuleData();
  const [statusLabels, setStatusLabels] = useState(() =>
    Object.fromEntries(getAgendaStatusOptions().map((item) => [item.key, item.label])),
  );

  useEffect(() => {
    const defaults = Object.fromEntries(getAgendaStatusOptions().map((item) => [item.key, item.label]));
    setStatusLabels({
      ...defaults,
      ...(settings.statusLabels || {}),
    });
  }, [settings.theme, settings.statusLabels]);

  async function saveAgendaSettings() {
    writeAgendaStatusLabelsOverride(statusLabels);
    await saveSettings({
      intervalClinic: settings.intervalClinic,
      intervalAesthetics: settings.intervalAesthetics,
      workingDays: settings.workingDays,
      statusLabels,
    });
  }

  return (
    <SettingsAgendaPageView
      settings={settings}
      feedback={feedback}
      saving={saving}
      statusOptions={getAgendaStatusOptions().map((item) => ({
        ...item,
        label: statusLabels[item.key] || item.label,
      }))}
      workingDaysPreset={getWorkingDaysPreset(settings.workingDays)}
      onWorkingDaysPresetChange={(preset) => updateSettings({ workingDays: buildWorkingDaysFromPreset(preset) })}
      onIntervalClinicChange={(value) => updateSettings({ intervalClinic: value })}
      onIntervalAestheticsChange={(value) => updateSettings({ intervalAesthetics: value })}
      onStatusLabelChange={(key, value) =>
        setStatusLabels((current) => ({
          ...current,
          [key]: value,
        }))
      }
      saveAgendaSettings={saveAgendaSettings}
    />
  );
}

function SettingsPrintPage() {
  return (
    <SettingsShell activeTab="Impressao">
      <div className="settings-stack">
        <div className="settings-form-row settings-form-row-compact">
          <Field label="Dias Trabalhados" value="Segunda a Sábado" />
        </div>

        <div className="settings-form-row">
          <Field label="Eventos Estética" value="A cada 1 hora" />
          <Field label="Eventos Clínica" value="A cada 1 hora" />
        </div>

        <section className="settings-card">
          <strong>Etiquetas de Situação</strong>
          <div className="settings-status-grid">
            {[
              ["Aguardando", "#fff200", "#1d1d1d"],
              ["Fazendo", "#ff910d", "#fff"],
              ["Secando", "#33d12a", "#1d1d1d"],
              ["Pronto", "#007a00", "#fff"],
              ["Entregue", "#2c8ff1", "#fff"],
              ["Refazer", "#1e17ff", "#fff"],
              ["Atrasado", "#fb1714", "#fff"],
              ["Encaixe", "#9f0300", "#fff"],
              ["Atenção", "#000000", "#fff"],
            ].map(([label, bg, color]) => (
              <div key={label} className="settings-status-row">
                <span className="settings-check-fill">✓</span>
                <span className="settings-status-pill" style={{ background: bg, color }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </SettingsShell>
  );
}

function SettingsAccountPageConnected() {
  const auth = useAuth();
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [renewingPlan, setRenewingPlan] = useState(false);
  const [accountSettings, setAccountSettings] = useState(() => normalizeAccountSettings(readAccountSettings(), auth.user));

  useEffect(() => {
    let active = true;

    async function loadAccountSettings() {
      if (!auth.token) {
        if (active) {
          setFeedback("Sessao expirada. Entre novamente para carregar a conta.");
        }
        return;
      }

      if (auth.token === DEMO_AUTH_TOKEN) {
        if (active) {
          setFeedback("Conta usa dados reais. Entre com a conta real para editar.");
        }
        return;
      }

      try {
        const response = await apiRequest("/settings/account", {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        const normalized = normalizeAccountSettings(
          {
            ...readAccountSettings(),
            ...(response?.data || {}),
          },
          auth.user,
        );
        writeAccountSettings(normalized);
        writeStoredUiSettings({
          ...readStoredUiSettings(),
          storeName: normalized.establishmentName,
        });
        if (active) {
          setAccountSettings(normalized);
        }
      } catch (error) {
        const fallback = normalizeAccountSettings(readAccountSettings(), auth.user);
        writeAccountSettings(fallback);
        if (active) {
          setAccountSettings(fallback);
          setFeedback(error.message || "Nao foi possivel carregar os dados da conta.");
        }
      }
    }

    loadAccountSettings();

    return () => {
      active = false;
    };
  }, [auth.token, auth.user]);

  function handleElectronicSignatureChange(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAccountSettings((current) => ({
        ...current,
        electronicSignatureUrl: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  }

  async function saveAccountSettings() {
    const normalized = normalizeAccountSettings(accountSettings, auth.user);
    writeAccountSettings(normalized);

    if (!auth.token) {
      setAccountSettings(normalized);
      setFeedback("Sessao expirada. Entre novamente para salvar a conta.");
      return;
    }

    if (auth.token === DEMO_AUTH_TOKEN) {
      setAccountSettings(normalized);
      setFeedback("Conta usa dados reais. Entre com a conta real para salvar.");
      return;
    }

    setSaving(true);
    setFeedback("");
    try {
      const response = await apiRequest("/settings/account", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          establishmentName: normalized.establishmentName,
          naming: normalized.naming,
          contactEmail: normalized.contactEmail,
          contactPhone: normalized.contactPhone,
          crmAccessWhatsapp: normalized.crmAccessWhatsapp,
          driverWhatsappRecipients: normalized.driverWhatsappRecipients,
          electronicSignatureUrl: normalized.electronicSignatureUrl,
          electronicSignatureName: normalized.electronicSignatureName,
        }),
      });
      const nextSettings = normalizeAccountSettings(
        {
          ...normalized,
          ...(response?.data || {}),
        },
        auth.user,
      );
      writeAccountSettings(nextSettings);
      writeStoredUiSettings({
        ...readStoredUiSettings(),
        storeName: nextSettings.establishmentName,
      });
      setAccountSettings(nextSettings);
      setFeedback("Configuracao da conta salva com sucesso.");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar a configuracao da conta.");
    } finally {
      setSaving(false);
    }
  }

  async function renewMainSubscription() {
    if (!auth.user?.id) {
      setFeedback("Nao foi possivel identificar o usuario para renovar o ViaPet.");
      return;
    }

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("Validade do ViaPet usa dados reais. Entre com a conta real para renovar.");
      return;
    }

    setRenewingPlan(true);
    setFeedback("");
    try {
      const response = await apiRequest(`/admin/clients/${auth.user.id}/renew-plan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      const nextSettings = normalizeAccountSettings(
        {
          ...accountSettings,
          expirationDate: response?.data?.expirationDate || accountSettings.expirationDate,
        },
        auth.user,
      );
      writeAccountSettings(nextSettings);
      writeStoredUiSettings({
        ...readStoredUiSettings(),
        expirationDate: nextSettings.expirationDate,
      });
      setAccountSettings(nextSettings);
      setFeedback("Validade do ViaPet renovada por 30 dias com sucesso.");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel renovar a validade do ViaPet.");
    } finally {
      setRenewingPlan(false);
    }
  }

  return (
    <SettingsAccountPageView
      accountSettings={accountSettings}
      setAccountSettings={setAccountSettings}
      saveAccountSettings={saveAccountSettings}
      feedback={feedback}
      saving={saving}
      renewingPlan={renewingPlan}
      onRenewPlan={renewMainSubscription}
      onElectronicSignatureChange={handleElectronicSignatureChange}
      onRemoveElectronicSignature={() =>
        setAccountSettings((current) => ({
          ...current,
          electronicSignatureUrl: "",
        }))
      }
    />
  );
}

function SettingsTaxesPageConnected() {
  const auth = useAuth();
  const [feedback, setFeedback] = useState("");
  const [accountSettings, setAccountSettings] = useState(() => readAccountSettings());

  useEffect(() => {
    let active = true;

    async function loadTaxSettings() {
      if (!auth.token) {
        setFeedback("Sessao expirada. Entre novamente para carregar as taxas.");
        return;
      }

      if (auth.token === DEMO_AUTH_TOKEN) {
        setFeedback("Taxas usa dados reais. Entre com a conta real para editar.");
        return;
      }

      try {
        const response = await apiRequest("/settings/account", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (!active) return;
        const normalized = normalizeAccountSettings(response?.data || response || {}, auth.user);
        setAccountSettings(normalized);
        writeAccountSettings(normalized);
      } catch (error) {
        if (!active) return;
        setFeedback(error.message || "Nao foi possivel carregar as taxas.");
      }
    }

    loadTaxSettings();

    return () => {
      active = false;
    };
  }, [auth.token, auth.user]);

  async function saveAccountSettings() {
    writeAccountSettings(accountSettings);

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("Taxas usa dados reais. Entre com a conta real para salvar.");
      return;
    }

    try {
      await apiRequest("/settings/account", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          bankName: accountSettings.bankName,
          debitFee: accountSettings.debitFee,
          creditFee: accountSettings.creditFee,
          installmentFee: accountSettings.installmentFee,
          pixFee: accountSettings.pixFee,
          cashFee: accountSettings.cashFee,
        }),
      });
      setFeedback("Configuracao das taxas salva com sucesso.");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar as taxas.");
    }
  }

  return (
    <SettingsTaxesPageView
      accountSettings={accountSettings}
      setAccountSettings={setAccountSettings}
      saveAccountSettings={saveAccountSettings}
      feedback={feedback}
    />
  );
}

function ExamsMainPage() {
  return (
    <div className="exams-main-layout">
      <aside className="exams-left-panel">
        <div className="exams-panel-head">
          <strong>Exames</strong>
        </div>

        <div className="exams-panel-body">
          <div className="exams-filter-row">
            <div className="exams-filter-pill">{examsOverview.filterLabel}</div>
            <button className="registers-icon-btn">Filtro</button>
          </div>

          <div className="exams-list-head">
            <span>Pet</span>
            <span>Exame</span>
          </div>

          <div className="exams-list">
            {examsOverview.items.map((item) => (
              <div key={`${item.pet}-${item.exam}`} className="exams-list-row">
                <span>{item.pet}</span>
                <span>{item.exam}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="exams-stage" />
    </div>
  );
}

function QueueMainPage() {
  return (
    <div className="agenda-layout">
      <aside className="left-panel">
        <div className="panel-header panel-header-accent">
          <strong>Agenda</strong>
          <span>Hoje</span>
        </div>
        <div className="panel-body">
          <div className="calendar-header">
            <span>Marco</span>
            <span>2026</span>
            <span>Hoje</span>
          </div>
          <div className="calendar-grid">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }, (_, index) => {
              const day = index + 1;
              return (
                <div key={day} className={day === 26 ? "day day-active" : "day"}>
                  {day}
                </div>
              );
            })}
          </div>

          <div className="filters">
            <h3>Filtros</h3>
            <div className="radio-line">
              <span>Dia</span>
              <span>Semana</span>
            </div>
            <Field label="Evento" value="" />
            <Field label="Usuario" value="" />
            <Field label="Funcao" value="" />
          </div>
        </div>
      </aside>

      <main className="center-panel">
        <AgendaTabbar activeTab="Fila" />

        <section className="agenda-board">
          <div className="agenda-toolbar">
            <div className="toolbar-group">
              <button className="soft-btn">Adicionar a Fila</button>
              <button className="soft-btn">Atualizar</button>
            </div>
            <div className="toolbar-group">
              <div className="soft-counter">{queueOverview.total}</div>
            </div>
          </div>

          <div className="queue-table-board">
            <div className="queue-table-head">
              <div>Posicao</div>
              <div>Entrada</div>
              <div>Paciente</div>
              <div />
              <div />
              <div>Veterinario</div>
            </div>

            <div className="queue-table-body">
              {queueOverview.items.map((item) => (
                <div key={item.id} className="queue-table-row">
                  <div>{item.position}</div>
                  <div>{item.entry}</div>
                  <div>{item.patient}</div>
                  <div className="queue-search-icon">Q</div>
                  <div>{item.status}</div>
                  <div>{item.veterinarian}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ClinicMainPage() {
  return <AgendaPage agendaType="clinica" activeTab="Clínica" />;
}

function HospitalizationMainPage() {
  return (
    <div className="agenda-layout hospitalization-layout">
      <aside className="left-panel">
        <div className="panel-header panel-header-accent">
          <strong>Agenda</strong>
          <span>Hoje</span>
        </div>
        <div className="panel-body">
          <div className="calendar-header">
            <span>Marco</span>
            <span>2026</span>
            <span>Hoje</span>
          </div>
          <div className="calendar-grid">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }, (_, index) => {
              const day = index + 1;
              return (
                <div key={day} className={day === 26 ? "day day-active" : "day"}>
                  {day}
                </div>
              );
            })}
          </div>

          <div className="filters">
            <h3>Filtros</h3>
            <div className="radio-line">
              <span>Dia</span>
              <span>Semana</span>
            </div>
            <Field label="Evento" value="" />
            <Field label="Usuario" value="" />
            <Field label="Funcao" value="" />
          </div>
        </div>
      </aside>

      <main className="center-panel">
      <AgendaTabbar activeTab="Internação" />

        <section className="agenda-board hospitalization-board">
          <div className="hospitalization-main">
            <div className="agenda-toolbar">
              <div className="toolbar-group">
                <button className="soft-btn">Novo Evento</button>
              </div>
              <div className="toolbar-group">
                <button type="button" className="soft-counter" onClick={() => window.print()}>
                  Imprimir
                </button>
              </div>
            </div>

            <div className="timeline">
              <div className="timeline-head">
                <div>Hora</div>
                <div>26 Marco 2026</div>
              </div>

              {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map((hour) => (
                <div key={hour} className="timeline-slot clinic-slot-empty">
                  <div className="timeline-hour">{hour}</div>
                  <div className="timeline-card clinic-empty-card" />
                </div>
              ))}
            </div>
          </div>

          <aside className="hospitalization-side">
            <div className="hospitalization-side-head">
              <span>Pet</span>
              <span>Periodo</span>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function AgendaTabbar({ activeTab }) {
  const visibleTabs = getVisibleAgendaTabs(readSelectedResources());
  return (
    <div className="tabbar">
      {visibleTabs.map((tab) => (
        <NavLink key={tab} to={getAgendaTabPath(tab)} className={tab === activeTab ? "tab active" : "tab"}>
          {tab}
        </NavLink>
      ))}
    </div>
  );
}

function RegistersPage() {
  return (
    <div className="page-grid">
      <section className="split-grid">
        <div className="surface-card">
          <div className="section-head">
            <div>
              <span className="section-kicker">Cadastros base</span>
              <h2>Clientes e tutores</h2>
            </div>
          </div>

          <div className="list-stack">
            {registersPreview.customers.map((customer) => (
              <div key={customer.phone} className="list-card">
                <strong>{customer.name}</strong>
                <p>{customer.phone}</p>
                <span>
                  {customer.pets} pets • {customer.city}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card">
          <div className="section-head">
            <div>
              <span className="section-kicker">Catalogo</span>
              <h2>Servicos ativos</h2>
            </div>
          </div>

          <div className="list-stack">
            {registersPreview.services.map((service) => (
              <div key={service.name} className="list-card">
                <strong>{service.name}</strong>
                <p>{service.category}</p>
                <span>{service.price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function RegistersModernPage() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState("Pacientes");
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRegisters() {
      if (!auth.token) {
        return;
      }

      try {
        setLoading(true);
        setFeedback("");

        const [customersResponse, petsResponse] = await Promise.all([
          apiRequest("/customers", {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }),
          apiRequest("/pets", {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }),
        ]);

        if (!active) {
          return;
        }

        setPeople(customersResponse?.data || []);
        setPatients(petsResponse?.data || []);
      } catch (error) {
        if (active) {
          setFeedback(error.message || "Nao foi possivel carregar os cadastros.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRegisters();

    return () => {
      active = false;
    };
  }, [auth.token]);

  const filteredPatients = patients.filter((patient) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [patient.name, patient.customerName, patient.customerPhone]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const filteredPeople = people.filter((person) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [person.name, person.phone, person.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const listRows =
    activeTab === "Pacientes"
      ? filteredPatients.map((patient) => `${patient.name}${patient.customerName ? ` (${patient.customerName})` : ""}`)
      : filteredPeople.map((person) => `${person.name}${person.phone ? ` • ${person.phone}` : ""}`);

  return (
    <div className="page-grid">
      <section className="registers-screen">
        <div className="registers-head">
          <strong>Cadastros</strong>
        </div>

        <div className="registers-tabbar">
          {registersPreview.mainTabs.map((tab, index) => (
            <button
              key={tab}
              className={tab === activeTab ? "registers-main-tab active" : "registers-main-tab"}
              onClick={() => {
                if (tab === "Pacientes" || tab === "Pessoas") {
                  setActiveTab(tab);
                }
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="registers-board">
          <div className="registers-toolbar">
            <div className="registers-toolbar-left">
              <NavLink
                to={activeTab === "Pacientes" ? "/cadastros/novo-paciente" : "/cadastros/nova-pessoa"}
                className="registers-new-btn registers-link-btn"
              >
                {activeTab === "Pacientes" ? "+ Novo Paciente" : "+ Nova Pessoa"}
              </NavLink>
              <input
                className="registers-search-box"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={
                  activeTab === "Pacientes"
                    ? "Buscar paciente, tutor ou telefone"
                    : "Buscar pessoa, telefone ou email"
                }
              />
              <button className="registers-icon-btn">Imprimir</button>
              <button className="registers-icon-btn">Excel</button>
            </div>

            <div className="registers-toolbar-right">
              <button className="registers-icon-btn">Filtro</button>
              <button className="registers-icon-btn">Excluir</button>
            </div>
          </div>

          <div className="registers-list-head">
            {activeTab === "Pacientes" ? "Lista de Pacientes" : "Lista de Pessoas"}
          </div>

          {feedback ? <div className="registers-feedback">{feedback}</div> : null}

          <div className="registers-list">
            {loading ? <div className="registers-row">Carregando cadastros...</div> : null}
            {!loading && listRows.length === 0 ? (
              <div className="registers-row">Nenhum cadastro encontrado.</div>
            ) : null}
            {!loading &&
              listRows.map((item) => (
                <div key={item} className="registers-row">
                  {item}
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function NewPatientFormPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingPatient = location.state?.patient || null;
  const [customers, setCustomers] = useState([]);
  const [patientSuggestions, setPatientSuggestions] = useState(buildPatientSuggestionOptions([]));
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState({
    name: "",
    species: "Canina",
    customerId: "",
    photoUrl: "",
    birthdate: "",
    breed: "",
    secondaryBreed: "",
    size: "",
    color: "",
    secondaryColor: "",
    coat: "",
    pedigree: "",
    microchip: "",
    group: "",
    allergies: "",
    bloodType: "",
    veterinarian: "",
    feedBrand: "",
    hygienicCarpet: "",
    favoriteTreat: "",
    observation: "",
    sex: "Macho",
    aggressive: false,
    alive: true,
    registered: true,
    reproductionReady: false,
  });

  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      try {
        setIsLoadingCustomers(true);

        if (auth.token === DEMO_AUTH_TOKEN) {
          const demoCatalogs = getAgendaDemoCatalogs();
          const demoCustomers = demoCatalogs.customers.map((customer) => ({
            ...customer,
            phone: customer.phone || "",
            email: customer.email || "",
          }));
          if (!active) return;
          setCustomers(demoCustomers);
          setPatientSuggestions(buildPatientSuggestionOptions(demoCatalogs.pets));
          return;
        }

        const [customersResponse, petsResponse] = await Promise.all([
          apiRequest("/customers", {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }),
          apiRequest("/pets", {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }),
        ]);

        if (!active) {
          return;
        }

        const data = customersResponse?.data || [];
        const pets = petsResponse?.data || petsResponse || [];
        setCustomers(data);
        setPatientSuggestions(buildPatientSuggestionOptions(pets));
      } catch (error) {
        if (active) {
          setFeedback(error.message || "Nao foi possivel carregar os tutores.");
        }
      } finally {
        if (active) {
          setIsLoadingCustomers(false);
        }
      }
    }

    loadCustomers();

    return () => {
      active = false;
    };
  }, [auth.token]);

  useEffect(() => {
    if (!editingPatient) return;

    const customerId = String(editingPatient.customerId || editingPatient.customer?.id || editingPatient.Custumer?.id || "");
    const customerName =
      editingPatient.customerName ||
      editingPatient.customer?.name ||
      editingPatient.Custumer?.name ||
      customers.find((item) => String(item.id) === customerId)?.name ||
      "";

    setForm((current) => ({
      ...current,
      id: editingPatient.id || current.id,
      name: editingPatient.name || "",
      species: editingPatient.species || current.species,
      customerId,
      photoUrl:
        resolvePetPhoto({
          id: editingPatient.id,
          name: editingPatient.name,
          customerId,
        }) ||
        editingPatient.photoUrl ||
        "",
      birthdate: editingPatient.birthdate ? String(editingPatient.birthdate).slice(0, 10) : "",
      breed: String(editingPatient.breed || "").split("/")[0]?.trim() || "",
      secondaryBreed: String(editingPatient.breed || "").split("/")[1]?.trim() || "",
      size: extractObservationValue(editingPatient.observation, "Porte"),
      color: String(editingPatient.color || "").split("/")[0]?.trim() || "",
      secondaryColor: String(editingPatient.color || "").split("/")[1]?.trim() || "",
      coat: extractObservationValue(editingPatient.observation, "Pelo"),
      pedigree: extractObservationValue(editingPatient.observation, "Pedigree"),
      microchip: extractObservationValue(editingPatient.observation, "Microchip"),
      group: extractObservationValue(editingPatient.observation, "Grupo"),
      allergies: extractObservationValue(editingPatient.observation, "Alergias"),
      bloodType: extractObservationValue(editingPatient.observation, "Tipo sanguineo"),
      veterinarian: extractObservationValue(editingPatient.observation, "Veterinario"),
      feedBrand: editingPatient.feedBrand || "",
      hygienicCarpet: editingPatient.hygienicCarpet || "",
      favoriteTreat: editingPatient.favoriteTreat || "",
      observation: String(editingPatient.observation || "")
        .split("|")
        .map((item) => item.trim())
        .filter(
          (item) =>
            item &&
            !["Porte:", "Pelo:", "Pedigree:", "Microchip:", "Grupo:", "Alergias:", "Tipo sanguineo:", "Veterinario:", "Registrado", "Apto a reproducao"].some((prefix) =>
              item.toLowerCase().startsWith(prefix.toLowerCase()),
            ),
        )
        .join(" | "),
      sex: editingPatient.sex || current.sex,
      aggressive: Boolean(editingPatient.allergic),
      alive: current.alive,
      registered: String(editingPatient.observation || "").toLowerCase().includes("registrado"),
      reproductionReady: String(editingPatient.observation || "").toLowerCase().includes("apto a reproducao"),
    }));

    setCustomerSearch(customerName);
  }, [editingPatient, customers]);

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateForm("photoUrl", dataUrl);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel carregar a foto do pet.");
    } finally {
      event.target.value = "";
    }
  }

  function selectCustomer(customer) {
    updateForm("customerId", customer.id);
    setCustomerSearch(customer.name || "");
    setCustomerDropdownOpen(false);
  }

  const visibleCustomers = rankCustomerMatches(customers, customerSearch).map((entry) => entry.customer);

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    const resolvedCustomer = resolveCustomerSelection(customers, customerSearch, form.customerId);
    const resolvedCustomerId = resolvedCustomer?.id ? String(resolvedCustomer.id) : "";

    if (!form.name || !resolvedCustomerId) {
      setFeedback("Preencha pelo menos o nome do paciente e o responsavel.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (auth.token === DEMO_AUTH_TOKEN) {
        persistDemoPet(
          {
            ...form,
            customerId: resolvedCustomerId,
          },
          customers,
        );
        navigate("/cadastros?tab=Pacientes");
        return;
      }

      if (!auth.token) {
        throw new Error("Sessao expirada. Entre novamente para salvar o paciente.");
      }

      const response = await apiRequest(editingPatient?.id ? `/pets/${editingPatient.id}` : "/pets", {
        method: editingPatient?.id ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          name: form.name,
          species: form.species,
          breed: [form.breed, form.secondaryBreed].filter(Boolean).join(" / "),
          color: [form.color, form.secondaryColor].filter(Boolean).join(" / "),
          sex: form.sex,
          birthdate: form.birthdate || null,
          observation: [
            form.observation,
            form.size ? `Porte: ${form.size}` : "",
            form.coat ? `Pelo: ${form.coat}` : "",
            form.pedigree ? `Pedigree: ${form.pedigree}` : "",
            form.microchip ? `Microchip: ${form.microchip}` : "",
            form.group ? `Grupo: ${form.group}` : "",
            form.allergies ? `Alergias: ${form.allergies}` : "",
            form.bloodType ? `Tipo sanguineo: ${form.bloodType}` : "",
            form.veterinarian ? `Veterinario: ${form.veterinarian}` : "",
            form.registered ? "Registrado" : "",
            form.reproductionReady ? "Apto a reproducao" : "",
          ]
            .filter(Boolean)
            .join(" | "),
          allergic: form.aggressive || Boolean(form.allergies),
          customerId: resolvedCustomerId,
          custumerId: resolvedCustomerId,
          feedBrand: form.feedBrand,
          hygienicCarpet: form.hygienicCarpet,
          favoriteTreat: form.favoriteTreat,
        }),
      });

      const savedPet = response?.data || response?.pet || response;

      if (form.photoUrl) {
        persistPetPhoto(
          {
            id: editingPatient?.id || savedPet?.id || form.id,
            name: form.name,
            customerId: resolvedCustomerId,
          },
          form.photoUrl,
        );
      }

      navigate("/cadastros?tab=Pacientes");
    } catch (error) {
      const message = error.message || "Nao foi possivel salvar o paciente.";
      if (/token|sessao|authoriz/i.test(message)) {
        persistDemoPet(
          {
            ...form,
            customerId: resolvedCustomerId,
          },
          customers,
        );
        setFeedback("Sessao expirada. Paciente salvo localmente para voce nao perder o cadastro.");
        navigate("/cadastros?tab=Pacientes");
        return;
      }
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="patient-form-shell">
      <form className="patient-form-card" onSubmit={handleSubmit}>
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">Cadastro pet</span>
            <h2>{editingPatient ? "Editar Paciente" : "Novo Paciente"}</h2>
          </div>
          <NavLink to="/cadastros?tab=Pacientes" className="ghost-btn toolbar-link">
            Voltar
          </NavLink>
        </div>

        <div className="patient-form-layout">
          <div className="patient-form-main">
            <div className="patient-grid patient-grid-top">
              <EditableField label="Nome" value={form.name} onChange={(value) => updateForm("name", value)} />
              <EditableSelectField
                label="Especie"
                value={form.species}
                onChange={(value) => updateForm("species", value)}
                options={["Canina", "Felina", "Ave", "Roedor", "Outros"]}
              />
            </div>

            <div className="patient-grid patient-grid-top">
              <div className="field-block">
                <label>Responsavel</label>
                <input
                  className="field-input"
                  type="text"
                  value={customerSearch}
                  placeholder={isLoadingCustomers ? "Carregando tutores..." : "Digite para buscar o tutor"}
                  onFocus={() => setCustomerDropdownOpen(true)}
                  onChange={(event) => {
                    setCustomerSearch(event.target.value);
                    updateForm("customerId", "");
                    setCustomerDropdownOpen(true);
                  }}
                />
                {customerDropdownOpen ? (
                  <div className="patient-customer-dropdown">
                    <button
                      type="button"
                      className="ghost-btn patient-inline-create-btn patient-dropdown-create-btn"
                      onClick={() => {
                        setCustomerDropdownOpen(false);
                        setShowCustomerModal(true);
                      }}
                    >
                      Novo cadastro
                    </button>
                    <div className="patient-customer-options">
                      {visibleCustomers.length ? (
                        visibleCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            className="patient-customer-option"
                            onClick={() => selectCustomer(customer)}
                          >
                            <strong>{customer.name}</strong>
                            <span>{customer.phone || customer.email || "Sem contato"}</span>
                          </button>
                        ))
                      ) : (
                        <div className="patient-customer-empty">Nenhum responsavel encontrado.</div>
                      )}
                    </div>
                  </div>
                ) : null}
                <div className="patient-inline-actions">
                  <button type="button" className="ghost-btn patient-inline-create-btn" onClick={() => setShowCustomerModal(true)}>
                    Novo cadastro
                  </button>
                </div>
              </div>
              <EditableField
                label="Nascimento"
                type="date"
                value={form.birthdate}
                onChange={(value) => updateForm("birthdate", value)}
              />
            </div>

            <div className="patient-section">
              <h3>Caracteristicas</h3>
              <div className="patient-grid patient-grid-three">
                <EditableSuggestField
                  label="Raca predominante"
                  value={form.breed}
                  onChange={(value) => updateForm("breed", value)}
                  options={patientSuggestions.breed}
                />
                <EditableSuggestField
                  label="Raca secundaria"
                  value={form.secondaryBreed}
                  onChange={(value) => updateForm("secondaryBreed", value)}
                  options={patientSuggestions.secondaryBreed}
                />
                <EditableSuggestField
                  label="Porte"
                  value={form.size}
                  onChange={(value) => updateForm("size", value)}
                  options={patientSuggestions.size}
                />
              </div>
              <div className="patient-grid patient-grid-three">
                <EditableSuggestField
                  label="Cor predominante"
                  value={form.color}
                  onChange={(value) => updateForm("color", value)}
                  options={patientSuggestions.color}
                />
                <EditableSuggestField
                  label="Cor secundaria"
                  value={form.secondaryColor}
                  onChange={(value) => updateForm("secondaryColor", value)}
                  options={patientSuggestions.secondaryColor}
                />
                <EditableSuggestField
                  label="Pelo"
                  value={form.coat}
                  onChange={(value) => updateForm("coat", value)}
                  options={patientSuggestions.coat}
                />
              </div>
              <div className="patient-grid patient-grid-three">
                <EditableSuggestField
                  label="Pedigree"
                  value={form.pedigree}
                  onChange={(value) => updateForm("pedigree", value)}
                  options={patientSuggestions.pedigree}
                />
                <EditableSuggestField
                  label="Microchip"
                  value={form.microchip}
                  onChange={(value) => updateForm("microchip", value)}
                  options={patientSuggestions.microchip}
                />
                <EditableSuggestField
                  label="Grupo"
                  value={form.group}
                  onChange={(value) => updateForm("group", value)}
                  options={patientSuggestions.group}
                />
              </div>
            </div>

            <div className="patient-section">
              <h3>Outras Informacoes</h3>
              <div className="patient-grid patient-grid-three patient-grid-custom">
                <EditableSuggestField label="Alergias" value={form.allergies} onChange={(value) => updateForm("allergies", value)} options={patientSuggestions.allergies} />
                <EditableSuggestField label="Tipo sanguineo" value={form.bloodType} onChange={(value) => updateForm("bloodType", value)} options={patientSuggestions.bloodType} />
                <EditableSuggestField label="Veterinario" value={form.veterinarian} onChange={(value) => updateForm("veterinarian", value)} options={patientSuggestions.veterinarian} />
              </div>
              <h3>Consumos do Pet</h3>
              <div className="patient-grid patient-grid-three">
                <EditableSuggestField label="Racao de consumo" value={form.feedBrand} onChange={(value) => updateForm("feedBrand", value)} options={patientSuggestions.feedBrand} />
                <EditableSuggestField label="Tapete higienico" value={form.hygienicCarpet} onChange={(value) => updateForm("hygienicCarpet", value)} options={patientSuggestions.hygienicCarpet} />
                <EditableSuggestField label="Petisco" value={form.favoriteTreat} onChange={(value) => updateForm("favoriteTreat", value)} options={patientSuggestions.favoriteTreat} />
              </div>
              <EditableSuggestTextArea
                label="Observacoes"
                value={form.observation}
                onChange={(value) => updateForm("observation", value)}
                options={patientSuggestions.observation}
              />
            </div>
          </div>

          <aside className="patient-form-side">
            <div className="patient-radio-group">
              {["Macho", "Femea", "Indeterminado"].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={form.sex === option ? "patient-radio active" : "patient-radio"}
                  onClick={() => updateForm("sex", option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="patient-checklist">
              <button type="button" className={form.aggressive ? "patient-check active" : "patient-check"} onClick={() => updateForm("aggressive", !form.aggressive)}>
                Agressivo
              </button>
              <button type="button" className={form.alive ? "patient-check active" : "patient-check"} onClick={() => updateForm("alive", !form.alive)}>
                Vivo
              </button>
              <button type="button" className={form.registered ? "patient-check active" : "patient-check"} onClick={() => updateForm("registered", !form.registered)}>
                Registrado
              </button>
              <button
                type="button"
                className={form.reproductionReady ? "patient-check active" : "patient-check"}
                onClick={() => updateForm("reproductionReady", !form.reproductionReady)}
              >
                Apto a reproducao
              </button>
            </div>
          </aside>
        </div>

        {feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="patient-form-footer">
          <div className="person-photo-upload-row">
            <label className="patient-photo-btn person-photo-btn">
              {form.photoUrl ? "Trocar Foto" : "Incluir Foto"}
              <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handlePhotoChange} hidden />
            </label>
            {form.photoUrl ? <img className="person-photo-preview" src={form.photoUrl} alt={form.name || "Pet"} /> : null}
          </div>
          <div className="patient-form-actions">
            <button className="footer-btn footer-btn-green" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
            <button className="footer-btn patient-cancel-btn" type="button" onClick={() => navigate("/cadastros")}>
              Cancelar
            </button>
          </div>
        </div>
      </form>

      {showCustomerModal ? (
        <PersonQuickCreateModal
          auth={auth}
          onClose={() => setShowCustomerModal(false)}
          onCreated={(customer) => {
            setCustomers((current) => [customer, ...current.filter((item) => String(item.id) !== String(customer.id))]);
            selectCustomer(customer);
            setShowCustomerModal(false);
          }}
        />
      ) : null}
    </section>
  );
}

function PersonQuickCreateModal({ auth, onClose, onCreated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [socialNameTouched, setSocialNameTouched] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState({
    name: "",
    cpf: "",
    rg: "",
    photoUrl: "",
    cep: "",
    address: "",
    addressNumber: "",
    addressComplement: "",
    city: "",
    state: "",
    bairro: "",
    phone: "",
    secondaryPhone: "",
    email: "",
    instagram: "",
    noMessages: false,
    socialName: "",
    birthDate: "",
    grupo: "",
    profissao: "",
    observation: "",
  });

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateName(value) {
    const firstName = String(value || "").trim().split(/\s+/)[0] || "";
    setForm((current) => ({
      ...current,
      name: value,
      socialName: socialNameTouched ? current.socialName : firstName,
    }));
  }

  function updateSocialName(value) {
    setSocialNameTouched(true);
    updateForm("socialName", value);
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateForm("photoUrl", dataUrl);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel carregar a foto.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleCepChange(value) {
    const normalizedCep = normalizeCep(value);
    updateForm("cep", normalizedCep);
    if (normalizedCep.length !== 8) {
      return;
    }
    try {
      setIsFetchingCep(true);
      const addressData = await fetchCepAddressData(normalizedCep);
      if (!addressData) return;
      setForm((current) => ({
        ...current,
        cep: addressData.cep,
        address: addressData.address || current.address,
        bairro: addressData.bairro || current.bairro,
        city: addressData.city || current.city,
        state: addressData.state || current.state,
      }));
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel buscar o CEP.");
    } finally {
      setIsFetchingCep(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!form.name) {
      setFeedback("Preencha pelo menos o nome do tutor.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (auth.token === DEMO_AUTH_TOKEN) {
        const demoCustomer = persistDemoCustomer(form);
        onCreated(demoCustomer);
        return;
      }

      if (!auth.token) {
        throw new Error("Sessão expirada. Entre novamente para salvar o tutor.");
      }

      const response = await apiRequest("/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          instagram: form.instagram,
          phone: form.phone,
          address: form.address,
          city: form.city,
          bairro: form.bairro,
          state: form.state,
          complement: [
            form.cep ? `CEP: ${form.cep}` : "",
            form.addressNumber ? `Numero: ${form.addressNumber}` : "",
            form.addressComplement ? `Complemento endereco: ${form.addressComplement}` : "",
            form.secondaryPhone ? `Contato extra: ${form.secondaryPhone}` : "",
            form.noMessages ? "Nao enviar mensagens" : "",
            form.socialName ? `Nome social: ${form.socialName}` : "",
            form.instagram ? `Instagram: ${form.instagram}` : "",
          ]
            .filter(Boolean)
            .join(" | "),
          observation: form.observation,
          birthDate: form.birthDate || null,
          cpf: form.cpf || null,
          grupo: form.grupo || null,
          profissao: form.profissao || null,
          rg: form.rg || null,
        }),
      });

      const created = response?.data || response;
      const createdCustomer = {
        id: created?.id || created?.customer?.id || `customer-${Date.now()}`,
        name: created?.name || form.name,
        phone: created?.phone || form.phone,
        email: created?.email || form.email,
        instagram: created?.instagram || form.instagram,
        photoUrl: form.photoUrl || "",
      };
      if (form.photoUrl) {
        persistCustomerPhoto(createdCustomer, form.photoUrl);
      }
      onCreated({
        ...createdCustomer,
      });
    } catch (error) {
      const message = error.message || "Não foi possível salvar o tutor.";
      if (/token|sessao|authoriz/i.test(message)) {
        const demoCustomer = persistDemoCustomer(form);
        onCreated(demoCustomer);
        setFeedback("Sessão expirada. Tutor salvo localmente para você não perder o cadastro.");
        return;
      }
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="quick-create-overlay">
      <form className="quick-create-modal" onSubmit={handleSubmit}>
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">Cadastro tutor</span>
            <h2>Novo Tutor</h2>
          </div>
          <button type="button" className="ghost-btn toolbar-link" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="patient-form-main">
          <div className="patient-section">
            <h3>Foto do Cliente</h3>
            <div className="person-photo-upload-row">
              <label className="patient-photo-btn person-photo-btn">
                {form.photoUrl ? "Trocar Foto" : "Incluir Foto"}
                <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handlePhotoChange} hidden />
              </label>
              {form.photoUrl ? <img className="person-photo-preview" src={form.photoUrl} alt={form.name || "Cliente"} /> : null}
            </div>
          </div>

          <div className="patient-grid person-grid-top">
            <EditableField label="Nome" value={form.name} onChange={updateName} />
            <EditableField label="CPF/CNPJ" value={form.cpf} onChange={(value) => updateForm("cpf", value)} />
            <EditableField label="RG" value={form.rg} onChange={(value) => updateForm("rg", value)} />
          </div>

          <div className="patient-section">
            <h3>Informacoes de Contato</h3>
            <div className="patient-grid person-grid-contact">
              <EditableField label={isFetchingCep ? "CEP (buscando...)" : "CEP"} value={form.cep} onChange={handleCepChange} />
              <EditableField label="Endereco" value={form.address} onChange={(value) => updateForm("address", value)} />
              <EditableField label="Numero" value={form.addressNumber} onChange={(value) => updateForm("addressNumber", value)} />
              <EditableField label="Complemento" value={form.addressComplement} onChange={(value) => updateForm("addressComplement", value)} />
            </div>

            <div className="patient-grid person-grid-contact-secondary">
              <EditableField label="Cidade" value={form.city} onChange={(value) => updateForm("city", value)} />
              <EditableField label="UF" value={form.state} onChange={(value) => updateForm("state", value)} />
              <EditableField label="Bairro" value={form.bairro} onChange={(value) => updateForm("bairro", value)} />
            </div>

            <div className="patient-grid person-grid-contacts">
              <EditableField label="Fone" value={form.phone} onChange={(value) => updateForm("phone", value)} />
              <EditableField label="Contatos" value={form.secondaryPhone} onChange={(value) => updateForm("secondaryPhone", value)} />
              <EditableField label="Email" value={form.email} onChange={(value) => updateForm("email", value)} />
              <EditableField label="Instagram" value={form.instagram} onChange={(value) => updateForm("instagram", value)} />
            </div>
          </div>

          <div className="patient-section">
            <h3>Outras Informacoes</h3>
            <div className="patient-grid person-grid-extra">
              <EditableField label="Nome social (opcional)" value={form.socialName} onChange={updateSocialName} />
              <EditableField label="Nascimento" type="date" value={form.birthDate} onChange={(value) => updateForm("birthDate", value)} />
              <EditableField label="Grupo" value={form.grupo} onChange={(value) => updateForm("grupo", value)} />
              <EditableField label="Profissao" value={form.profissao} onChange={(value) => updateForm("profissao", value)} />
            </div>

            <EditableTextArea label="Observacoes" value={form.observation} onChange={(value) => updateForm("observation", value)} />
          </div>
        </div>

        {feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="patient-form-footer patient-form-footer-right">
          <div className="patient-form-actions">
            <button className="footer-btn footer-btn-green" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
            <button className="footer-btn patient-cancel-btn" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function NewPersonFormPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingPerson = location.state?.person || null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [socialNameTouched, setSocialNameTouched] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState({
    name: "",
    cpf: "",
    rg: "",
    photoUrl: "",
    cep: "",
    address: "",
    addressNumber: "",
    addressComplement: "",
    city: "",
    state: "",
    bairro: "",
    phone: "",
    secondaryPhone: "",
    email: "",
    instagram: "",
    noMessages: false,
    socialName: "",
    birthDate: "",
    grupo: "",
    profissao: "",
    observation: "",
  });

  useEffect(() => {
    if (!editingPerson) return;

    const complement = String(editingPerson.complement || "");
    const extractComplementValue = (label) => extractObservationValue(complement, label);
    const existingSocialName = extractComplementValue("Nome social");
    const existingInstagram = extractComplementValue("Instagram");

    setForm((current) => ({
      ...current,
      id: editingPerson.id || current.id,
      name: editingPerson.name || "",
      cpf: editingPerson.cpf || "",
      rg: editingPerson.rg || "",
      photoUrl: resolveCustomerPhoto(editingPerson),
      cep: extractComplementValue("CEP"),
      address: editingPerson.address || "",
      addressNumber: extractComplementValue("Numero"),
      addressComplement: extractComplementValue("Complemento endereco"),
      city: editingPerson.city || "",
      state: editingPerson.state || "",
      bairro: editingPerson.bairro || "",
      phone: editingPerson.phone || "",
      secondaryPhone: extractComplementValue("Contato extra"),
      email: editingPerson.email || "",
      instagram: existingInstagram || editingPerson.instagram || "",
      noMessages: complement.toLowerCase().includes("nao enviar mensagens"),
      socialName: existingSocialName || current.socialName,
      birthDate: editingPerson.birthDate ? String(editingPerson.birthDate).slice(0, 10) : "",
      grupo: editingPerson.grupo || "",
      profissao: editingPerson.profissao || "",
      observation: editingPerson.observation || "",
    }));

    setSocialNameTouched(Boolean(existingSocialName));
  }, [editingPerson]);

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateName(value) {
    const firstName = String(value || "").trim().split(/\s+/)[0] || "";
    setForm((current) => ({
      ...current,
      name: value,
      socialName: socialNameTouched ? current.socialName : firstName,
    }));
  }

  function updateSocialName(value) {
    setSocialNameTouched(true);
    updateForm("socialName", value);
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateForm("photoUrl", dataUrl);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel carregar a foto.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleCepChange(value) {
    const normalizedCep = normalizeCep(value);
    updateForm("cep", normalizedCep);
    if (normalizedCep.length !== 8) {
      return;
    }
    try {
      setIsFetchingCep(true);
      const addressData = await fetchCepAddressData(normalizedCep);
      if (!addressData) return;
      setForm((current) => ({
        ...current,
        cep: addressData.cep,
        address: addressData.address || current.address,
        bairro: addressData.bairro || current.bairro,
        city: addressData.city || current.city,
        state: addressData.state || current.state,
      }));
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel buscar o CEP.");
    } finally {
      setIsFetchingCep(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!form.name) {
      setFeedback("Preencha pelo menos o nome da pessoa.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (auth.token === DEMO_AUTH_TOKEN) {
        persistDemoCustomer(form);
        setFeedback("Pessoa salva em modo demonstracao local.");
        navigate("/cadastros?tab=Pessoas");
        return;
      }

      if (!auth.token) {
        throw new Error("Sessao expirada. Entre novamente para salvar a pessoa.");
      }

      const payload = {
        ...(editingPerson?.id ? { id: editingPerson.id } : {}),
        name: form.name,
        email: form.email,
        instagram: form.instagram,
        phone: form.phone,
        address: form.address,
        city: form.city,
        bairro: form.bairro,
        state: form.state,
        complement: [
          form.cep ? `CEP: ${form.cep}` : "",
          form.addressNumber ? `Numero: ${form.addressNumber}` : "",
          form.addressComplement ? `Complemento endereco: ${form.addressComplement}` : "",
          form.secondaryPhone ? `Contato extra: ${form.secondaryPhone}` : "",
          form.noMessages ? "Nao enviar mensagens" : "",
          form.socialName ? `Nome social: ${form.socialName}` : "",
          form.instagram ? `Instagram: ${form.instagram}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
        observation: form.observation,
        birthDate: form.birthDate || null,
        cpf: form.cpf || null,
        grupo: form.grupo || null,
        profissao: form.profissao || null,
        rg: form.rg || null,
      };

      let response = null;

      if (editingPerson?.id) {
        try {
          response = await apiRequest(`/customers/${editingPerson.id}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
            body: JSON.stringify(payload),
          });
        } catch (error) {
          const shouldRetryLegacyRoute =
            /cannot put/i.test(error.message || "") ||
            /nao encontrado/i.test(error.message || "") ||
            /not found/i.test(error.message || "");

          if (!shouldRetryLegacyRoute) {
            throw error;
          }

          response = await apiRequest("/customers", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
            body: JSON.stringify(payload),
          });
        }
      } else {
        response = await apiRequest("/customers", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const savedPerson = response?.data || response?.customer || response;

      if (form.photoUrl) {
        persistCustomerPhoto(
          {
            id: editingPerson?.id || savedPerson?.id || form.id,
            name: form.name,
            phone: form.phone,
          },
          form.photoUrl,
        );
      }

      navigate("/cadastros");
    } catch (error) {
      const message = error.message || "Nao foi possivel salvar a pessoa.";
      if (/token|sessao|authoriz/i.test(message)) {
        persistDemoCustomer(form);
        setFeedback("Sessao expirada. Pessoa salva localmente para voce nao perder o cadastro.");
        navigate("/cadastros?tab=Pessoas");
        return;
      }
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="patient-form-shell">
      <form className="patient-form-card" onSubmit={handleSubmit}>
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">Cadastro tutor</span>
            <h2>{editingPerson ? "Editar Tutor" : "Novo Tutor"}</h2>
          </div>
          <NavLink to="/cadastros" className="ghost-btn toolbar-link">
            Voltar
          </NavLink>
        </div>

        <div className="patient-form-main">
          <div className="patient-section">
            <h3>Foto do Cliente</h3>
            <div className="person-photo-upload-row">
              <label className="patient-photo-btn person-photo-btn">
                {form.photoUrl ? "Trocar Foto" : "Incluir Foto"}
                <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handlePhotoChange} hidden />
              </label>
              {form.photoUrl ? <img className="person-photo-preview" src={form.photoUrl} alt={form.name || "Cliente"} /> : null}
            </div>
          </div>

          <div className="patient-grid person-grid-top">
            <EditableField label="Nome" value={form.name} onChange={updateName} />
            <EditableField label="CPF/CNPJ" value={form.cpf} onChange={(value) => updateForm("cpf", value)} />
            <EditableField label="RG" value={form.rg} onChange={(value) => updateForm("rg", value)} />
          </div>

          <div className="patient-section">
            <h3>Informacoes de Contato</h3>
            <div className="patient-grid person-grid-contact">
              <EditableField label={isFetchingCep ? "CEP (buscando...)" : "CEP"} value={form.cep} onChange={handleCepChange} />
              <EditableField label="Endereco" value={form.address} onChange={(value) => updateForm("address", value)} />
              <EditableField label="Numero" value={form.addressNumber} onChange={(value) => updateForm("addressNumber", value)} />
              <EditableField label="Complemento" value={form.addressComplement} onChange={(value) => updateForm("addressComplement", value)} />
            </div>

            <div className="patient-grid person-grid-contact-secondary">
              <EditableField label="Cidade" value={form.city} onChange={(value) => updateForm("city", value)} />
              <EditableField label="UF" value={form.state} onChange={(value) => updateForm("state", value)} />
              <EditableField label="Bairro" value={form.bairro} onChange={(value) => updateForm("bairro", value)} />
            </div>

            <div className="patient-grid person-grid-contacts">
              <EditableField label="Fone" value={form.phone} onChange={(value) => updateForm("phone", value)} />
              <EditableField label="Contatos" value={form.secondaryPhone} onChange={(value) => updateForm("secondaryPhone", value)} />
              <EditableField label="Email" value={form.email} onChange={(value) => updateForm("email", value)} />
              <EditableField label="Instagram" value={form.instagram} onChange={(value) => updateForm("instagram", value)} />
            </div>

            <div className="person-check-row">
              <label className="person-message-check" onClick={() => updateForm("noMessages", !form.noMessages)}>
                <span className={form.noMessages ? "person-box active" : "person-box"} />
                Nao enviar mensagens
              </label>
            </div>
          </div>

          <div className="patient-section">
            <h3>Outras Informacoes</h3>
            <div className="patient-grid person-grid-extra">
              <EditableField label="Nome social (opcional)" value={form.socialName} onChange={updateSocialName} />
              <EditableField label="Nascimento" type="date" value={form.birthDate} onChange={(value) => updateForm("birthDate", value)} />
              <EditableField label="Grupo" value={form.grupo} onChange={(value) => updateForm("grupo", value)} />
              <EditableField label="Profissao" value={form.profissao} onChange={(value) => updateForm("profissao", value)} />
            </div>

            <EditableTextArea label="Observacoes" value={form.observation} onChange={(value) => updateForm("observation", value)} />
          </div>
        </div>

        {feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="patient-form-footer patient-form-footer-right">
          <div className="patient-form-actions">
            <button className="footer-btn footer-btn-green" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
            <button className="footer-btn patient-cancel-btn" type="button" onClick={() => navigate("/cadastros")}>
              Fechar
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function NewProductFormPage() {
  return (
    <section className="patient-form-shell">
      <div className="patient-form-card">
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">Cadastro produto</span>
            <h2>Novo Produto</h2>
          </div>
          <NavLink to="/cadastros" className="ghost-btn toolbar-link">
            Voltar
          </NavLink>
        </div>

        <div className="patient-form-main">
          <div className="field-block">
            <label>Nome</label>
            <div className="input-like">Shampoo Premium Pet Clean</div>
          </div>

          <div className="patient-grid product-grid-top">
            <Field label="Tipo de produto" value="Higiene" />
            <div className="product-inline-check">
              <span className="person-box" />
              <span>Vacina</span>
            </div>
            <Field label="Tributacao" value="Padrao" />
          </div>

          <div className="patient-section">
            <h3>Informacoes do Produto</h3>
            <div className="patient-grid patient-grid-top">
              <Field label="Marca" value="Pet Clean" />
              <Field label="Fornecedor" value="Distribuidora Animal" />
            </div>
            <div className="patient-grid patient-grid-top">
              <Field label="Codigo de barras" value="7890001234567" />
              <Field label="Validade" value="12/12/2026" />
            </div>
          </div>

          <div className="patient-section">
            <h3>Estoque</h3>
            <div className="patient-grid product-grid-stock">
              <Field label="Estoque minimo" value="5" />
              <Field label="Estoque atual" value="18" />
            </div>
          </div>

          <div className="patient-section">
            <h3>Precificacao</h3>
            <div className="patient-grid product-grid-pricing">
              <Field label="Unidade" value="Unidade" />
              <Field label="Preco de custo" value="25,00" />
              <Field label="Margem" value="35%" />
              <Field label="Preco de venda" value="33,75" />
            </div>
            <div className="patient-grid product-grid-bottom">
              <Field label="Comissao" value="5%" />
              <div className="product-inline-check">
                <span className="person-box" />
                <span>Comissao sobre o lucro</span>
              </div>
            </div>
          </div>

        </div>

        <div className="patient-form-footer patient-form-footer-right">
          <div className="patient-form-actions">
            <button className="footer-btn footer-btn-green">Fechar</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewServiceFormPage() {
  const aestheticsSizes = [
    { size: "Micro", short: "0,00", long: "0,00" },
    { size: "Mini", short: "0,00", long: "0,00" },
    { size: "Pequeno", short: "0,00", long: "0,00" },
    { size: "Medio", short: "0,00", long: "0,00" },
    { size: "Grande", short: "0,00", long: "0,00" },
    { size: "Gigante", short: "0,00", long: "0,00" },
  ];

  return (
    <section className="patient-form-shell">
      <div className="patient-form-card">
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">Cadastro servico</span>
            <h2>Novo Servico</h2>
          </div>
          <NavLink to="/cadastros" className="ghost-btn toolbar-link">
            Voltar
          </NavLink>
        </div>

        <div className="service-forms-grid">
          <ServiceBasicCard serviceType="Cirurgias" />
          <ServiceBasicCard serviceType="Consultas" />
          <ServiceAgreementCard />
          <ServiceAestheticsCard items={aestheticsSizes} />
          <ServiceBasicCard serviceType="Exames" />
          <ServiceBasicCard serviceType="Outros" />
        </div>
      </div>
    </section>
  );
}

function NewExamFormPage() {
  return (
    <section className="patient-form-shell">
      <div className="patient-form-card">
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">Cadastro exame</span>
            <h2>Novo Exame</h2>
          </div>
          <NavLink to="/cadastros" className="ghost-btn toolbar-link">
            Voltar
          </NavLink>
        </div>

        <div className="patient-form-main">
          <div className="patient-grid exam-grid-top">
            <Field label="Nome do exame" value="Hemograma completo" />
            <Field label="Categoria" value="Laboratorial" />
          </div>

          <div className="patient-grid exam-grid-top">
            <Field label="Setor" value="Exames" />
            <Field label="Prazo do resultado" value="24 horas" />
          </div>

          <div className="patient-section">
            <h3>Coleta e Processamento</h3>
            <div className="patient-grid exam-grid-three">
              <Field label="Material" value="Sangue" />
              <Field label="Amostra" value="2 ml" />
              <Field label="Metodo" value="Analise automatizada" />
            </div>
            <div className="patient-grid exam-grid-three">
              <Field label="Laboratorio parceiro" value="Lab Pet Bahia" />
              <Field label="Codigo TUSS" value="40301012" />
              <Field label="Validade do preparo" value="Mesmo dia" />
            </div>
          </div>

          <div className="patient-section">
            <h3>Orientacoes</h3>
            <div className="patient-grid exam-grid-two">
              <Field label="Jejum" value="8 horas" />
              <Field label="Restricao" value="Sem medicacao pela manha" />
            </div>
            <div className="field-block">
              <label>Observacoes de preparo</label>
              <div className="textarea-like">
                Coletar preferencialmente pela manha. Informar ao tutor para levar exames anteriores se houver.
              </div>
            </div>
          </div>

          <div className="patient-section">
            <h3>Precificacao</h3>
            <div className="service-pricing-grid">
              <Field label="Preco de custo" value="28,00" />
              <Field label="Preco de venda" value="65,00" />
            </div>
            <div className="service-commission-row">
              <Field label="Comissao" value="6%" />
              <div className="product-inline-check">
                <span className="person-box" />
                <span>Comissao sobre o Lucro</span>
              </div>
            </div>
          </div>
        </div>

        <div className="patient-form-footer patient-form-footer-right">
          <div className="patient-form-actions">
            <button className="footer-btn footer-btn-green">Salvar</button>
            <button className="footer-btn patient-cancel-btn">Cancelar</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewVaccineFormPage() {
  return (
    <section className="patient-form-shell">
      <div className="patient-form-card vaccine-form-card">
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">Cadastro vacina</span>
            <h2>Novo Tipo de Vacina</h2>
          </div>
          <NavLink to="/cadastros" className="ghost-btn toolbar-link">
            Voltar
          </NavLink>
        </div>

        <div className="patient-form-main">
          <div className="field-block">
            <label>Nome</label>
            <div className="input-like">V10 Importada</div>
          </div>

          <div className="patient-grid exam-grid-top">
            <Field label="Laboratorio" value="Zoetis" />
            <Field label="Dose padrao" value="1 ml" />
          </div>

          <div className="patient-grid exam-grid-top">
            <Field label="Intervalo de reforco" value="21 dias" />
            <Field label="Validade apos abertura" value="Imediata" />
          </div>

          <div className="field-block">
            <label>Observacoes</label>
            <div className="textarea-like">
              Vacina de protocolo inicial. Recomendar reforco conforme calendario vacinal e manter sob refrigeracao.
            </div>
          </div>
        </div>

        <div className="patient-form-footer patient-form-footer-right">
          <div className="patient-form-actions">
            <button className="footer-btn footer-btn-green">Fechar</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function RegistersVaccinesPage() {
  return (
    <div className="page-grid">
      <section className="registers-screen">
        <div className="registers-tabbar">
          {registersPreview.vaccineTabs.map((tab, index) => (
            <button key={tab} className={index === 1 ? "registers-subtab active" : "registers-subtab"}>
              {tab}
            </button>
          ))}
        </div>

        <div className="registers-board">
          <div className="registers-toolbar">
            <div className="registers-toolbar-left">
              <button className="registers-new-btn">+ Novo Plano</button>
              <div className="registers-search-box">Buscar plano vacinal</div>
              <button className="registers-icon-btn">Imprimir</button>
              <button className="registers-icon-btn">Excel</button>
            </div>

            <div className="registers-toolbar-right">
              <button className="registers-icon-btn">Filtro</button>
              <button className="registers-icon-btn">Excluir</button>
            </div>
          </div>

          <div className="registers-list-head">Lista de Planos Vacinais</div>

          <div className="registers-list">
            {registersPreview.vaccinePlans.map((plan) => (
              <div key={plan} className="registers-row">
                {plan}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceBasicCard({ serviceType }) {
  return (
    <article className="service-form-card">
      <div className="field-block">
        <label>Nome</label>
        <div className="input-like">Servico exemplo</div>
      </div>

      <div className="service-type-box">
        <label>Tipo de Servico</label>
        <div className="input-like">{serviceType}</div>
      </div>

      <div className="patient-section">
        <h3>Precificacao</h3>
        <div className="service-pricing-grid">
          <Field label="Preco de custo" value="0,00" />
          <Field label="Preco de venda" value="0,00" />
        </div>
        <div className="service-commission-row">
          <Field label="Comissao" value="0,00" />
          <div className="product-inline-check">
            <span className="person-box" />
            <span>Comissao sobre o Lucro</span>
          </div>
        </div>
      </div>

      <div className="service-footer-actions">
        <button className="footer-btn footer-btn-green">Salvar</button>
        <button className="footer-btn patient-cancel-btn">Cancelar</button>
      </div>
    </article>
  );
}

function ServiceAgreementCard() {
  return (
    <article className="service-form-card">
      <div className="field-block">
        <label>Nome</label>
        <div className="input-like">Plano Convenio Pet</div>
      </div>

      <div className="service-type-box">
        <label>Tipo de Servico</label>
        <div className="input-like">Convenios</div>
      </div>

      <div className="patient-section">
        <h3>Precificacao</h3>
        <div className="service-pricing-grid">
          <Field label="Preco de custo" value="0,00" />
          <Field label="Preco de venda" value="0,00" />
        </div>
        <div className="service-commission-row">
          <Field label="Comissao" value="0,00" />
          <div className="product-inline-check">
            <span className="person-box" />
            <span>Comissao sobre o Lucro</span>
          </div>
        </div>
      </div>

      <div className="patient-section">
        <h3>Tabela do Convenio</h3>
        <div className="service-agreement-grid">
          <Field label="Servico conveniado" value="Consulta clinica" />
          <Field label="Limite do convenio" value="20 atendimentos" />
          <div className="service-remove-box">x</div>
        </div>
      </div>

      <div className="service-footer-actions">
        <button className="footer-btn footer-btn-green">Salvar</button>
        <button className="footer-btn patient-cancel-btn">Cancelar</button>
      </div>
    </article>
  );
}

function ServiceAestheticsCard({ items }) {
  return (
    <article className="service-form-card">
      <div className="field-block">
        <label>Nome</label>
        <div className="input-like">Banho Premium</div>
      </div>

      <div className="service-type-box">
        <label>Tipo de Servico</label>
        <div className="input-like">Estetica</div>
      </div>

      <div className="patient-section">
        <div className="service-aesthetic-head">
          <h3>Porte</h3>
          <h3>Pelo Curto</h3>
          <h3>Pelo Longo</h3>
        </div>

        <div className="service-aesthetic-table">
          {items.map((item) => (
            <div key={item.size} className="service-aesthetic-row">
              <div className="service-size-cell">{item.size}</div>
              <div className="input-like service-mini-input">{item.short}</div>
              <div className="input-like service-mini-input">{item.long}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="patient-section">
        <div className="service-pricing-grid service-single-cost">
          <Field label="Preco de custo" value="0,00" />
        </div>
        <div className="service-commission-row">
          <Field label="Comissao" value="0,00" />
          <div className="product-inline-check">
            <span className="person-box" />
            <span>Comissao sobre o Lucro</span>
          </div>
        </div>
      </div>

      <div className="service-footer-actions">
        <button className="footer-btn footer-btn-green">Salvar</button>
        <button className="footer-btn patient-cancel-btn">Cancelar</button>
      </div>
    </article>
  );
}

function AdminControlPageConnected() {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientDetails, setClientDetails] = useState(null);
  const [billingSettings, setBillingSettings] = useState({
    monthlyPrice: "69.90",
    promotionalPrice: "39.90",
    trialDays: "30",
    promotionalMonths: "3",
    reminderDays: "7",
    mercadoPagoEnabled: true,
    mercadoPagoPublicKey: "",
    notes: "",
  });
  const [billingOverview, setBillingOverview] = useState([]);
  const [agendaBanners, setAgendaBanners] = useState([]);
  const [agendaBannerAlerts, setAgendaBannerAlerts] = useState([]);
  const [adminSiteSettings, setAdminSiteSettings] = useState({
    siteConsultantWhatsapp: "551120977579",
  });
  const [clientDeleteConfirm, setClientDeleteConfirm] = useState(null);
  const [editingBannerId, setEditingBannerId] = useState("");
  const [bannerForm, setBannerForm] = useState({
    title: "",
    link: "",
    startDate: "",
    endDate: "",
    reminderDays: "7",
    isActive: true,
    notes: "",
    imageFile: null,
    imagePreview: "",
  });

  if (auth.isReady && auth.token !== DEMO_AUTH_TOKEN && auth.user?.role !== "admin") {
    return (
      <div className="plan-blocked-card">
        <span className="crm-header-kicker">Acesso restrito</span>
        <h2>Esta area e exclusiva para administradores</h2>
        <p>Entre com uma conta admin para controlar clientes, cobrancas e configuracoes globais.</p>
        <div className="plan-notice-actions">
          <NavLink to="/dashboard" className="soft-btn">
            Ir para inicio
          </NavLink>
        </div>
      </div>
    );
  }

  async function loadAdminClients() {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const demoRow = {
        id: "demo-user",
        name: auth.user?.name || "Usuario Demo",
        email: auth.user?.email || DEMO_USER_EMAIL,
        phone: auth.user?.phone || "11999999999",
        status: true,
        plan: true,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        statistics: {
          totalEmployees: 1,
          totalProducts: 0,
          totalServices: 0,
          totalAppointments: 0,
          totalSales: 0,
          totalCustomers: 0,
          totalRevenue: 0,
        },
        crmAiSubscription: {
          status: "demo",
          amount: 49.9,
          currency: "BRL",
          notes: "Controle demo local",
        },
      };
      setClients([demoRow]);
      setSelectedClientId((current) => current || demoRow.id);
      setClientDetails({
        ...demoRow,
        recentActivity: {
          appointments: [],
          sales: [],
          logins: [],
        },
      });
      setBillingOverview([
        {
          id: demoRow.id,
          name: demoRow.name,
          email: demoRow.email,
          stage: "trial",
          daysUntilExpiry: 7,
          reminderDue: true,
          nextChargeAmount: 39.9,
          nextChargePlanType: "promotional",
        },
      ]);
      const localBanners = readDemoAgendaBanners();
      setAgendaBanners(localBanners);
      setAgendaBannerAlerts(
        localBanners.filter((item) => item.stage === "expired" || (item.daysUntilEnd != null && item.daysUntilEnd >= 0 && item.daysUntilEnd <= Number(item.reminderDays || 7))),
      );
      setFeedback("Painel admin em modo demonstracao local.");
      return;
    }

    setLoading(true);
    try {
      const [clientsResponse, crmAiResponse, billingSettingsResponse, billingOverviewResponse, bannersResponse, bannerAlertsResponse, adminSettingsResponse] = await Promise.all([
        apiRequest("/admin/clients", {
          headers: { Authorization: `Bearer ${auth.token}` },
        }),
        apiRequest("/admin/crm-ai/subscriptions", {
          headers: { Authorization: `Bearer ${auth.token}` },
        }),
        apiRequest("/admin/billing/settings", {
          headers: { Authorization: `Bearer ${auth.token}` },
        }),
        apiRequest("/admin/billing/overview", {
          headers: { Authorization: `Bearer ${auth.token}` },
        }),
        apiRequest("/banners?placement=agenda_sidebar", {
          headers: { Authorization: `Bearer ${auth.token}` },
        }).catch(() => []),
        apiRequest("/admin/banners/alerts", {
          headers: { Authorization: `Bearer ${auth.token}` },
        }).catch(() => ({ data: [] })),
        apiRequest("/settings/admin", {
          headers: { Authorization: `Bearer ${auth.token}` },
        }).catch(() => ({ data: { siteConsultantWhatsapp: "551120977579" } })),
      ]);

      const aiMap = new Map(
        (crmAiResponse?.data || []).map((item) => [item.userId, item.subscription || null]),
      );

      const merged = (clientsResponse?.data || []).map((client) => ({
        ...client,
        crmAiSubscription: aiMap.get(client.id) || null,
      }));

      setClients(merged);
      setSelectedClientId((current) => current || merged[0]?.id || "");
      setBillingSettings((current) => ({
        ...current,
        ...(billingSettingsResponse?.data || {}),
        monthlyPrice: String(billingSettingsResponse?.data?.monthlyPrice ?? current.monthlyPrice),
        promotionalPrice: String(billingSettingsResponse?.data?.promotionalPrice ?? current.promotionalPrice),
        trialDays: String(billingSettingsResponse?.data?.trialDays ?? current.trialDays),
        promotionalMonths: String(billingSettingsResponse?.data?.promotionalMonths ?? current.promotionalMonths),
        reminderDays: String(billingSettingsResponse?.data?.reminderDays ?? current.reminderDays),
      }));
      setBillingOverview(billingOverviewResponse?.data?.overview || []);
      setAgendaBanners((Array.isArray(bannersResponse) ? bannersResponse : []).map(normalizeAgendaBannerRecord));
      setAgendaBannerAlerts((bannerAlertsResponse?.data || []).map(normalizeAgendaBannerRecord));
      setAdminSiteSettings({
        siteConsultantWhatsapp: adminSettingsResponse?.data?.siteConsultantWhatsapp || "551120977579",
      });
      setFeedback("");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel carregar o painel administrativo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminClients();
  }, [auth.token]);

  useEffect(() => {
    async function loadDetails() {
      if (!selectedClientId) return;

      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) return;

      setDetailsLoading(true);
      try {
        const response = await apiRequest(`/admin/clients/${selectedClientId}/details`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setClientDetails(response?.data || null);
      } catch (error) {
        setFeedback(error.message || "Nao foi possivel carregar os detalhes do cliente.");
      } finally {
        setDetailsLoading(false);
      }
    }

    const fallback = clients.find((item) => item.id === selectedClientId) || null;
    if (auth.token === DEMO_AUTH_TOKEN) {
      setClientDetails(
        fallback
          ? {
              ...fallback,
              recentActivity: { appointments: [], sales: [], logins: [] },
            }
          : null,
      );
      return;
    }

    loadDetails();
  }, [selectedClientId, auth.token, clients]);

  const filteredClients = clients.filter((client) =>
    [client.name, client.email, client.phone]
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  const selectedClient =
    filteredClients.find((item) => item.id === selectedClientId) ||
    clients.find((item) => item.id === selectedClientId) ||
    filteredClients[0] ||
    clients[0] ||
    null;
  const billingReminderRows = billingOverview.filter((item) => item.reminderDue);
  const activePlanCount = clients.filter((item) => item.plan).length;
  const expiringCount = billingOverview.filter((item) => item.reminderDue && !item.overdue).length;
  const overdueCount = billingOverview.filter((item) => item.overdue).length;
  const firstAccessCount = clients.filter((item) => item.firstAccessRequired).length;
  const passwordResetPendingCount = clients.filter((item) => item.passwordResetActive).length;
  const selectedBillingHistory =
    clientDetails?.billing?.paymentHistory?.length
      ? clientDetails.billing.paymentHistory
      : selectedClient
        ? [
            {
              id: `plan-${selectedClient.id}`,
              status: selectedClient.plan ? "approved" : "cancelled",
              amount: selectedClient.plan ? 69.9 : 0,
              payment_method: selectedClient.plan ? "manual" : null,
              billing_period_end: selectedClient.expirationDate || null,
              created_at: selectedClient.expirationDate || new Date().toISOString(),
              notes: selectedClient.plan ? "Plano principal ativo" : "Plano principal bloqueado",
            },
          ]
        : [];
  const selectedBillingOverview = billingOverview.find((item) => item.id === selectedClient?.id) || null;

  function getBillingEntryVariant(entry) {
    const notes = String(entry?.notes || "").toLowerCase();
    const planType = String(entry?.plan_type || "").toLowerCase();
    const paymentStatus = String(entry?.payment_status || "").toLowerCase();
    const status = String(entry?.status || "").toLowerCase();

    if (notes.includes("sem custo") || paymentStatus.includes("manual_free")) return "free";
    if (planType === "trial" || notes.includes("trial") || paymentStatus.includes("manual_trial")) return "trial";
    if (notes.includes("pagamento manual")) return "paid";
    if (notes.includes("bloqueado") || paymentStatus.includes("manual_blocked") || status === "cancelled") return "blocked";
    if (status === "approved" || status === "active") return "paid";
    return "neutral";
  }

  function getBillingEntryLabel(entry) {
    const variant = getBillingEntryVariant(entry);
    if (variant === "trial") return "Trial";
    if (variant === "free") return "Sem custo";
    if (variant === "blocked") return "Bloqueio manual";
    if (variant === "paid") return "Renovacao paga";
    return "Atualizacao";
  }

  function getBillingEntryTitle(entry) {
    const variant = getBillingEntryVariant(entry);
    if (variant === "trial") return entry.notes || "Trial do ViaPet";
    if (variant === "free") return entry.notes || "Acesso gratuito ao ViaPet";
    if (variant === "blocked") return entry.notes || "ViaPet bloqueado manualmente";
    if (variant === "paid") return entry.notes || "Renovacao do ViaPet";
    return entry.notes || "Atualizacao manual";
  }

  async function refreshAdminArea(focusId = selectedClientId) {
    await loadAdminClients();
    if (focusId) setSelectedClientId(focusId);
  }

  async function saveMainPlan(client, planEnabled, expirationDate) {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setClients((current) =>
        current.map((item) =>
          item.id === client.id ? { ...item, plan: planEnabled, expirationDate } : item,
        ),
      );
      setFeedback("Plano atualizado localmente no modo demonstracao.");
      return;
    }

    try {
      await apiRequest(`/admin/clients/${client.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          name: client.name,
          email: client.email,
          phone: client.phone,
          status: client.status,
          plan: planEnabled,
          expirationDate: planEnabled ? expirationDate : null,
        }),
      });
      setFeedback("Plano principal atualizado com sucesso.");
      await refreshAdminArea(client.id);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel atualizar o plano principal.");
    }
  }

  async function renewMainPlan(client) {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      await saveMainPlan(client, true, date.toISOString());
      return;
    }

    try {
      await apiRequest(`/admin/clients/${client.id}/renew-plan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setFeedback("Plano renovado por 30 dias.");
      await refreshAdminArea(client.id);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel renovar o plano.");
    }
  }

  async function grantMainTrial(client, days) {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      await saveMainPlan(client, true, date.toISOString());
      setFeedback(`Trial principal liberado por ${days} dias.`);
      return;
    }

    try {
      await apiRequest(`/admin/clients/${client.id}/grant-trial`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ days }),
      });
      setFeedback(`Trial principal liberado por ${days} dias.`);
      await refreshAdminArea(client.id);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel liberar o trial principal.");
    }
  }

  async function grantMainFree(client) {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 10);
      await saveMainPlan(client, true, date.toISOString());
      setFeedback("Plano principal liberado sem custo.");
      return;
    }

    try {
      await apiRequest(`/admin/clients/${client.id}/grant-free`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setFeedback("Plano principal liberado sem custo.");
      await refreshAdminArea(client.id);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel liberar o plano principal sem custo.");
    }
  }

  async function blockMainPlan(client) {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      await saveMainPlan(client, false, null);
      setFeedback("Plano principal bloqueado.");
      return;
    }

    try {
      await apiRequest(`/admin/clients/${client.id}/block-plan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setFeedback("Plano principal bloqueado.");
      await refreshAdminArea(client.id);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel bloquear o plano principal.");
    }
  }

  async function resetFirstAccess(client) {
    if (!client) return;

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setFeedback(`Primeiro acesso resetado localmente. Senha provisoria: ViaPet@DEMO`);
      return;
    }

    try {
      const response = await apiRequest(`/admin/clients/${client.id}/reset-first-access`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      const temporaryPassword = response?.data?.temporaryPassword || "gerada";
      setFeedback(`Primeiro acesso resetado. Senha provisoria: ${temporaryPassword}`);
      await refreshAdminArea(client.id);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel resetar o primeiro acesso.");
    }
  }

  async function resendPasswordResetLink(client) {
    if (!client) return;

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("Link de redefinicao simulado no modo demonstracao.");
      setClientDetails((current) =>
        current
          ? {
              ...current,
              passwordReset: {
                active: true,
                requestedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              },
            }
          : current,
      );
      return;
    }

    try {
      const response = await apiRequest(`/admin/clients/${client.id}/send-reset-link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setFeedback(response?.message || "Link de redefinicao reenviado com sucesso.");
      setClientDetails((current) =>
        current
          ? {
              ...current,
              passwordReset: {
                active: true,
                requestedAt: response?.data?.requestedAt || new Date().toISOString(),
                expiresAt: response?.data?.expiresAt || null,
              },
            }
          : current,
      );
      await refreshAdminArea(client.id);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel reenviar o link de redefinicao.");
    }
  }

  async function copyPasswordResetLink(client) {
    if (!client) return;

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("Link de redefinicao demo copiado localmente.");
      return;
    }

    try {
      const response = await apiRequest(`/admin/clients/${client.id}/send-reset-link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const resetUrl = response?.data?.resetUrl || "";
      if (resetUrl && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(resetUrl);
      }
      setFeedback("Link de redefinicao copiado e reenviado por e-mail.");
      await refreshAdminArea(client.id);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel copiar o link de redefinicao.");
    }
  }

  async function deleteAdminClient(client) {
    if (!client?.id) return;

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      let nextSelectedId = "";
      setClients((current) => {
        const remaining = current.filter((item) => item.id !== client.id);
        nextSelectedId = remaining[0]?.id || "";
        return remaining;
      });
      setClientDetails(null);
      setSelectedClientId(nextSelectedId);
      setFeedback("Usuario removido localmente no modo demonstracao.");
      return;
    }

    const nextSelectedId = clients.find((item) => item.id !== client.id)?.id || "";

    try {
      await apiRequest(`/admin/clients/${client.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setClientDetails(null);
      setSelectedClientId(nextSelectedId);
      setFeedback("Usuario removido do sistema com sucesso.");
      await loadAdminClients();
      if (!nextSelectedId) {
        setSelectedClientId("");
      }
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel excluir o usuario.");
    }
  }

  async function saveBillingSettings() {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("Configuracao de cobranca salva localmente no modo demonstracao.");
      return;
    }

    try {
      await apiRequest("/admin/billing/settings", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          monthlyPrice: Number(String(billingSettings.monthlyPrice).replace(",", ".")) || 69.9,
          promotionalPrice: Number(String(billingSettings.promotionalPrice).replace(",", ".")) || 39.9,
          trialDays: Number(billingSettings.trialDays || 30),
          promotionalMonths: Number(billingSettings.promotionalMonths || 3),
          reminderDays: Number(billingSettings.reminderDays || 7),
          mercadoPagoEnabled: Boolean(billingSettings.mercadoPagoEnabled),
          mercadoPagoPublicKey: billingSettings.mercadoPagoPublicKey || "",
          notes: billingSettings.notes || "",
        }),
      });
      setFeedback("Configuracao de cobranca salva com sucesso.");
      await refreshAdminArea(selectedClientId);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar a configuracao de cobranca.");
    }
  }

  async function saveAdminSiteSettings() {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("WhatsApp comercial salvo localmente no modo demonstracao.");
      return;
    }

    try {
      await apiRequest("/settings/admin", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          siteConsultantWhatsapp: adminSiteSettings.siteConsultantWhatsapp || "",
        }),
      });
      setFeedback("WhatsApp comercial do site salvo com sucesso.");
      await refreshAdminArea(selectedClientId);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar o WhatsApp comercial do site.");
    }
  }

  function resetBannerForm() {
    setEditingBannerId("");
    setBannerForm({
      title: "",
      link: "",
      startDate: "",
      endDate: "",
      reminderDays: "7",
      isActive: true,
      notes: "",
      imageFile: null,
      imagePreview: "",
    });
  }

  function startBannerEditing(banner) {
    setEditingBannerId(banner.id || "");
    setBannerForm({
      title: banner.title || "",
      link: banner.link || "",
      startDate: banner.startDate ? String(banner.startDate).slice(0, 10) : "",
      endDate: banner.endDate ? String(banner.endDate).slice(0, 10) : "",
      reminderDays: String(banner.reminderDays || 7),
      isActive: banner.isActive !== false,
      notes: banner.notes || "",
      imageFile: null,
      imagePreview: banner.url || "",
    });
  }

  function handleBannerImageChange(file) {
    if (!file) {
      setBannerForm((current) => ({ ...current, imageFile: null }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBannerForm((current) => ({
        ...current,
        imageFile: file,
        imagePreview: typeof reader.result === "string" ? reader.result : current.imagePreview,
      }));
    };
    reader.readAsDataURL(file);
  }

  async function saveAgendaBanner() {
    if (!bannerForm.title.trim()) {
      setFeedback("Informe um titulo para o banner da agenda.");
      return;
    }

    if (!editingBannerId && !bannerForm.imageFile && !bannerForm.imagePreview) {
      setFeedback("Escolha uma imagem para o banner da agenda.");
      return;
    }

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const nextBanner = normalizeAgendaBannerRecord({
        id: editingBannerId || `demo-banner-${Date.now()}`,
        title: bannerForm.title,
        link: bannerForm.link,
        startDate: bannerForm.startDate,
        endDate: bannerForm.endDate,
        reminderDays: Number(bannerForm.reminderDays || 7),
        isActive: bannerForm.isActive,
        notes: bannerForm.notes,
        url: bannerForm.imagePreview,
        placement: "agenda_sidebar",
        order: 0,
      });
      const currentBanners = readDemoAgendaBanners();
      const updated =
        editingBannerId
          ? currentBanners.map((item) => (item.id === editingBannerId ? nextBanner : item))
          : [nextBanner, ...currentBanners];
      writeDemoAgendaBanners(updated);
      setAgendaBanners(updated);
      setAgendaBannerAlerts(
        updated.filter((item) => item.stage === "expired" || (item.daysUntilEnd != null && item.daysUntilEnd >= 0 && item.daysUntilEnd <= Number(item.reminderDays || 7))),
      );
      setFeedback(editingBannerId ? "Banner da agenda atualizado localmente." : "Banner da agenda salvo localmente.");
      resetBannerForm();
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", bannerForm.title);
      formData.append("link", bannerForm.link || "");
      formData.append("startDate", bannerForm.startDate || "");
      formData.append("endDate", bannerForm.endDate || "");
      formData.append("reminderDays", String(Number(bannerForm.reminderDays || 7)));
      formData.append("isActive", bannerForm.isActive ? "true" : "false");
      formData.append("notes", bannerForm.notes || "");
      formData.append("placement", "agenda_sidebar");
      formData.append("order", "0");
      if (bannerForm.imageFile) {
        formData.append("image", bannerForm.imageFile);
      }

      await apiRequest(editingBannerId ? `/banners/${editingBannerId}` : "/banners", {
        method: editingBannerId ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: formData,
      });

      setFeedback(editingBannerId ? "Banner da agenda atualizado com sucesso." : "Banner da agenda criado com sucesso.");
      resetBannerForm();
      await refreshAdminArea(selectedClientId);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar o banner da agenda.");
    }
  }

  async function removeAgendaBanner(banner) {
    if (!banner?.id) return;

    if (!window.confirm(`Deseja remover o banner "${banner.title || "Agenda"}"?`)) {
      return;
    }

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const updated = readDemoAgendaBanners().filter((item) => item.id !== banner.id);
      writeDemoAgendaBanners(updated);
      setAgendaBanners(updated);
      setAgendaBannerAlerts(
        updated.filter((item) => item.stage === "expired" || (item.daysUntilEnd != null && item.daysUntilEnd >= 0 && item.daysUntilEnd <= Number(item.reminderDays || 7))),
      );
      if (editingBannerId === banner.id) {
        resetBannerForm();
      }
      setFeedback("Banner removido localmente.");
      return;
    }

    try {
      await apiRequest(`/banners/${banner.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setFeedback("Banner removido com sucesso.");
      if (editingBannerId === banner.id) {
        resetBannerForm();
      }
      await refreshAdminArea(selectedClientId);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel remover o banner.");
    }
  }

  async function createBillingCharge(client) {
    if (!client) return;

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("Cobranca simulada no modo demonstracao.");
      return;
    }

    try {
      const response = await apiRequest(`/admin/clients/${client.id}/create-billing-charge`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      const checkoutUrl = response?.data?.checkoutUrl;
      setFeedback(
        `Cobranca criada em ${response?.data?.planType === "promotional" ? "valor promocional" : "valor normal"} por R$ ${formatCurrencyBr(response?.data?.amount || 0)}.`,
      );
      await refreshAdminArea(client.id);

      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel criar a cobranca.");
    }
  }

  async function markManualPaid(client) {
    if (!client) return;

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const nextDate = new Date(client.expirationDate || new Date());
      nextDate.setDate(nextDate.getDate() + 30);
      setClients((current) =>
        current.map((item) =>
          item.id === client.id ? { ...item, plan: true, expirationDate: nextDate.toISOString() } : item,
        ),
      );
      setFeedback("Pagamento manual registrado localmente no modo demonstracao.");
      return;
    }

    try {
      const response = await apiRequest(`/admin/clients/${client.id}/mark-manual-paid`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setFeedback(
        `Pagamento manual registrado por R$ ${formatCurrencyBr(response?.data?.amount || 0)}.`,
      );
      await refreshAdminArea(client.id);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel registrar o pagamento manual.");
    }
  }

  async function runAiAdminAction(client, action, payload = {}) {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setClients((current) =>
        current.map((item) =>
          item.id === client.id
            ? {
                ...item,
                crmAiSubscription:
                  action === "block"
                    ? { status: "cancelled", notes: "Bloqueado no modo demo" }
                    : {
                        status: "active",
                        amount: 0,
                        currency: "BRL",
                        notes:
                          action === "grant-free"
                            ? "Acesso gratuito demo"
                            : `Trial demo por ${payload.days || 7} dias`,
                      },
              }
            : item,
        ),
      );
      setFeedback("Controle da IA CRM atualizado localmente no modo demonstracao.");
      return;
    }

    try {
      await apiRequest(`/admin/crm-ai/${client.id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify(payload),
      });
      setFeedback(
        action === "block"
          ? "IA CRM bloqueada com sucesso."
          : action === "grant-free"
            ? "IA CRM liberada sem custo."
            : `Trial da IA CRM liberado por ${payload.days || 7} dias.`,
      );
      await refreshAdminArea(client.id);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel atualizar a assinatura da IA CRM.");
    }
  }

  return (
    <div className="messages-stage-wrap admin-control-wrap">
      <header className="crm-header admin-control-header">
        <div className="crm-header-copy">
          <span className="crm-header-kicker">Controle central</span>
          <h1>Admin ViaPet</h1>
          <p>Gerencie clientes do sistema, plano principal e liberacao premium da IA CRM.</p>
        </div>
        <div className="crm-header-stats">
          <div className="crm-header-stat admin-top-stat admin-top-stat-neutral">
            <strong>{clients.length}</strong>
            <span>Clientes do sistema</span>
          </div>
          <div className="crm-header-stat admin-top-stat admin-top-stat-success">
            <strong>{activePlanCount}</strong>
            <span>Ativos</span>
          </div>
          <div className="crm-header-stat admin-top-stat admin-top-stat-warning">
            <strong>{expiringCount}</strong>
            <span>Vencendo</span>
          </div>
          <div className="crm-header-stat admin-top-stat admin-top-stat-danger">
            <strong>{overdueCount}</strong>
            <span>Vencidos</span>
          </div>
          <div className="crm-header-stat admin-top-stat admin-top-stat-primary">
            <strong>{firstAccessCount}</strong>
            <span>Primeiro acesso</span>
          </div>
          <div className="crm-header-stat admin-top-stat admin-top-stat-info">
            <strong>{passwordResetPendingCount}</strong>
            <span>Reset pendente</span>
          </div>
        </div>
      </header>

      {feedback ? <div className="feedback-banner">{feedback}</div> : null}

      <div className="admin-control-layout">
        <aside className="admin-control-sidebar">
          <div className="admin-control-search">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente, email ou telefone"
            />
          </div>

          <div className="admin-control-list">
            {filteredClients.map((client) => (
              <button
                key={client.id}
                type="button"
                className={client.id === selectedClient?.id ? "admin-client-row active" : "admin-client-row"}
                onClick={() => setSelectedClientId(client.id)}
              >
                <div>
                  <strong>{client.name}</strong>
                  <span>{client.email}</span>
                </div>
                <div className="admin-client-badges">
                  <span className={client.plan ? "admin-chip success" : "admin-chip muted"}>
                    {client.plan ? "Plano on" : "Sem plano"}
                  </span>
                  <span className={client.crmAiSubscription?.status === "active" ? "admin-chip primary" : "admin-chip muted"}>
                    {client.crmAiSubscription?.status === "active" ? "IA ativa" : "IA off"}
                  </span>
                  {client.firstAccessRequired ? <span className="admin-chip warn">Primeiro acesso</span> : null}
                  {client.passwordResetActive ? <span className="admin-chip primary">Reset pendente</span> : null}
                  {(billingOverview.find((item) => item.id === client.id)?.reminderDue || billingOverview.find((item) => item.id === client.id)?.overdue) ? (
                    <span className="admin-chip danger">
                      {billingOverview.find((item) => item.id === client.id)?.overdue ? "Vencido" : "Vencendo"}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
            {!filteredClients.length ? <div className="search-empty-state">Nenhum cliente encontrado.</div> : null}
          </div>
        </aside>

        <section className="admin-control-main">
          {selectedClient ? (
            <>
              <div className="admin-detail-head">
                <div>
                  <h2>{selectedClient.name}</h2>
                  <p>{selectedClient.email} • {selectedClient.phone || "Sem telefone"}</p>
                  {clientDetails?.firstAccess?.required ? (
                    <span className="admin-chip warn">Primeiro acesso pendente</span>
                  ) : null}
                </div>
                <div className="admin-action-grid">
                  <button type="button" className="soft-btn" onClick={() => refreshAdminArea(selectedClient.id)} disabled={loading || detailsLoading}>
                    Atualizar
                  </button>
                  <button
                    type="button"
                    className="soft-btn danger-btn"
                    onClick={() => setClientDeleteConfirm(selectedClient)}
                    disabled={loading || detailsLoading}
                  >
                    Excluir usuario
                  </button>
                </div>
              </div>

              <div className="crm-summary-grid">
                <article className="crm-summary-card admin-topic-card admin-topic-billing">
                  <span className="crm-summary-kicker">Plano principal</span>
                  <h3>{selectedClient.plan ? "Ativo" : "Bloqueado"}</h3>
                  <p>Expira em: {selectedClient.expirationDate ? formatDateBr(selectedClient.expirationDate) : "Sem data"}</p>
                  {selectedBillingOverview ? (
                    <p>
                      Fase atual: {selectedBillingOverview.stage} • Proxima cobranca: R$ {formatCurrencyBr(selectedBillingOverview.nextChargeAmount || 0)}
                    </p>
                  ) : null}
                  <div className="admin-action-grid">
                    <button type="button" className="soft-btn" onClick={() => renewMainPlan(selectedClient)}>Renovar 30 dias</button>
                    <button type="button" className="soft-btn" onClick={() => grantMainTrial(selectedClient, 7)}>Trial 7 dias</button>
                    <button type="button" className="soft-btn" onClick={() => grantMainTrial(selectedClient, 30)}>Trial 30 dias</button>
                    <button type="button" className="soft-btn" onClick={() => createBillingCharge(selectedClient)}>Gerar cobranca MP</button>
                    <button type="button" className="soft-btn" onClick={() => markManualPaid(selectedClient)}>Marcar pago manual</button>
                    <button type="button" className="soft-btn" onClick={() => grantMainFree(selectedClient)}>Sem custo</button>
                    <button type="button" className="soft-btn danger-btn" onClick={() => blockMainPlan(selectedClient)}>Bloquear</button>
                  </div>
                </article>

                <article className="crm-summary-card crm-summary-card-primary admin-topic-card admin-topic-ai">
                  <span className="crm-summary-kicker">IA CRM</span>
                  <h3>{selectedClient.crmAiSubscription?.status === "active" ? "Liberada" : selectedClient.crmAiSubscription?.status || "Sem assinatura"}</h3>
                  <p>
                    {selectedClient.crmAiSubscription?.notes || "Sem liberacao manual registrada."}
                  </p>
                  <div className="admin-action-grid">
                    <button type="button" className="soft-btn" onClick={() => runAiAdminAction(selectedClient, "grant-trial", { days: 7 })}>Trial IA 7 dias</button>
                    <button type="button" className="soft-btn" onClick={() => runAiAdminAction(selectedClient, "grant-trial", { days: 30 })}>Trial IA 30 dias</button>
                    <button type="button" className="soft-btn" onClick={() => runAiAdminAction(selectedClient, "grant-free")}>IA sem custo</button>
                    <button type="button" className="soft-btn danger-btn" onClick={() => runAiAdminAction(selectedClient, "block")}>Bloquear IA</button>
                  </div>
                </article>
              </div>

              <div className="admin-detail-grid">
                <article className="crm-summary-card admin-topic-card admin-topic-billing-settings">
                  <span className="crm-summary-kicker">Cobranca do sistema</span>
                  <h3>Regras da assinatura</h3>
                  <div className="patient-grid-three">
                    <div className="field-block">
                      <label>Valor normal</label>
                      <input
                        className="field-input"
                        value={billingSettings.monthlyPrice}
                        onChange={(event) => setBillingSettings((current) => ({ ...current, monthlyPrice: event.target.value }))}
                      />
                    </div>
                    <div className="field-block">
                      <label>Valor promocional</label>
                      <input
                        className="field-input"
                        value={billingSettings.promotionalPrice}
                        onChange={(event) => setBillingSettings((current) => ({ ...current, promotionalPrice: event.target.value }))}
                      />
                    </div>
                    <div className="field-block">
                      <label>Dias gratis</label>
                      <input
                        className="field-input"
                        value={billingSettings.trialDays}
                        onChange={(event) => setBillingSettings((current) => ({ ...current, trialDays: event.target.value }))}
                      />
                    </div>
                    <div className="field-block">
                      <label>Meses promocionais</label>
                      <input
                        className="field-input"
                        value={billingSettings.promotionalMonths}
                        onChange={(event) => setBillingSettings((current) => ({ ...current, promotionalMonths: event.target.value }))}
                      />
                    </div>
                    <div className="field-block">
                      <label>Antecedencia do aviso</label>
                      <input
                        className="field-input"
                        value={billingSettings.reminderDays}
                        onChange={(event) => setBillingSettings((current) => ({ ...current, reminderDays: event.target.value }))}
                      />
                    </div>
                    <div className="field-block">
                      <label>Mercado Pago</label>
                      <select
                        className="field-input"
                        value={billingSettings.mercadoPagoEnabled ? "on" : "off"}
                        onChange={(event) =>
                          setBillingSettings((current) => ({
                            ...current,
                            mercadoPagoEnabled: event.target.value === "on",
                          }))}
                      >
                        <option value="on">Ativo</option>
                        <option value="off">Desligado</option>
                      </select>
                    </div>
                  </div>
                  <div className="field-block">
                    <label>Public key Mercado Pago</label>
                    <input
                      className="field-input"
                      value={billingSettings.mercadoPagoPublicKey || ""}
                      onChange={(event) =>
                        setBillingSettings((current) => ({ ...current, mercadoPagoPublicKey: event.target.value }))}
                    />
                  </div>
                  <div className="field-block">
                    <label>Observacoes</label>
                    <textarea
                      className="field-textarea"
                      value={billingSettings.notes || ""}
                      onChange={(event) => setBillingSettings((current) => ({ ...current, notes: event.target.value }))}
                    />
                  </div>
                  <div className="admin-action-grid">
                    <button type="button" className="soft-btn" onClick={saveBillingSettings}>Salvar cobranca</button>
                  </div>
                </article>

                <article className="crm-summary-card admin-topic-card admin-topic-alerts">
                  <span className="crm-summary-kicker">Site comercial</span>
                  <h3>WhatsApp do consultor</h3>
                  <div className="field-block">
                    <label>Numero do consultor</label>
                    <input
                      className="field-input"
                      value={adminSiteSettings.siteConsultantWhatsapp}
                      onChange={(event) =>
                        setAdminSiteSettings((current) => ({
                          ...current,
                          siteConsultantWhatsapp: event.target.value,
                        }))}
                      placeholder="5511999999999"
                    />
                  </div>
                  <p className="settings-option-hint">
                    Este numero sera usado nos botoes de consultor do site institucional.
                  </p>
                  <div className="admin-action-grid">
                    <button type="button" className="soft-btn" onClick={saveAdminSiteSettings}>
                      Salvar contato do site
                    </button>
                  </div>
                </article>

                <article className="crm-summary-card admin-topic-card admin-topic-alerts">
                  <span className="crm-summary-kicker">Avisos de cobranca</span>
                  <h3>Clientes proximos do vencimento</h3>
                  <ul className="crm-bullet-list">
                    {billingReminderRows.slice(0, 8).map((item) => (
                      <li key={`billing-reminder-${item.id}`}>
                        {item.name} • {item.overdue ? "vencido" : `vence em ${item.daysUntilExpiry} dias`} • proxima cobranca R$ {formatCurrencyBr(item.nextChargeAmount || 0)}
                      </li>
                    ))}
                    {!billingReminderRows.length ? <li>Nenhum cliente precisa de cobranca antecipada agora.</li> : null}
                  </ul>
                </article>
              </div>

              <div className="admin-detail-grid">
                <article className="crm-summary-card admin-topic-card admin-topic-access">
                  <span className="crm-summary-kicker">Primeiro acesso</span>
                  <h3>{clientDetails?.firstAccess?.required ? "Pendente" : "Concluido"}</h3>
                  <p>
                    {clientDetails?.firstAccess?.required
                      ? `Valido ate ${formatDateBr(clientDetails?.firstAccess?.expiresAt)}`
                      : "O cliente ja definiu a propria senha."}
                  </p>
                  <div className="admin-action-grid">
                    <button type="button" className="soft-btn" onClick={() => resetFirstAccess(selectedClient)}>
                      Gerar senha provisoria
                    </button>
                  </div>
                </article>

                <article className="crm-summary-card admin-topic-card admin-topic-password">
                  <span className="crm-summary-kicker">Recuperacao de senha</span>
                  <h3>{clientDetails?.passwordReset?.active ? "Link ativo" : "Sem solicitacao ativa"}</h3>
                  <ul className="crm-bullet-list">
                    <li>Email: {selectedClient.email || "Nao informado"}</li>
                    <li>
                      Ultima solicitacao:{" "}
                      {clientDetails?.passwordReset?.requestedAt
                        ? formatDateBr(clientDetails.passwordReset.requestedAt)
                        : "Nenhuma"}
                    </li>
                    <li>
                      Expira em:{" "}
                      {clientDetails?.passwordReset?.expiresAt
                        ? formatDateBr(clientDetails.passwordReset.expiresAt)
                        : "Sem link ativo"}
                    </li>
                  </ul>
                  <div className="admin-action-grid">
                    <button type="button" className="soft-btn" onClick={() => resendPasswordResetLink(selectedClient)}>
                      Reenviar link de redefinicao
                    </button>
                    <button type="button" className="soft-btn" onClick={() => copyPasswordResetLink(selectedClient)}>
                      Copiar link de redefinicao
                    </button>
                  </div>
                </article>

                <article className="crm-summary-card admin-topic-card admin-topic-operations">
                  <span className="crm-summary-kicker">Resumo operacional</span>
                  <h3>Uso do sistema</h3>
                  <ul className="crm-bullet-list">
                    <li>Funcionarios: {selectedClient.statistics?.totalEmployees || 0}</li>
                    <li>Produtos: {selectedClient.statistics?.totalProducts || 0}</li>
                    <li>Servicos: {selectedClient.statistics?.totalServices || 0}</li>
                    <li>Clientes internos: {selectedClient.statistics?.totalCustomers || 0}</li>
                    <li>Agendamentos: {selectedClient.statistics?.totalAppointments || 0}</li>
                    <li>Vendas: {selectedClient.statistics?.totalSales || 0}</li>
                    <li>Faturamento: R$ {formatCurrencyBr(selectedClient.statistics?.totalRevenue || 0)}</li>
                  </ul>
                </article>

                <article className="crm-summary-card admin-topic-card admin-topic-history">
                  <span className="crm-summary-kicker">Detalhes do cliente</span>
                  <h3>Informacoes recentes</h3>
                  {detailsLoading ? (
                    <p>Carregando detalhes...</p>
                  ) : (
                    <div className="admin-recent-grid">
                      <div>
                        <strong>Ultimos logins</strong>
                        <ul className="crm-bullet-list">
                          {(clientDetails?.recentActivity?.logins || []).slice(0, 4).map((item, index) => (
                            <li key={`login-${index}`}>{formatDateBr(item.createdAt || item.created_at || item.date)}</li>
                          ))}
                          {!(clientDetails?.recentActivity?.logins || []).length ? <li>Nenhum login recente</li> : null}
                        </ul>
                      </div>
                      <div>
                        <strong>Ultimas vendas</strong>
                        <ul className="crm-bullet-list">
                          {(clientDetails?.recentActivity?.sales || []).slice(0, 4).map((item, index) => (
                            <li key={`sale-${index}`}>R$ {formatCurrencyBr(item.total || 0)}</li>
                          ))}
                          {!(clientDetails?.recentActivity?.sales || []).length ? <li>Nenhuma venda recente</li> : null}
                        </ul>
                      </div>
                    </div>
                  )}
                </article>

                <article className="crm-summary-card admin-topic-card admin-topic-banner">
                  <span className="crm-summary-kicker">Cobranca e validade</span>
                  <h3>Historico do plano</h3>
                  <div className="admin-billing-topline">
                    <span className={selectedClient.plan ? "admin-chip success" : "admin-chip muted"}>
                      {selectedClient.plan ? "ViaPet ativo" : "ViaPet bloqueado"}
                    </span>
                    <span className="admin-billing-expiration">
                      Vence em: {selectedClient.expirationDate ? formatDateBr(selectedClient.expirationDate) : "Sem data"}
                    </span>
                  </div>
                  <div className="admin-billing-history">
                    {selectedBillingHistory.map((item, index) => (
                      <div key={item.id || `billing-${index}`} className="admin-billing-row">
                        <div>
                          <div className="admin-billing-row-head">
                            <strong>{getBillingEntryTitle(item)}</strong>
                            <span className={`admin-chip admin-billing-chip ${getBillingEntryVariant(item)}`}>
                              {getBillingEntryLabel(item)}
                            </span>
                          </div>
                          <span>
                            {formatDateBr(item.created_at || item.date_created || item.createdAt || item.billing_period_end || item.date)}{" "}
                            • {item.payment_method || "manual"}
                          </span>
                        </div>
                        <div className="admin-billing-values">
                          <strong>R$ {formatCurrencyBr(item.amount || 0)}</strong>
                          <span>{item.billing_period_end ? `Ate ${formatDateBr(item.billing_period_end)}` : item.notes || "Sem ciclo definido"}</span>
                        </div>
                      </div>
                    ))}
                    {!selectedBillingHistory.length ? (
                      <div className="search-empty-state">Nenhum historico de cobranca registrado ainda.</div>
                    ) : null}
                  </div>
                </article>
              </div>

              <div className="admin-detail-grid">
                <article className="crm-summary-card admin-topic-card admin-topic-banner-alerts">
                  <span className="crm-summary-kicker">Banner da agenda</span>
                  <h3>Publicidade da coluna lateral</h3>
                  <div className="patient-grid-two">
                    <div className="field-block">
                      <label>Titulo</label>
                      <input
                        className="field-input"
                        value={bannerForm.title}
                        onChange={(event) => setBannerForm((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Ex.: Marca parceira do mes"
                      />
                    </div>
                    <div className="field-block">
                      <label>Link do anunciante</label>
                      <input
                        className="field-input"
                        value={bannerForm.link}
                        onChange={(event) => setBannerForm((current) => ({ ...current, link: event.target.value }))}
                        placeholder="https://empresa.com.br"
                      />
                    </div>
                    <div className="field-block">
                      <label>Inicio</label>
                      <input
                        type="date"
                        className="field-input"
                        value={bannerForm.startDate}
                        onChange={(event) => setBannerForm((current) => ({ ...current, startDate: event.target.value }))}
                      />
                    </div>
                    <div className="field-block">
                      <label>Fim</label>
                      <input
                        type="date"
                        className="field-input"
                        value={bannerForm.endDate}
                        onChange={(event) => setBannerForm((current) => ({ ...current, endDate: event.target.value }))}
                      />
                    </div>
                    <div className="field-block">
                      <label>Avisar faltando</label>
                      <input
                        className="field-input"
                        value={bannerForm.reminderDays}
                        onChange={(event) => setBannerForm((current) => ({ ...current, reminderDays: event.target.value }))}
                        placeholder="7"
                      />
                    </div>
                    <div className="field-block">
                      <label>Status</label>
                      <select
                        className="field-input"
                        value={bannerForm.isActive ? "on" : "off"}
                        onChange={(event) => setBannerForm((current) => ({ ...current, isActive: event.target.value === "on" }))}
                      >
                        <option value="on">Ativo</option>
                        <option value="off">Desligado</option>
                      </select>
                    </div>
                  </div>
                  <div className="field-block">
                    <label>Observacoes</label>
                    <textarea
                      className="field-textarea"
                      value={bannerForm.notes}
                      onChange={(event) => setBannerForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Informacoes comerciais, valor da locacao, campanha ou produto."
                    />
                  </div>
                  <div className="banner-admin-upload-row">
                    <label className="soft-btn banner-admin-upload-btn">
                      Incluir imagem
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(event) => handleBannerImageChange(event.target.files?.[0] || null)}
                      />
                    </label>
                    {bannerForm.imagePreview ? (
                      <div className="banner-admin-preview">
                        <img src={bannerForm.imagePreview} alt={bannerForm.title || "Preview do banner"} />
                      </div>
                    ) : (
                      <div className="banner-admin-preview banner-admin-preview-empty">Sem imagem</div>
                    )}
                  </div>
                  <div className="admin-action-grid">
                    <button type="button" className="soft-btn" onClick={saveAgendaBanner}>
                      {editingBannerId ? "Atualizar banner" : "Salvar banner"}
                    </button>
                    {editingBannerId ? (
                      <button type="button" className="soft-btn" onClick={resetBannerForm}>
                        Cancelar edicao
                      </button>
                    ) : null}
                  </div>
                </article>

                <article className="crm-summary-card">
                  <span className="crm-summary-kicker">Alertas comerciais</span>
                  <h3>Vencimento do banner</h3>
                  <ul className="crm-bullet-list">
                    {agendaBannerAlerts.slice(0, 8).map((item) => (
                      <li key={`banner-alert-${item.id}`}>
                        {item.title || "Banner da agenda"} • {item.stage === "expired" ? "expirado" : `vence em ${item.daysUntilEnd} dias`}
                      </li>
                    ))}
                    {!agendaBannerAlerts.length ? <li>Nenhum banner perto do fim agora.</li> : null}
                  </ul>
                  <div className="banner-admin-list">
                    {agendaBanners.map((banner) => (
                      <div key={banner.id} className="banner-admin-row">
                        <div className="banner-admin-row-main">
                          {banner.url ? <img src={banner.url} alt={banner.title || "Banner"} className="banner-admin-row-thumb" /> : null}
                          <div>
                            <strong>{banner.title || "Banner da agenda"}</strong>
                            <span>
                              {banner.startDate ? formatDateBr(banner.startDate) : "Sem inicio"} • {banner.endDate ? formatDateBr(banner.endDate) : "Sem fim"}
                            </span>
                            <span>Status: {banner.stage}</span>
                          </div>
                        </div>
                        <div className="admin-action-grid">
                          <button type="button" className="soft-btn" onClick={() => startBannerEditing(banner)}>
                            Editar
                          </button>
                          <button type="button" className="soft-btn danger-btn" onClick={() => removeAgendaBanner(banner)}>
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                    {!agendaBanners.length ? <div className="search-empty-state">Nenhum banner cadastrado para a agenda.</div> : null}
                  </div>
                </article>
              </div>
            </>
          ) : (
            <div className="search-empty-state">Selecione um cliente para administrar o sistema.</div>
          )}
        </section>
      </div>

      {clientDeleteConfirm ? (
        <div className="user-modal-overlay">
          <div className="confirm-modal">
            <h3>Excluir usuario</h3>
            <p>
              Deseja mesmo excluir <strong>{clientDeleteConfirm.name || "este usuario"}</strong>?
            </p>
            <p>Essa acao remove tambem os dados vinculados a essa conta dentro do sistema.</p>
            <div className="confirm-modal-actions">
              <button type="button" className="soft-btn" onClick={() => setClientDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="soft-btn danger-btn"
                onClick={async () => {
                  const pendingClient = clientDeleteConfirm;
                  setClientDeleteConfirm(null);
                  await deleteAdminClient(pendingClient);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


function SettingsResourcesPageConnected() {
  const auth = useAuth();
  const [feedback, setFeedback] = useState("");
  const [selected, setSelected] = useState(() => readSelectedResources());

  useEffect(() => {
    let active = true;

    async function loadResources() {
      if (!auth.token) {
        setFeedback("Sessao expirada. Entre novamente para carregar os recursos.");
        return;
      }

      if (auth.token === DEMO_AUTH_TOKEN) {
        setFeedback("Recursos usa dados reais. Entre com a conta real para editar.");
        return;
      }

      try {
        const response = await apiRequest("/settings/resources", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (!active) return;
        const nextSelected = normalizeStoredResources(response?.data?.selected || response?.selected || []);
        setSelected(nextSelected);
        writeSelectedResources(nextSelected);
      } catch (error) {
        if (!active) return;
        setFeedback(error.message || "Nao foi possivel carregar os recursos.");
      }
    }

    loadResources();

    return () => {
      active = false;
    };
  }, [auth.token]);

  function toggleResource(item) {
    setSelected((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]);
  }

  async function saveResources() {
    writeSelectedResources(selected);

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("Recursos usa dados reais. Entre com a conta real para salvar.");
      return;
    }

    try {
      await apiRequest("/settings/resources", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ selected }),
      });
      setFeedback("Recursos atualizados no sistema.");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar os recursos.");
    }
  }

  return <SettingsResourcesPageView feedback={feedback} resourceItems={RESOURCE_ITEMS} selected={selected} toggleResource={toggleResource} saveResources={saveResources} />;
}

function SettingsPrintPageConnected() {
  const auth = useAuth();
  const storageKey = "viapet.settings.print";
  const [feedback, setFeedback] = useState("");
  const [printSettings, setPrintSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : { useCompact: true, showHeader: true, showFooter: true, printerName: "Impressora tÃ©rmica padrÃ£o", paperSize: "A4" };
    } catch {
      return { useCompact: true, showHeader: true, showFooter: true, printerName: "Impressora tÃ©rmica padrÃ£o", paperSize: "A4" };
    }
  });

  useEffect(() => {
    let active = true;

    async function loadPrintSettings() {
      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        return;
      }

      try {
        const response = await apiRequest("/settings/print", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (!active) return;
        const nextPrintSettings = response?.data || response || {};
        setPrintSettings(nextPrintSettings);
        localStorage.setItem(storageKey, JSON.stringify(nextPrintSettings));
      } catch (error) {
        if (!active) return;
        setFeedback(error.message || "Nao foi possivel carregar a configuracao de impressao.");
      }
    }

    loadPrintSettings();

    return () => {
      active = false;
    };
  }, [auth.token]);

  async function savePrintSettings() {
    localStorage.setItem(storageKey, JSON.stringify(printSettings));

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setFeedback("Impressao usa dados reais. Entre com a conta real para salvar.");
      return;
    }

    try {
      await apiRequest("/settings/print", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify(printSettings),
      });
      setFeedback("Configuracao de impressao salva com sucesso.");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar a configuracao de impressao.");
    }
  }

  return <SettingsPrintPageView feedback={feedback} printSettings={printSettings} setPrintSettings={setPrintSettings} savePrintSettings={savePrintSettings} />;
}

function ExamsMainPageConnected() {
  const auth = useAuth();
  const [feedback, setFeedback] = useState("");
  const [items, setItems] = useState([]);
  const [showNewExamModal, setShowNewExamModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadExams() {
      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        setFeedback(auth.token === DEMO_AUTH_TOKEN ? "Exames em modo demonstração local." : "");
        return;
      }

      try {
        const response = await apiRequest("/appointments/queue/exame/true", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        if (!active) return;

        const mapped = (response || []).map((item) => ({
          pet: item.Pet?.name || item.pet?.name || "Pet",
          exam: item.Service?.name || item.service?.name || item.type || "Exame",
        }));

        setItems(mapped);
        setFeedback("");
      } catch (error) {
        if (active) {
          setFeedback(error.message || "Não foi possível carregar os exames.");
          setItems([]);
        }
      }
    }

    loadExams();

    return () => {
      active = false;
    };
  }, [auth.token, refreshKey]);

  return (
    <div className="exams-main-layout">
      <aside className="exams-left-panel">
        <div className="exams-panel-head">
          <strong>Exames</strong>
        </div>

        <div className="exams-panel-body">
          <div className="exams-filter-row">
            <div className="exams-filter-pill">{examsOverview.filterLabel}</div>
            <div className="toolbar-group">
              <NavLink to="/receita?origem=exames" className="soft-btn toolbar-link">
                Receita
              </NavLink>
              <button type="button" className="registers-icon-btn" onClick={() => setShowNewExamModal(true)}>
                Novo cadastro
              </button>
            </div>
          </div>

          <div className="exams-list-head">
            <span>Pet</span>
            <span>Exame</span>
          </div>

          {feedback ? <div className="registers-feedback search-feedback">{feedback}</div> : null}
          <div className="exams-list">
            {items.length ? (
              items.map((item) => (
                <div key={`${item.pet}-${item.exam}`} className="exams-list-row">
                  <span>{item.pet}</span>
                  <span>{item.exam}</span>
                </div>
              ))
            ) : (
              <div className="registers-row">Nenhum exame pendente.</div>
            )}
          </div>
        </div>
      </aside>

      <section className="exams-stage" />

      {showNewExamModal ? (
        <div className="user-modal-overlay">
          <div className="registers-form-modal">
            <NewExamFormPageConnected
              embedded
              onClose={() => setShowNewExamModal(false)}
              onSaved={() => {
                setShowNewExamModal(false);
                setRefreshKey((current) => current + 1);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QueueMainPageConnected() {
  const auth = useAuth();
  const [feedback, setFeedback] = useState("");
  const [queueItems, setQueueItems] = useState([]);

  async function loadQueue() {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setFeedback(auth.token === DEMO_AUTH_TOKEN ? "Fila em modo demonstração local." : "");
      setQueueItems([]);
      return;
    }

    try {
      const response = await apiRequest("/appointments/queue/geral/true", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      const detailedAppointments = await loadAppointmentDetailsList(response?.data || response || [], auth.token);
      const mapped = detailedAppointments.map((item, index) => {
        const financialSnapshot = getAppointmentFinancialSnapshot(item);
        return {
          id: item.id,
          position: index + 1,
          entry: item.queueTime ? new Date(item.queueTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--",
          patient: repairDisplayText(`${item.Pet?.name || "Pet"} (${item.Custumer?.name || item.customer?.name || "Tutor"})`),
          status: repairDisplayText(item.status || "Encaminhado"),
          veterinarian: repairDisplayText(item.responsible?.name || "VH"),
          outstandingAmount: financialSnapshot.outstandingAmount,
        };
      });

      setQueueItems(mapped);
      setFeedback("");
    } catch (error) {
      setFeedback(error.message || "Não foi possível carregar a fila.");
      setQueueItems([]);
    }
  }

  useEffect(() => {
    loadQueue().catch(() => null);
  }, [auth.token]);

  return (
    <div className="agenda-layout">
      <aside className="left-panel">
        <div className="panel-header panel-header-accent">
          <strong>Agenda</strong>
          <span>Hoje</span>
        </div>
        <div className="panel-body">
          <div className="calendar-header">
            <span>Marco</span>
            <span>2026</span>
            <span>Hoje</span>
          </div>
          <div className="calendar-grid">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }, (_, index) => {
              const day = index + 1;
              return (
                <div key={day} className={day === 26 ? "day day-active" : "day"}>
                  {day}
                </div>
              );
            })}
          </div>

          <div className="filters">
            <h3>Filtros</h3>
            <div className="radio-line">
              <span>Dia</span>
              <span>Semana</span>
            </div>
            <Field label="Evento" value="" />
            <Field label="Usuario" value="" />
            <Field label="Funcao" value="" />
          </div>
        </div>
      </aside>

      <main className="center-panel">
        <AgendaTabbar activeTab="Fila" />

        <section className="agenda-board">
          <div className="agenda-toolbar">
            <div className="toolbar-group">
              <button className="soft-btn" onClick={() => setFeedback("Use os agendamentos já criados para alimentar a fila.")}>Adicionar à Fila</button>
              <button className="soft-btn" onClick={() => loadQueue()}>Atualizar</button>
            </div>
          </div>

          {feedback ? <div className="registers-feedback">{feedback}</div> : null}
          <div className="queue-table-board">
            <div className="queue-table-head">
              <div>Posição</div>
              <div>Entrada</div>
              <div>Paciente</div>
              <div />
              <div />
              <div>Veterinário</div>
            </div>

            <div className="queue-table-body">
              {queueItems.length ? (
                queueItems.map((item) => (
                  <div key={item.id} className="queue-table-row">
                    <div>{item.position}</div>
                    <div>{item.entry}</div>
                    <div className="queue-patient-cell">
                      <span className="queue-patient-name">{item.patient}</span>
                      {item.outstandingAmount > 0 ? <span className="queue-row-remaining">Falta pagar {formatCurrencyBr(item.outstandingAmount)}</span> : null}
                    </div>
                    <div className="queue-search-icon">Q</div>
                    <div>{item.status}</div>
                    <div>{item.veterinarian}</div>
                  </div>
                ))
              ) : (
                <div className="registers-row">Nenhum paciente na fila.</div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SearchMainPage() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState("pets");
  const [criterion, setCriterion] = useState("vacina");
  const [option, setOption] = useState("hoje");
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  function getCriterionOptions(tab) {
    return tab === "pets"
      ? [
          { value: "vacina", label: "Vacina" },
          { value: "aniversario", label: "Aniversário" },
          { value: "atendimento", label: "Atendimento" },
          { value: "breed", label: "Raça" },
          { value: "veterinarian", label: "Veterinário" },
        ]
      : [
          { value: "debt", label: "Devedores" },
          { value: "phone", label: "Telefones" },
          { value: "name", label: "Nome" },
        ];
  }

  function getOptionOptions(tab, currentCriterion) {
    if (tab === "pets" && ["vacina", "aniversario", "atendimento"].includes(currentCriterion)) {
      return [
        { value: "hoje", label: "Hoje" },
        { value: "semana", label: "Esta semana" },
        { value: "mes", label: "Este mês" },
        { value: "todos", label: "Todos" },
      ];
    }

    return [
      { value: "contains", label: "Contém" },
      { value: "startsWith", label: "Começa com" },
      { value: "exact", label: "Igual" },
    ];
  }

  function getDateFilterMatch(rawDate, selectedOption) {
    if (!rawDate) return selectedOption === "todos";
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return selectedOption === "todos";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDiff = Math.floor((target.getTime() - today.getTime()) / 86400000);

    if (selectedOption === "todos") return true;
    if (selectedOption === "hoje") return dayDiff === 0;
    if (selectedOption === "semana") return dayDiff >= 0 && dayDiff <= 7;
    if (selectedOption === "mes") {
      return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();
    }
    return true;
  }

  function extractObservationValueFromSearch(text, label) {
    const match = String(text || "").match(new RegExp(`${label}:\\s*([^|]+)`, "i"));
    return match ? match[1].trim() : "";
  }

  useEffect(() => {
    setCriterion(activeTab === "pets" ? "vacina" : "debt");
    setOption(activeTab === "pets" ? "hoje" : "contains");
    setResults([]);
    setFeedback("");
  }, [activeTab]);

  useEffect(() => {
    const validOptions = getOptionOptions(activeTab, criterion);
    if (!validOptions.some((item) => item.value === option)) {
      setOption(validOptions[0]?.value || "");
    }
  }, [activeTab, criterion, option]);

  async function handleSearch() {
    const demoPets = [
      {
        id: "demo-pet-1",
        name: "Belinha",
        detail: "Amanda Lima",
        meta: "Shih Tzu • Cliente demo",
        breed: "Shih Tzu",
        birthdate: getLocalDateString(),
        veterinarian: "Dr. Carlos",
        vaccineDate: getLocalDateString(),
        lastAppointmentDate: getLocalDateString(),
      },
      {
        id: "demo-pet-2",
        name: "Arena",
        detail: "Antonio Martins",
        meta: "Labrador • Cliente demo",
        breed: "Labrador",
        birthdate: getLocalDateString(),
        veterinarian: "Dra. Ana",
        vaccineDate: getLocalDateString(),
        lastAppointmentDate: getLocalDateString(),
      },
      {
        id: "demo-pet-3",
        name: "Meg",
        detail: "Sheila Monteiro",
        meta: "Shih Tzu • Cliente demo",
        breed: "Shih Tzu",
        birthdate: getLocalDateString(),
        veterinarian: "Dr. Lucas",
        vaccineDate: getLocalDateString(),
        lastAppointmentDate: getLocalDateString(),
      },
    ];
    const demoPeople = [
      { id: "demo-person-1", name: "Amanda Lima", detail: "Tutora da Belinha", meta: "11994167999" },
      { id: "demo-person-2", name: "Antonio Martins", detail: "Tutor da Arena", meta: "11994167999" },
      { id: "demo-person-3", name: "Sheila Monteiro", detail: "Tutora da Meg", meta: "11994167999" },
    ];

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      const source = activeTab === "pets" ? demoPets : demoPeople;
      const query = searchValue.trim().toLowerCase();
      const filtered = source.filter((item) => {
        if (activeTab !== "pets") {
          return [item.name, item.detail, item.meta]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        }

        if (criterion === "vacina") return getDateFilterMatch(item.vaccineDate, option);
        if (criterion === "aniversario") return getDateFilterMatch(item.birthdate, option);
        if (criterion === "atendimento") return getDateFilterMatch(item.lastAppointmentDate, option);

        const currentValue = String(item[criterion] || "").toLowerCase();
        if (option === "startsWith") return currentValue.startsWith(query);
        if (option === "exact") return currentValue === query;
        return currentValue.includes(query);
      });
      setResults(filtered);
      setFeedback("Pesquisa em modo demonstração local.");
      return;
    }

    try {
      setLoading(true);
      setFeedback("");

      const response = await apiRequest(activeTab === "pets" ? "/pets" : "/customers", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      const source = response?.data || [];
      const filtered = source
        .filter((item) => {
          const query = searchValue.trim().toLowerCase();
          const fieldMap =
            activeTab === "pets"
              ? {
                  vacina:
                    item.nextVaccineDate ||
                    item.vaccineDueDate ||
                    item.vaccineDate ||
                    extractObservationValueFromSearch(item.observation, "Vacina"),
                  aniversario: item.birthdate,
                  atendimento: item.lastAppointmentDate || item.lastVisit || item.updatedAt || item.createdAt,
                  breed: item.breed,
                  veterinarian:
                    item.veterinarian ||
                    item.vetName ||
                    extractObservationValueFromSearch(item.observation, "Veterinario"),
                }
              : {
                  name: item.name,
                  debt: item.debt || item.pendingAmount || item.balance || item.observation,
                  email: item.email,
                  phone: item.phone,
                  city: item.city,
                };

          if (activeTab === "pets" && ["vacina", "aniversario", "atendimento"].includes(criterion)) {
            return getDateFilterMatch(fieldMap[criterion], option);
          }

          if (!query) return true;
          const currentValue = String(fieldMap[criterion] || "").toLowerCase();
          if (option === "startsWith") return currentValue.startsWith(query);
          if (option === "exact") return currentValue === query;
          return currentValue.includes(query);
        })
        .map((item) =>
          activeTab === "pets"
            ? {
                id: item.id,
                name: item.name || "Pet",
                detail: item.customerName || item.customer?.name || item.Custumer?.name || "Tutor não informado",
                meta: [item.species, item.breed].filter(Boolean).join(" • ") || "Sem detalhes",
              }
            : {
                id: item.id,
                name: item.name || "Pessoa",
                detail: item.phone || "Telefone não informado",
                meta: [item.email, item.city].filter(Boolean).join(" • ") || "Sem detalhes",
              },
        );

      setResults(filtered);
      setFeedback(filtered.length ? "" : "Nenhum registro encontrado para a pesquisa.");
    } catch (error) {
      setFeedback(error.message || "Não foi possível pesquisar agora.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const criterionOptions = getCriterionOptions(activeTab);
  const optionOptions = getOptionOptions(activeTab, criterion);

  return (
    <div className="search-main-layout">
      <aside className="search-left-panel">
        <div className="search-panel-head">
          <strong>Pesquisa</strong>
        </div>

        <div className="search-panel-body">
          <div className="search-subtabs">
            <button type="button" className={activeTab === "pets" ? "search-subtab active" : "search-subtab"} onClick={() => setActiveTab("pets")}>
              <PetMiniIcon className="search-tab-icon" />
              <span>Pets</span>
            </button>
            <button type="button" className={activeTab === "people" ? "search-subtab active" : "search-subtab"} onClick={() => setActiveTab("people")}>
              <PersonMiniIcon className="search-tab-icon" />
              <span>Pessoas</span>
            </button>
          </div>

          <div className="search-filter-row">
            <div className="search-field">
              <small>Critério</small>
              <select className="field-input search-inline-input" value={criterion} onChange={(event) => setCriterion(event.target.value)}>
                {criterionOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="search-field">
              <small>Opção</small>
              <select className="field-input search-inline-input" value={option} onChange={(event) => setOption(event.target.value)}>
                {optionOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="search-remove-btn"
              onClick={() => {
                setSearchValue("");
                setResults([]);
                setFeedback("");
              }}
            >
              <CloseMiniIcon className="search-btn-icon" />
            </button>
          </div>

          <div className="field-block search-query-field">
            <label>Termo de busca</label>
            <input
              className="field-input"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={
                activeTab === "pets"
                  ? ["vacina", "aniversario", "atendimento"].includes(criterion)
                    ? "Escolha a opção para pesquisar"
                    : criterion === "breed"
                      ? "Digite a raça do pet..."
                      : "Digite o nome do veterinário..."
                  : "Digite nome, telefone, email..."
              }
            />
          </div>

          <div className="search-actions">
            <button type="button" className="footer-btn footer-btn-green" onClick={handleSearch}>
              <SearchMiniIcon className="search-btn-icon" />
              <span>{loading ? "Pesquisando..." : "Pesquisar"}</span>
            </button>
            <button
              type="button"
              className="soft-btn"
              onClick={() => {
                setSearchValue("");
                setResults([]);
                setFeedback("");
              }}
            >
              <ClearMiniIcon className="search-btn-icon" />
              <span>Limpar</span>
            </button>
          </div>
        </div>
      </aside>

      <section className="search-stage">
        <div className="search-stage-head">{activeTab === "pets" ? "Nome do Pet" : "Nome"}</div>
        <div className="search-stage-body">
          {feedback ? <div className="registers-feedback search-feedback">{feedback}</div> : null}
          <div className="search-results-list">
            {results.map((item) => (
              <div key={item.id} className="search-result-row">
                <strong>{item.name}</strong>
                <span>{item.detail}</span>
                <small>{item.meta}</small>
              </div>
            ))}
            {!results.length && !feedback ? <div className="search-empty-state">Faça uma busca para ver os resultados aqui.</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function ViaCentralMainPage() {
  const auth = useAuth();
  const today = new Date();
  const buildEmptyViaCentralOverview = () => ({
    monthlyBars: Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
      return {
        month: monthDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        costHeight: 12,
        profitHeight: 24,
      };
    }),
    serviceLegend: [
      { label: "Estética", value: "R$ 0,00 (0%)" },
      { label: "Consultas", value: "R$ 0,00 (0%)" },
      { label: "Cirurgias", value: "R$ 0,00 (0%)" },
    ],
    productLegend: [
      { label: "Produtos", value: "R$ 0,00 (0%)" },
      { label: "Serviços", value: "R$ 0,00 (0%)" },
    ],
    totals: {
      bruto: 0,
      taxas: 0,
      custos: 0,
      comissoes: 0,
      liquido: 0,
      ticketMedio: 0,
      atendimentos: 0,
    },
  });
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear] = useState(today.getFullYear());
  const [selectedSeller, setSelectedSeller] = useState("all");
  const [sellerOptions, setSellerOptions] = useState([{ value: "all", label: "Total geral" }]);
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState("faturamento");
  const [overview, setOverview] = useState(buildEmptyViaCentralOverview);

  useEffect(() => {
    let active = true;

    async function loadViaCentral() {
      if (!auth.token) {
        if (active) {
          setOverview(buildEmptyViaCentralOverview());
          setSellerOptions([{ value: "all", label: "Total geral" }]);
          setFeedback("Sessão expirada. Entre novamente para carregar a ViaCentral.");
        }
        return;
      }

      if (auth.token === DEMO_AUTH_TOKEN) {
        if (active) {
          setOverview(buildEmptyViaCentralOverview());
          setSellerOptions([{ value: "all", label: "Total geral" }]);
          setFeedback("A ViaCentral usa somente dados reais. Entre com a conta real para visualizar os lançamentos.");
        }
        return;
      }

      try {
        const year = selectedYear;
        const month = selectedMonth;
        const sellerQuery = selectedSeller !== "all" ? `?seller=${encodeURIComponent(selectedSeller)}` : "";
        const summaryStartDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const summaryEndDate = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
        const historyMonths = Array.from({ length: 6 }, (_, index) => {
          const monthDate = new Date(year, month - 1 - (5 - index), 1);
          return {
            year: monthDate.getFullYear(),
            month: monthDate.getMonth() + 1,
            monthLabel: monthDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
            startDate: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}-01`,
            endDate: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}-${String(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()).padStart(2, "0")}`,
          };
        });
        const commonHeaders = {
          Authorization: `Bearer ${auth.token}`,
        };
        const [monthlyResponse, summaryResponse, ...historySummaryResponses] = await Promise.all([
          apiRequest(`/monthly-stats-detailed/${year}/${month}${sellerQuery}`, {
            headers: commonHeaders,
          }),
          apiRequest(`/finance/summary?startDate=${summaryStartDate}&endDate=${summaryEndDate}`, {
            headers: commonHeaders,
          }),
          ...historyMonths.map((item) =>
            apiRequest(`/finance/summary?startDate=${item.startDate}&endDate=${item.endDate}`, {
              headers: commonHeaders,
            }).catch(() => ({ data: {} })),
          ),
        ]);

        if (!active) return;

        const stats = monthlyResponse?.data || monthlyResponse?.stats || {};
        const summary = summaryResponse?.data || {};
        const backendCategories = Array.isArray(stats.serviceCategories) ? stats.serviceCategories : [];
        const defaultServiceItems = [
          { label: "Estética", count: Number(stats.aestheticAppointments?.count || 0), amount: Number(stats.aestheticAppointments?.value || 0) },
          { label: "Consultas", count: Number(stats.clinicalAppointments?.count || 0), amount: Number(stats.clinicalAppointments?.value || 0) },
          { label: "Cirurgias", count: 0, amount: 0 },
        ];
        const serviceItems = (backendCategories.length
          ? backendCategories.map((item) => ({
              label: item.label,
              count: Number(item.count || 0),
              amount: Number(item.value || 0),
            }))
          : defaultServiceItems
        ).filter((item) => item.label);
        const totalServices = serviceItems.reduce((sum, item) => sum + item.amount, 0) || 1;
        const productAmount = Number(stats.products?.value || 0);
        const serviceAmount = serviceItems.reduce((sum, item) => sum + item.amount, 0);
        const totalProducts = productAmount + serviceAmount || 1;
        const totalSales = Number(summary.totalSales || 0);
        const totalFees = Number(summary.taxas?.total || summary.fees?.total || summary.totalFees || 0);
        const totalCosts = Number(summary.saidas?.total || 0);
        const commissions = Number(summary.commissions?.total || 0);
        const estimatedNet = totalSales - totalFees - totalCosts - commissions;
        const totalAppointments = serviceItems.reduce((sum, item) => sum + Number(item.count || 0), 0);
        const sellerStats = Array.isArray(stats.sellers)
          ? stats.sellers
          : Object.entries(stats.sellers || {}).map(([name, sellerData]) => ({
              name,
              ...sellerData,
            }));
        const nextSellerOptions = [
          { value: "all", label: "Total geral" },
          ...sellerStats
            .map((item) => ({
              value: String(item.id || item.name || item.sellerName || "").trim(),
              label: String(item.name || item.sellerName || "").trim(),
            }))
            .filter((item) => item.value && item.label),
        ];
        setSellerOptions(nextSellerOptions);
        if (selectedSeller !== "all" && !nextSellerOptions.some((item) => item.value === selectedSeller)) {
          setSelectedSeller("all");
        }

        setOverview({
          monthlyBars: historyMonths.map((item, index) => {
            const monthSummary = historySummaryResponses[index]?.data || {};
            const monthGross = Number(monthSummary.totalSales || 0);
            const monthFees = Number(monthSummary.taxas?.total || monthSummary.fees?.total || monthSummary.totalFees || 0);
            const monthCosts = Number(monthSummary.saidas?.total || 0);
            const monthCommissions = Number(monthSummary.commissions?.total || 0);
            const monthNet = Math.max(monthGross - monthFees - monthCosts - monthCommissions, 0);
            const highestBase = Math.max(...historySummaryResponses.map((response) => Number(response?.data?.totalSales || 0)), 1);
            return {
              month: item.monthLabel,
              costHeight: 12 + Math.round(((monthCosts + monthFees + monthCommissions) / highestBase) * 90),
              profitHeight: 24 + Math.round((monthNet / highestBase) * 150),
            };
          }),
          serviceLegend: serviceItems.map((item) => ({
            label: item.label,
            value: `R$ ${formatCurrencyBr(item.amount)} (${Math.round((item.amount / totalServices) * 100)}%)`,
          })),
          productLegend: [
            {
              label: "Produtos",
              value: `R$ ${formatCurrencyBr(productAmount)} (${Math.round((productAmount / totalProducts) * 100)}%)`,
            },
            {
              label: "Serviços",
              value: `R$ ${formatCurrencyBr(serviceAmount)} (${Math.round((serviceAmount / totalProducts) * 100)}%)`,
            },
          ],
          totals: {
            bruto: totalSales,
            taxas: totalFees,
            custos: totalCosts,
            comissoes: commissions,
            liquido: estimatedNet,
            ticketMedio: totalAppointments ? totalSales / totalAppointments : totalSales,
            atendimentos: totalAppointments,
          },
        });
        setFeedback("");
      } catch (error) {
        if (active) {
          setOverview(buildEmptyViaCentralOverview());
          setFeedback(error.message || "Não foi possível carregar a ViaCentral.");
        }
      }
    }

    loadViaCentral();

    return () => {
      active = false;
    };
  }, [auth.token, selectedMonth, selectedSeller, selectedYear]);

  const periodLabel = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const availableMonths = Array.from({ length: 12 }, (_, index) => {
    const monthValue = index + 1;
    return {
      value: monthValue,
      label: new Date(selectedYear, index, 1).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
    };
  });

  return (
    <div className="viacentral-layout">
      <div className="viacentral-topbar">
        <div className="viacentral-brand">ViaCentral</div>
        <label className="viacentral-filter viacentral-filter-select">
          <span>Período</span>
          <select value={selectedMonth} onChange={(event) => setSelectedMonth(Number(event.target.value))}>
            {availableMonths.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="viacentral-filter viacentral-filter-select">
          <span>Vendedor</span>
          <select value={selectedSeller} onChange={(event) => setSelectedSeller(event.target.value)}>
            {sellerOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="tabbar viacentral-tabs">
        <button type="button" className={activeTab === "faturamento" ? "tab active" : "tab"} onClick={() => setActiveTab("faturamento")}>
          Faturamento
        </button>
        <button type="button" className={activeTab === "servicos" ? "tab active" : "tab"} onClick={() => setActiveTab("servicos")}>
          Serviços
        </button>
        <button type="button" className={activeTab === "valores" ? "tab active" : "tab"} onClick={() => setActiveTab("valores")}>
          Valores
        </button>
      </div>

      <section className="viacentral-board">
        {feedback ? <div className="registers-feedback">{feedback}</div> : null}
        {activeTab === "faturamento" ? (
          <>
            <div className="viacentral-faturamento-grid">
              <section className="viacentral-chart-card viacentral-faturamento-card">
                <span className="section-kicker">Bruto</span>
                <strong>R$ {formatCurrencyBr(overview.totals.bruto)}</strong>
                <small>Total vendido no período selecionado</small>
              </section>
              <section className="viacentral-chart-card viacentral-faturamento-card viacentral-faturamento-card-warn">
                <span className="section-kicker">Taxas</span>
                <strong>R$ {formatCurrencyBr(overview.totals.taxas)}</strong>
                <small>Descontos de banco e maquininha</small>
              </section>
              <section className="viacentral-chart-card viacentral-faturamento-card viacentral-faturamento-card-highlight">
                <span className="section-kicker">Liquido</span>
                <strong>R$ {formatCurrencyBr(overview.totals.liquido)}</strong>
                <small>Valor real previsto para entrada</small>
              </section>
            </div>
            <section className="viacentral-chart-card viacentral-chart-main">
              <h3>Total Faturado</h3>
              <div className="viacentral-bars">
                {overview.monthlyBars.map((item) => (
                  <div key={item.month} className="viacentral-bar-col">
                    <div className="viacentral-bar-stack">
                      <span className="viacentral-bar-cost" style={{ height: `${item.costHeight}px` }} />
                      <span className="viacentral-bar-profit" style={{ height: `${item.profitHeight}px` }} />
                    </div>
                    <small>{item.month}</small>
                  </div>
                ))}
              </div>
            </section>

            <div className="viacentral-grid">
              <section className="viacentral-chart-card viacentral-services">
                <h3>Serviços Prestados</h3>
                <div className="viacentral-pie-wrap">
                  <div className="viacentral-pie" />
                  <div className="viacentral-legend">
                    {overview.serviceLegend.map((item) => (
                      <p key={item.label}>
                        {item.label}
                        <br />
                        {item.value}
                      </p>
                    ))}
                  </div>
                </div>
              </section>

              <section className="viacentral-chart-card viacentral-products">
                <h3>Produtos Vendidos</h3>
                <div className="viacentral-pie-wrap">
                  <div className="viacentral-pie viacentral-pie-products" />
                  <div className="viacentral-legend">
                    {overview.productLegend.map((item) => (
                      <p key={item.label}>
                        {item.label}
                        <br />
                        {item.value}
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </>
        ) : null}

        {activeTab === "servicos" ? (
          <section className="viacentral-chart-card viacentral-list-card">
            <h3>Desempenho de Serviços</h3>
            <div className="viacentral-list-head">
              <div>Serviço</div>
              <div>Participação</div>
            </div>
            <div className="viacentral-list-body">
              {overview.serviceLegend.map((item) => (
                <div key={item.label} className="viacentral-list-row">
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="viacentral-list-head">
              <div>Categoria</div>
              <div>Participação</div>
            </div>
            <div className="viacentral-list-body">
              {overview.productLegend.map((item) => (
                <div key={item.label} className="viacentral-list-row">
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "valores" ? (
          <div className="viacentral-values-grid">
            <section className="viacentral-chart-card viacentral-value-card">
              <span className="section-kicker">Bruto</span>
              <strong>R$ {formatCurrencyBr(overview.totals.bruto)}</strong>
              <small>Total vendido no período</small>
            </section>
            <section className="viacentral-chart-card viacentral-value-card">
              <span className="section-kicker">Taxas</span>
              <strong>R$ {formatCurrencyBr(overview.totals.taxas)}</strong>
              <small>Taxas bancárias e da maquininha</small>
            </section>
            <section className="viacentral-chart-card viacentral-value-card">
              <span className="section-kicker">Custos</span>
              <strong>R$ {formatCurrencyBr(overview.totals.custos)}</strong>
              <small>Saídas e compras vinculadas</small>
            </section>
            <section className="viacentral-chart-card viacentral-value-card">
              <span className="section-kicker">Comissões</span>
              <strong>R$ {formatCurrencyBr(overview.totals.comissoes)}</strong>
              <small>Comissões do período</small>
            </section>
            <section className="viacentral-chart-card viacentral-value-card viacentral-value-card-highlight">
              <span className="section-kicker">Líquido</span>
              <strong>R$ {formatCurrencyBr(overview.totals.liquido)}</strong>
              <small>Bruto menos custos e comissões</small>
            </section>
            <section className="viacentral-chart-card viacentral-value-card">
              <span className="section-kicker">Ticket médio</span>
              <strong>R$ {formatCurrencyBr(overview.totals.ticketMedio)}</strong>
              <small>Média por atendimento</small>
            </section>
            <section className="viacentral-chart-card viacentral-value-card">
              <span className="section-kicker">Atendimentos</span>
              <strong>{overview.totals.atendimentos}</strong>
              <small>Movimentos considerados</small>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function RegistersModernPageConnected() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("Pacientes");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [patientDeleteConfirm, setPatientDeleteConfirm] = useState(null);
  const [personDeleteConfirm, setPersonDeleteConfirm] = useState(null);
  const [productDeleteConfirm, setProductDeleteConfirm] = useState(null);
  const [serviceDeleteConfirm, setServiceDeleteConfirm] = useState(null);
  const [examDeleteConfirm, setExamDeleteConfirm] = useState(null);
  const [vaccineDeleteConfirm, setVaccineDeleteConfirm] = useState(null);
  const [collections, setCollections] = useState({
    patients: [],
    people: [],
    products: [],
    services: [],
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    const search = searchParams.get("search");

    if (tab && ["Pacientes", "Pessoas", "Produtos", "Servicos", "Exames", "Vacinas"].includes(tab)) {
      setActiveTab(tab);
    }

    if (typeof search === "string") {
      setSearchTerm(search);
      setAppliedSearchTerm(search);
    }
  }, [location.search]);

  useEffect(() => {
    let active = true;

    async function loadRegisters() {
      try {
        setLoading(true);
        setFeedback("");

        if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
          const demoCustomers = readDemoCustomers();
          const demoPatients = readDemoPets();
          const demoProducts = readDemoProducts();
          const demoServices = readDemoServices();

          if (!active) return;

          setCollections({
            patients: demoPatients,
            people: demoCustomers,
            products: demoProducts,
            services: demoServices,
          });

          if (auth.token === DEMO_AUTH_TOKEN) {
            setFeedback("Cadastros em modo demonstracao local.");
          }
          return;
        }

        const safeRequest = async (path) => {
          try {
            return await apiRequest(path, {
              headers: { Authorization: `Bearer ${auth.token}` },
            });
          } catch (error) {
            if (String(error.message || "").toLowerCase().includes("nenhum")) {
              return [];
            }
            throw error;
          }
        };

        const [customersResponse, petsResponse, productsResponse, servicesResponse] = await Promise.all([
          safeRequest("/customers"),
          safeRequest("/pets"),
          safeRequest("/products"),
          safeRequest("/services"),
        ]);

        if (!active) return;

        setCollections({
          people: customersResponse?.data || customersResponse || [],
          patients: petsResponse?.data || petsResponse || [],
          products: productsResponse?.data || productsResponse || [],
          services: servicesResponse?.data || servicesResponse || [],
        });
      } catch (error) {
        if (!active) return;
        setFeedback(error.message || "Nao foi possivel carregar os cadastros.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRegisters();

    return () => {
      active = false;
    };
  }, [auth.token]);

  const query = normalizeSearchableText(appliedSearchTerm.trim());
  const examServices = collections.services.filter((item) => normalizeSearchableText(item.category || "").includes("exam"));
  const vaccineServices = collections.services.filter((item) => normalizeSearchableText(item.category || "").includes("vacin"));
  const peopleById = new Map(collections.people.map((item) => [String(item.id), item]));

  const visiblePatientRows = collections.patients
    .filter((item) => {
      if (!query) return true;

      const linkedPerson =
        peopleById.get(String(item.customerId || item.customer?.id || item.Custumer?.id || "")) ||
        collections.people.find((person) => String(person.name || "").toLowerCase() === String(item.customerName || "").toLowerCase());

      const searchableValues = [
        item.name,
        item.species,
        item.breed,
        item.color,
        item.sex,
        item.birthdate,
        item.customerName,
        item.customerPhone,
        item.observation,
        linkedPerson?.name,
        linkedPerson?.phone,
        linkedPerson?.email,
        linkedPerson?.address,
        linkedPerson?.city,
        linkedPerson?.bairro,
        linkedPerson?.state,
        linkedPerson?.complement,
      ]
        .filter(Boolean)
        .map((value) => normalizeSearchableText(value));

      return searchableValues.some((value) => value.includes(query));
    })
    .map((item) => {
      const linkedPerson =
        peopleById.get(String(item.customerId || item.customer?.id || item.Custumer?.id || "")) ||
        collections.people.find((person) => String(person.name || "").toLowerCase() === String(item.customerName || "").toLowerCase());

      const contactInfo = linkedPerson?.phone || item.customerPhone || "";
      return {
        id: item.id,
        label: `${repairDisplayText(item.name)}${
          item.customerName ? ` (${repairDisplayText(item.customerName)})` : linkedPerson?.name ? ` (${repairDisplayText(linkedPerson.name)})` : ""
        }${
          contactInfo ? ` • ${repairDisplayText(contactInfo)}` : ""
        }`,
        raw: item,
        linkedPerson,
      };
    });

  const visiblePeopleRows = collections.people
    .filter((item) =>
      !query ||
      [item.name, item.phone, item.email, item.instagram]
        .filter(Boolean)
        .some((value) => normalizeSearchableText(value).includes(query)),
    )
    .map((item) => ({
      id: item.id,
      label: `${repairDisplayText(item.name)}${item.phone ? ` - ${repairDisplayText(item.phone)}` : ""}`,
      phone: repairDisplayText(item.phone || ""),
      raw: item,
    }));

  const visibleProductRows = collections.products
    .filter((item) => !query || [item.name, item.category, item.barcode].filter(Boolean).some((value) => normalizeSearchableText(value).includes(query)))
    .map((item) => ({
      id: item.id,
      label: `${repairDisplayText(item.name)}${item.category ? ` (${repairDisplayText(item.category)})` : ""}`,
      raw: item,
    }));

  const visibleServiceRows = collections.services
    .filter((item) => !query || [item.name, item.category].filter(Boolean).some((value) => normalizeSearchableText(value).includes(query)))
    .map((item) => ({
      id: item.id,
      label: `${repairDisplayText(item.name)}${item.category ? ` (${repairDisplayText(item.category)})` : ""}`,
      raw: item,
    }));

  const visibleExamRows = examServices
    .filter((item) => !query || [item.name, item.category, item.description, item.observation].filter(Boolean).some((value) => normalizeSearchableText(value).includes(query)))
    .map((item) => ({
      id: item.id,
      label: `${repairDisplayText(item.name)}${item.category ? ` (${repairDisplayText(item.category)})` : ""}`,
      raw: item,
    }));

  const visibleVaccineRows = vaccineServices
    .filter((item) => !query || [item.name, item.category, item.description, item.observation].filter(Boolean).some((value) => normalizeSearchableText(value).includes(query)))
    .map((item) => ({
      id: item.id,
      label: `${repairDisplayText(item.name)}${item.category ? ` (${repairDisplayText(item.category)})` : ""}`,
      raw: item,
    }));

  async function handleDeletePerson(person) {
    if (!person?.id) return;

    try {
      setFeedback("");

      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        const nextPeople = readDemoCustomers().filter((item) => String(item.id) !== String(person.id));
        const nextPatients = readDemoPets().filter(
          (item) =>
            String(item.customerId || item.customer?.id || item.Custumer?.id || "") !== String(person.id) &&
            String(item.customerName || "").toLowerCase() !== String(person.name || "").toLowerCase(),
        );

        writeDemoCustomers(nextPeople);
        writeDemoPets(nextPatients);

        setCollections((current) => ({
          ...current,
          people: nextPeople,
          patients: nextPatients,
        }));
        setFeedback("Pessoa e pacientes vinculados removidos com sucesso.");
        return;
      }

      await apiRequest("/customers/batch", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          customerIds: [{ id: person.id }],
        }),
      });

      setCollections((current) => ({
        ...current,
        people: current.people.filter((item) => String(item.id) !== String(person.id)),
        patients: current.patients.filter(
          (item) =>
            String(item.customerId || item.customer?.id || item.Custumer?.id || "") !== String(person.id) &&
            String(item.customerName || "").toLowerCase() !== String(person.name || "").toLowerCase(),
        ),
      }));
      setFeedback("Pessoa e pacientes vinculados removidos com sucesso.");
    } catch (error) {
      setFeedback(error.message || "Não foi possível excluir a pessoa.");
    }
  }

  async function handleDeletePatient(patient, linkedPerson) {
    if (!patient?.id) return;

    try {
      setFeedback("");

      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        const nextPatients = readDemoPets().filter((item) => String(item.id) !== String(patient.id));
        writeDemoPets(nextPatients);
        setCollections((current) => ({
          ...current,
          patients: nextPatients,
        }));
        setFeedback("Paciente removido com sucesso.");
        return;
      }

      await apiRequest(`/pets/${patient.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      setCollections((current) => ({
        ...current,
        patients: current.patients.filter((item) => String(item.id) !== String(patient.id)),
      }));
      setFeedback("Paciente removido com sucesso.");
    } catch (error) {
      setFeedback(error.message || "Não foi possível excluir o paciente.");
    }
  }

  async function handleDeleteProduct(product) {
    if (!product?.id) return;

    try {
      setFeedback("");

      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        const nextProducts = readDemoProducts().filter((item) => String(item.id) !== String(product.id));
        writeDemoProducts(nextProducts);
        setCollections((current) => ({ ...current, products: nextProducts }));
        setFeedback("Produto removido com sucesso.");
        return;
      }

      await apiRequest("/deleteproduct", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ id: product.id }),
      });

      setCollections((current) => ({
        ...current,
        products: current.products.filter((item) => String(item.id) !== String(product.id)),
      }));
      setFeedback("Produto removido com sucesso.");
    } catch (error) {
      setFeedback(error.message || "Não foi possível excluir o produto.");
    }
  }

  async function handleDeleteService(service) {
    if (!service?.id) return;

    try {
      setFeedback("");

      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        const nextServices = readDemoServices().filter((item) => String(item.id) !== String(service.id));
        writeDemoServices(nextServices);
        setCollections((current) => ({ ...current, services: nextServices }));
        setFeedback("Serviço removido com sucesso.");
        return;
      }

      await apiRequest("/services", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ id: service.id }),
      });

      setCollections((current) => ({
        ...current,
        services: current.services.filter((item) => String(item.id) !== String(service.id)),
      }));
      setFeedback("Serviço removido com sucesso.");
    } catch (error) {
      setFeedback(error.message || "Não foi possível excluir o serviço.");
    }
  }

  const tabConfig = {
    Pacientes: {
      newLabel: "+ Novo Paciente",
      newPath: "/cadastros/novo-paciente",
      searchPlaceholder: "Buscar paciente, tutor ou telefone",
      head: "Lista de Pacientes",
      rows: visiblePatientRows,
    },
    Pessoas: {
      newLabel: "+ Novo Tutor",
      newPath: "/cadastros/nova-pessoa",
      searchPlaceholder: "Buscar tutor, telefone ou email",
      head: "Lista de Tutores",
      rows: visiblePeopleRows.map((item) => item.label),
    },
    Produtos: {
      newLabel: "+ Novo Produto",
      newPath: "/cadastros/novo-produto",
      searchPlaceholder: "Buscar produto, categoria ou codigo",
      head: "Lista de Produtos",
      rows: visibleProductRows.map((item) => item.label),
    },
    Servicos: {
      newLabel: "+ Novo Serviço",
      newPath: "/cadastros/novo-servico",
      searchPlaceholder: "Buscar serviço ou categoria",
      head: "Lista de Serviços",
      rows: visibleServiceRows.map((item) => item.label),
    },
    Exames: {
      newLabel: "+ Novo Exame",
      newPath: "/cadastros/novo-exame",
      searchPlaceholder: "Buscar exame cadastrado",
      head: "Lista de Exames",
      rows: visibleExamRows,
    },
    Vacinas: {
      newLabel: "+ Gerenciar Vacinas",
      newPath: "/cadastros/vacinas",
      searchPlaceholder: "Buscar vacina cadastrada",
      head: "Lista de Vacinas",
      rows: visibleVaccineRows,
    },
  };

  const current = tabConfig[activeTab];
  const activeTabLabel =
    activeTab === "Pessoas" ? "Tutores" : activeTab === "Servicos" ? "Serviços" : activeTab;

  function handleApplyRegistersSearch() {
    setAppliedSearchTerm(searchTerm);
  }

  function handleRegistersSearchKeyDown(event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleApplyRegistersSearch();
  }

  function buildRegisterExportRows() {
    if (activeTab === "Pacientes") {
      return visiblePatientRows.map((item) => ({
        Nome: repairDisplayText(item.raw?.name || ""),
        Tutor: repairDisplayText(item.linkedPerson?.name || item.raw?.customerName || ""),
        Telefone: repairDisplayText(item.linkedPerson?.phone || item.raw?.customerPhone || ""),
        Especie: repairDisplayText(item.raw?.species || ""),
        Raca: repairDisplayText(item.raw?.breed || ""),
      }));
    }

    if (activeTab === "Pessoas") {
      return visiblePeopleRows.map((item) => ({
        Nome: repairDisplayText(item.raw?.name || ""),
        Telefone: repairDisplayText(item.raw?.phone || ""),
        Email: repairDisplayText(item.raw?.email || ""),
        Instagram: repairDisplayText(item.raw?.instagram || ""),
      }));
    }

    if (activeTab === "Produtos") {
      return visibleProductRows.map((item) => ({
        Nome: repairDisplayText(item.raw?.name || ""),
        Categoria: repairDisplayText(item.raw?.category || ""),
        Codigo: repairDisplayText(item.raw?.barcode || ""),
      }));
    }

    if (activeTab === "Servicos") {
      return visibleServiceRows.map((item) => ({
        Nome: repairDisplayText(item.raw?.name || ""),
        Categoria: repairDisplayText(item.raw?.category || ""),
      }));
    }

    if (activeTab === "Exames") {
      return visibleExamRows.map((item) => ({
        Nome: repairDisplayText(item.raw?.name || ""),
        Categoria: repairDisplayText(item.raw?.category || ""),
        Descricao: repairDisplayText(item.raw?.description || ""),
      }));
    }

    if (activeTab === "Vacinas") {
      return visibleVaccineRows.map((item) => ({
        Nome: repairDisplayText(item.raw?.name || ""),
        Categoria: repairDisplayText(item.raw?.category || ""),
        Descricao: repairDisplayText(item.raw?.description || ""),
      }));
    }

    return [];
  }

  function handlePrintRegisters() {
    window.print();
  }

  function handleExportRegisters() {
    const rows = buildRegisterExportRows();

    if (!rows.length) {
      setFeedback("Não há dados para exportar.");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(";"),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header] || "").replaceAll('"', '""')}"`)
          .join(";"),
      ),
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cadastros-${activeTabLabel.toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-grid">
      <section className="registers-screen">
        <div className="registers-head">
          <strong>Cadastros</strong>
        </div>

        <div className="registers-tabbar">
          {["Pacientes", "Pessoas", "Produtos", "Servicos", "Exames", "Vacinas"].map((tab) => (
            <button
              key={tab}
              className={tab === activeTab ? "registers-main-tab active" : "registers-main-tab"}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "Pessoas" ? "Tutores" : tab === "Servicos" ? "Serviços" : tab}
            </button>
          ))}
        </div>

        <div className="registers-board">
          <div className="registers-toolbar">
            <div className="registers-toolbar-left">
              <NavLink to={current.newPath} className="registers-new-btn registers-link-btn">
                {current.newLabel}
              </NavLink>
              <input
                className="registers-search-box"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={handleRegistersSearchKeyDown}
                placeholder={current.searchPlaceholder}
              />
              <button type="button" className="registers-icon-btn" onClick={handleApplyRegistersSearch}>
                Buscar
              </button>
              <button type="button" className="registers-icon-btn" onClick={handlePrintRegisters}>
                Imprimir
              </button>
              <button type="button" className="registers-icon-btn" onClick={handleExportRegisters}>
                Excel
              </button>
            </div>
          </div>

          <div className="registers-list-head">{current.head}</div>
          {feedback ? <div className="registers-feedback">{feedback}</div> : null}

          <div className="registers-list">
            {loading ? <div className="registers-row">Carregando cadastros...</div> : null}
            {!loading &&
            ((activeTab === "Pessoas"
              ? visiblePeopleRows.length === 0
              : activeTab === "Pacientes"
                ? visiblePatientRows.length === 0
                : activeTab === "Produtos"
                  ? visibleProductRows.length === 0
                  : activeTab === "Servicos"
                    ? visibleServiceRows.length === 0
                    : activeTab === "Exames"
                      ? visibleExamRows.length === 0
                      : activeTab === "Vacinas"
                        ? visibleVaccineRows.length === 0
                    : current.rows.length === 0)) ? (
              <div className="registers-row">Nenhum cadastro encontrado.</div>
            ) : null}
            {!loading &&
              (activeTab === "Pessoas"
                ? visiblePeopleRows.map((item) => (
                    <div key={item.id} className="registers-row registers-row-action">
                      <button type="button" className="registers-open-inline" onClick={() => navigate("/cadastros/nova-pessoa", { state: { person: item.raw } })}>
                        {item.label}
                      </button>
                      {item.phone ? (
                        <button
                          type="button"
                          className="registers-whatsapp-inline"
                          onClick={() =>
                            navigate(
                              buildMessagesRoute({
                                search: item.phone || item.raw?.name || "",
                                customerId: item.raw?.id || "",
                                phone: item.phone || item.raw?.phone || "",
                                customerName: item.raw?.name || "",
                                title: item.raw?.name || item.phone || "",
                                source: "registers-person",
                              }),
                            )
                          }
                          aria-label={`Abrir CRM para ${item.raw?.name || "tutor"}`}
                          title="Abrir CRM"
                        >
                          <WhatsappMiniIcon className="registers-whatsapp-inline-icon" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="registers-delete-inline"
                        onClick={() => setPersonDeleteConfirm(item.raw)}
                        aria-label={`Excluir ${item.raw?.name || "tutor"}`}
                      >
                        🗑
                        </button>
                      </div>
                    ))
                : activeTab === "Pacientes"
                  ? visiblePatientRows.map((item) => (
                      <div key={item.id} className="registers-row registers-row-action">
                        <button
                          type="button"
                          className="registers-open-inline"
                          onClick={() => navigate("/cadastros/novo-paciente", { state: { patient: item.raw } })}
                        >
                          {item.label}
                        </button>
                        {(item.linkedPerson?.phone || item.raw?.customerPhone || item.raw?.phone || item.raw?.customerId || item.raw?.Custumer?.id) ? (
                          <button
                            type="button"
                            className="registers-whatsapp-inline"
                            onClick={() =>
                              navigate(
                                buildMessagesRoute({
                                  search:
                                    item.linkedPerson?.phone ||
                                    item.raw?.customerPhone ||
                                    item.raw?.name ||
                                    "",
                                  customerId:
                                    item.linkedPerson?.id ||
                                    item.raw?.customerId ||
                                    item.raw?.customer?.id ||
                                    item.raw?.Custumer?.id ||
                                    "",
                                  petId: item.raw?.id || "",
                                  phone:
                                    item.linkedPerson?.phone ||
                                    item.raw?.customerPhone ||
                                    item.raw?.phone ||
                                    "",
                                  customerName:
                                    item.linkedPerson?.name ||
                                    item.raw?.customerName ||
                                    item.raw?.customer?.name ||
                                    item.raw?.Custumer?.name ||
                                    "",
                                  petName: item.raw?.name || "",
                                  title:
                                    item.linkedPerson?.name ||
                                    item.raw?.customerName ||
                                    item.raw?.name ||
                                    "",
                                  source: "registers-patient",
                                }),
                              )
                            }
                            aria-label={`Abrir CRM para ${item.raw?.name || "paciente"}`}
                            title="Abrir CRM"
                          >
                            <WhatsappMiniIcon className="registers-whatsapp-inline-icon" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="registers-delete-inline"
                          onClick={() => setPatientDeleteConfirm({ patient: item.raw, linkedPerson: item.linkedPerson })}
                          aria-label={`Excluir ${item.raw?.name || "paciente"}`}
                        >
                          🗑
                        </button>
                      </div>
                    ))
                  : activeTab === "Produtos"
                    ? visibleProductRows.map((item) => (
                        <div key={item.id} className="registers-row registers-row-action">
                          <button
                            type="button"
                            className="registers-open-inline"
                            onClick={() => navigate("/cadastros/novo-produto", { state: { product: item.raw } })}
                          >
                            {item.label}
                          </button>
                          <button
                            type="button"
                            className="registers-delete-inline"
                            onClick={() => setProductDeleteConfirm(item.raw)}
                            aria-label={`Excluir ${item.raw?.name || "produto"}`}
                          >
                            🗑
                          </button>
                        </div>
                      ))
                    : activeTab === "Servicos"
                      ? visibleServiceRows.map((item) => (
                          <div key={item.id} className="registers-row registers-row-action">
                            <button
                              type="button"
                              className="registers-open-inline"
                              onClick={() => navigate("/cadastros/novo-servico", { state: { service: item.raw } })}
                            >
                              {item.label}
                            </button>
                            <button
                              type="button"
                              className="registers-delete-inline"
                              onClick={() => setServiceDeleteConfirm(item.raw)}
                              aria-label={`Excluir ${item.raw?.name || "servico"}`}
                            >
                              🗑
                            </button>
                          </div>
                        ))
                      : activeTab === "Exames"
                        ? visibleExamRows.map((item) => (
                            <div key={item.id} className="registers-row registers-row-action">
                              <button
                                type="button"
                                className="registers-open-inline"
                                onClick={() => navigate("/cadastros/novo-exame", { state: { exam: item.raw } })}
                              >
                                {item.label}
                              </button>
                              <button
                                type="button"
                                className="registers-delete-inline"
                                onClick={() => setExamDeleteConfirm(item.raw)}
                                aria-label={`Excluir ${item.raw?.name || "exame"}`}
                              >
                                🗑
                              </button>
                            </div>
                          ))
                        : activeTab === "Vacinas"
                          ? visibleVaccineRows.map((item) => (
                              <div key={item.id} className="registers-row registers-row-action">
                                <button
                                  type="button"
                                  className="registers-open-inline"
                                  onClick={() => navigate("/cadastros/nova-vacina", { state: { vaccine: item.raw } })}
                                >
                                  {item.label}
                                </button>
                                <button
                                  type="button"
                                  className="registers-delete-inline"
                                  onClick={() => setVaccineDeleteConfirm(item.raw)}
                                aria-label={`Excluir ${item.raw?.name || "vacina"}`}
                              >
                                  🗑
                                </button>
                              </div>
                            ))
                          : current.rows.map((item) => (
                              <div key={item} className="registers-row">
                                {item}
                              </div>
                            )))}
          </div>
        </div>
      </section>

      {personDeleteConfirm ? (
        <div className="user-modal-overlay">
          <div className="confirm-modal">
            <h3>Excluir tutor</h3>
            <p>
              Deseja mesmo excluir <strong>{personDeleteConfirm.name || "este tutor"}</strong>?
            </p>
            <p>Os pacientes vinculados a esse tutor também serão removidos.</p>
            <div className="confirm-modal-actions">
              <button type="button" className="footer-btn patient-cancel-btn" onClick={() => setPersonDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="footer-btn footer-btn-green"
                onClick={async () => {
                  const pendingPerson = personDeleteConfirm;
                  setPersonDeleteConfirm(null);
                  await handleDeletePerson(pendingPerson);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {patientDeleteConfirm ? (
        <div className="user-modal-overlay">
          <div className="confirm-modal">
            <h3>Excluir paciente</h3>
            <p>
              Deseja mesmo excluir <strong>{patientDeleteConfirm.patient?.name || "este paciente"}</strong>?
            </p>
            <p>
              {patientDeleteConfirm.linkedPerson?.name || patientDeleteConfirm.patient?.customerName
                ? `Este paciente esta vinculado a ${patientDeleteConfirm.linkedPerson?.name || patientDeleteConfirm.patient?.customerName}.`
                : "Esta acao remove apenas o cadastro do paciente."}
            </p>
            <div className="confirm-modal-actions">
              <button type="button" className="footer-btn patient-cancel-btn" onClick={() => setPatientDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="footer-btn footer-btn-green"
                onClick={async () => {
                  const pendingPatient = patientDeleteConfirm;
                  setPatientDeleteConfirm(null);
                  await handleDeletePatient(pendingPatient.patient, pendingPatient.linkedPerson);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {productDeleteConfirm ? (
        <div className="user-modal-overlay">
          <div className="confirm-modal">
            <h3>Excluir produto</h3>
            <p>
              Deseja mesmo excluir <strong>{productDeleteConfirm.name || "este produto"}</strong>?
            </p>
            <div className="confirm-modal-actions">
              <button type="button" className="footer-btn patient-cancel-btn" onClick={() => setProductDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="footer-btn footer-btn-green"
                onClick={async () => {
                  const pendingProduct = productDeleteConfirm;
                  setProductDeleteConfirm(null);
                  await handleDeleteProduct(pendingProduct);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {serviceDeleteConfirm ? (
        <div className="user-modal-overlay">
          <div className="confirm-modal">
            <h3>Excluir serviço</h3>
            <p>
              Deseja mesmo excluir <strong>{serviceDeleteConfirm.name || "este serviço"}</strong>?
            </p>
            <div className="confirm-modal-actions">
              <button type="button" className="footer-btn patient-cancel-btn" onClick={() => setServiceDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="footer-btn footer-btn-green"
                onClick={async () => {
                  const pendingService = serviceDeleteConfirm;
                  setServiceDeleteConfirm(null);
                  await handleDeleteService(pendingService);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {examDeleteConfirm ? (
        <div className="user-modal-overlay">
          <div className="confirm-modal">
            <h3>Excluir exame</h3>
            <p>
              Deseja mesmo excluir <strong>{examDeleteConfirm.name || "este exame"}</strong>?
            </p>
            <div className="confirm-modal-actions">
              <button type="button" className="footer-btn patient-cancel-btn" onClick={() => setExamDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="footer-btn footer-btn-green"
                onClick={async () => {
                  const pendingExam = examDeleteConfirm;
                  setExamDeleteConfirm(null);
                  await handleDeleteService(pendingExam);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {vaccineDeleteConfirm ? (
        <div className="user-modal-overlay">
          <div className="confirm-modal">
            <h3>Excluir vacina</h3>
            <p>
              Deseja mesmo excluir <strong>{vaccineDeleteConfirm.name || "esta vacina"}</strong>?
            </p>
            <div className="confirm-modal-actions">
              <button type="button" className="footer-btn patient-cancel-btn" onClick={() => setVaccineDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="footer-btn footer-btn-green"
                onClick={async () => {
                  const pendingVaccine = vaccineDeleteConfirm;
                  setVaccineDeleteConfirm(null);
                  await handleDeleteService(pendingVaccine);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NewProductFormPageConnected() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingProduct = location.state?.product || null;
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Higiene",
    taxable: "Padrao",
    brand: "",
    supplier: "",
    barcode: "",
    expiration: "",
    stockMin: "0",
    stockCurrent: "0",
    unit: "Unidade",
    cost: "0",
    margin: "0",
    price: "0",
    commission: "0",
    observation: "",
  });

  useEffect(() => {
    if (!editingProduct) return;

    setForm((current) => ({
      ...current,
      id: editingProduct.id || current.id,
      name: editingProduct.name || "",
      type: editingProduct.category || current.type,
      taxable: extractObservationValue(editingProduct.observation, "Tributacao") || current.taxable,
      brand: extractObservationValue(editingProduct.description, "Marca"),
      supplier: extractObservationValue(editingProduct.description, "Fornecedor"),
      barcode: editingProduct.barcode || "",
      expiration: extractObservationValue(editingProduct.observation, "Validade") || "",
      stockMin: extractObservationValue(editingProduct.observation, "Estoque minimo") || current.stockMin,
      stockCurrent: String(editingProduct.stoke ?? current.stockCurrent),
      unit: editingProduct.unit || current.unit,
      cost: extractObservationValue(editingProduct.observation, "Custo") || current.cost,
      margin: extractObservationValue(editingProduct.observation, "Margem") || current.margin,
      price: String(editingProduct.price ?? current.price),
      commission: extractObservationValue(editingProduct.observation, "Comissao") || current.commission,
      observation: String(editingProduct.observation || "")
        .split("|")
        .map((item) => item.trim())
        .filter(
          (item) =>
            item &&
            ![
              "Tributacao:",
              "Validade:",
              "Estoque minimo:",
              "Unidade:",
              "Custo:",
              "Margem:",
              "Comissao:",
              "Taxa bancaria:",
              "Taxa debito:",
              "Taxa credito:",
              "Taxa parcelamento:",
              "Taxa pix:",
            ].some((prefix) => item.toLowerCase().startsWith(prefix.toLowerCase())),
        )
        .join(" | "),
    }));
  }, [editingProduct]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!form.name.trim()) {
      setFeedback("Preencha pelo menos o nome do produto.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: `${form.brand ? `Marca: ${form.brand}` : ""}${form.supplier ? ` | Fornecedor: ${form.supplier}` : ""}`.trim(),
      price: Number(form.price || 0),
      stoke: Number(form.stockCurrent || 0),
      unitary: true,
      category: form.type,
      observation: [
        form.observation,
        form.taxable ? `Tributacao: ${form.taxable}` : "",
        form.expiration ? `Validade: ${form.expiration}` : "",
        form.stockMin ? `Estoque minimo: ${form.stockMin}` : "",
        form.unit ? `Unidade: ${form.unit}` : "",
        form.cost ? `Custo: ${form.cost}` : "",
        form.margin ? `Margem: ${form.margin}` : "",
        form.commission ? `Comissao: ${form.commission}` : "",
      ].filter(Boolean).join(" | "),
      barcode: form.barcode,
      unit: form.unit,
    };

    try {
      setIsSubmitting(true);

      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        persistDemoProduct(payload);
      } else {
        const endpoint = editingProduct?.id ? "/editProduct" : "/addProduct";
        const requestPayload = editingProduct?.id ? { ...payload, id: editingProduct.id, cost: Number(form.cost || 0) } : payload;

        try {
          await apiRequest(endpoint, {
            method: editingProduct?.id ? "PUT" : "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify(requestPayload),
          });
        } catch (error) {
          if (!isLegacyPositivePriceValidationError(error.message) || Number(payload.price) > 0) {
            throw error;
          }

          await apiRequest(endpoint, {
            method: editingProduct?.id ? "PUT" : "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify({
              ...requestPayload,
              price: 0.01,
            }),
          });
        }
      }

      navigate("/cadastros?tab=Produtos");
    } catch (error) {
      const message = error.message || "Nao foi possivel salvar o produto.";
      if (/token|sessao|authoriz/i.test(message)) {
        persistDemoProduct(payload);
        setFeedback("Sessao expirada. Produto salvo localmente para voce nao perder o cadastro.");
        navigate("/cadastros?tab=Produtos");
        return;
      }
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="patient-form-shell">
      <form className="patient-form-card" onSubmit={handleSubmit}>
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">Cadastro produto</span>
            <h2>{editingProduct ? "Editar Produto" : "Novo Produto"}</h2>
          </div>
          <NavLink to="/cadastros?tab=Produtos" className="ghost-btn toolbar-link">Voltar</NavLink>
        </div>

        <div className="patient-form-main">
          <EditableField label="Nome" value={form.name} onChange={(value) => update("name", value)} />

          <div className="patient-grid product-grid-top">
            <EditableField label="Tipo de produto" value={form.type} onChange={(value) => update("type", value)} />
            <EditableField label="Tributacao" value={form.taxable} onChange={(value) => update("taxable", value)} />
            <EditableField label="Codigo de barras" value={form.barcode} onChange={(value) => update("barcode", value)} />
          </div>

          <div className="patient-section">
            <h3>Informacoes do Produto</h3>
            <div className="patient-grid patient-grid-top">
              <EditableField label="Marca" value={form.brand} onChange={(value) => update("brand", value)} />
              <EditableField label="Fornecedor" value={form.supplier} onChange={(value) => update("supplier", value)} />
            </div>
            <div className="patient-grid patient-grid-top">
              <EditableField label="Validade" value={form.expiration} onChange={(value) => update("expiration", value)} />
              <EditableField label="Unidade" value={form.unit} onChange={(value) => update("unit", value)} />
            </div>
          </div>

          <div className="patient-section">
            <h3>Estoque</h3>
            <div className="patient-grid product-grid-stock">
              <EditableField label="Estoque minimo" type="number" value={form.stockMin} onChange={(value) => update("stockMin", value)} />
              <EditableField label="Estoque atual" type="number" value={form.stockCurrent} onChange={(value) => update("stockCurrent", value)} />
            </div>
          </div>

          <div className="patient-section">
            <h3>Precificacao</h3>
            <div className="patient-grid product-grid-pricing">
              <EditableField label="Preco de custo" type="number" value={form.cost} onChange={(value) => update("cost", value)} />
              <EditableField label="Margem" value={form.margin} onChange={(value) => update("margin", value)} />
              <EditableField label="Preco de venda" type="number" value={form.price} onChange={(value) => update("price", value)} />
              <EditableField label="Comissao" value={form.commission} onChange={(value) => update("commission", value)} />
            </div>
          </div>

          <EditableTextArea label="Observacoes" value={form.observation} onChange={(value) => update("observation", value)} />
        </div>

        {feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="patient-form-footer patient-form-footer-right">
          <div className="patient-form-actions">
            <button className="footer-btn footer-btn-green" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
            <button className="footer-btn patient-cancel-btn" type="button" onClick={() => navigate("/cadastros?tab=Produtos")}>
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function NewServiceFormPageConnected() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingService = location.state?.service || null;
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Consultas",
    description: "",
    observation: "",
    cost: "0,00",
    price: "0,00",
    duration: "",
    agreementService: "",
    agreementLimit: "",
  });

  useEffect(() => {
    if (!editingService) return;

    setForm((current) => ({
      ...current,
      id: editingService.id || current.id,
      name: editingService.name || "",
      category: editingService.category || current.category,
      description: editingService.description || "",
      observation: String(editingService.observation || "")
        .split("|")
        .map((item) => item.trim())
        .filter((item) => item && !item.toLowerCase().startsWith("servico conveniado:") && !item.toLowerCase().startsWith("limite convenio:"))
        .join(" | "),
      cost: formatCurrencyBr(editingService.cost ?? current.cost),
      price: formatCurrencyBr(editingService.price ?? current.price),
      duration: editingService.duration ? String(editingService.duration) : "",
      agreementService: extractObservationValue(editingService.observation, "Servico conveniado"),
      agreementLimit: extractObservationValue(editingService.observation, "Limite convenio"),
    }));
  }, [editingService]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateCurrencyField(field, value) {
    const numericValue = parseCurrencyLike(value);
    setForm((current) => ({
      ...current,
      [field]: formatCurrencyBr(numericValue),
    }));
  }

  async function saveService(payload) {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      persistDemoService(payload);
      return;
    }

    const requestPayload = editingService?.id ? { ...payload, id: editingService.id } : payload;

    try {
      await apiRequest("/services", {
        method: editingService?.id ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify(requestPayload),
      });
    } catch (error) {
      if (!isLegacyPositivePriceValidationError(error.message) || Number(payload.price) > 0) {
        throw error;
      }

      await apiRequest("/services", {
        method: editingService?.id ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          ...requestPayload,
          price: 0.01,
        }),
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!form.name.trim()) {
      setFeedback("Preencha pelo menos o nome do servico.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description,
      price: parseCurrencyLike(form.price),
      duration: form.duration ? Number(form.duration) : null,
      category: form.category,
      cost: parseCurrencyLike(form.cost),
      observation: [
        form.observation,
        form.agreementService ? `Servico conveniado: ${form.agreementService}` : "",
        form.agreementLimit ? `Limite convenio: ${form.agreementLimit}` : "",
      ].filter(Boolean).join(" | "),
    };

    try {
      setIsSubmitting(true);
      await saveService(payload);
      navigate("/cadastros?tab=Servicos");
    } catch (error) {
      const message = error.message || "Nao foi possivel salvar o servico.";
      if (/token|sessao|authoriz/i.test(message)) {
        persistDemoService(payload);
        setFeedback("Sessao expirada. Servico salvo localmente para voce nao perder o cadastro.");
        navigate("/cadastros?tab=Servicos");
        return;
      }
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="patient-form-shell">
      <form className="patient-form-card" onSubmit={handleSubmit}>
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">Cadastro servico</span>
            <h2>{editingService ? "Editar Servico" : "Novo Servico"}</h2>
          </div>
          <NavLink to="/cadastros?tab=Servicos" className="ghost-btn toolbar-link">Voltar</NavLink>
        </div>

        <div className="patient-form-main">
          <EditableField label="Nome" value={form.name} onChange={(value) => update("name", value)} />

          <div className="patient-grid exam-grid-top">
            <EditableSelectField
              label="Tipo de servico"
              value={form.category}
              onChange={(value) => update("category", value)}
              options={["Cirurgias", "Consultas", "Convenios", "Estetica", "Exames", "Outros", "Vacinas"]}
            />
            <EditableField label="Duracao (min)" value={form.duration} onChange={(value) => update("duration", value)} />
          </div>

          <div className="patient-section">
            <h3>Precificacao</h3>
            <div className="service-pricing-grid">
              <EditableField label="Preco de custo" value={form.cost} onChange={(value) => updateCurrencyField("cost", value)} />
              <EditableField label="Preco de venda" value={form.price} onChange={(value) => updateCurrencyField("price", value)} />
            </div>
          </div>

          {form.category === "Convenios" ? (
            <div className="patient-section">
              <h3>Tabela do Convenio</h3>
              <div className="patient-grid exam-grid-top">
                <EditableField label="Servico conveniado" value={form.agreementService} onChange={(value) => update("agreementService", value)} />
                <EditableField label="Limite do convenio" value={form.agreementLimit} onChange={(value) => update("agreementLimit", value)} />
              </div>
            </div>
          ) : null}

          <EditableTextArea label="Descricao" value={form.description} onChange={(value) => update("description", value)} />
          <EditableTextArea label="Observacoes" value={form.observation} onChange={(value) => update("observation", value)} />
        </div>

        {feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="patient-form-footer patient-form-footer-right">
          <div className="patient-form-actions">
            <button className="footer-btn footer-btn-green" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
            <button className="footer-btn patient-cancel-btn" type="button" onClick={() => navigate("/cadastros?tab=Servicos")}>
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function NewExamFormPageConnected({ embedded = false, onClose, onSaved } = {}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingExam = location.state?.exam || null;
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Exames",
    sector: "Exames",
    resultDeadline: "",
    material: "",
    sample: "",
    method: "",
    partnerLab: "",
    tussCode: "",
    prepValidity: "",
    fasting: "",
    restriction: "",
    prepObservation: "",
    cost: "0",
    price: "0",
  });

  useEffect(() => {
    if (!editingExam) return;

    setForm((current) => ({
      ...current,
      id: editingExam.id || current.id,
      name: editingExam.name || "",
      category: editingExam.category || current.category,
      sector: extractObservationValue(editingExam.observation, "Setor") || current.sector,
      resultDeadline: extractObservationValue(editingExam.observation, "Prazo") || current.resultDeadline,
      material: extractObservationValue(editingExam.description, "Material"),
      sample: extractObservationValue(editingExam.description, "Amostra"),
      method: extractObservationValue(editingExam.description, "Metodo"),
      partnerLab: extractObservationValue(editingExam.description, "Laboratorio"),
      tussCode: extractObservationValue(editingExam.description, "Codigo TUSS"),
      prepValidity: extractObservationValue(editingExam.observation, "Validade preparo") || current.prepValidity,
      fasting: extractObservationValue(editingExam.observation, "Jejum") || current.fasting,
      restriction: extractObservationValue(editingExam.observation, "Restricao") || current.restriction,
      prepObservation: String(editingExam.observation || "")
        .split("|")
        .map((item) => item.trim())
        .filter(
          (item) =>
            item &&
            !item.toLowerCase().startsWith("setor:") &&
            !item.toLowerCase().startsWith("prazo:") &&
            !item.toLowerCase().startsWith("validade preparo:") &&
            !item.toLowerCase().startsWith("jejum:") &&
            !item.toLowerCase().startsWith("restricao:"),
        )
        .join(" | "),
      cost: String(editingExam.cost ?? current.cost),
      price: String(editingExam.price ?? current.price),
    }));
  }, [editingExam]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!form.name.trim()) {
      setFeedback("Preencha pelo menos o nome do exame.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: [
        form.material ? `Material: ${form.material}` : "",
        form.sample ? `Amostra: ${form.sample}` : "",
        form.method ? `Metodo: ${form.method}` : "",
        form.partnerLab ? `Laboratorio: ${form.partnerLab}` : "",
        form.tussCode ? `Codigo TUSS: ${form.tussCode}` : "",
      ].filter(Boolean).join(" | "),
      price: Number(form.price || 0),
      duration: null,
      category: form.category,
      cost: Number(form.cost || 0),
      observation: [
        form.sector ? `Setor: ${form.sector}` : "",
        form.resultDeadline ? `Prazo: ${form.resultDeadline}` : "",
        form.prepValidity ? `Validade preparo: ${form.prepValidity}` : "",
        form.fasting ? `Jejum: ${form.fasting}` : "",
        form.restriction ? `Restricao: ${form.restriction}` : "",
        form.prepObservation,
      ].filter(Boolean).join(" | "),
    };

    try {
      setIsSubmitting(true);

      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        persistDemoService({ ...payload, id: editingExam?.id });
      } else {
        const requestPayload = editingExam?.id ? { ...payload, id: editingExam.id } : payload;

        try {
          await apiRequest("/services", {
            method: editingExam?.id ? "PUT" : "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify(requestPayload),
          });
        } catch (error) {
          if (!isLegacyPositivePriceValidationError(error.message) || Number(payload.price) > 0) {
            throw error;
          }

          await apiRequest("/services", {
            method: editingExam?.id ? "PUT" : "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify({
              ...requestPayload,
              price: 0.01,
            }),
          });
        }
      }

      if (embedded) {
        onSaved?.();
      } else {
        navigate("/cadastros?tab=Exames");
      }
    } catch (error) {
      const message = error.message || "Nao foi possivel salvar o exame.";
      if (/token|sessao|authoriz/i.test(message)) {
        persistDemoService({ ...payload, id: editingExam?.id });
        setFeedback("Sessao expirada. Exame salvo localmente para voce nao perder o cadastro.");
        if (embedded) {
          onSaved?.();
        } else {
          navigate("/cadastros?tab=Exames");
        }
        return;
      }
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="patient-form-shell">
      <form className="patient-form-card" onSubmit={handleSubmit}>
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">Cadastro exame</span>
            <h2>{editingExam ? "Editar Exame" : "Novo Exame"}</h2>
          </div>
          {embedded ? (
            <button type="button" className="ghost-btn toolbar-link" onClick={() => onClose?.()}>
              Fechar
            </button>
          ) : (
            <NavLink to="/cadastros?tab=Exames" className="ghost-btn toolbar-link">Voltar</NavLink>
          )}
        </div>

        <div className="patient-form-main">
          <div className="patient-grid exam-grid-top">
            <EditableField label="Nome do exame" value={form.name} onChange={(value) => update("name", value)} />
            <EditableField label="Categoria" value={form.category} onChange={(value) => update("category", value)} />
          </div>

          <div className="patient-grid exam-grid-top">
            <EditableField label="Setor" value={form.sector} onChange={(value) => update("sector", value)} />
            <EditableField label="Prazo do resultado" value={form.resultDeadline} onChange={(value) => update("resultDeadline", value)} />
          </div>

          <div className="patient-section">
            <h3>Coleta e Processamento</h3>
            <div className="patient-grid exam-grid-three">
              <EditableField label="Material" value={form.material} onChange={(value) => update("material", value)} />
              <EditableField label="Amostra" value={form.sample} onChange={(value) => update("sample", value)} />
              <EditableField label="Metodo" value={form.method} onChange={(value) => update("method", value)} />
            </div>
            <div className="patient-grid exam-grid-three">
              <EditableField label="Laboratorio parceiro" value={form.partnerLab} onChange={(value) => update("partnerLab", value)} />
              <EditableField label="Codigo TUSS" value={form.tussCode} onChange={(value) => update("tussCode", value)} />
              <EditableField label="Validade do preparo" value={form.prepValidity} onChange={(value) => update("prepValidity", value)} />
            </div>
          </div>

          <div className="patient-section">
            <h3>Orientacoes</h3>
            <div className="patient-grid exam-grid-two">
              <EditableField label="Jejum" value={form.fasting} onChange={(value) => update("fasting", value)} />
              <EditableField label="Restricao" value={form.restriction} onChange={(value) => update("restriction", value)} />
            </div>
            <EditableTextArea label="Observacoes de preparo" value={form.prepObservation} onChange={(value) => update("prepObservation", value)} />
          </div>

          <div className="patient-section">
            <h3>Precificacao</h3>
            <div className="service-pricing-grid">
              <EditableField label="Preco de custo" type="number" value={form.cost} onChange={(value) => update("cost", value)} />
              <EditableField label="Preco de venda" type="number" value={form.price} onChange={(value) => update("price", value)} />
            </div>
          </div>
        </div>

        {feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="patient-form-footer patient-form-footer-right">
          <div className="patient-form-actions">
            <button className="footer-btn footer-btn-green" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
            <button
              className="footer-btn patient-cancel-btn"
              type="button"
              onClick={() => {
                if (embedded) {
                  onClose?.();
                  return;
                }
                navigate("/cadastros?tab=Exames");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function NewVaccineFormPageConnected() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editingVaccine = location.state?.vaccine || null;
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    laboratory: "",
    defaultDose: "",
    boosterInterval: "",
    openValidity: "",
    observation: "",
  });

  useEffect(() => {
    if (!editingVaccine) return;

    setForm((current) => ({
      ...current,
      id: editingVaccine.id || current.id,
      name: editingVaccine.name || "",
      laboratory: extractObservationValue(editingVaccine.description, "Laboratorio"),
      defaultDose: extractObservationValue(editingVaccine.description, "Dose padrao"),
      boosterInterval: extractObservationValue(editingVaccine.observation, "Intervalo de reforco"),
      openValidity: extractObservationValue(editingVaccine.observation, "Validade apos abertura"),
      observation: String(editingVaccine.observation || "")
        .split("|")
        .map((item) => item.trim())
        .filter(
          (item) =>
            item &&
            !item.toLowerCase().startsWith("intervalo de reforco:") &&
            !item.toLowerCase().startsWith("validade apos abertura:"),
        )
        .join(" | "),
    }));
  }, [editingVaccine]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!form.name) {
      setFeedback("Preencha o nome da vacina.");
      return;
    }

    const payload = {
      name: form.name,
      description: [
        form.laboratory ? `Laboratorio: ${form.laboratory}` : "",
        form.defaultDose ? `Dose padrao: ${form.defaultDose}` : "",
      ].filter(Boolean).join(" | "),
      price: 0.01,
      duration: null,
      category: "Vacinas",
      cost: 0,
      observation: [
        form.boosterInterval ? `Intervalo de reforco: ${form.boosterInterval}` : "",
        form.openValidity ? `Validade apos abertura: ${form.openValidity}` : "",
        form.observation,
      ].filter(Boolean).join(" | "),
    };

    try {
      setIsSubmitting(true);

      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        persistDemoService({ ...payload, id: editingVaccine?.id });
      } else {
        const requestPayload = editingVaccine?.id ? { ...payload, id: editingVaccine.id } : payload;

        try {
          await apiRequest("/services", {
            method: editingVaccine?.id ? "PUT" : "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify(requestPayload),
          });
        } catch (error) {
          if (!isLegacyPositivePriceValidationError(error.message) || Number(payload.price) > 0) {
            throw error;
          }

          await apiRequest("/services", {
            method: editingVaccine?.id ? "PUT" : "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify({
              ...requestPayload,
              price: 0.01,
            }),
          });
        }
      }

      navigate("/cadastros?tab=Vacinas");
    } catch (error) {
      const message = error.message || "Nao foi possivel salvar a vacina.";
      if (/token|sessao|authoriz/i.test(message)) {
        persistDemoService({ ...payload, id: editingVaccine?.id });
        setFeedback("Sessao expirada. Vacina salva localmente para voce nao perder o cadastro.");
        navigate("/cadastros?tab=Vacinas");
        return;
      }
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="patient-form-shell">
      <form className="patient-form-card vaccine-form-card" onSubmit={handleSubmit}>
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">Cadastro vacina</span>
            <h2>{editingVaccine ? "Editar Tipo de Vacina" : "Novo Tipo de Vacina"}</h2>
          </div>
          <NavLink to="/cadastros?tab=Vacinas" className="ghost-btn toolbar-link">Voltar</NavLink>
        </div>

        <div className="patient-form-main">
          <EditableField label="Nome" value={form.name} onChange={(value) => update("name", value)} />

          <div className="patient-grid exam-grid-top">
            <EditableField label="Laboratorio" value={form.laboratory} onChange={(value) => update("laboratory", value)} />
            <EditableField label="Dose padrao" value={form.defaultDose} onChange={(value) => update("defaultDose", value)} />
          </div>

          <div className="patient-grid exam-grid-top">
            <EditableField label="Intervalo de reforco" value={form.boosterInterval} onChange={(value) => update("boosterInterval", value)} />
            <EditableField label="Validade apos abertura" value={form.openValidity} onChange={(value) => update("openValidity", value)} />
          </div>

          <EditableTextArea label="Observacoes" value={form.observation} onChange={(value) => update("observation", value)} />
        </div>

        {feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="patient-form-footer patient-form-footer-right">
          <div className="patient-form-actions">
            <button className="footer-btn footer-btn-green" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
            <button className="footer-btn patient-cancel-btn" type="button" onClick={() => navigate("/cadastros?tab=Vacinas")}>
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function RegistersVaccinesPageConnected() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Planos Vacinais");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState("");
  const [vaccines, setVaccines] = useState([]);
  const [vaccineDeleteConfirm, setVaccineDeleteConfirm] = useState(null);
  const [planDeleteConfirm, setPlanDeleteConfirm] = useState(null);
  const normalizePlanList = (items) =>
    (items || []).map((item, index) =>
      typeof item === "string"
        ? { id: `local-plan-${index}-${item}`, name: item }
        : { id: item.id || `local-plan-${index}-${item.name || "plano"}`, name: item.name || "Plano vacinal" },
    );
  const [plans, setPlans] = useState(() => {
    try {
      const stored = localStorage.getItem("viapet.vaccine.plans");
      return normalizePlanList(stored ? JSON.parse(stored) : registersPreview.vaccinePlans);
    } catch {
      return normalizePlanList(registersPreview.vaccinePlans);
    }
  });

  useEffect(() => {
    let active = true;

    async function loadVaccinesAndPlans() {
      try {
        if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
          const demoServices = JSON.parse(localStorage.getItem("viapet.demo.services") || "[]");
          const localVaccines = demoServices.filter((item) => String(item.category || "").toLowerCase().includes("vacin"));
          if (!active) return;
          setVaccines(localVaccines);
          if (auth.token === DEMO_AUTH_TOKEN) setFeedback("Vacinas em modo demonstracao local.");
          return;
        }

        const [servicesResponse, plansResponse] = await Promise.all([
          apiRequest("/services", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
          apiRequest("/vaccine-plans", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
        ]);

        if (!active) return;

        const list = (servicesResponse?.data || servicesResponse || []).filter((item) => String(item.category || "").toLowerCase().includes("vacin"));
        const loadedPlans = normalizePlanList(plansResponse?.data || []);
        setVaccines(list);
        setPlans(loadedPlans.length ? loadedPlans : normalizePlanList(plans));
      } catch (error) {
        if (!active) return;
        setFeedback(error.message || "Nao foi possivel carregar as vacinas.");
      }
    }

    loadVaccinesAndPlans();

    return () => {
      active = false;
    };
  }, [auth.token]);

  async function addPlan() {
    const planName = window.prompt("Nome do novo plano vacinal:");
    if (!planName) return;

    try {
      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        const next = [...plans, { id: `local-plan-${Date.now()}`, name: planName }];
        setPlans(next);
        localStorage.setItem("viapet.vaccine.plans", JSON.stringify(next));
        setFeedback("Plano vacinal salvo localmente.");
        return;
      }

      const response = await apiRequest("/vaccine-plans", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ name: planName }),
      });

      const createdPlan = response?.data || { id: `server-plan-${Date.now()}`, name: planName };
      setPlans((current) => [...current, { id: createdPlan.id || `server-plan-${Date.now()}`, name: createdPlan.name || planName }]);
      setFeedback("Plano vacinal salvo com sucesso.");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar o plano vacinal.");
    }
  }

  async function handleDeleteVaccine(vaccine) {
    if (!vaccine?.id) return;

    try {
      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        const nextVaccines = vaccines.filter((item) => String(item.id) !== String(vaccine.id));
        const nextServices = readDemoServices().filter((item) => String(item.id) !== String(vaccine.id));
        setVaccines(nextVaccines);
        writeDemoServices(nextServices);
        setFeedback("Vacina removida com sucesso.");
        return;
      }

      await apiRequest("/services", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ id: vaccine.id }),
      });

      setVaccines((current) => current.filter((item) => String(item.id) !== String(vaccine.id)));
      setFeedback("Vacina removida com sucesso.");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel excluir a vacina.");
    }
  }

  async function handleDeletePlan(plan) {
    if (!plan?.id) return;

    try {
      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        const nextPlans = plans.filter((item) => String(item.id) !== String(plan.id));
        setPlans(nextPlans);
        localStorage.setItem("viapet.vaccine.plans", JSON.stringify(nextPlans));
        setFeedback("Plano vacinal removido com sucesso.");
        return;
      }

      await apiRequest(`/vaccine-plans/${plan.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      setPlans((current) => current.filter((item) => String(item.id) !== String(plan.id)));
      setFeedback("Plano vacinal removido com sucesso.");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel excluir o plano vacinal.");
    }
  }

  async function handleEditPlan(plan) {
    const nextName = window.prompt("Editar nome do plano vacinal:", plan?.name || "");
    if (!nextName || nextName === plan?.name) return;

    try {
      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        const nextPlans = plans.map((item) => (String(item.id) === String(plan.id) ? { ...item, name: nextName } : item));
        setPlans(nextPlans);
        localStorage.setItem("viapet.vaccine.plans", JSON.stringify(nextPlans));
        setFeedback("Plano vacinal atualizado localmente.");
        return;
      }

      await apiRequest(`/vaccine-plans/${plan.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ name: nextName }),
      });

      setPlans((current) => current.map((item) => (String(item.id) === String(plan.id) ? { ...item, name: nextName } : item)));
      setFeedback("Plano vacinal atualizado com sucesso.");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel atualizar o plano vacinal.");
    }
  }

  const query = searchTerm.trim().toLowerCase();
  const visibleRows =
    activeTab === "Vacinas"
      ? vaccines
          .filter((item) => !query || [item.name, item.description].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
          .map((item) => ({ id: item.id, label: item.name, raw: item }))
      : plans
          .filter((item) => String(item.name || "").toLowerCase().includes(query))
          .map((item) => ({ id: item.id, label: item.name, raw: item }));

  return (
    <div className="page-grid">
      <section className="registers-screen">
        <div className="registers-tabbar">
          {["Vacinas", "Planos Vacinais"].map((tab) => (
            <button key={tab} className={tab === activeTab ? "registers-subtab active" : "registers-subtab"} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        <div className="registers-board">
          <div className="registers-toolbar">
            <div className="registers-toolbar-left">
              {activeTab === "Vacinas" ? (
                <NavLink to="/cadastros/nova-vacina" className="registers-new-btn registers-link-btn">+ Nova Vacina</NavLink>
              ) : (
                <button className="registers-new-btn" onClick={addPlan}>+ Novo Plano</button>
              )}
              <input
                className="registers-search-box"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={activeTab === "Vacinas" ? "Buscar vacina" : "Buscar plano vacinal"}
              />
              <button className="registers-icon-btn">Imprimir</button>
              <button className="registers-icon-btn">Excel</button>
            </div>

            <div className="registers-toolbar-right">
              <button className="registers-icon-btn">Filtro</button>
              <button className="registers-icon-btn">Excluir</button>
            </div>
          </div>

          <div className="registers-list-head">{activeTab === "Vacinas" ? "Lista de Vacinas" : "Lista de Planos Vacinais"}</div>
          {feedback ? <div className="registers-feedback">{feedback}</div> : null}

          <div className="registers-list">
            {visibleRows.length === 0 ? <div className="registers-row">Nenhum item encontrado.</div> : null}
            {visibleRows.map((item) => (
              <div key={item.id} className="registers-row registers-row-action">
                <button
                  type="button"
                  className="registers-open-inline"
                  onClick={() =>
                    activeTab === "Vacinas"
                      ? navigate("/cadastros/nova-vacina", { state: { vaccine: item.raw } })
                      : handleEditPlan(item.raw)
                  }
                >
                  {item.label}
                </button>
                <button
                  type="button"
                  className="registers-delete-inline"
                  onClick={() => (activeTab === "Vacinas" ? setVaccineDeleteConfirm(item.raw) : setPlanDeleteConfirm(item.raw))}
                  aria-label={`Excluir ${item.label}`}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {vaccineDeleteConfirm ? (
        <div className="user-modal-overlay">
          <div className="confirm-modal">
            <h3>Excluir vacina</h3>
            <p>
              Deseja mesmo excluir <strong>{vaccineDeleteConfirm.name || "esta vacina"}</strong>?
            </p>
            <div className="confirm-modal-actions">
              <button type="button" className="footer-btn patient-cancel-btn" onClick={() => setVaccineDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="footer-btn footer-btn-green"
                onClick={async () => {
                  const pendingVaccine = vaccineDeleteConfirm;
                  setVaccineDeleteConfirm(null);
                  await handleDeleteVaccine(pendingVaccine);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {planDeleteConfirm ? (
        <div className="user-modal-overlay">
          <div className="confirm-modal">
            <h3>Excluir plano vacinal</h3>
            <p>
              Deseja mesmo excluir <strong>{planDeleteConfirm.name || "este plano vacinal"}</strong>?
            </p>
            <div className="confirm-modal-actions">
              <button type="button" className="footer-btn patient-cancel-btn" onClick={() => setPlanDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="footer-btn footer-btn-green"
                onClick={async () => {
                  const pendingPlan = planDeleteConfirm;
                  setPlanDeleteConfirm(null);
                  await handleDeletePlan(pendingPlan);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DashboardPageConnected() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [resourceKeys, setResourceKeys] = useState(() => readSelectedResources());
  const [birthdayRows, setBirthdayRows] = useState([]);
  const [birthdayMonthRows, setBirthdayMonthRows] = useState([]);
  const [payablesRows, setPayablesRows] = useState([]);
  const [summary, setSummary] = useState({
    entradas: { total: 0, count: 0 },
    saidas: { total: 0, count: 0 },
    saldo: 0,
  });
  const [feedback, setFeedback] = useState("");
  const [cashValue, setCashValue] = useState("");
  const [cashFeedback, setCashFeedback] = useState("");
  const [cashStatus, setCashStatus] = useState({
    opened: false,
    openingAmount: 0,
    closed: false,
  });

  useEffect(() => {
    const syncResources = () => {
      setResourceKeys(readSelectedResources());
    };

    window.addEventListener("storage", syncResources);
    window.addEventListener(SETTINGS_UPDATED_EVENT, syncResources);
    return () => {
      window.removeEventListener("storage", syncResources);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, syncResources);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        setFeedback("");
        setBirthdayRows([]);
        setBirthdayMonthRows([]);
        return;
      }

      try {
        setFeedback("");

        const [birthdayResult, pendingResult, summaryResult] = await Promise.allSettled([
          apiRequest("/birthdays", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
          apiRequest("/finance/pending", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
          apiRequest("/finance/summary", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
        ]);

        if (!active) return;

        const birthdayResponse = birthdayResult.status === "fulfilled" ? birthdayResult.value : null;
        const pendingResponse = pendingResult.status === "fulfilled" ? pendingResult.value : null;
        const summaryResponse = summaryResult.status === "fulfilled" ? summaryResult.value : null;
        const birthdayData = birthdayResponse?.data || birthdayResponse || {};
        const pets = birthdayData.pets || [];
        const customers = birthdayData.customers || [];
        const monthPets = birthdayData.monthPets || [];
        const monthCustomers = birthdayData.monthCustomers || [];
        const nextBirthdayRows = [
          ...pets.map((item) => ({
            type: "Pet",
            name: item.name || "Pet sem nome",
            owner:
              item.customerName?.name ||
              item.customerName ||
              item.ownerName ||
              item.Custumer?.name ||
              "Tutor",
            when: "Hoje",
            tone: "pet",
            phone:
              item.customerPhone ||
              item.customerName?.phone ||
              item.phone ||
              "5511994167999",
            whatsappLabel: `WhatsApp ${item.customerName?.name || item.customerName || item.ownerName || item.name || "tutor"}`,
          })),
          ...customers.map((item) => ({
            type: "Tutor",
            name: item.name || "Tutor sem nome",
            owner: item.petName || "Aniversariante do dia",
            when: "Hoje",
            tone: "owner",
            phone: item.phone || "5511994167999",
            whatsappLabel: `WhatsApp ${item.name || "tutor"}`,
          })),
        ];
        const nextBirthdayMonthRows = [
          ...monthPets.map((item) => ({
            type: "Pet",
            name: item.name || "Pet sem nome",
            owner: item.customerName || item.ownerName || "Tutor",
            when: item.birthDate ? formatDateBr(item.birthDate).slice(0, 5) : "",
            tone: "pet",
            phone: item.customerPhone || item.phone || "5511994167999",
            whatsappLabel: `WhatsApp ${item.customerName || item.name || "tutor"}`,
            sortKey: item.birthDate || "",
          })),
          ...monthCustomers.map((item) => ({
            type: "Tutor",
            name: item.name || "Tutor sem nome",
            owner: "Aniversariante do mes",
            when: item.birthDate ? formatDateBr(item.birthDate).slice(0, 5) : "",
            tone: "owner",
            phone: item.phone || "5511994167999",
            whatsappLabel: `WhatsApp ${item.name || "tutor"}`,
            sortKey: item.birthDate || "",
          })),
        ].sort((left, right) => {
          const leftDate = left.sortKey ? new Date(left.sortKey) : null;
          const rightDate = right.sortKey ? new Date(right.sortKey) : null;
          return (leftDate?.getDate() || 0) - (rightDate?.getDate() || 0);
        });

        const pendingRows = (pendingResponse?.data || []).map((item) => ({
          title: item.description || item.category || "Conta pendente",
          due: item.dueDate ? formatDateBr(item.dueDate) : "Sem data",
          amount: `R$ ${formatCurrencyBr(item.amount)}`,
          status: item.status || "pendente",
        }));

        setBirthdayRows(nextBirthdayRows);
        setBirthdayMonthRows(nextBirthdayMonthRows);
        setPayablesRows(pendingRows);
        setSummary(summaryResponse?.data || {
          entradas: { total: 0, count: 0 },
          saidas: { total: 0, count: 0 },
          saldo: 0,
        });

        const failedSections = [
          birthdayResult.status === "rejected" ? "aniversarios" : null,
          pendingResult.status === "rejected" ? "financeiro pendente" : null,
          summaryResult.status === "rejected" ? "resumo financeiro" : null,
        ].filter(Boolean);

        if (failedSections.length) {
          setFeedback(`Alguns blocos nao carregaram agora: ${failedSections.join(", ")}.`);
        }

        try {
          const today = getLocalDateString();
          const cashStatusResponse = await apiRequest(`/finance/cash-status/${today}`, {
            headers: { Authorization: `Bearer ${auth.token}` },
          });
          if (active) {
            const nextCashStatus = cashStatusResponse?.data || {};
            setCashStatus({
              opened: Boolean(nextCashStatus.opened),
              openingAmount: Number(nextCashStatus.openingAmount || 0),
              closed: Boolean(nextCashStatus.closed),
            });
            if (nextCashStatus.opened) {
              setCashValue(
                Number(nextCashStatus.openingAmount || 0)
                  .toFixed(2)
                  .replace(".", ","),
              );
            }
          }
        } catch {
          if (active) {
            setCashStatus({
              opened: false,
              openingAmount: 0,
              closed: false,
            });
          }
        }
      } catch (error) {
        if (!active) return;
        setFeedback(error.message || "Nao foi possivel carregar a dashboard.");
        setBirthdayRows([]);
        setBirthdayMonthRows([]);
        setPayablesRows([]);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [auth.token]);

  const displayName = auth.user?.name || "Usuario ViaPet";
  const saldoLabel = `Saldo R$ ${formatCurrencyBr(summary?.saldo)}`;
  const formatCashInput = (value) =>
    Number(value || 0)
      .toFixed(2)
      .replace(".", ",");
  const cashStatusLabel = cashStatus.closed
    ? "Fechado hoje"
    : cashStatus.opened
      ? "Aberto hoje"
      : "Lancamento rapido";
  const quickTileRoutes = {
    Agenda: "/agenda",
    Pesquisa: "/pesquisa",
    Cadastros: "/cadastros",
    Financeiro: "/financeiro",
    "Venda (PDV)": "/venda",
    SuperVet: "/viacentral",
    Exames: "/exames",
    Mensagens: "/mensagens",
    Fila: "/fila",
    Internacao: "/internacao",
    Configurar: "/configuracao",
  };

  async function refreshCashStatus() {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      return;
    }

    const today = getLocalDateString();
    const cashStatusResponse = await apiRequest(`/finance/cash-status/${today}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const nextCashStatus = cashStatusResponse?.data || {};
    setCashStatus({
      opened: Boolean(nextCashStatus.opened),
      openingAmount: Number(nextCashStatus.openingAmount || 0),
      closed: Boolean(nextCashStatus.closed),
    });
    if (nextCashStatus.opened) {
      setCashValue(formatCashInput(nextCashStatus.openingAmount || 0));
    }
  }

  async function handleOpenCashDashboard() {
    if (!cashValue) {
      setCashFeedback("Informe o valor para abrir o caixa.");
      return;
    }

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setCashFeedback("Entre com a conta real para abrir o caixa.");
      return;
    }

    try {
      setCashFeedback("");
      await apiRequest("/finance/open-cash", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          referenceDate: getLocalDateString(),
          amount: Number(String(cashValue).replace(",", ".")) || 0,
        }),
      });
      await refreshCashStatus();
      setCashFeedback("Abertura de caixa registrada com sucesso.");
    } catch (error) {
      setCashFeedback(error.message || "Nao foi possivel abrir o caixa.");
    }
  }

  async function handleCloseCashDashboard() {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setCashFeedback("Entre com a conta real para fechar o caixa.");
      return;
    }

    try {
      setCashFeedback("");
      const response = await apiRequest("/finance/close-cash", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          referenceDate: getLocalDateString(),
        }),
      });
      await refreshCashStatus();
      const balance = response?.data?.balance ?? 0;
      setCashFeedback(`Caixa fechado com sucesso. Saldo do dia: ${formatCurrencyBr(balance)}.`);
    } catch (error) {
      setCashFeedback(error.message || "Nao foi possivel fechar o caixa.");
    }
  }

  return (
    <DashboardPageView
      displayName={displayName}
      saldoLabel={saldoLabel}
      feedback={feedback}
      birthdayRows={birthdayRows}
      birthdayMonthRows={birthdayMonthRows}
      payablesRows={payablesRows}
      cashValue={cashValue}
      cashStatusLabel={cashStatusLabel}
      cashFeedback={cashFeedback}
      onCashValueChange={setCashValue}
      onOpenCash={handleOpenCashDashboard}
      onCloseCash={handleCloseCashDashboard}
      onNewPet={() => navigate("/cadastros/novo-paciente")}
      onNewPerson={() => navigate("/cadastros/nova-pessoa")}
      onPayableClick={() => navigate("/financeiro/pagamentos")}
      isTileVisible={(title) => isDashboardTileVisible(title, resourceKeys)}
      resolveTileRoute={(title) => quickTileRoutes[title] || ""}
      onTileClick={(title) => {
        if (title === "Sair") {
          auth.logout();
          navigate("/login");
          return;
        }

        if (!isDashboardTileVisible(title, resourceKeys)) {
          return;
        }

        const route = quickTileRoutes[title];
        if (route) {
          navigate(route);
        }
      }}
    />
  );
}

function HospitalizationMainPageConnected() {
  const auth = useAuth();
  const todayDate = getLocalDateString();
  const [feedback, setFeedback] = useState("");
  const [catalogs, setCatalogs] = useState(() => getEmptyAgendaCatalogs());
  const [rows, setRows] = useState([]);
  const [editor, setEditor] = useState({
    isOpen: false,
    loading: false,
    saving: false,
    appointmentId: "",
    feedback: "",
    form: createAgendaFormState({
      selectedDate: todayDate,
      selectedHour: "08:00",
      catalogs: getEmptyAgendaCatalogs(),
    }),
  });

  useEffect(() => {
    let active = true;

    async function loadHospitalization() {
      if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
        if (auth.token === DEMO_AUTH_TOKEN) {
          setFeedback("Internacao em modo demonstracao local.");
        }
        setCatalogs(getAgendaDemoCatalogs());
        setRows([]);
        return;
      }

      try {
        setFeedback("");
        const [response, customersResponse, petsResponse, servicesResponse, productsResponse] = await Promise.all([
          apiRequest("/appointments/queue/internacao/true", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
          apiRequest("/customers", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }).catch(() => ({ data: [] })),
          apiRequest("/pets", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }).catch(() => ({ data: [] })),
          apiRequest("/services", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }).catch(() => ({ data: [] })),
          apiRequest("/products", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }).catch(() => ({ data: [] })),
        ]);

        if (!active) return;

        setCatalogs({
          customers: normalizeListResponse(customersResponse),
          pets: normalizeListResponse(petsResponse),
          services: normalizeListResponse(servicesResponse),
          products: normalizeListResponse(productsResponse),
        });

        const detailedAppointments = await loadAppointmentDetailsList(response?.data || [], auth.token);
        if (!active) return;

        const mappedRows = detailedAppointments.map((item) => {
          const petName = item?.Pet?.name || item?.petName || "Pet sem nome";
          const dateLabel = item.date ? formatDateBr(item.date) : "Sem data";
          const timeLabel = item.hour || item.time || "";
          const serviceLabel = item?.Service?.name || item?.serviceName || item?.description || "Internacao";
          const financialSnapshot = getAppointmentFinancialSnapshot(item);

          return {
            id: item.id,
            pet: petName,
            period: `${dateLabel}${timeLabel ? ` ${timeLabel}` : ""} - ${serviceLabel}`,
            outstandingAmount: financialSnapshot.outstandingAmount,
          };
        });

        setRows(mappedRows);
      } catch (error) {
        if (!active) return;
        setFeedback(error.message || "Nao foi possivel carregar a internacao.");
        setCatalogs(getEmptyAgendaCatalogs());
        setRows([]);
      }
    }

    loadHospitalization();

    return () => {
      active = false;
    };
  }, [auth.token]);

  async function loadHospitalizationRows() {
    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) return;
    const response = await apiRequest("/appointments/queue/internacao/true", {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const detailedAppointments = await loadAppointmentDetailsList(response?.data || [], auth.token);
    const mappedRows = detailedAppointments.map((item) => {
      const petName = item?.Pet?.name || item?.petName || "Pet sem nome";
      const dateLabel = item.date ? formatDateBr(item.date) : "Sem data";
      const timeLabel = item.hour || item.time || "";
      const serviceLabel = item?.Service?.name || item?.serviceName || item?.description || "Internacao";
      const financialSnapshot = getAppointmentFinancialSnapshot(item);

      return {
        id: item.id,
        pet: petName,
        period: `${dateLabel}${timeLabel ? ` ${timeLabel}` : ""} - ${serviceLabel}`,
        outstandingAmount: financialSnapshot.outstandingAmount,
      };
    });
    setRows(mappedRows);
  }

  function openNewHospitalizationEditor() {
    setEditor({
      isOpen: true,
      loading: false,
      saving: false,
      appointmentId: "",
      feedback: "",
      form: createAgendaFormState({
        selectedDate: getLocalDateString(),
        selectedHour: "08:00",
        catalogs,
      }),
    });
  }

  function closeHospitalizationEditor() {
    setEditor((current) => ({ ...current, isOpen: false, feedback: "" }));
  }

  function updateHospitalizationField(field, value) {
    setEditor((current) => {
      const nextForm = { ...current.form, [field]: value };

      if (field === "customerId" && nextForm.petId) {
        const currentPet = catalogs.pets.find((pet) => String(pet.id) === String(nextForm.petId));
        if (currentPet && getPetCustomerId(currentPet) !== String(value)) {
          nextForm.petId = "";
        }
      }

      if (field === "petId") {
        const selectedPet = catalogs.pets.find((pet) => String(pet.id) === String(value));
        if (selectedPet) {
          const selectedPetCustomerId = getPetCustomerId(selectedPet);
          nextForm.customerId = String(selectedPetCustomerId || nextForm.customerId || "");
          const tutor = catalogs.customers.find((customer) => String(customer.id) === selectedPetCustomerId);
          nextForm.petSearch = `${selectedPet.name}${tutor ? ` (${tutor.name})` : ""}`;
          if (!nextForm.weight && selectedPet.weight) {
            nextForm.weight = String(selectedPet.weight);
          }
        }
      }

      if (field === "serviceId" && (!current.form.paymentAmount || current.form.paymentAmount === "0")) {
        const resolvedServiceId = resolveAgendaServiceReference(value, catalogs);
        const service = catalogs.services.find((item) => String(item.id) === String(resolvedServiceId));
        if (service?.price) {
          nextForm.paymentAmount = String(service.price);
        }
      }

      if (field === "serviceId") {
        const resolvedServiceId = resolveAgendaServiceReference(value, catalogs);
        nextForm.serviceId = resolvedServiceId;
        const service = catalogs.services.find((item) => String(item.id) === String(resolvedServiceId));
        const itemRows = [...(nextForm.itemRows || [])];
        const primaryRow = itemRows[0] || buildAgendaItemRow({ lockedPrimary: true });
        itemRows[0] = {
          ...primaryRow,
          lockedPrimary: true,
          kind: "service",
          referenceId: String(resolvedServiceId || ""),
          description: service?.name || "",
          quantity: primaryRow.quantity || "1",
          unitPrice: String(service?.price || 0),
          total: String(calculateAgendaItemTotal({ quantity: primaryRow.quantity || "1", unitPrice: service?.price || 0 })),
        };
        nextForm.itemRows = itemRows;
        const itemsTotal = calculateAgendaRowsTotal(itemRows);
        nextForm.paymentAmount = String(itemsTotal);
        if ((nextForm.paymentRows || []).length === 1) {
          nextForm.paymentRows = nextForm.paymentRows.map((paymentRow, index) =>
            index === 0 ? buildAgendaPaymentRow({ ...paymentRow, amount: String(itemsTotal) }, nextForm.date) : paymentRow,
          );
        }
      }

      return {
        ...current,
        form: nextForm,
      };
    });
  }

  function updateHospitalizationItemRow(rowId, field, value) {
    setEditor((current) => {
      const itemRows = (current.form.itemRows || []).map((row) => {
        if (row.id !== rowId) return row;

        let nextRow = { ...row, [field]: value };

        if (field === "referenceId") {
          const [kind, referenceId] = String(value || "").split(":");
          nextRow.kind = kind || row.kind;
          nextRow.referenceId = referenceId || "";

          if (kind === "service") {
            const service = catalogs.services.find((item) => String(item.id) === String(referenceId));
            nextRow.description = service?.name || "";
            nextRow.unitPrice = String(service?.price || 0);
          }

          if (kind === "product") {
            const product = (catalogs.products || []).find((item) => String(item.id) === String(referenceId));
            nextRow.description = product?.name || "";
            nextRow.unitPrice = String(product?.price || 0);
          }
        }

        if (field === "quantity" || field === "unitPrice" || field === "referenceId") {
          nextRow.total = String(calculateAgendaItemTotal(nextRow));
        }

        return nextRow;
      });

      const itemsTotal = calculateAgendaRowsTotal(itemRows);
      const paymentRows =
        (current.form.paymentRows || []).length === 1
          ? current.form.paymentRows.map((paymentRow, index) =>
              index === 0 ? buildAgendaPaymentRow({ ...paymentRow, amount: String(itemsTotal) }, current.form.date) : paymentRow,
            )
          : current.form.paymentRows;
      const primaryServiceRow = itemRows.find((row) => row.kind === "service" && row.referenceId);

      return {
        ...current,
        form: {
          ...current.form,
          itemRows,
          paymentRows,
          paymentAmount: String(itemsTotal),
          serviceId: primaryServiceRow ? String(primaryServiceRow.referenceId || "") : "",
        },
      };
    });
  }

  function addHospitalizationItemRow() {
    setEditor((current) => ({
      ...current,
      form: {
        ...current.form,
        itemRows: [
          ...(current.form.itemRows || []),
          buildAgendaItemRow({ kind: "service", quantity: 1, unitPrice: 0, total: 0 }),
        ],
      },
    }));
  }

  function removeHospitalizationItemRow(rowId) {
    setEditor((current) => {
      let itemRows = (current.form.itemRows || []).filter((row) => row.id !== rowId);

      if (!itemRows.length) {
        itemRows = [buildAgendaItemRow({ lockedPrimary: true, kind: "service" })];
      }

      const itemsTotal = calculateAgendaRowsTotal(itemRows);
      const paymentRows =
        (current.form.paymentRows || []).length === 1
          ? current.form.paymentRows.map((paymentRow, index) =>
              index === 0 ? buildAgendaPaymentRow({ ...paymentRow, amount: String(itemsTotal) }, current.form.date) : paymentRow,
            )
          : current.form.paymentRows;

      return {
        ...current,
        form: {
          ...current.form,
          itemRows,
          paymentRows,
          paymentAmount: String(itemsTotal),
          serviceId: itemRows[0]?.kind === "service" ? String(itemRows[0].referenceId || "") : current.form.serviceId,
        },
      };
    });
  }

  function updateHospitalizationPaymentRow(rowId, field, value) {
    setEditor((current) => {
      const paymentRows = (current.form.paymentRows || []).map((row) => {
        if (row.id !== rowId) return row;
        const nextRow = { ...row, [field]: value };
        if (field === "paymentMethod" || field === "amount") {
          const breakdown = calculateFeeBreakdown(nextRow.amount, nextRow.paymentMethod, readAccountSettings());
          nextRow.grossAmount = String(breakdown.grossAmount);
          nextRow.feePercentage = String(breakdown.feePercentage);
          nextRow.feeAmount = String(breakdown.feeAmount);
          nextRow.netAmount = String(breakdown.netAmount);
        }
        return nextRow;
      });

      return {
        ...current,
        form: {
          ...current.form,
          paymentRows,
        },
      };
    });
  }

  function addHospitalizationPaymentRow() {
    setEditor((current) => {
      const totalAmount = calculateAgendaRowsTotal(current.form.itemRows || []);
      const paidAmount = calculateAgendaPaymentsTotal(current.form.paymentRows || []);
      const remainingAmount = Math.max(totalAmount - paidAmount, 0);

      return {
        ...current,
        form: {
          ...current.form,
          paymentRows: [
            ...(current.form.paymentRows || []),
            buildAgendaPaymentRow({ amount: remainingAmount }, current.form.date),
          ],
        },
      };
    });
  }

  function removeHospitalizationPaymentRow(rowId) {
    setEditor((current) => {
      let paymentRows = (current.form.paymentRows || []).filter((row) => row.id !== rowId);
      if (!paymentRows.length) {
        paymentRows = [buildAgendaPaymentRow({}, current.form.date)];
      }
      return {
        ...current,
        form: {
          ...current.form,
          paymentRows,
        },
      };
    });
  }

  async function saveHospitalizationFromEditor() {
    const form = editor.form;
    const validItemRows = (form.itemRows || [])
      .filter((row) => row.referenceId || row.description)
      .map((row) => resolveAgendaCatalogRowReference(row, catalogs));
    const mainServiceRow = validItemRows.find((row) => row.kind === "service" && row.referenceId);
    const mainServiceId =
      resolveAgendaServiceReference(form.serviceId, catalogs) ||
      mainServiceRow?.referenceId ||
      "";

    if (!form.customerId || !form.petId || !mainServiceId || !form.date || !form.time) {
      setEditor((current) => ({
        ...current,
        feedback: "Preencha tutor, pet, servico, data e horario para salvar a internacao.",
      }));
      return;
    }

    if (!auth.token || auth.token === DEMO_AUTH_TOKEN) {
      setEditor((current) => ({
        ...current,
        feedback: "Internacao em modo demonstracao local.",
      }));
      return;
    }

    setEditor((current) => ({ ...current, saving: true, feedback: "" }));

    try {
      const validPaymentRows = getPersistableAgendaPaymentRows(form.paymentRows || []);
      const appointmentPayload = {
        customerId: form.customerId,
        petId: form.petId,
        serviceId: mainServiceId,
        responsibleId: auth.user?.id || null,
        type: "internacao",
        date: form.date,
        time: form.time,
        observation: form.observation,
        status: form.status || "aguardando",
        sellerName: form.sellerName || "",
      };

      const created = await apiRequest("/appointments", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify(appointmentPayload),
      });

      const resolvedAppointmentId = created?.data?.id;
      if (!resolvedAppointmentId) {
        throw new Error("Nao foi possivel criar a internacao.");
      }

      for (const row of validItemRows) {
        if (row.kind === "service" && row.referenceId) {
          await apiRequest(`/appointments/${resolvedAppointmentId}/items`, {
            method: "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify({
              type: "service",
              serviceId: row.referenceId,
              quantity: Number(row.quantity || 1),
              unitPrice: Number(row.unitPrice || 0),
              description: row.description,
            }),
          });
        }

        if (row.kind === "product" && row.referenceId) {
          await apiRequest(`/appointments/${resolvedAppointmentId}/items`, {
            method: "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify({
              type: "product",
              productId: row.referenceId,
              quantity: Number(row.quantity || 1),
              unitPrice: Number(row.unitPrice || 0),
              description: row.description,
            }),
          });
        }
      }

      for (const paymentRow of validPaymentRows) {
        await apiRequest(`/appointments/${resolvedAppointmentId}/payments`, {
          method: "POST",
          headers: { Authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({
            dueDate: paymentRow.dueDate || form.date,
            paymentMethod: paymentRow.paymentMethod,
            details: paymentRow.details,
            amount: paymentRow.normalizedAmount,
            feePercentage: Number(paymentRow.feePercentage || 0),
            status: paymentRow.status || "pendente",
            paidAt: paymentRow.status === "pago" ? `${paymentRow.dueDate || form.date}T12:00:00` : null,
          }),
        });
      }

      await loadHospitalizationRows();
      closeHospitalizationEditor();
    } catch (error) {
      setEditor((current) => ({
        ...current,
        saving: false,
        feedback: error.message || "Nao foi possivel salvar a internacao.",
      }));
      return;
    }

    setEditor((current) => ({ ...current, saving: false }));
  }

  return (
    <div className="agenda-layout hospitalization-layout">
      <aside className="left-panel">
        <div className="panel-header panel-header-accent">
          <strong>Agenda</strong>
          <span>Hoje</span>
        </div>
        <div className="panel-body">
          <div className="calendar-header">
            <span>Marco</span>
            <span>2026</span>
            <span>Hoje</span>
          </div>
          <div className="calendar-grid">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }, (_, index) => {
              const day = index + 1;
              return (
                <div key={day} className={day === 26 ? "day day-active" : "day"}>
                  {day}
                </div>
              );
            })}
          </div>

          <div className="filters">
            <h3>Filtros</h3>
            <div className="radio-line">
              <span>Dia</span>
              <span>Semana</span>
            </div>
            <Field label="Evento" value="" />
            <Field label="Usuario" value="" />
            <Field label="Funcao" value="" />
          </div>
        </div>
      </aside>

      <main className="center-panel">
      <AgendaTabbar activeTab="Internação" />

        <section className="agenda-board hospitalization-board">
          <div className="hospitalization-main">
            <div className="agenda-toolbar">
              <div className="toolbar-group">
                <button className="soft-btn" onClick={openNewHospitalizationEditor}>Novo Evento</button>
                <NavLink to="/receita?origem=internacao" className="soft-btn toolbar-link">
                  Receita
                </NavLink>
              </div>
              <div className="toolbar-group">
                <button type="button" className="soft-counter" onClick={() => window.print()}>
                  Imprimir
                </button>
              </div>
            </div>

            <div className="timeline">
              <div className="timeline-head">
                <div>Hora</div>
                <div>26 Marco 2026</div>
              </div>

              {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map((hour) => (
                <div key={hour} className="timeline-slot clinic-slot-empty">
                  <div className="timeline-hour">{hour}</div>
                  <div className="timeline-card clinic-empty-card" />
                </div>
              ))}
            </div>
          </div>

          <aside className="hospitalization-side">
            <div className="hospitalization-side-head">
              <span>Pet</span>
              <span>Periodo</span>
            </div>
            {feedback ? <div className="registers-feedback hospitalization-feedback">{feedback}</div> : null}
            <div className="hospitalization-side-body">
              {rows.length ? (
                rows.map((row) => (
                  <div key={row.id} className="hospitalization-row">
                    <strong>{row.pet}</strong>
                    <span>{row.period}</span>
                    {row.outstandingAmount > 0 ? <span className="hospitalization-row-remaining">Falta pagar {formatCurrencyBr(row.outstandingAmount)}</span> : null}
                  </div>
                ))
              ) : (
                <div className="registers-row">Nenhum pet em internacao.</div>
              )}
            </div>
          </aside>
        </section>

        {editor.isOpen ? (
          <AgendaAppointmentModal
            title="Internação"
            editor={editor}
            customers={catalogs.customers}
            pets={catalogs.pets}
            services={catalogs.services}
            products={catalogs.products}
            onClose={closeHospitalizationEditor}
            onFieldChange={updateHospitalizationField}
            onItemChange={updateHospitalizationItemRow}
            onAddItem={addHospitalizationItemRow}
            onRemoveItem={removeHospitalizationItemRow}
            onPaymentChange={updateHospitalizationPaymentRow}
            onAddPayment={addHospitalizationPaymentRow}
            onRemovePayment={removeHospitalizationPaymentRow}
            onSave={saveHospitalizationFromEditor}
            onDelete={closeHospitalizationEditor}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;




