import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessagesAiControlPanel,
  buildDefaultAiControl,
} from "./MessagesAiControlPanel.jsx";
import { MessagesWhatsappConfigPanel } from "./MessagesWhatsappConfigPanel.jsx";

const APP_MENU_ITEMS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "contacts", label: "Contatos", icon: "contacts" },
  { id: "crm", label: "CRM", icon: "crm" },
  { id: "tasks", label: "Tarefas", icon: "tasks" },
  { id: "broadcast", label: "Envio em massa", icon: "send" },
  { id: "reports", label: "Relatorios", icon: "clock" },
  { id: "links", label: "Gerador de Links", icon: "link" },
  { id: "apps", label: "Aplicativos", icon: "phone" },
  { id: "courses", label: "Cursos", icon: "book" },
  { id: "profile", label: "Perfil", icon: "user" },
  { id: "settings", label: "Configuracoes", icon: "settings" },
];

const MESSAGE_STATUS_TABS = [
  { id: "all", label: "Todas", icon: "list" },
  { id: "pending", label: "Pendente", icon: "clock" },
  { id: "attending", label: "Atendendo", icon: "timer" },
  { id: "closed", label: "Fechado", icon: "check" },
];

const INITIAL_THREADS = [
  {
    id: "thread-isa",
    name: "Isa Viviane",
    handle: "Nao futuro mais...kkkkkk",
    owner: "Pedro",
    channel: "WhatsApp",
    status: "pending",
    preview: "Nao futuro mais...kkkkkk",
    dateLabel: "16 de fev.",
    unreadCount: 7,
    avatarLabel: "IV",
    accent: "green",
    messages: [
      {
        id: "thread-isa-1",
        side: "incoming",
        sender: "Isa Viviane",
        text: "Nao futuro mais...kkkkkk",
        time: "16/02/2024 16:41",
      },
      {
        id: "thread-isa-2",
        side: "outgoing",
        sender: "Pedro",
        text: "Posso deixar o horario reservado para voce quando quiser.",
        time: "16/02/2024 16:42",
      },
    ],
  },
  {
    id: "thread-pedro",
    name: "Pedro Z.",
    handle: "pode sim",
    owner: "Pedro",
    channel: "WhatsApp",
    status: "attending",
    preview: "pode sim",
    dateLabel: "16 de fev.",
    unreadCount: 1,
    avatarLabel: "PZ",
    accent: "violet",
    messages: [
      {
        id: "thread-pedro-1",
        side: "outgoing",
        sender: "Pedro",
        text: "faz podemos agendar uma apresentacao para o senhor tirar todas as duvidas ?",
        time: "16/02/2024 17:50",
      },
      {
        id: "thread-pedro-2",
        side: "incoming",
        sender: "Cliente",
        text: "seria otimo",
        time: "16/02/2024 17:51",
      },
      {
        id: "thread-pedro-3",
        side: "incoming",
        sender: "Cliente",
        text: "pode ser segunda, umas 13 ou 14 horas",
        time: "16/02/2024 17:52",
      },
      {
        id: "thread-pedro-4",
        side: "outgoing",
        sender: "Pedro",
        text: "que dia e horario fica otimo ?",
        time: "16/02/2024 17:51",
      },
      {
        id: "thread-pedro-5",
        side: "outgoing",
        sender: "Pedro",
        text: "claro ja vou agendar para as 14:00",
        time: "16/02/2024 17:53",
      },
      {
        id: "thread-pedro-6",
        side: "outgoing",
        sender: "Pedro",
        text: "pode ser ?",
        time: "16/02/2024 17:53",
      },
    ],
  },
  {
    id: "thread-suzana",
    name: "Suzana Martins",
    handle: "userfiles/f623d92c60e9f30ddfd...",
    owner: "Pedro",
    channel: "WhatsApp",
    status: "pending",
    preview: "userfiles/f623d92c60e9f30ddfd...",
    dateLabel: "16 de fev.",
    unreadCount: 0,
    avatarLabel: "SM",
    accent: "neutral",
    messages: [
      {
        id: "thread-suzana-1",
        side: "incoming",
        sender: "Suzana Martins",
        text: "Consegue me mandar os horarios de banho e tosa da semana ?",
        time: "16/02/2024 11:17",
      },
    ],
  },
  {
    id: "thread-jhemisson",
    name: "Jhemisson Fernandes",
    handle: "Fico no aguardo",
    owner: "Pedro",
    channel: "WhatsApp",
    status: "attending",
    preview: "Fico no aguardo",
    dateLabel: "16 de fev.",
    unreadCount: 5,
    avatarLabel: "JF",
    accent: "blue",
    messages: [
      {
        id: "thread-jhemisson-1",
        side: "incoming",
        sender: "Jhemisson Fernandes",
        text: "Fico no aguardo",
        time: "16/02/2024 09:05",
      },
    ],
  },
  {
    id: "thread-iury",
    name: "Iury Landin",
    handle: "Pronto zezo",
    owner: "Pedro",
    channel: "WhatsApp",
    status: "closed",
    preview: "Pronto zezo",
    dateLabel: "15 de fev.",
    unreadCount: 5,
    avatarLabel: "IL",
    accent: "neutral",
    messages: [
      {
        id: "thread-iury-1",
        side: "incoming",
        sender: "Iury Landin",
        text: "Pronto zezo",
        time: "15/02/2024 18:24",
      },
    ],
  },
  {
    id: "thread-pedro-igor",
    name: "Pedro Igor",
    handle: "userfiles/fb8bb36ca97f0c2a85e...",
    owner: "Pedro",
    channel: "Instagram",
    status: "closed",
    preview: "userfiles/fb8bb36ca97f0c2a85e...",
    dateLabel: "14 de fev.",
    unreadCount: 0,
    avatarLabel: "PI",
    accent: "neutral",
    messages: [
      {
        id: "thread-pedro-igor-1",
        side: "incoming",
        sender: "Pedro Igor",
        text: "Muito obrigado pelo retorno.",
        time: "14/02/2024 10:20",
      },
    ],
  },
  {
    id: "thread-landin",
    name: "Landin",
    handle: "Fechado com sucesso",
    owner: "Pedro",
    channel: "WhatsApp",
    status: "closed",
    preview: "Fechado com sucesso",
    dateLabel: "9 de fev.",
    unreadCount: 0,
    avatarLabel: "LA",
    accent: "dark",
    messages: [
      {
        id: "thread-landin-1",
        side: "outgoing",
        sender: "Pedro",
        text: "Fechado com sucesso. Obrigado pela preferencia.",
        time: "09/02/2024 12:02",
      },
    ],
  },
];

function buildDefaultWhatsappCrmConfig() {
  return {
    provider: "WhatsApp Cloud API",
    phoneNumberId: "",
    businessAccountId: "",
    verifyToken: "genius",
    accessTokenConfigured: false,
    accessTokenPreview: "",
    defaultCountryCode: "55",
    webhookPath: "/webhook",
    webhookUrl: "",
    status: "pending",
  };
}

function buildDefaultWhatsappCrmStatus() {
  return {
    provider: "WhatsApp Cloud API",
    configured: false,
    connected: false,
    recentMessages: 0,
    lastWebhookAt: null,
    webhookUrl: "",
    phoneNumberId: "",
    businessAccountId: "",
  };
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10.5 3a7.5 7.5 0 1 0 4.73 13.32l4.72 4.73 1.06-1.06-4.73-4.72A7.5 7.5 0 0 0 10.5 3Zm0 1.5A6 6 0 1 1 4.5 10.5a6.01 6.01 0 0 1 6-6Z"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4.5 6.25h3v3h-3Zm5.25 0h9.75v1.5H9.75Zm0 8.25h9.75V16H9.75Zm0-4.12h9.75v1.5H9.75ZM4.5 10.38h3v3h-3Zm0 4.12h3v3h-3Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3a9 9 0 1 0 9 9 9.01 9.01 0 0 0-9-9Zm0 1.5A7.5 7.5 0 1 1 4.5 12 7.51 7.51 0 0 1 12 4.5Zm-.75 2.75v5.31l4.2 2.52.77-1.28-3.47-2.08V7.25Z"
      />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.25 2.75h-4.5v1.5h1.5v1.2A7.75 7.75 0 1 0 17.5 8l1.06-1.06-1.06-1.06-1.15 1.15a7.69 7.69 0 0 0-3.6-1.56V4.25h1.5Zm-2.25 4a6.25 6.25 0 1 1-6.25 6.25A6.26 6.26 0 0 1 12 6.75Zm-.75 1.75v4.81l3.4 2.08.78-1.28-2.68-1.63V8.5Z"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3a9 9 0 1 0 9 9 9.01 9.01 0 0 0-9-9Zm4.23 6.66-5.16 5.91-3.3-3.02 1.01-1.11 2.17 1.98 4.15-4.76Z"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 4.24 4.75 10.2v9.05h5.5v-5.5h3.5v5.5h5.5V10.2Zm0-1.94 8.75 7.2v11.25h-8.5v-5.5h-.5v5.5h-8.5V9.5Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4 4.75h16A1.75 1.75 0 0 1 21.75 6.5v8A1.75 1.75 0 0 1 20 16.25H9.7L5.5 19.61v-3.36H4A1.75 1.75 0 0 1 2.25 14.5v-8A1.75 1.75 0 0 1 4 4.75Zm0 1.5a.25.25 0 0 0-.25.25v8A.25.25 0 0 0 4 14.75h3v1.74l2.18-1.74H20a.25.25 0 0 0 .25-.25v-8A.25.25 0 0 0 20 6.25Z" />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M8.5 11.25a3.25 3.25 0 1 0-3.25-3.25 3.25 3.25 0 0 0 3.25 3.25Zm7.75-.75a2.75 2.75 0 1 0-2.75-2.75 2.75 2.75 0 0 0 2.75 2.75ZM3.75 18.75h9.5v-.25c0-2.31-2.35-4.25-5.25-4.25s-5.25 1.94-5.25 4.25Zm10.75 0h5.75v-.5c0-1.92-2.02-3.53-4.45-3.93a5.57 5.57 0 0 1 1.2 3.43v1Z" />
    </svg>
  );
}

function CRMIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4.25 4.25h6.5v6.5h-6.5Zm9 0h6.5v6.5h-6.5Zm-9 9h6.5v6.5h-6.5Zm9 0h6.5v6.5h-6.5Zm-7.5-7.5v3.5h3.5v-3.5Zm9 0v3.5h3.5v-3.5Zm-9 9v3.5h3.5v-3.5Zm9 0v3.5h3.5v-3.5Z" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M9.79 16.61 5.4 12.22l1.06-1.06 3.33 3.33 7.75-7.75 1.06 1.06Zm-4.54 4.14A2.75 2.75 0 0 1 2.5 18V6A2.75 2.75 0 0 1 5.25 3.25h13.5A2.75 2.75 0 0 1 21.5 6v12a2.75 2.75 0 0 1-2.75 2.75Zm0-16A1.25 1.25 0 0 0 4 6v12a1.25 1.25 0 0 0 1.25 1.25h13.5A1.25 1.25 0 0 0 20 18V6a1.25 1.25 0 0 0-1.25-1.25Z" />
    </svg>
  );
}

function SendPlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="m3.22 11.54 16.8-7.35a.75.75 0 0 1 1.02.88l-3.22 13.65a.75.75 0 0 1-1.26.37l-4.21-4.03-3.4 3.4a.75.75 0 0 1-1.28-.53v-4.36L3.02 12.9a.75.75 0 0 1 .2-1.36Zm3.43.3 2.9.43a.75.75 0 0 1 .54 1.07l-.88 1.76 9.21-8.35Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M9.47 14.53a.75.75 0 0 1 0-1.06l4-4a3.25 3.25 0 1 1 4.6 4.6l-1.77 1.77-1.06-1.06L17 13a1.75 1.75 0 0 0-2.48-2.47l-4 4a.75.75 0 0 1-1.05 0Zm5.06-5.06a.75.75 0 0 1 0 1.06l-4 4a3.25 3.25 0 0 1-4.6-4.6l1.77-1.77 1.06 1.06L7 11a1.75 1.75 0 0 0 2.48 2.47l4-4a.75.75 0 0 1 1.05 0Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M8.25 2.75h7.5A2.75 2.75 0 0 1 18.5 5.5v13a2.75 2.75 0 0 1-2.75 2.75h-7.5A2.75 2.75 0 0 1 5.5 18.5v-13A2.75 2.75 0 0 1 8.25 2.75Zm0 1.5A1.25 1.25 0 0 0 7 5.5v13a1.25 1.25 0 0 0 1.25 1.25h7.5A1.25 1.25 0 0 0 17 18.5v-13a1.25 1.25 0 0 0-1.25-1.25Zm2.75 13.5h2.5v1.5H11Z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M5.25 3.25h11.5A2.75 2.75 0 0 1 19.5 6v12.75h-1.5V6a1.25 1.25 0 0 0-1.25-1.25H6.5v14h10.25v1.5H6.5A2.25 2.25 0 0 1 4.25 18V5.5a2.25 2.25 0 0 1 1-1.88Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 1.5c-4 0-7.25 2.36-7.25 5.25v.5h14.5v-.5c0-2.89-3.25-5.25-7.25-5.25Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="m12 2.75 1.07 2.48 2.7.29.71 2.62 2.33 1.41-1.06 2.5 1.06 2.5-2.33 1.41-.71 2.62-2.7.29L12 21.25l-1.07-2.48-2.7-.29-.71-2.62-2.33-1.41 1.06-2.5-1.06-2.5 2.33-1.41.71-2.62 2.7-.29Zm0 3.06-1.01 2.34-2.54.27-.45 1.64-2.02 1.22.92 2.16-.92 2.16 2.02 1.22.45 1.64 2.54.27L12 18.19l1.01-2.34 2.54-.27.45-1.64 2.02-1.22-.92-2.16.92-2.16-2.02-1.22-.45-1.64-2.54-.27ZM12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M13.18 2.8a8.96 8.96 0 1 0 8.02 12.53 7.6 7.6 0 0 1-8.02-12.53Zm-5.93 14.8a7.46 7.46 0 0 1 8.03-12.24 9.1 9.1 0 0 0 6.53 10.82A7.47 7.47 0 0 1 7.25 17.6Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3 5.25h18A1.75 1.75 0 0 1 22.75 7v10A1.75 1.75 0 0 1 21 18.75H3A1.75 1.75 0 0 1 1.25 17V7A1.75 1.75 0 0 1 3 5.25Zm0 1.5a.25.25 0 0 0-.25.25v.12L12 13.4l9.25-6.28V7a.25.25 0 0 0-.25-.25Zm18 10.5a.25.25 0 0 0 .25-.25V8.93l-8.83 5.99a.75.75 0 0 1-.84 0L2.75 8.93V17a.25.25 0 0 0 .25.25Z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 4a8 8 0 0 1 7.74 6h-1.56A6.5 6.5 0 1 0 18 14.5h-2.25L19 18l3.25-3.5H19.5A7.99 7.99 0 0 1 12 20a8 8 0 0 1 0-16Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="m6.53 5.47 5.47 5.47 5.47-5.47 1.06 1.06L13.06 12l5.47 5.47-1.06 1.06L12 13.06l-5.47 5.47-1.06-1.06L10.94 12 5.47 6.53Z" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M15.81 6.19a3.75 3.75 0 0 0-5.3 0l-4.6 4.6a5.25 5.25 0 1 0 7.43 7.42l5.26-5.25-.01-.01a6.75 6.75 0 0 0-9.55-9.55l-4.25 4.25 1.06 1.06 4.25-4.25a5.25 5.25 0 0 1 7.43 7.43l-5.25 5.25a3.75 3.75 0 0 1-5.31-5.3l4.6-4.61a2.25 2.25 0 0 1 3.19 3.18l-4.25 4.25 1.06 1.06 4.25-4.25a3.75 3.75 0 0 0 0-5.3Z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 3.25A2.75 2.75 0 0 0 9.25 6v5.5a2.75 2.75 0 1 0 5.5 0V6A2.75 2.75 0 0 0 12 3.25Zm0 12.5A4.26 4.26 0 0 1 7.75 11.5v-.75h-1.5v.75a5.76 5.76 0 0 0 5 5.69v2.06H8.5v1.5h7v-1.5h-2.75v-2.06a5.76 5.76 0 0 0 5-5.69v-.75h-1.5v.75A4.26 4.26 0 0 1 12 15.75Z" />
    </svg>
  );
}

function getIconByName(name) {
  switch (name) {
    case "home":
      return <HomeIcon />;
    case "chat":
      return <ChatIcon />;
    case "contacts":
      return <ContactsIcon />;
    case "crm":
      return <CRMIcon />;
    case "tasks":
      return <TasksIcon />;
    case "send":
      return <SendPlaneIcon />;
    case "clock":
      return <ClockIcon />;
    case "link":
      return <LinkIcon />;
    case "phone":
      return <PhoneIcon />;
    case "book":
      return <BookIcon />;
    case "user":
      return <UserIcon />;
    case "settings":
      return <SettingsIcon />;
    case "list":
      return <ListIcon />;
    case "timer":
      return <TimerIcon />;
    case "check":
      return <CheckCircleIcon />;
    default:
      return <ChatIcon />;
  }
}

function formatNowLabel() {
  const now = new Date();
  const date = now.toLocaleDateString("pt-BR");
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date} ${time}`;
}

function formatThreadDateLabel(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}

function formatThreadMessageTime(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPhoneDisplay(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "Nao informado";

  if (digits.length === 13 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 12 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return digits;
}

function formatConversationStatusLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "pending") return "Pendente";
  if (normalized === "attending") return "Atendendo";
  if (normalized === "closed") return "Fechado";
  return "Atendimento";
}

function formatConversationSourceLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "whatsapp-webhook") return "Webhook WhatsApp";
  if (normalized === "agenda") return "Agenda";
  if (normalized === "registers-person") return "Cadastro tutor";
  if (normalized === "registers-patient") return "Cadastro paciente";
  if (normalized === "crm") return "CRM";
  return normalized || "manual";
}

function getAccentForStatus(status) {
  if (status === "attending") return "violet";
  if (status === "closed") return "neutral";
  return "green";
}

function buildSummaryCounts(threads) {
  return threads.reduce(
    (accumulator, thread) => {
      accumulator.all += 1;
      if (accumulator[thread.status] != null) {
        accumulator[thread.status] += 1;
      }
      return accumulator;
    },
    { all: 0, pending: 0, attending: 0, closed: 0 },
  );
}

function toChannelLabel(channel) {
  const normalized = String(channel || "").trim().toLowerCase();
  if (normalized === "whatsapp") return "WhatsApp";
  if (normalized === "instagram") return "Instagram";
  if (!normalized) return "Canal";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function toAvatarLabel(...values) {
  const source = values.find((value) => String(value || "").trim()) || "?";
  const parts = String(source).trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return String(source).trim().slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function mapConversationToThread(conversation) {
  const customerName =
    conversation?.customerName || conversation?.customer?.name || "";
  const petName = conversation?.petName || conversation?.pet?.name || "";
  const title =
    conversation?.title ||
    petName ||
    customerName ||
    conversation?.phone ||
    "Nova conversa";
  const subtitle =
    petName ||
    conversation?.phone ||
    conversation?.lastMessagePreview ||
    "Sem mensagens";

  return {
    id: conversation?.id || "",
    customerId: conversation?.customerId || conversation?.customer?.id || "",
    petId: conversation?.petId || conversation?.pet?.id || "",
    name: title,
    handle: subtitle,
    owner: conversation?.assignedUser?.name || "Sem responsavel",
    channel: toChannelLabel(conversation?.channel),
    status: String(conversation?.status || "pending").toLowerCase(),
    preview: conversation?.lastMessagePreview || subtitle,
    dateLabel: formatThreadDateLabel(
      conversation?.lastMessageAt || conversation?.updatedAt,
    ),
    unreadCount: Number(conversation?.unreadCount || 0),
    avatarLabel: toAvatarLabel(petName, customerName, title),
    accent: getAccentForStatus(conversation?.status),
    phone: conversation?.phone || "",
    customerName,
    petName,
    title,
    source: conversation?.source || "crm",
    notes: conversation?.notes || "",
    metadata: conversation?.metadata || {},
    customer: conversation?.customer || null,
    pet: conversation?.pet || null,
    assignedUser: conversation?.assignedUser || null,
    lastMessageAt: conversation?.lastMessageAt || conversation?.updatedAt || "",
    messages: [],
  };
}

function mapConversationMessageToBubble(message, thread) {
  const isOutgoing = String(message?.direction || "").toLowerCase() === "outbound";
  const sender =
    message?.authorUser?.name ||
    thread?.owner ||
    thread?.customerName ||
    thread?.name ||
    (isOutgoing ? "Atendente" : "Cliente");

  return {
    id: message?.id || "",
    side: isOutgoing ? "outgoing" : "incoming",
    sender,
    text: message?.body || (message?.mediaUrl ? "[midia]" : ""),
    time: formatThreadMessageTime(
      message?.sentAt ||
        message?.receivedAt ||
        message?.createdAt ||
        message?.readAt,
    ),
  };
}

function getVisibleThreads(threads, activeTab, searchQuery) {
  const normalizedQuery = String(searchQuery || "").trim().toLowerCase();

  return threads.filter((thread) => {
    const matchesStatus = activeTab === "all" ? true : thread.status === activeTab;
    if (!matchesStatus) return false;

    if (!normalizedQuery) return true;

    return [thread.name, thread.handle, thread.owner, thread.channel, thread.preview, thread.phone, thread.customerName, thread.petName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });
}

function evaluateAiControlPreview(control, actionType, payload = {}) {
  if (!control?.enabled) {
    return {
      allowed: false,
      executionMode: "blocked",
      reasons: ["A IA esta desativada no preview."],
      warnings: [],
    };
  }

  if (
    actionType === "schedule_appointment" &&
    control?.capabilities?.createAppointment
  ) {
    const requiresApproval =
      control?.scheduling?.requireHumanApproval ||
      !control?.autoExecuteEnabled ||
      !payload?.tutorConfirmed;

    return {
      allowed: true,
      executionMode: requiresApproval ? "approval" : "automatic",
      reasons: [],
      warnings: !payload?.tutorConfirmed
        ? ["Tutor ainda nao confirmou no preview."]
        : [],
    };
  }

  return {
    allowed: true,
    executionMode: control?.autoExecuteEnabled ? "automatic" : "approval",
    reasons: [],
    warnings: [],
  };
}

function buildDefaultAiBathDraft() {
  const nextDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
  nextDate.setSeconds(0, 0);
  const localValue = new Date(
    nextDate.getTime() - nextDate.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);

  return {
    appointmentAt: localValue,
    serviceQuery: "Banho",
    tutorConfirmed: true,
    humanApproved: false,
    notes: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    petName: "",
    petSpecies: "",
    petBreed: "",
  };
}

function formatAppointmentOptionLabel(appointment) {
  const date = String(appointment?.date || "").slice(0, 10);
  const time = String(appointment?.time || "").slice(0, 5);
  const serviceName =
    appointment?.Service?.name ||
    appointment?.service?.name ||
    "Atendimento";

  return [serviceName, date, time].filter(Boolean).join(" - ");
}

function formatAiAuditStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "executed") return "Executado";
  if (normalized === "blocked") return "Bloqueado";
  if (normalized === "waiting_approval") return "Aguardando aprovacao";
  if (normalized === "proposed") return "Proposta";
  return normalized || "Registro";
}

function formatAiAuditAction(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "schedule_bath") return "Agendar banho";
  if (normalized === "upsert_contact") return "Cadastro";
  if (normalized === "reschedule_appointment") return "Remarcar";
  if (normalized === "cancel_appointment") return "Cancelar";
  if (normalized === "answer") return "Resposta";
  return normalized || "Acao";
}

function buildDateTimeLocalValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function extractDateTimeSuggestionFromText(text, fallbackValue) {
  const normalized = String(text || "").toLowerCase();
  const baseDate = new Date();

  if (normalized.includes("amanha") || normalized.includes("amanhã")) {
    baseDate.setDate(baseDate.getDate() + 1);
  }

  const explicitDateMatch = normalized.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (explicitDateMatch) {
    const day = Number(explicitDateMatch[1]);
    const month = Number(explicitDateMatch[2]) - 1;
    let year = explicitDateMatch[3] ? Number(explicitDateMatch[3]) : baseDate.getFullYear();
    if (year < 100) {
      year += 2000;
    }
    baseDate.setFullYear(year, month, day);
  }

  const timeMatch =
    normalized.match(/(\d{1,2})[:h](\d{2})/) ||
    normalized.match(/(\d{1,2})\s*horas?/);

  if (!timeMatch) {
    return fallbackValue;
  }

  const hours = Number(timeMatch[1]);
  const minutes = timeMatch[2] != null ? Number(timeMatch[2]) : 0;
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return fallbackValue;
  }

  baseDate.setHours(hours, minutes, 0, 0);
  return buildDateTimeLocalValue(baseDate);
}

function buildIntentSuggestion({
  thread,
  appointments,
  latestQuestion,
}) {
  const question = String(latestQuestion || "").trim();
  const normalized = question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  let action = "knowledge";
  let label = "Resposta";
  let reason = "A conversa parece pedir uma orientacao com base no sistema.";

  if (
    normalized.includes("cancel") ||
    normalized.includes("desmarc")
  ) {
    action = "cancel";
    label = "Cancelar";
    reason = "A mensagem parece pedir cancelamento de agendamento.";
  } else if (
    normalized.includes("remarc") ||
    normalized.includes("mudar o horario") ||
    normalized.includes("mudar horario") ||
    normalized.includes("outro horario")
  ) {
    action = "reschedule";
    label = "Remarcar";
    reason = "A mensagem parece pedir alteracao de horario.";
  } else if (
    normalized.includes("cadastro") ||
    normalized.includes("cliente novo") ||
    normalized.includes("primeira vez") ||
    normalized.includes("me cadastrar")
  ) {
    action = "contact";
    label = "Cadastro";
    reason = "A conversa parece pedir cadastro de tutor ou pet.";
  } else if (
    normalized.includes("banho") ||
    normalized.includes("tosa") ||
    normalized.includes("horario") ||
    normalized.includes("agenda") ||
    normalized.includes("agendar")
  ) {
    action = "bath";
    label = "Agendar";
    reason = "A mensagem parece pedir horario ou agendamento de banho/tosa.";
  }

  const appointmentId =
    action === "reschedule" || action === "cancel"
      ? appointments?.[0]?.id || ""
      : "";
  const serviceQuery = normalized.includes("tosa")
    ? normalized.includes("banho")
      ? "Banho e Tosa"
      : "Tosa"
    : "Banho";

  return {
    key: `${thread?.id || ""}:${action}:${question}`,
    action,
    label,
    reason,
    question,
    serviceQuery,
    appointmentId,
    appointmentAt: extractDateTimeSuggestionFromText(
      question,
      buildDefaultAiBathDraft().appointmentAt,
    ),
  };
}

export function MessagesWorkspacePage({
  auth,
  apiRequest,
  isDemo = false,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [threads, setThreads] = useState(() => (isDemo ? INITIAL_THREADS : []));
  const [activeTab, setActiveTab] = useState("all");
  const [activeMenuId, setActiveMenuId] = useState("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedThreadId, setSelectedThreadId] = useState(() =>
    isDemo ? "thread-pedro" : "",
  );
  const [draftMessage, setDraftMessage] = useState("");
  const [summaryCounts, setSummaryCounts] = useState(() =>
    isDemo
      ? buildSummaryCounts(INITIAL_THREADS)
      : { all: 0, pending: 0, attending: 0, closed: 0 },
  );
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAiControlOpen, setIsAiControlOpen] = useState(false);
  const [aiControl, setAiControl] = useState(() => buildDefaultAiControl());
  const [isAiControlLoading, setIsAiControlLoading] = useState(false);
  const [isAiControlSaving, setIsAiControlSaving] = useState(false);
  const [aiControlFeedback, setAiControlFeedback] = useState("");
  const [isWhatsappConfigOpen, setIsWhatsappConfigOpen] = useState(false);
  const [whatsappConfig, setWhatsappConfig] = useState(() =>
    buildDefaultWhatsappCrmConfig(),
  );
  const [whatsappStatus, setWhatsappStatus] = useState(() =>
    buildDefaultWhatsappCrmStatus(),
  );
  const [isWhatsappConfigLoading, setIsWhatsappConfigLoading] = useState(false);
  const [isWhatsappConfigSaving, setIsWhatsappConfigSaving] = useState(false);
  const [isWhatsappConfigTesting, setIsWhatsappConfigTesting] = useState(false);
  const [whatsappConfigFeedback, setWhatsappConfigFeedback] = useState("");
  const [whatsappTestResult, setWhatsappTestResult] = useState(null);
  const [aiBathDraft, setAiBathDraft] = useState(() => buildDefaultAiBathDraft());
  const [aiBathResult, setAiBathResult] = useState(null);
  const [isAiBathLoading, setIsAiBathLoading] = useState(false);
  const [isAiReplySending, setIsAiReplySending] = useState(false);
  const [customerAppointments, setCustomerAppointments] = useState([]);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);
  const [aiAgendaDraft, setAiAgendaDraft] = useState(() => ({
    appointmentId: "",
    appointmentAt: buildDefaultAiBathDraft().appointmentAt,
    humanApproved: false,
  }));
  const [aiAgendaResult, setAiAgendaResult] = useState(null);
  const [isAiAgendaLoading, setIsAiAgendaLoading] = useState(false);
  const [aiContactResult, setAiContactResult] = useState(null);
  const [isAiContactLoading, setIsAiContactLoading] = useState(false);
  const [aiKnowledgeDraft, setAiKnowledgeDraft] = useState("");
  const [aiKnowledgeResult, setAiKnowledgeResult] = useState(null);
  const [isAiKnowledgeLoading, setIsAiKnowledgeLoading] = useState(false);
  const [aiIntentSuggestion, setAiIntentSuggestion] = useState(null);
  const [aiAuditLogs, setAiAuditLogs] = useState([]);
  const [isAiAuditLoading, setIsAiAuditLoading] = useState(false);
  const contextRequestRef = useRef("");
  const aiIntentAppliedRef = useRef("");

  const routeContext = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      search: String(params.get("search") || "").trim(),
      customerId: String(params.get("customerId") || "").trim(),
      petId: String(params.get("petId") || "").trim(),
      phone: String(params.get("phone") || "").trim(),
      customerName: String(params.get("customerName") || "").trim(),
      petName: String(params.get("petName") || "").trim(),
      title: String(params.get("title") || "").trim(),
      source: String(params.get("source") || "").trim(),
      status: String(params.get("status") || "").trim(),
    };
  }, [location.search]);

  const authHeaders = useMemo(() => {
    if (!auth?.token || isDemo) return {};
    return { Authorization: `Bearer ${auth.token}` };
  }, [auth?.token, isDemo]);
  const canEditAiControl = useMemo(
    () => ["admin", "proprietario"].includes(String(auth?.user?.role || "").toLowerCase()),
    [auth?.user?.role],
  );

  const statusMeta = useMemo(() => {
    return MESSAGE_STATUS_TABS.map((tab) => ({
      ...tab,
      count:
        tab.id === "all"
          ? Number(summaryCounts?.all ?? threads.length)
          : Number(summaryCounts?.[tab.id] ?? 0),
    }));
  }, [summaryCounts, threads]);

  const visibleThreads = useMemo(
    () => getVisibleThreads(threads, activeTab, deferredSearchQuery),
    [threads, activeTab, deferredSearchQuery],
  );
  const selectedThread =
    visibleThreads.find((thread) => thread.id === selectedThreadId) ||
    threads.find((thread) => thread.id === selectedThreadId) ||
    null;
  const selectedCustomer = selectedThread?.customer || null;
  const selectedPet = selectedThread?.pet || null;
  const latestCustomerQuestion = useMemo(() => {
    const inboundMessages = (selectedThread?.messages || []).filter(
      (message) =>
        message.side === "incoming" && String(message.text || "").trim(),
    );

    return (
      inboundMessages[inboundMessages.length - 1]?.text ||
      selectedThread?.preview ||
      selectedThread?.handle ||
      ""
    );
  }, [selectedThread]);

  useEffect(() => {
    if (routeContext.search) {
      setSearchQuery(routeContext.search);
    }
  }, [routeContext.search]);

  useEffect(() => {
    if (!visibleThreads.length) {
      setSelectedThreadId("");
      return;
    }

    if (selectedThreadId && !threads.some((thread) => thread.id === selectedThreadId)) {
      setSelectedThreadId("");
      return;
    }

    if (isDemo && !selectedThreadId) {
      setSelectedThreadId(visibleThreads[0].id);
    }
  }, [isDemo, selectedThreadId, threads, visibleThreads]);

  useEffect(() => {
    setAiBathResult(null);
    setAiAgendaResult(null);
    setAiContactResult(null);
    setAiKnowledgeResult(null);
    setAiIntentSuggestion(null);
    aiIntentAppliedRef.current = "";
    setAiBathDraft((current) => ({
      ...buildDefaultAiBathDraft(),
      serviceQuery: current?.serviceQuery || "Banho",
      tutorConfirmed:
        typeof current?.tutorConfirmed === "boolean"
          ? current.tutorConfirmed
          : true,
      customerName: selectedCustomer?.name || selectedThread?.customerName || "",
      customerPhone: selectedCustomer?.phone || selectedThread?.phone || "",
      customerEmail: selectedCustomer?.email || "",
      petName: selectedPet?.name || selectedThread?.petName || "",
      petSpecies: selectedPet?.species || "",
      petBreed: selectedPet?.breed || "",
    }));
    setAiAgendaDraft((current) => ({
      appointmentId: "",
      appointmentAt:
        current?.appointmentAt || buildDefaultAiBathDraft().appointmentAt,
      humanApproved: false,
    }));
    setAiKnowledgeDraft("");
  }, [selectedCustomer?.email, selectedCustomer?.name, selectedCustomer?.phone, selectedPet?.breed, selectedPet?.name, selectedPet?.species, selectedThread?.customerName, selectedThread?.petName, selectedThread?.phone, selectedThreadId]);

  useEffect(() => {
    let active = true;

    async function loadCustomerAppointments() {
      if (!selectedCustomer?.id || isDemo || typeof apiRequest !== "function" || !auth?.token) {
        setCustomerAppointments([]);
        setIsAppointmentsLoading(false);
        return;
      }

      try {
        setIsAppointmentsLoading(true);
        const response = await apiRequest(
          `/appointments/customer/${selectedCustomer.id}`,
          {
            headers: authHeaders,
          },
        );

        if (!active) return;

        const rows = Array.isArray(response?.data) ? response.data : [];
        setCustomerAppointments(rows);
      } catch (error) {
        if (!active) return;
        setCustomerAppointments([]);
      } finally {
        if (active) {
          setIsAppointmentsLoading(false);
        }
      }
    }

    loadCustomerAppointments();

    return () => {
      active = false;
    };
  }, [apiRequest, auth?.token, authHeaders, isDemo, selectedCustomer?.id, refreshKey]);

  useEffect(() => {
    let active = true;

    async function loadAiAuditLogs() {
      if (!selectedThread?.id || isDemo || typeof apiRequest !== "function" || !auth?.token) {
        setAiAuditLogs([]);
        setIsAiAuditLoading(false);
        return;
      }

      try {
        setIsAiAuditLoading(true);
        const response = await apiRequest(
          `/api/crm-ai/assistant/logs?conversationId=${encodeURIComponent(selectedThread.id)}&limit=15`,
          {
            headers: authHeaders,
          },
        );

        if (!active) return;
        setAiAuditLogs(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        if (!active) return;
        setAiAuditLogs([]);
      } finally {
        if (active) {
          setIsAiAuditLoading(false);
        }
      }
    }

    loadAiAuditLogs();

    return () => {
      active = false;
    };
  }, [apiRequest, auth?.token, authHeaders, isDemo, refreshKey, selectedThread?.id]);

  useEffect(() => {
    if (!selectedThread || !String(latestCustomerQuestion || "").trim()) {
      setAiIntentSuggestion(null);
      return;
    }

    const nextSuggestion = buildIntentSuggestion({
      thread: selectedThread,
      appointments: customerAppointments,
      latestQuestion: latestCustomerQuestion,
    });

    setAiIntentSuggestion(nextSuggestion);

    if (aiIntentAppliedRef.current === nextSuggestion.key) {
      return;
    }

    aiIntentAppliedRef.current = nextSuggestion.key;

    if (nextSuggestion.action === "bath") {
      setAiBathDraft((current) => ({
        ...current,
        serviceQuery: current?.serviceQuery || nextSuggestion.serviceQuery,
        appointmentAt:
          current?.appointmentAt || nextSuggestion.appointmentAt,
      }));
    }

    if (
      (nextSuggestion.action === "reschedule" ||
        nextSuggestion.action === "cancel") &&
      nextSuggestion.appointmentId
    ) {
      setAiAgendaDraft((current) => ({
        ...current,
        appointmentId: current?.appointmentId || nextSuggestion.appointmentId,
        appointmentAt:
          current?.appointmentAt || nextSuggestion.appointmentAt,
      }));
    }

    if (nextSuggestion.action === "knowledge") {
      setAiKnowledgeDraft((current) =>
        String(current || "").trim() ? current : nextSuggestion.question,
      );
    }
  }, [customerAppointments, latestCustomerQuestion, selectedThread]);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      if (isDemo) {
        setThreads(INITIAL_THREADS);
        setSummaryCounts(buildSummaryCounts(INITIAL_THREADS));
        setIsWorkspaceLoading(false);
        return;
      }

      if (!auth?.token || typeof apiRequest !== "function") {
        setThreads([]);
        setSummaryCounts({ all: 0, pending: 0, attending: 0, closed: 0 });
        setIsWorkspaceLoading(false);
        return;
      }

      setIsWorkspaceLoading(true);
      setErrorMessage("");

      try {
        const params = new URLSearchParams();
        params.set("status", activeTab);
        params.set("limit", "80");
        if (deferredSearchQuery) {
          params.set("search", deferredSearchQuery);
        }

        const conversationsResponse = await apiRequest(
          `/crm-conversations?${params.toString()}`,
          {
            headers: authHeaders,
          },
        );

        if (!active) return;

        const nextThreads = Array.isArray(conversationsResponse?.data)
          ? conversationsResponse.data.map(mapConversationToThread)
          : [];

        setThreads(nextThreads);
        setSummaryCounts(
          conversationsResponse?.summary || buildSummaryCounts(nextThreads),
        );
      } catch (error) {
        if (!active) return;
        setThreads([]);
        setSummaryCounts({ all: 0, pending: 0, attending: 0, closed: 0 });
        setSelectedThreadId("");
        setErrorMessage(
          error?.message || "Nao foi possivel carregar as conversas.",
        );
      } finally {
        if (active) {
          setIsWorkspaceLoading(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      active = false;
    };
  }, [activeTab, apiRequest, auth?.token, authHeaders, deferredSearchQuery, isDemo, refreshKey]);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      if (!selectedThread || isDemo || typeof apiRequest !== "function" || !auth?.token) {
        return;
      }

      setIsMessagesLoading(true);

      try {
        const response = await apiRequest(
          `/crm-conversations/${selectedThread.id}/messages?limit=300`,
          {
            headers: authHeaders,
          },
        );

        if (!active) return;

        const mappedMessages = Array.isArray(response?.data)
          ? response.data.map((message) =>
              mapConversationMessageToBubble(message, selectedThread),
            )
          : [];

        setThreads((currentThreads) =>
          currentThreads.map((thread) =>
            thread.id === selectedThread.id
              ? { ...thread, messages: mappedMessages, unreadCount: 0 }
              : thread,
          ),
        );

        if (selectedThread.unreadCount > 0) {
          await apiRequest(`/crm-conversations/${selectedThread.id}/read`, {
            method: "POST",
            headers: authHeaders,
          });

          if (!active) return;

          setThreads((currentThreads) =>
            currentThreads.map((thread) =>
              thread.id === selectedThread.id
                ? { ...thread, unreadCount: 0 }
                : thread,
            ),
          );
        }
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          error?.message || "Nao foi possivel carregar as mensagens.",
        );
      } finally {
        if (active) {
          setIsMessagesLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      active = false;
    };
  }, [apiRequest, auth?.token, authHeaders, isDemo, selectedThread]);

  useEffect(() => {
    const hasContext =
      routeContext.customerId ||
      routeContext.petId ||
      routeContext.phone ||
      routeContext.customerName ||
      routeContext.petName ||
      routeContext.title;

    if (!hasContext || isDemo || typeof apiRequest !== "function" || !auth?.token) {
      return;
    }

    const requestKey = JSON.stringify(routeContext);
    if (contextRequestRef.current === requestKey) {
      return;
    }
    contextRequestRef.current = requestKey;

    let active = true;

    async function openConversationFromContext() {
      try {
        const response = await apiRequest("/crm-conversations", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            customerId: routeContext.customerId || null,
            petId: routeContext.petId || null,
            phone: routeContext.phone || null,
            customerName: routeContext.customerName || null,
            petName: routeContext.petName || null,
            title: routeContext.title || null,
            source: routeContext.source || "crm",
            status: routeContext.status || "pending",
            channel: "whatsapp",
            assignedUserId: auth?.user?.id || null,
          }),
        });

        if (!active) return;

        const nextThread = mapConversationToThread(response?.data || {});
        setSelectedThreadId(nextThread.id);
        setActiveTab(nextThread.status || "pending");
        setFeedback("Conversa preparada com o contexto selecionado.");
        setRefreshKey((current) => current + 1);

        const nextParams = new URLSearchParams(location.search);
        [
          "customerId",
          "petId",
          "phone",
          "customerName",
          "petName",
          "title",
          "source",
          "status",
        ].forEach((key) => nextParams.delete(key));
        navigate(
          `${location.pathname}${nextParams.toString() ? `?${nextParams.toString()}` : ""}`,
          { replace: true },
        );
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          error?.message || "Nao foi possivel abrir a conversa pelo contexto recebido.",
        );
      }
    }

    openConversationFromContext();

    return () => {
      active = false;
    };
  }, [apiRequest, auth?.token, auth?.user?.id, authHeaders, isDemo, location.pathname, location.search, navigate, routeContext]);

  const handleCloseConversation = async () => {
    if (!selectedThread) return;

    setErrorMessage("");
    setFeedback("");
    setIsSubmitting(true);

    if (!isDemo && typeof apiRequest === "function" && auth?.token) {
      try {
        await apiRequest(`/crm-conversations/${selectedThread.id}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ status: "closed" }),
        });
      } catch (error) {
        setErrorMessage(
          error?.message || "Nao foi possivel fechar a conversa.",
        );
        setIsSubmitting(false);
        return;
      }
    }

    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === selectedThread.id
          ? {
              ...thread,
              status: "closed",
              unreadCount: 0,
              preview: "Conversa fechada",
              accent: "neutral",
            }
          : thread,
      ),
    );
    setSummaryCounts((currentCounts) => ({
      ...currentCounts,
      pending:
        selectedThread.status === "pending"
          ? Math.max(0, Number(currentCounts.pending || 0) - 1)
          : Number(currentCounts.pending || 0),
      attending:
        selectedThread.status === "attending"
          ? Math.max(0, Number(currentCounts.attending || 0) - 1)
          : Number(currentCounts.attending || 0),
      closed:
        Number(currentCounts.closed || 0) +
        (selectedThread.status === "closed" ? 0 : 1),
    }));
    setActiveTab("closed");
    setFeedback(isDemo ? "Conversa fechada no preview." : "Conversa fechada com sucesso.");
    setIsSubmitting(false);
  };

  const sendConversationText = async (bodyText, successMessage) => {
    const nextDraft = String(bodyText || "").trim();
    if (!selectedThread || !nextDraft) {
      return false;
    }

    let nextMessage = {
      id: `${selectedThread.id}-${Date.now()}`,
      side: "outgoing",
      sender: auth?.user?.name || "Pedro",
      text: nextDraft,
      time: formatNowLabel(),
    };

    if (!isDemo && typeof apiRequest === "function" && auth?.token) {
      const response = await apiRequest(
        `/crm-conversations/${selectedThread.id}/messages`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            body: nextDraft,
            direction: "outbound",
            messageType: "text",
            sendNow: true,
          }),
        },
      );

      nextMessage = mapConversationMessageToBubble(
        response?.data || {},
        selectedThread,
      );
    }

    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === selectedThread.id
          ? {
              ...thread,
              status: "attending",
              preview: nextDraft,
              unreadCount: 0,
              dateLabel: "agora",
              accent: "violet",
              messages: [...(thread.messages || []), nextMessage],
            }
          : thread,
      ),
    );
    setSummaryCounts((currentCounts) => ({
      ...currentCounts,
      pending:
        selectedThread.status === "pending"
          ? Math.max(0, Number(currentCounts.pending || 0) - 1)
          : Number(currentCounts.pending || 0),
      attending:
        selectedThread.status === "attending"
          ? Number(currentCounts.attending || 0)
          : Number(currentCounts.attending || 0) + 1,
    }));
    setActiveTab("attending");
    setFeedback(
      successMessage ||
        (isDemo
          ? "Mensagem enviada no preview."
          : "Mensagem enviada com sucesso."),
    );
    return true;
  };

  const handleSendMessage = async () => {
    const nextDraft = String(draftMessage || "").trim();
    if (!selectedThread || !nextDraft) return;

    setErrorMessage("");
    setFeedback("");
    setIsSubmitting(true);

    try {
      const sent = await sendConversationText(nextDraft);
      if (sent) {
        setDraftMessage("");
      }
    } catch (error) {
      setErrorMessage(
        error?.message || "Nao foi possivel enviar a mensagem.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const openCustomerRegister = () => {
    const customerLabel =
      selectedThread?.customer?.name ||
      selectedThread?.customerName ||
      selectedThread?.phone ||
      "";
    if (!customerLabel) return;
    navigate(`/cadastros?tab=Pessoas&search=${encodeURIComponent(customerLabel)}`);
  };

  const openPetRegister = () => {
    const petLabel = selectedThread?.pet?.name || selectedThread?.petName || "";
    if (!petLabel) return;
    navigate(`/cadastros?tab=Pacientes&search=${encodeURIComponent(petLabel)}`);
  };

  const openAiControl = async () => {
    setIsAiControlOpen(true);
    setAiControlFeedback("");

    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
      setAiControl(buildDefaultAiControl());
      if (isDemo) {
        setAiControlFeedback("Controle da IA em modo preview. As regras ficam locais enquanto voce testa.");
      }
      return;
    }

    try {
      setIsAiControlLoading(true);
      const response = await apiRequest("/api/crm-ai/control", {
        headers: authHeaders,
      });
      setAiControl(response?.data || buildDefaultAiControl());
    } catch (error) {
      setAiControlFeedback(
        error?.message || "Nao foi possivel carregar o controle da IA.",
      );
    } finally {
      setIsAiControlLoading(false);
    }
  };

  const openWhatsappConfig = async () => {
    setIsWhatsappConfigOpen(true);
    setWhatsappConfigFeedback("");
    setWhatsappTestResult(null);

    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
      setWhatsappConfig(buildDefaultWhatsappCrmConfig());
      setWhatsappStatus(buildDefaultWhatsappCrmStatus());
      if (isDemo) {
        setWhatsappConfigFeedback(
          "Configuracao do WhatsApp em modo preview. Salve os dados reais quando estiver usando a conta principal.",
        );
      }
      return;
    }

    try {
      setIsWhatsappConfigLoading(true);
      const [configResponse, statusResponse] = await Promise.all([
        apiRequest("/whatsapp-crm-config", {
          headers: authHeaders,
        }),
        apiRequest("/crm-whatsapp/status", {
          headers: authHeaders,
        }),
      ]);
      setWhatsappConfig({
        ...buildDefaultWhatsappCrmConfig(),
        ...(configResponse?.data || {}),
      });
      setWhatsappStatus({
        ...buildDefaultWhatsappCrmStatus(),
        ...(statusResponse?.data || {}),
      });
    } catch (error) {
      setWhatsappConfigFeedback(
        error?.message || "Nao foi possivel carregar a configuracao do WhatsApp CRM.",
      );
    } finally {
      setIsWhatsappConfigLoading(false);
    }
  };

  const saveWhatsappConfig = async (nextConfig) => {
    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
      setWhatsappConfig({
        ...buildDefaultWhatsappCrmConfig(),
        ...nextConfig,
        accessTokenConfigured:
          Boolean(nextConfig?.accessToken) || Boolean(nextConfig?.accessTokenConfigured),
        accessTokenPreview: nextConfig?.accessToken
          ? `${String(nextConfig.accessToken).slice(0, 8)}...${String(nextConfig.accessToken).slice(-4)}`
          : "",
      });
      setWhatsappConfigFeedback(
        "Preview salvo localmente. No ambiente principal, esses dados vao para o servidor.",
      );
      return;
    }

    try {
      setIsWhatsappConfigSaving(true);
      const response = await apiRequest("/whatsapp-crm-config", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(nextConfig),
      });
      const savedConfig = response?.data || {};
      const statusResponse = await apiRequest("/crm-whatsapp/status", {
        headers: authHeaders,
      });
      setWhatsappConfig({
        ...buildDefaultWhatsappCrmConfig(),
        ...savedConfig,
        accessTokenConfigured:
          Boolean(savedConfig?.accessTokenConfigured) || Boolean(nextConfig?.accessToken),
        accessTokenPreview: nextConfig?.accessToken
          ? `${String(nextConfig.accessToken).slice(0, 8)}...${String(nextConfig.accessToken).slice(-4)}`
          : whatsappConfig.accessTokenPreview,
        webhookUrl: whatsappConfig.webhookUrl,
        webhookPath: whatsappConfig.webhookPath,
      });
      setWhatsappStatus({
        ...buildDefaultWhatsappCrmStatus(),
        ...(statusResponse?.data || {}),
      });
      setWhatsappConfigFeedback(
        response?.message || "Configuracao do WhatsApp CRM salva com sucesso.",
      );
    } catch (error) {
      setWhatsappConfigFeedback(
        error?.message || "Nao foi possivel salvar a configuracao do WhatsApp CRM.",
      );
    } finally {
      setIsWhatsappConfigSaving(false);
    }
  };

  const testWhatsappConfig = async () => {
    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
      setWhatsappTestResult({
        displayPhoneNumber: whatsappConfig.phoneNumberId || "Preview local",
        verifiedName: "ViaPet Preview",
        qualityRating: "GREEN",
      });
      setWhatsappConfigFeedback(
        "Teste executado em modo preview. Na conta real, ele consulta a Meta.",
      );
      return;
    }

    try {
      setIsWhatsappConfigTesting(true);
      const response = await apiRequest("/crm-whatsapp/test-connection", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({}),
      });
      setWhatsappTestResult(response?.data || null);
      setWhatsappConfigFeedback(
        response?.message || "Conexao com a Meta validada com sucesso.",
      );
    } catch (error) {
      setWhatsappTestResult(null);
      setWhatsappConfigFeedback(
        error?.message || "Nao foi possivel validar a conexao com a Meta.",
      );
    } finally {
      setIsWhatsappConfigTesting(false);
    }
  };

  const saveAiControl = async (nextControl) => {
    setAiControlFeedback("");

    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
      setAiControl(nextControl);
      setAiControlFeedback("Regras salvas no preview do Mensagens.");
      return nextControl;
    }

    if (!canEditAiControl) {
      setAiControlFeedback("Somente proprietario ou admin podem alterar essas regras.");
      return null;
    }

    try {
      setIsAiControlSaving(true);
      const response = await apiRequest("/api/crm-ai/control", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(nextControl),
      });
      const savedControl = response?.data || nextControl;
      setAiControl(savedControl);
      setAiControlFeedback(response?.message || "Controle da IA atualizado com sucesso.");
      return savedControl;
    } catch (error) {
      setAiControlFeedback(
        error?.message || "Nao foi possivel salvar o controle da IA.",
      );
      return null;
    } finally {
      setIsAiControlSaving(false);
    }
  };

  const evaluateAiControl = async ({ actionType, payload }) => {
    setAiControlFeedback("");

    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
      return evaluateAiControlPreview(aiControl, actionType, payload);
    }

    try {
      const response = await apiRequest("/api/crm-ai/control/evaluate", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ actionType, payload }),
      });
      return response?.data || null;
    } catch (error) {
      setAiControlFeedback(
        error?.message || "Nao foi possivel validar a regra da IA.",
      );
      return {
        allowed: false,
        executionMode: "blocked",
        reasons: ["Falha ao validar a regra no servidor."],
        warnings: [],
      };
    }
  };

  const handleAiBathProposal = async (execute = false, suggestOnly = false) => {
    if (!selectedThread) return;

    setAiBathResult(null);
    setAiControlFeedback("");
    setFeedback("");
    setErrorMessage("");

    const requestPayload = {
      conversationId: selectedThread.id,
      customerId: selectedCustomer?.id || selectedThread.customerId || "",
      petId: selectedPet?.id || selectedThread.petId || "",
      serviceQuery: aiBathDraft.serviceQuery,
      appointmentAt: suggestOnly ? "" : aiBathDraft.appointmentAt,
      tutorConfirmed: aiBathDraft.tutorConfirmed,
      humanApproved: aiBathDraft.humanApproved,
      execute,
      suggestSlots: suggestOnly,
      notes: aiBathDraft.notes,
      customerDraft: {
        name: aiBathDraft.customerName,
        phone: aiBathDraft.customerPhone,
        email: aiBathDraft.customerEmail,
      },
      petDraft: {
        name: aiBathDraft.petName,
        species: aiBathDraft.petSpecies,
        breed: aiBathDraft.petBreed,
      },
    };

    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
      const validation = evaluateAiControlPreview(aiControl, "schedule_appointment", {
        agendaType: "estetica",
        serviceCategory: aiBathDraft.serviceQuery || "Banho",
        appointmentAt: suggestOnly ? "" : aiBathDraft.appointmentAt,
        tutorConfirmed: aiBathDraft.tutorConfirmed,
      });

      const previewSuggestions = suggestOnly
        ? [
            { label: "02/04/2026 09:00", dateTime: "2026-04-02T09:00" },
            { label: "02/04/2026 09:30", dateTime: "2026-04-02T09:30" },
            { label: "02/04/2026 10:00", dateTime: "2026-04-02T10:00" },
          ]
        : [];

      const previewResult = {
        customer: {
          name:
            selectedCustomer?.name ||
            aiBathDraft.customerName ||
            selectedThread.customerName ||
            selectedThread.name,
        },
        pet: {
          name: selectedPet?.name || aiBathDraft.petName || selectedThread.petName || "Pet",
        },
        service: {
          name: aiBathDraft.serviceQuery || "Banho",
          category: "Estetica",
        },
        appointment: {
          label: suggestOnly ? "" : aiBathDraft.appointmentAt,
        },
        slotSuggestions: previewSuggestions,
        validation,
        assistantReply: suggestOnly
          ? `Encontrei horarios para ${aiBathDraft.serviceQuery || "banho"}: ${previewSuggestions.map((item) => item.label).join(" | ")}.`
          : `Posso seguir com ${aiBathDraft.serviceQuery || "banho"} para ${selectedPet?.name || aiBathDraft.petName || "o pet"} em ${aiBathDraft.appointmentAt}.`,
        executed: execute && validation.allowed && validation.executionMode !== "blocked",
      };

      setAiBathResult(previewResult);
        setAiControlFeedback(
        suggestOnly
          ? "Preview: horarios sugeridos pela IA local."
          : execute
          ? "Preview: a IA executaria esse banho conforme as regras locais."
          : "Preview: proposta montada pela IA local.",
      );
      return;
    }

    try {
      setIsAiBathLoading(true);
      const response = await apiRequest("/api/crm-ai/assistant/schedule-bath", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(requestPayload),
      });

      setAiBathResult(response?.data || null);
      setFeedback(
        response?.message ||
          (execute
            ? "Agendamento criado pela IA com sucesso."
            : "Proposta da IA carregada com sucesso."),
      );

      if (execute) {
        setRefreshKey((current) => current + 1);
      }
    } catch (error) {
      setAiBathResult(error?.payload?.data || null);
      setAiControlFeedback(
        error?.message || "Nao foi possivel processar o agendamento pela IA.",
      );
    } finally {
      setIsAiBathLoading(false);
    }
  };

  const handleSendAiReplyText = async (replyText) => {
    if (!replyText || !selectedThread) return;

    setIsAiReplySending(true);
    setErrorMessage("");
    setFeedback("");
    setAiControlFeedback("");

    try {
      await sendConversationText(
        replyText,
        isDemo
          ? "Resposta da IA enviada no preview."
          : "Resposta da IA enviada para a conversa.",
      );
    } catch (error) {
      setAiControlFeedback(
        error?.message || "Nao foi possivel enviar a resposta da IA.",
      );
    } finally {
      setIsAiReplySending(false);
    }
  };

  const handleSendAiReply = async () => {
    await handleSendAiReplyText(aiBathResult?.assistantReply || "");
  };

  const handleAiContactUpsert = async (execute = false) => {
    if (!selectedThread) return;

    setIsAiContactLoading(true);
    setAiContactResult(null);
    setAiControlFeedback("");

    try {
      if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
        const previewResult = {
          executed: execute,
          customer: {
            name: aiBathDraft.customerName,
            phone: aiBathDraft.customerPhone,
            email: aiBathDraft.customerEmail,
          },
          pet: {
            name: aiBathDraft.petName,
            species: aiBathDraft.petSpecies,
            breed: aiBathDraft.petBreed,
          },
          assistantReply:
            "Posso adiantar o cadastro do tutor e do pet por aqui e deixar tudo pronto para o atendimento.",
        };
        setAiContactResult(previewResult);
        return;
      }

      const response = await apiRequest("/api/crm-ai/assistant/upsert-contact", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          conversationId: selectedThread.id,
          execute,
          customerDraft: {
            name: aiBathDraft.customerName,
            phone: aiBathDraft.customerPhone,
            email: aiBathDraft.customerEmail,
          },
          petDraft: {
            name: aiBathDraft.petName,
            species: aiBathDraft.petSpecies,
            breed: aiBathDraft.petBreed,
          },
        }),
      });

      setAiContactResult(response?.data || null);
      setFeedback(
        response?.message ||
          (execute
            ? "Cadastro atualizado pela IA."
            : "Proposta de cadastro carregada."),
      );
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setAiContactResult(error?.payload?.data || null);
      setAiControlFeedback(
        error?.message || "Nao foi possivel processar o cadastro pela IA.",
      );
    } finally {
      setIsAiContactLoading(false);
    }
  };

  const handleAiReschedule = async (execute = false) => {
    if (!selectedThread) return;

    setIsAiAgendaLoading(true);
    setAiAgendaResult(null);
    setAiControlFeedback("");

    try {
      if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
        setAiAgendaResult({
          appointment: {
            label:
              customerAppointments.find((item) => item.id === aiAgendaDraft.appointmentId)
                ? formatAppointmentOptionLabel(
                    customerAppointments.find((item) => item.id === aiAgendaDraft.appointmentId),
                  )
                : "Atendimento selecionado",
          },
          target: {
            label: aiAgendaDraft.appointmentAt,
          },
          validation: {
            allowed: true,
            executionMode: aiAgendaDraft.humanApproved ? "automatic" : "approval",
            reasons: [],
            warnings: aiAgendaDraft.humanApproved ? [] : ["Ainda depende de aprovacao humana no preview."],
          },
          assistantReply: "Posso remarcar esse atendimento no horario informado.",
          executed: execute,
        });
        return;
      }

      const response = await apiRequest(
        "/api/crm-ai/assistant/reschedule-appointment",
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            conversationId: selectedThread.id,
            appointmentId: aiAgendaDraft.appointmentId,
            customerId: selectedCustomer?.id || selectedThread.customerId || "",
            petId: selectedPet?.id || selectedThread.petId || "",
            appointmentAt: aiAgendaDraft.appointmentAt,
            humanApproved: aiAgendaDraft.humanApproved,
            execute,
          }),
        },
      );

      setAiAgendaResult(response?.data || null);
      setFeedback(
        response?.message ||
          (execute
            ? "Remarcacao processada pela IA."
            : "Proposta de remarcacao carregada."),
      );
      if (execute) {
        setRefreshKey((current) => current + 1);
      }
    } catch (error) {
      setAiAgendaResult(error?.payload?.data || null);
      setAiControlFeedback(
        error?.message || "Nao foi possivel remarcar pela IA.",
      );
    } finally {
      setIsAiAgendaLoading(false);
    }
  };

  const handleAiCancel = async (execute = false) => {
    if (!selectedThread) return;

    setIsAiAgendaLoading(true);
    setAiAgendaResult(null);
    setAiControlFeedback("");

    try {
      if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
        setAiAgendaResult({
          appointment: {
            label:
              customerAppointments.find((item) => item.id === aiAgendaDraft.appointmentId)
                ? formatAppointmentOptionLabel(
                    customerAppointments.find((item) => item.id === aiAgendaDraft.appointmentId),
                  )
                : "Atendimento selecionado",
          },
          validation: {
            allowed: true,
            executionMode: aiAgendaDraft.humanApproved ? "automatic" : "approval",
            reasons: [],
            warnings: aiAgendaDraft.humanApproved ? [] : ["Ainda depende de aprovacao humana no preview."],
          },
          assistantReply: "Posso cancelar esse atendimento e avisar o tutor.",
          executed: execute,
        });
        return;
      }

      const response = await apiRequest(
        "/api/crm-ai/assistant/cancel-appointment",
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            conversationId: selectedThread.id,
            appointmentId: aiAgendaDraft.appointmentId,
            customerId: selectedCustomer?.id || selectedThread.customerId || "",
            petId: selectedPet?.id || selectedThread.petId || "",
            humanApproved: aiAgendaDraft.humanApproved,
            execute,
          }),
        },
      );

      setAiAgendaResult(response?.data || null);
      setFeedback(
        response?.message ||
          (execute
            ? "Cancelamento processado pela IA."
            : "Proposta de cancelamento carregada."),
      );
      if (execute) {
        setRefreshKey((current) => current + 1);
      }
    } catch (error) {
      setAiAgendaResult(error?.payload?.data || null);
      setAiControlFeedback(
        error?.message || "Nao foi possivel cancelar pela IA.",
      );
    } finally {
      setIsAiAgendaLoading(false);
    }
  };

  const handleAiKnowledgeAnswer = async () => {
    if (!selectedThread || !String(aiKnowledgeDraft || "").trim()) return;

    setIsAiKnowledgeLoading(true);
    setAiKnowledgeResult(null);
    setAiControlFeedback("");

    try {
      if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
        setAiKnowledgeResult({
          assistantReply:
            "Posso responder usando os dados reais do sistema, sugerir horarios, cadastrar tutor e pet, ou montar uma proposta de atendimento.",
        });
        return;
      }

      const response = await apiRequest("/api/crm-ai/assistant/answer", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          conversationId: selectedThread.id,
          customerId: selectedCustomer?.id || selectedThread.customerId || "",
          petId: selectedPet?.id || selectedThread.petId || "",
          question: aiKnowledgeDraft,
        }),
      });

      setAiKnowledgeResult(response?.data || null);
    } catch (error) {
      setAiControlFeedback(
        error?.message || "Nao foi possivel gerar a resposta da IA.",
      );
    } finally {
      setIsAiKnowledgeLoading(false);
    }
  };

  const selectedStatusLabel = formatConversationStatusLabel(selectedThread?.status);
  const selectedSourceLabel = formatConversationSourceLabel(selectedThread?.source);

  return (
    <div className="messages-redesign-shell">
      <section className="messages-redesign-board">
        <aside className="messages-redesign-appnav">
          <div className="messages-redesign-appnav-brand">
            <div className="messages-redesign-appnav-logo">
              <span>On</span>
              <small>CENTER</small>
              <strong>CHAT</strong>
            </div>
            <button type="button" className="messages-redesign-appnav-circle" aria-label="Notificacoes">
              <MoonIcon />
            </button>
          </div>

          <div className="messages-redesign-appnav-group">
            <span className="messages-redesign-appnav-title">Aplicacao</span>
            <nav className="messages-redesign-appnav-menu" aria-label="Menu do modulo">
              {APP_MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === activeMenuId ? "messages-redesign-appnav-item active" : "messages-redesign-appnav-item"}
                  onClick={() => setActiveMenuId(item.id)}
                >
                  <span className="messages-redesign-appnav-icon">{getIconByName(item.icon)}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <button type="button" className="messages-redesign-support-btn">
            <span className="messages-redesign-support-icon">
              <PhoneIcon />
            </span>
            <span>Suporte</span>
          </button>
        </aside>

        <section className="messages-redesign-panel">
          <header className="messages-redesign-topbar">
            <div className="messages-redesign-topbar-left">
              <button type="button" className="messages-redesign-topbar-btn" aria-label="Home">
                <HomeIcon />
              </button>
              <button type="button" className="messages-redesign-topbar-btn" aria-label="Conversas">
                <ChatIcon />
              </button>
              <button type="button" className="messages-redesign-topbar-btn" aria-label="Contatos">
                <ContactsIcon />
              </button>
              <button type="button" className="messages-redesign-topbar-btn" aria-label="Aplicativo">
                <PhoneIcon />
              </button>
              <button
                type="button"
                className="messages-redesign-topbar-btn"
                aria-label="Controle da IA"
                title="Controle da IA"
                onClick={openAiControl}
              >
                <SettingsIcon />
              </button>
              <button
                type="button"
                className="messages-redesign-topbar-btn"
                aria-label="Configurar WhatsApp CRM"
                title="Configurar WhatsApp CRM"
                onClick={openWhatsappConfig}
              >
                <PhoneIcon />
              </button>
            </div>

            <div className="messages-redesign-topbar-right">
              <strong>OnCenterChat</strong>
              <button type="button" className="messages-redesign-topbar-btn" aria-label="Modo">
                <MoonIcon />
              </button>
              <div className="messages-redesign-profile">
                <div className="messages-redesign-profile-copy">
                  <strong>{auth?.user?.name || "Pedro"}</strong>
                  <span>{auth?.user?.role || "gerente"}</span>
                </div>
                <div className="messages-redesign-profile-avatar">
                  <span className="messages-redesign-profile-status" />
                  <UserIcon />
                </div>
              </div>
            </div>
          </header>

          {(feedback || errorMessage) ? (
            <div className={errorMessage ? "messages-redesign-feedbackbar error" : "messages-redesign-feedbackbar"}>
              {errorMessage || feedback}
            </div>
          ) : null}

          <div className="messages-redesign-workspace">
            <aside className="messages-redesign-conversations">
              <div className="messages-redesign-status-grid">
                {statusMeta.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={tab.id === activeTab ? "messages-redesign-status-card active" : "messages-redesign-status-card"}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="messages-redesign-status-badge">{tab.count}</span>
                    <span className="messages-redesign-status-icon">{getIconByName(tab.icon)}</span>
                    <strong>{tab.label}</strong>
                  </button>
                ))}
              </div>

              <div className="messages-redesign-search-row">
                <label className="messages-redesign-search-box">
                  <SearchIcon />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Pesquisar"
                  />
                </label>
                <button type="button" className="messages-redesign-mini-btn" aria-label="Atendentes">
                  <ContactsIcon />
                </button>
                <button type="button" className="messages-redesign-mini-btn" aria-label="Filtrar">
                  <SettingsIcon />
                </button>
              </div>

              <div className="messages-redesign-list-header">
                <strong>Atendimentos</strong>
                <span className="messages-redesign-list-subtitle">
                  {isWorkspaceLoading ? "Carregando..." : `${visibleThreads.length} conversa(s)`}
                </span>
              </div>

              <div className="messages-redesign-thread-list">
                {isWorkspaceLoading ? (
                  <div className="messages-redesign-empty">Carregando conversas...</div>
                ) : visibleThreads.length ? (
                  visibleThreads.map((thread) => {
                    const isActive = thread.id === selectedThread?.id;
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        className={isActive ? "messages-redesign-thread-card active" : "messages-redesign-thread-card"}
                        onClick={() => setSelectedThreadId(thread.id)}
                      >
                        <span className="messages-redesign-thread-line" />
                        <div className={`messages-redesign-thread-avatar ${thread.accent || "violet"}`}>
                          {thread.avatarLabel}
                        </div>
                        <div className="messages-redesign-thread-bodycopy">
                          <div className="messages-redesign-thread-topline">
                            <strong>{thread.name}</strong>
                            <span>{thread.dateLabel}</span>
                          </div>
                          <p>{thread.handle}</p>
                          <div className="messages-redesign-thread-meta">
                            <span className="messages-redesign-channel-pill">{thread.channel}</span>
                            <span>{thread.owner}</span>
                          </div>
                        </div>
                        {thread.unreadCount ? (
                          <span className="messages-redesign-thread-unread">{thread.unreadCount}</span>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <div className="messages-redesign-empty">Nenhum atendimento encontrado.</div>
                )}
              </div>

              <footer className="messages-redesign-list-footer">
                COPYRIGHT © 2024 OnCenterChat, Todos os direitos reservados
              </footer>
            </aside>

            <main className="messages-redesign-chat">
              {selectedThread ? (
                <>
                  <header className="messages-redesign-chat-header">
                    <div className="messages-redesign-chat-user">
                      <div className={`messages-redesign-thread-avatar large ${selectedThread.accent || "violet"}`}>
                        {selectedThread.avatarLabel}
                      </div>
                      <div className="messages-redesign-chat-user-copy">
                        <strong>{selectedThread.name}</strong>
                        <span className="messages-redesign-chat-user-meta">
                          {selectedThread.petName || "Sem pet"} • {formatPhoneDisplay(selectedThread.phone)}
                        </span>
                      </div>
                    </div>

                    <div className="messages-redesign-chat-actions">
                      <button type="button" className="messages-redesign-chat-btn" aria-label="Historico">
                        <ClockIcon />
                      </button>
                      <button type="button" className="messages-redesign-chat-btn" aria-label="Email">
                        <MailIcon />
                      </button>
                      <button type="button" className="messages-redesign-chat-btn" aria-label="Atualizar" onClick={() => setRefreshKey((current) => current + 1)}>
                        <RefreshIcon />
                      </button>
                      <button type="button" className="messages-redesign-close-btn" onClick={handleCloseConversation} disabled={isSubmitting}>
                        <CloseIcon />
                        <span>{isSubmitting ? "Salvando" : "Fechar"}</span>
                      </button>
                    </div>
                  </header>

                  <div className="messages-redesign-chat-stage">
                    <div className="messages-redesign-chat-pattern" />
                    <div className="messages-redesign-bubbles">
                      {isMessagesLoading ? (
                        <div className="messages-redesign-empty thread">Carregando mensagens...</div>
                      ) : (selectedThread.messages || []).length ? (
                        (selectedThread.messages || []).map((message) => (
                          <article
                            key={message.id}
                            className={
                              message.side === "outgoing"
                                ? "messages-redesign-bubble outgoing"
                                : "messages-redesign-bubble incoming"
                            }
                          >
                            <strong>{message.sender}</strong>
                            <p>{message.text}</p>
                            <span>{message.time}</span>
                          </article>
                        ))
                      ) : (
                        <div className="messages-redesign-empty thread">Nenhuma mensagem registrada nessa conversa.</div>
                      )}
                    </div>
                  </div>

                  <div className="messages-redesign-composer">
                    <button type="button" className="messages-redesign-checkbox" aria-label="Selecionar conversa" />
                    <label className="messages-redesign-toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="messages-redesign-toggle-track" />
                    </label>
                    <div className="messages-redesign-composer-box">
                      <span className="messages-redesign-composer-emoji">🙂</span>
                      <input
                        type="text"
                        value={draftMessage}
                        onChange={(event) => setDraftMessage(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite aqui sua mensagem..."
                      />
                      <button type="button" className="messages-redesign-composer-btn" aria-label="Anexo">
                        <PaperclipIcon />
                      </button>
                      <button type="button" className="messages-redesign-composer-btn" aria-label="Audio">
                        <MicIcon />
                      </button>
                      <button type="button" className="messages-redesign-send-btn" onClick={handleSendMessage} disabled={isSubmitting}>
                        <SendPlaneIcon />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="messages-redesign-empty thread">Selecione um atendimento para visualizar a conversa.</div>
              )}
            </main>

            <aside className="messages-redesign-details">
              {selectedThread ? (
                <>
                  <section className="messages-redesign-detail-card">
                    <div className="messages-redesign-detail-head">
                      <strong>Conversa</strong>
                      <span>{selectedStatusLabel}</span>
                    </div>
                    <div className="messages-redesign-detail-list">
                      <div>
                        <span>Canal</span>
                        <strong>{selectedThread.channel}</strong>
                      </div>
                      <div>
                        <span>Telefone</span>
                        <strong>{formatPhoneDisplay(selectedThread.phone)}</strong>
                      </div>
                      <div>
                        <span>Origem</span>
                        <strong>{selectedSourceLabel}</strong>
                      </div>
                      <div>
                        <span>Responsavel</span>
                        <strong>{selectedThread.owner || "Sem responsavel"}</strong>
                      </div>
                      <div>
                        <span>Ultima atividade</span>
                        <strong>{selectedThread.lastMessageAt ? formatThreadMessageTime(selectedThread.lastMessageAt) : "Sem atividade"}</strong>
                      </div>
                    </div>
                    <div className="messages-redesign-detail-actions">
                      <button
                        type="button"
                        className="messages-redesign-detail-btn"
                        onClick={openWhatsappConfig}
                      >
                        Configurar WhatsApp
                      </button>
                    </div>
                  </section>

                  <section className="messages-redesign-detail-card">
                    <div className="messages-redesign-detail-head">
                      <strong>Tutor</strong>
                      <span>{selectedCustomer?.email ? "Cadastro encontrado" : "Ligacao rapida"}</span>
                    </div>
                    <div className="messages-redesign-detail-list">
                      <div>
                        <span>Nome</span>
                        <strong>{selectedCustomer?.name || selectedThread.customerName || "Nao vinculado"}</strong>
                      </div>
                      <div>
                        <span>Contato</span>
                        <strong>{formatPhoneDisplay(selectedCustomer?.phone || selectedThread.phone)}</strong>
                      </div>
                      <div>
                        <span>Email</span>
                        <strong>{selectedCustomer?.email || "Nao informado"}</strong>
                      </div>
                      <div>
                        <span>Cidade</span>
                        <strong>{selectedCustomer?.city || selectedCustomer?.bairro || "Nao informada"}</strong>
                      </div>
                    </div>
                    {selectedCustomer?.observation ? (
                      <div className="messages-redesign-detail-note">
                        {selectedCustomer.observation}
                      </div>
                    ) : null}
                    <div className="messages-redesign-detail-actions">
                      <button type="button" className="messages-redesign-detail-btn" onClick={openCustomerRegister}>
                        Abrir tutor
                      </button>
                    </div>
                  </section>

                  <section className="messages-redesign-detail-card">
                    <div className="messages-redesign-detail-head">
                      <strong>Pet</strong>
                      <span>{selectedPet?.species || "Sem especie"}</span>
                    </div>
                    <div className="messages-redesign-detail-list">
                      <div>
                        <span>Nome</span>
                        <strong>{selectedPet?.name || selectedThread.petName || "Nao vinculado"}</strong>
                      </div>
                      <div>
                        <span>Raca</span>
                        <strong>{selectedPet?.breed || "Nao informada"}</strong>
                      </div>
                      <div>
                        <span>Cor</span>
                        <strong>{selectedPet?.color || "Nao informada"}</strong>
                      </div>
                      <div>
                        <span>Sexo</span>
                        <strong>{selectedPet?.sex || "Nao informado"}</strong>
                      </div>
                    </div>
                    {selectedPet?.observation || selectedPet?.allergic ? (
                      <div className="messages-redesign-detail-note">
                        {selectedPet?.observation || selectedPet?.allergic}
                      </div>
                    ) : null}
                    <div className="messages-redesign-detail-actions">
                      <button
                        type="button"
                        className="messages-redesign-detail-btn"
                        onClick={openPetRegister}
                        disabled={!selectedThread.petName && !selectedPet?.name}
                      >
                        Abrir paciente
                      </button>
                    </div>
                  </section>

                  <section className="messages-redesign-detail-card">
                    <div className="messages-redesign-detail-head">
                      <strong>IA no atendimento</strong>
                      <span>{aiControl?.enabled ? "Ativa" : "Desligada"}</span>
                    </div>
                    <div className="messages-redesign-detail-list">
                      <div>
                        <span>Resposta automatica</span>
                        <strong>{aiControl?.autoReplyEnabled ? "Ligada" : "Desligada"}</strong>
                      </div>
                      <div>
                        <span>Execucao automatica</span>
                        <strong>{aiControl?.autoExecuteEnabled ? "Permitida" : "Com aprovacao"}</strong>
                      </div>
                      <div>
                        <span>Agenda</span>
                        <strong>{(aiControl?.scheduling?.allowedAgendaTypes || []).join(", ") || "Nao definido"}</strong>
                      </div>
                      <div>
                        <span>Servicos</span>
                        <strong>{(aiControl?.scheduling?.allowedServiceCategories || []).join(", ") || "Nao definidos"}</strong>
                      </div>
                    </div>
                    <div className="messages-redesign-detail-note">
                      {aiControl?.instructions || "Defina aqui o criterio que a IA deve seguir para responder e agendar."}
                    </div>
                    <div className="messages-redesign-detail-actions">
                      <button
                        type="button"
                        className="messages-redesign-detail-btn"
                        onClick={openAiControl}
                      >
                        Configurar IA
                      </button>
                    </div>
                  </section>

                  {aiIntentSuggestion ? (
                    <section className="messages-redesign-detail-card messages-redesign-detail-card-suggested">
                      <div className="messages-redesign-detail-head">
                        <strong>Leitura da conversa</strong>
                        <span>{aiIntentSuggestion.label}</span>
                      </div>
                      <div className="messages-redesign-detail-note">
                        <strong>Ultima mensagem do cliente</strong>
                        <br />
                        {aiIntentSuggestion.question}
                        <br />
                        <br />
                        <strong>Sugestao da IA</strong>
                        <br />
                        {aiIntentSuggestion.reason}
                      </div>
                    </section>
                  ) : null}

                  <section
                    className={
                      aiIntentSuggestion?.action === "bath"
                        ? "messages-redesign-detail-card messages-redesign-detail-card-focus"
                        : "messages-redesign-detail-card"
                    }
                  >
                    <div className="messages-redesign-detail-head">
                      <strong>IA Banho</strong>
                      <span>{isAiBathLoading ? "Processando" : "Proposta assistida"}</span>
                    </div>
                    <div className="messages-redesign-detail-form">
                      <label>
                        <span>Servico</span>
                        <input
                          type="text"
                          value={aiBathDraft.serviceQuery}
                          onChange={(event) =>
                            setAiBathDraft((current) => ({
                              ...current,
                              serviceQuery: event.target.value,
                            }))
                          }
                          placeholder="Banho"
                        />
                      </label>
                      <label>
                        <span>Tutor</span>
                        <input
                          type="text"
                          value={aiBathDraft.customerName}
                          onChange={(event) =>
                            setAiBathDraft((current) => ({
                              ...current,
                              customerName: event.target.value,
                            }))
                          }
                          placeholder="Nome do tutor"
                        />
                      </label>
                      <label>
                        <span>WhatsApp do tutor</span>
                        <input
                          type="text"
                          value={aiBathDraft.customerPhone}
                          onChange={(event) =>
                            setAiBathDraft((current) => ({
                              ...current,
                              customerPhone: event.target.value,
                            }))
                          }
                          placeholder="5511999999999"
                        />
                      </label>
                      <label>
                        <span>Email do tutor</span>
                        <input
                          type="text"
                          value={aiBathDraft.customerEmail}
                          onChange={(event) =>
                            setAiBathDraft((current) => ({
                              ...current,
                              customerEmail: event.target.value,
                            }))
                          }
                          placeholder="email@exemplo.com"
                        />
                      </label>
                      <label>
                        <span>Pet</span>
                        <input
                          type="text"
                          value={aiBathDraft.petName}
                          onChange={(event) =>
                            setAiBathDraft((current) => ({
                              ...current,
                              petName: event.target.value,
                            }))
                          }
                          placeholder="Nome do pet"
                        />
                      </label>
                      <label>
                        <span>Especie</span>
                        <input
                          type="text"
                          value={aiBathDraft.petSpecies}
                          onChange={(event) =>
                            setAiBathDraft((current) => ({
                              ...current,
                              petSpecies: event.target.value,
                            }))
                          }
                          placeholder="Cachorro, Gato..."
                        />
                      </label>
                      <label>
                        <span>Raca</span>
                        <input
                          type="text"
                          value={aiBathDraft.petBreed}
                          onChange={(event) =>
                            setAiBathDraft((current) => ({
                              ...current,
                              petBreed: event.target.value,
                            }))
                          }
                          placeholder="Shih-tzu, SRD..."
                        />
                      </label>
                      <label>
                        <span>Data e hora</span>
                        <input
                          type="datetime-local"
                          value={aiBathDraft.appointmentAt}
                          onChange={(event) =>
                            setAiBathDraft((current) => ({
                              ...current,
                              appointmentAt: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="messages-redesign-detail-form-check">
                        <input
                          type="checkbox"
                          checked={aiBathDraft.tutorConfirmed}
                          onChange={(event) =>
                            setAiBathDraft((current) => ({
                              ...current,
                              tutorConfirmed: event.target.checked,
                            }))
                          }
                        />
                        <span>Tutor confirmou o horario</span>
                      </label>
                      <label className="messages-redesign-detail-form-check">
                        <input
                          type="checkbox"
                          checked={aiBathDraft.humanApproved}
                          onChange={(event) =>
                            setAiBathDraft((current) => ({
                              ...current,
                              humanApproved: event.target.checked,
                            }))
                          }
                        />
                        <span>Aprovacao humana liberada</span>
                      </label>
                      <label>
                        <span>Observacao</span>
                        <textarea
                          value={aiBathDraft.notes}
                          onChange={(event) =>
                            setAiBathDraft((current) => ({
                              ...current,
                              notes: event.target.value,
                            }))
                          }
                          placeholder="Ex.: banho completo, sem laco, tutor prefere periodo da manha."
                        />
                      </label>
                    </div>
                    <div className="messages-redesign-detail-actions">
                      <button
                        type="button"
                        className="messages-redesign-detail-btn"
                        onClick={() => handleAiBathProposal(false, true)}
                        disabled={isAiBathLoading}
                      >
                        Sugerir horarios
                      </button>
                      <button
                        type="button"
                        className="messages-redesign-detail-btn"
                        onClick={() => handleAiBathProposal(false)}
                        disabled={
                          isAiBathLoading
                        }
                      >
                        Validar proposta
                      </button>
                      <button
                        type="button"
                        className="messages-redesign-detail-btn primary"
                        onClick={() => handleAiBathProposal(true)}
                        disabled={
                          isAiBathLoading
                        }
                      >
                        Criar com IA
                      </button>
                      {aiBathResult?.assistantReply ? (
                        <button
                          type="button"
                          className="messages-redesign-detail-btn"
                          onClick={() => setDraftMessage(aiBathResult.assistantReply)}
                          disabled={isAiReplySending}
                        >
                          Revisar no campo
                        </button>
                      ) : null}
                      {aiBathResult?.assistantReply ? (
                        <button
                          type="button"
                          className="messages-redesign-detail-btn primary"
                          onClick={handleSendAiReply}
                          disabled={isAiReplySending || isAiBathLoading}
                        >
                          {isAiReplySending ? "Enviando..." : "Enviar resposta da IA"}
                        </button>
                      ) : null}
                    </div>
                    {aiBathResult ? (
                      <div className="messages-redesign-detail-note">
                        <strong>
                          {aiBathResult.executed
                            ? "Agendamento executado."
                            : "Proposta gerada."}
                        </strong>
                        <br />
                        {aiBathResult.pet?.name || selectedPet?.name || "Pet"}:
                        {" "}
                        {aiBathResult.service?.name || aiBathDraft.serviceQuery}
                        {" "}
                        em
                        {" "}
                        {aiBathResult.appointment?.label || aiBathDraft.appointmentAt}
                        <br />
                        Modo:
                        {" "}
                        {aiBathResult.validation?.executionMode === "automatic"
                          ? "automatico"
                          : aiBathResult.validation?.executionMode === "approval"
                            ? "com aprovacao"
                            : "bloqueado"}
                        {aiBathResult.validation?.reasons?.length ? (
                          <>
                            <br />
                            Motivos: {aiBathResult.validation.reasons.join(" | ")}
                          </>
                        ) : null}
                        {aiBathResult.validation?.warnings?.length ? (
                          <>
                            <br />
                            Alertas: {aiBathResult.validation.warnings.join(" | ")}
                          </>
                        ) : null}
                        {aiBathResult.assistantReply ? (
                          <>
                            <br />
                            Resposta: {aiBathResult.assistantReply}
                          </>
                        ) : null}
                      </div>
                    ) : null}
                    {aiBathResult?.slotSuggestions?.length ? (
                      <div className="messages-redesign-detail-chip-list">
                        {aiBathResult.slotSuggestions.map((slot) => (
                          <button
                            key={slot.dateTime || slot.label}
                            type="button"
                            className="messages-redesign-detail-chip"
                            onClick={() =>
                              setAiBathDraft((current) => ({
                                ...current,
                                appointmentAt: slot.dateTime || current.appointmentAt,
                              }))
                            }
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  <section
                    className={
                      aiIntentSuggestion?.action === "contact"
                        ? "messages-redesign-detail-card messages-redesign-detail-card-focus"
                        : "messages-redesign-detail-card"
                    }
                  >
                    <div className="messages-redesign-detail-head">
                      <strong>IA Cadastro</strong>
                      <span>{isAiContactLoading ? "Processando" : "Tutor e pet"}</span>
                    </div>
                    <div className="messages-redesign-detail-actions">
                      <button
                        type="button"
                        className="messages-redesign-detail-btn"
                        onClick={() => handleAiContactUpsert(false)}
                        disabled={isAiContactLoading}
                      >
                        Validar cadastro
                      </button>
                      <button
                        type="button"
                        className="messages-redesign-detail-btn primary"
                        onClick={() => handleAiContactUpsert(true)}
                        disabled={isAiContactLoading}
                      >
                        Salvar cadastro
                      </button>
                      {aiContactResult?.assistantReply ? (
                        <button
                          type="button"
                          className="messages-redesign-detail-btn"
                          onClick={() => setDraftMessage(aiContactResult.assistantReply)}
                        >
                          Revisar no campo
                        </button>
                      ) : null}
                    </div>
                    {aiContactResult ? (
                      <div className="messages-redesign-detail-note">
                        <strong>
                          {aiContactResult.executed
                            ? "Cadastro executado."
                            : "Cadastro analisado."}
                        </strong>
                        <br />
                        Tutor: {aiContactResult.customer?.name || aiBathDraft.customerName || "Nao informado"}
                        <br />
                        Pet: {aiContactResult.pet?.name || aiBathDraft.petName || "Nao informado"}
                        {aiContactResult.assistantReply ? (
                          <>
                            <br />
                            Resposta: {aiContactResult.assistantReply}
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </section>

                  <section
                    className={
                      aiIntentSuggestion?.action === "reschedule" ||
                      aiIntentSuggestion?.action === "cancel"
                        ? "messages-redesign-detail-card messages-redesign-detail-card-focus"
                        : "messages-redesign-detail-card"
                    }
                  >
                    <div className="messages-redesign-detail-head">
                      <strong>IA Agenda</strong>
                      <span>{isAiAgendaLoading ? "Processando" : "Remarcar ou cancelar"}</span>
                    </div>
                    <div className="messages-redesign-detail-form">
                      <label>
                        <span>Agendamento</span>
                        <select
                          value={aiAgendaDraft.appointmentId}
                          onChange={(event) =>
                            setAiAgendaDraft((current) => ({
                              ...current,
                              appointmentId: event.target.value,
                            }))
                          }
                        >
                          <option value="">
                            {isAppointmentsLoading
                              ? "Carregando agendamentos..."
                              : "Selecione um agendamento"}
                          </option>
                          {customerAppointments.map((appointment) => (
                            <option key={appointment.id} value={appointment.id}>
                              {formatAppointmentOptionLabel(appointment)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Novo horario</span>
                        <input
                          type="datetime-local"
                          value={aiAgendaDraft.appointmentAt}
                          onChange={(event) =>
                            setAiAgendaDraft((current) => ({
                              ...current,
                              appointmentAt: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="messages-redesign-detail-form-check">
                        <input
                          type="checkbox"
                          checked={aiAgendaDraft.humanApproved}
                          onChange={(event) =>
                            setAiAgendaDraft((current) => ({
                              ...current,
                              humanApproved: event.target.checked,
                            }))
                          }
                        />
                        <span>Aprovacao humana liberada</span>
                      </label>
                    </div>
                    <div className="messages-redesign-detail-actions">
                      <button
                        type="button"
                        className="messages-redesign-detail-btn"
                        onClick={() => handleAiReschedule(false)}
                        disabled={isAiAgendaLoading || !aiAgendaDraft.appointmentId}
                      >
                        Validar remarcacao
                      </button>
                      <button
                        type="button"
                        className="messages-redesign-detail-btn primary"
                        onClick={() => handleAiReschedule(true)}
                        disabled={isAiAgendaLoading || !aiAgendaDraft.appointmentId}
                      >
                        Remarcar com IA
                      </button>
                      <button
                        type="button"
                        className="messages-redesign-detail-btn"
                        onClick={() => handleAiCancel(false)}
                        disabled={isAiAgendaLoading || !aiAgendaDraft.appointmentId}
                      >
                        Validar cancelamento
                      </button>
                      <button
                        type="button"
                        className="messages-redesign-detail-btn primary"
                        onClick={() => handleAiCancel(true)}
                        disabled={isAiAgendaLoading || !aiAgendaDraft.appointmentId}
                      >
                        Cancelar com IA
                      </button>
                      {aiAgendaResult?.assistantReply ? (
                        <button
                          type="button"
                          className="messages-redesign-detail-btn"
                          onClick={() => setDraftMessage(aiAgendaResult.assistantReply)}
                        >
                          Revisar no campo
                        </button>
                      ) : null}
                      {aiAgendaResult?.assistantReply ? (
                        <button
                          type="button"
                          className="messages-redesign-detail-btn primary"
                          onClick={() => handleSendAiReplyText(aiAgendaResult.assistantReply)}
                          disabled={isAiReplySending}
                        >
                          {isAiReplySending ? "Enviando..." : "Enviar resposta da IA"}
                        </button>
                      ) : null}
                    </div>
                    {aiAgendaResult ? (
                      <div className="messages-redesign-detail-note">
                        <strong>
                          {aiAgendaResult.executed
                            ? "Acao executada."
                            : "Acao preparada."}
                        </strong>
                        <br />
                        Atendimento: {aiAgendaResult.appointment?.label || "Nao informado"}
                        {aiAgendaResult.target?.label ? (
                          <>
                            <br />
                            Novo horario: {aiAgendaResult.target.label}
                          </>
                        ) : null}
                        {aiAgendaResult.assistantReply ? (
                          <>
                            <br />
                            Resposta: {aiAgendaResult.assistantReply}
                          </>
                        ) : null}
                      </div>
                    ) : null}
                    {aiAgendaResult?.slotSuggestions?.length ? (
                      <div className="messages-redesign-detail-chip-list">
                        {aiAgendaResult.slotSuggestions.map((slot) => (
                          <button
                            key={slot.dateTime || slot.label}
                            type="button"
                            className="messages-redesign-detail-chip"
                            onClick={() =>
                              setAiAgendaDraft((current) => ({
                                ...current,
                                appointmentAt: slot.dateTime || current.appointmentAt,
                              }))
                            }
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  <section
                    className={
                      aiIntentSuggestion?.action === "knowledge"
                        ? "messages-redesign-detail-card messages-redesign-detail-card-focus"
                        : "messages-redesign-detail-card"
                    }
                  >
                    <div className="messages-redesign-detail-head">
                      <strong>IA Resposta</strong>
                      <span>{isAiKnowledgeLoading ? "Pensando" : "Base no sistema"}</span>
                    </div>
                    <div className="messages-redesign-detail-form">
                      <label>
                        <span>Pergunta</span>
                        <textarea
                          value={aiKnowledgeDraft}
                          onChange={(event) => setAiKnowledgeDraft(event.target.value)}
                          placeholder="Ex.: quais horarios voces atendem? quais servicos de banho tem hoje?"
                        />
                      </label>
                    </div>
                    <div className="messages-redesign-detail-actions">
                      <button
                        type="button"
                        className="messages-redesign-detail-btn"
                        onClick={handleAiKnowledgeAnswer}
                        disabled={isAiKnowledgeLoading || !String(aiKnowledgeDraft || "").trim()}
                      >
                        Gerar resposta
                      </button>
                      {aiKnowledgeResult?.assistantReply ? (
                        <button
                          type="button"
                          className="messages-redesign-detail-btn"
                          onClick={() => setDraftMessage(aiKnowledgeResult.assistantReply)}
                        >
                          Revisar no campo
                        </button>
                      ) : null}
                      {aiKnowledgeResult?.assistantReply ? (
                        <button
                          type="button"
                          className="messages-redesign-detail-btn primary"
                          onClick={() => handleSendAiReplyText(aiKnowledgeResult.assistantReply)}
                          disabled={isAiReplySending}
                        >
                          {isAiReplySending ? "Enviando..." : "Enviar resposta da IA"}
                        </button>
                      ) : null}
                    </div>
                    {aiKnowledgeResult?.assistantReply ? (
                      <div className="messages-redesign-detail-note">
                        <strong>Resposta sugerida</strong>
                        <br />
                        {aiKnowledgeResult.assistantReply}
                      </div>
                    ) : null}
                  </section>

                  <section className="messages-redesign-detail-card">
                    <div className="messages-redesign-detail-head">
                      <strong>Auditoria da IA</strong>
                      <span>{isAiAuditLoading ? "Carregando" : `${aiAuditLogs.length} evento(s)`}</span>
                    </div>
                    <div className="messages-redesign-audit-list">
                      {isAiAuditLoading ? (
                        <div className="messages-redesign-detail-note">
                          Carregando historico da IA...
                        </div>
                      ) : aiAuditLogs.length ? (
                        aiAuditLogs.map((item) => (
                          <article key={item.id} className="messages-redesign-audit-item">
                            <div className="messages-redesign-audit-head">
                              <strong>{formatAiAuditAction(item.actionType)}</strong>
                              <span>{formatAiAuditStatus(item.status)}</span>
                            </div>
                            <p>{item.summary || "Acao registrada pela IA."}</p>
                            {item.assistantReply ? (
                              <small>{item.assistantReply}</small>
                            ) : null}
                            <div className="messages-redesign-audit-meta">
                              <span>{formatThreadMessageTime(item.createdAt)}</span>
                              <span>
                                {item.authorUser?.name || auth?.user?.name || "Sistema"}
                              </span>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="messages-redesign-detail-note">
                          Ainda nao ha eventos de auditoria para esta conversa.
                        </div>
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <div className="messages-redesign-detail-empty">
                  Selecione uma conversa para ver tutor, pet e origem do atendimento.
                </div>
              )}
            </aside>
          </div>
        </section>
      </section>
      <MessagesAiControlPanel
        open={isAiControlOpen}
        value={aiControl}
        loading={isAiControlLoading}
        saving={isAiControlSaving}
        canEdit={canEditAiControl || isDemo}
        feedback={aiControlFeedback}
        onClose={() => setIsAiControlOpen(false)}
        onSave={saveAiControl}
        onEvaluate={evaluateAiControl}
      />
      <MessagesWhatsappConfigPanel
        open={isWhatsappConfigOpen}
        config={whatsappConfig}
        status={whatsappStatus}
        loading={isWhatsappConfigLoading}
        saving={isWhatsappConfigSaving}
        testing={isWhatsappConfigTesting}
        feedback={whatsappConfigFeedback}
        testResult={whatsappTestResult}
        onClose={() => setIsWhatsappConfigOpen(false)}
        onSave={saveWhatsappConfig}
        onTest={testWhatsappConfig}
      />
    </div>
  );
}
