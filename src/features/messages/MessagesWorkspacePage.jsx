import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessagesAiControlPanel,
  buildDefaultAiControl,
} from "./MessagesAiControlPanel.jsx";
import { MessagesSetupWizard } from "./MessagesSetupWizard.jsx";
import { MessagesWhatsappHubPanel } from "./MessagesWhatsappHubPanel.jsx";
import { MessagesWhatsappConfigPanel } from "./MessagesWhatsappConfigPanel.jsx";
import { openExternalUrl as openPreferredExternalUrl } from "../../utils/windowPlacement.js";

const APP_MENU_ITEMS = [
  { id: "home", label: "Home", icon: "home" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "whatsapp", label: "WhatsApp", icon: "phone" },
  { id: "contacts", label: "Contatos", icon: "contacts" },
  { id: "crm", label: "CRM", icon: "crm" },
  { id: "ai", label: "IA", icon: "ai" },
  { id: "tasks", label: "Tarefas", icon: "tasks" },
  { id: "broadcast", label: "Envio em massa", icon: "send" },
  { id: "reports", label: "Relatorios", icon: "clock" },
  { id: "links", label: "Gerador de Links", icon: "link" },
  { id: "profile", label: "Perfil", icon: "user" },
  { id: "settings", label: "Configuracoes", icon: "settings" },
];

const MESSAGE_STATUS_TABS = [
  { id: "all", label: "Todas", icon: "list" },
  { id: "pending", label: "Pendente", icon: "clock" },
  { id: "attending", label: "Atendendo", icon: "timer" },
  { id: "closed", label: "Fechado", icon: "check" },
];

function getWhatsappOauthFeedback(status, reason = "") {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const normalizedReason = String(reason || "").trim().toLowerCase();

  if (normalizedStatus === "connected") {
    return "WhatsApp conectado com sucesso!";
  }

  if (normalizedStatus === "select") {
    return "Selecione o numero que deseja usar no CRM.";
  }

  if (normalizedStatus === "cancelled") {
    return "Conexao cancelada.";
  }

  switch (normalizedReason) {
    case "no_phone_numbers":
      return "Nenhum numero de WhatsApp Business foi encontrado. Confira o numero na Meta e as permissoes do app.";
    case "exchange_failed":
      return "A Meta nao concluiu a conexao. Revise as permissoes whatsapp_business_management e whatsapp_business_messaging.";
    case "meta_env_missing":
      return "A conexao da Meta nao esta configurada no servidor.";
    case "invalid_state":
      return "A sessao da Meta expirou. Abra a conexao novamente.";
    case "missing_params":
      return "A Meta nao devolveu os dados da conexao. Tente novamente.";
    default:
      return "Erro ao conectar com a Meta. Tente novamente.";
  }
}

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
    oauthAvailable: false,
    oauthConnectedAt: null,
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

function AIIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.75 14.1 7l4.65.68-3.37 3.28.8 4.63L12 13.54l-4.18 2.2.8-4.63L5.25 7.68 9.9 7Zm0 3.35-.95 1.93-2.13.31 1.54 1.5-.36 2.12L12 10.95l1.9 1.01-.36-2.12 1.54-1.5-2.13-.31Zm-5 9.9 1.7 1.7L7 19.4l-1.7-1.7Zm10 0 1.7 1.7-1.7 1.7-1.7-1.7ZM12 15.25a2.75 2.75 0 1 1-2.75 2.75A2.75 2.75 0 0 1 12 15.25Zm0 1.5a1.25 1.25 0 1 0 1.25 1.25A1.25 1.25 0 0 0 12 16.75Z"
      />
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
    case "ai":
      return <AIIcon />;
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
  if (normalized === "registers-patient") return "Cadastro pet";
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

function buildDefaultCrmBoardConfig() {
  return {
    columns: [
      {
        id: "prospectar",
        label: "Prospectar",
        color: "#ffe4e8",
        description: "Novos contatos e primeiras conversas.",
      },
      {
        id: "qualificar",
        label: "Qualificar",
        color: "#ffdbe7",
        description: "Separar quem tem interesse real e contexto definido.",
      },
      {
        id: "necessidades",
        label: "Levantando necessidades",
        color: "#ffd3df",
        description: "Mapear servicos, dores e urgencia do cliente.",
      },
      {
        id: "proposta",
        label: "Proposta",
        color: "#ffd7ea",
        description: "Negociacoes e combinacoes comerciais em andamento.",
      },
      {
        id: "followup",
        label: "Follow-up",
        color: "#ffe3ef",
        description: "Retomar contatos e acompanhar decisoes pendentes.",
      },
      {
        id: "negociacao",
        label: "Negociacao",
        color: "#ffd8df",
        description: "Ajustes finais antes do fechamento.",
      },
      {
        id: "fechamento",
        label: "Contratar e cobrar",
        color: "#ffeef2",
        description: "Fechamento, pagamento e confirmacoes finais.",
      },
    ],
  };
}

function slugifyCrmColumnId(value, fallback = "coluna") {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function normalizeCrmBoardConfig(value) {
  const source = value && typeof value === "object" ? value : {};
  const requestedColumns = Array.isArray(source.columns) ? source.columns : [];
  const fallbackColumns = buildDefaultCrmBoardConfig().columns;
  const usedIds = new Set();
  const columns = (requestedColumns.length ? requestedColumns : fallbackColumns)
    .map((column, index) => {
      const label =
        String(column?.label || column?.name || "").trim() || `Coluna ${index + 1}`;
      let id = slugifyCrmColumnId(column?.id || label, `coluna-${index + 1}`);
      while (usedIds.has(id)) {
        id = `${id}-${usedIds.size + 1}`;
      }
      usedIds.add(id);
      return {
        id,
        label,
        color: String(column?.color || "#ffe4e8").trim() || "#ffe4e8",
        description: String(column?.description || "").trim(),
      };
    })
    .slice(0, 20);

  return {
    columns: columns.length ? columns : fallbackColumns,
  };
}

function getThreadCrmStageId(thread, boardConfig) {
  const configuredColumns = Array.isArray(boardConfig?.columns)
    ? boardConfig.columns
    : [];
  const fallbackColumnId = configuredColumns[0]?.id || "prospectar";
  const stageId = String(thread?.metadata?.crmStageId || "").trim();
  return configuredColumns.some((column) => column.id === stageId)
    ? stageId
    : fallbackColumnId;
}

function formatCurrencyBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function formatDateTimeShort(value) {
  if (!value) return "Ainda nao informado";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function formatCrmAiStatusLabel(status, canAccess) {
  if (canAccess) return "Liberada";
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "pending") return "Pagamento pendente";
  if (normalized === "expired") return "Expirada";
  if (normalized === "cancelled") return "Cancelada";
  if (normalized === "suspended") return "Suspensa";
  if (normalized === "active") return "Ativa";
  return "Nao contratada";
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

function mergeConversationThreadState(nextThreads, currentThreads) {
  const currentById = new Map(
    (Array.isArray(currentThreads) ? currentThreads : []).map((thread) => [
      thread.id,
      thread,
    ]),
  );

  return (Array.isArray(nextThreads) ? nextThreads : []).map((thread) => {
    const currentThread = currentById.get(thread.id);
    if (!currentThread) {
      return thread;
    }

    return {
      ...thread,
      messages:
        Array.isArray(currentThread.messages) && currentThread.messages.length
          ? currentThread.messages
          : thread.messages || [],
    };
  });
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

function getVisibleThreads(threads, activeTab, searchQuery, filters = {}) {
  const normalizedQuery = String(searchQuery || "").trim().toLowerCase();

  return threads.filter((thread) => {
    const matchesStatus = activeTab === "all" ? true : thread.status === activeTab;
    if (!matchesStatus) return false;

    if (filters.owner && String(thread.owner || "") !== String(filters.owner)) {
      return false;
    }

    if (filters.channel && String(thread.channel || "") !== String(filters.channel)) {
      return false;
    }

    if (filters.onlyUnread && Number(thread.unreadCount || 0) <= 0) {
      return false;
    }

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
    agendaType: "estetica",
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

function formatAgendaTypeLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "clinica") return "Clínica";
  if (normalized === "internacao") return "Internação";
  return "Estética";
}

function getAgendaTypeServicePlaceholder(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "clinica") return "Consulta, vacina, procedimento...";
  if (normalized === "internacao") return "Internação, diária, observação...";
  return "Banho, tosa, estética...";
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
  if (normalized === "schedule_appointment") return "Agendar atendimento";
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
    normalized.includes("internacao") ||
    normalized.includes("internação") ||
    normalized.includes("internar") ||
    normalized.includes("hospital")
  ) {
    action = "bath";
    label = "Agendar";
    reason = "A mensagem parece pedir agendamento ou controle de internacao.";
  } else if (
    normalized.includes("consulta") ||
    normalized.includes("clinica") ||
    normalized.includes("clínica") ||
    normalized.includes("exame") ||
    normalized.includes("vacina") ||
    normalized.includes("procedimento") ||
    normalized.includes("cirurgia")
  ) {
    action = "bath";
    label = "Agendar";
    reason = "A mensagem parece pedir agendamento clinico.";
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
  let agendaType = "estetica";
  let serviceQuery = "Banho";

  if (
    normalized.includes("internacao") ||
    normalized.includes("internação") ||
    normalized.includes("internar") ||
    normalized.includes("hospital")
  ) {
    agendaType = "internacao";
    serviceQuery = "Internacao";
  } else if (
    normalized.includes("consulta") ||
    normalized.includes("clinica") ||
    normalized.includes("clínica") ||
    normalized.includes("exame") ||
    normalized.includes("vacina") ||
    normalized.includes("procedimento") ||
    normalized.includes("cirurgia")
  ) {
    agendaType = "clinica";
    serviceQuery = normalized.includes("exame")
      ? "Exame"
      : normalized.includes("vacina")
        ? "Vacina"
        : normalized.includes("cirurgia")
          ? "Cirurgia"
          : normalized.includes("procedimento")
            ? "Procedimento"
            : "Consulta";
  } else if (normalized.includes("tosa")) {
    agendaType = "estetica";
    serviceQuery = normalized.includes("banho") ? "Banho e Tosa" : "Tosa";
  }

  return {
    key: `${thread?.id || ""}:${action}:${question}`,
    action,
    label,
    reason,
    question,
    agendaType,
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
  supportWhatsapp = "",
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
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
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [aiControl, setAiControl] = useState(() => buildDefaultAiControl());
  const [isAiControlLoading, setIsAiControlLoading] = useState(false);
  const [isAiControlSaving, setIsAiControlSaving] = useState(false);
  const [aiControlFeedback, setAiControlFeedback] = useState("");
  const [crmAiSubscription, setCrmAiSubscription] = useState(() => ({
    plan: null,
    canAccess: false,
    subscription: null,
  }));
  const [isCrmAiSubscriptionLoading, setIsCrmAiSubscriptionLoading] =
    useState(false);
  const [isCrmAiCheckoutLoading, setIsCrmAiCheckoutLoading] = useState(false);
  const [crmBoardConfig, setCrmBoardConfig] = useState(() =>
    normalizeCrmBoardConfig(buildDefaultCrmBoardConfig()),
  );
  const [isCrmBoardLoading, setIsCrmBoardLoading] = useState(false);
  const [isCrmBoardSaving, setIsCrmBoardSaving] = useState(false);
  const [crmColumnDraft, setCrmColumnDraft] = useState("");
  const [isCreatingCrmColumn, setIsCreatingCrmColumn] = useState(false);
  const [draggedCrmThreadId, setDraggedCrmThreadId] = useState("");
  const [dragOverCrmColumnId, setDragOverCrmColumnId] = useState("");
  const [editingCrmColumnId, setEditingCrmColumnId] = useState("");
  const [editingCrmColumnLabel, setEditingCrmColumnLabel] = useState("");
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
  const [pendingOauthPhones, setPendingOauthPhones] = useState([]);
  const [isOauthConnecting, setIsOauthConnecting] = useState(false);
  const [aiBathDraft, setAiBathDraft] = useState(() => buildDefaultAiBathDraft());
  const [aiBathResult, setAiBathResult] = useState(null);
  const [isAiBathLoading, setIsAiBathLoading] = useState(false);
  const [isAiReplySending, setIsAiReplySending] = useState(false);
  const [customerAppointments, setCustomerAppointments] = useState([]);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isOwnerFilterOpen, setIsOwnerFilterOpen] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isConversationMarked, setIsConversationMarked] = useState(false);
  const [selectedAttachmentName, setSelectedAttachmentName] = useState("");
  const [selectedAttachmentFile, setSelectedAttachmentFile] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState("");
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcastSending, setIsBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [newConvPhone, setNewConvPhone] = useState("");
  const [newConvName, setNewConvName] = useState("");
  const [newConvMessage, setNewConvMessage] = useState("");
  const [isNewConvSubmitting, setIsNewConvSubmitting] = useState(false);
  const [newConvError, setNewConvError] = useState("");
  const [linkPhoneDraft, setLinkPhoneDraft] = useState("");
  const [linkMessageDraft, setLinkMessageDraft] = useState("");
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
  const routeActionRef = useRef("");
  const aiIntentAppliedRef = useRef("");
  const oauthConnectTimeoutRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);

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
      menu: String(params.get("menu") || "").trim().toLowerCase(),
      action: String(params.get("action") || "").trim().toLowerCase(),
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
  const canManageCrmBoard = canEditAiControl;
  const supportPhone = useMemo(
    () => String(supportWhatsapp || "").replace(/\D/g, ""),
    [supportWhatsapp],
  );
  const crmBoardColumns = useMemo(
    () => normalizeCrmBoardConfig(crmBoardConfig).columns,
    [crmBoardConfig],
  );
  const canUseCrmAi = Boolean(crmAiSubscription?.canAccess);
  const crmAiStatusLabel = useMemo(
    () =>
      formatCrmAiStatusLabel(
        crmAiSubscription?.subscription?.status,
        crmAiSubscription?.canAccess,
      ),
    [crmAiSubscription?.canAccess, crmAiSubscription?.subscription?.status],
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
  const ownerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          threads
            .map((thread) => String(thread.owner || "").trim())
            .filter(Boolean),
        ),
      ),
    [threads],
  );
  const channelOptions = useMemo(
    () =>
      Array.from(
        new Set(
          threads
            .map((thread) => String(thread.channel || "").trim())
            .filter(Boolean),
        ),
      ),
    [threads],
  );
  const contactsDirectory = useMemo(() => {
    const registry = new Map();

    for (const thread of threads) {
      const key =
        String(thread.customer?.id || "").trim() ||
        String(thread.customerId || "").trim() ||
        String(thread.phone || "").replace(/\D/g, "") ||
        thread.id;

      if (!registry.has(key)) {
        registry.set(key, {
          key,
          threadId: thread.id,
          name:
            thread.customer?.name ||
            thread.customerName ||
            thread.name ||
            "Contato sem nome",
          phone: thread.customer?.phone || thread.phone || "",
          email: thread.customer?.email || "",
          petName: thread.pet?.name || thread.petName || "",
          channel: thread.channel || "WhatsApp",
          owner: thread.owner || "Sem responsavel",
          status: thread.status || "pending",
          lastMessageAt: thread.lastMessageAt || "",
        });
      }
    }

    return Array.from(registry.values()).sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "pt-BR"),
    );
  }, [threads]);
  const taskQueue = useMemo(
    () =>
      threads
        .filter((thread) => ["pending", "attending"].includes(String(thread.status || "")))
        .sort(
          (a, b) =>
            Number(b.unreadCount || 0) - Number(a.unreadCount || 0) ||
            String(b.lastMessageAt || "").localeCompare(String(a.lastMessageAt || "")),
        ),
    [threads],
  );
  const reportMetrics = useMemo(() => {
    const unreadTotal = threads.reduce(
      (sum, thread) => sum + Number(thread.unreadCount || 0),
      0,
    );
    const whatsappTotal = threads.filter(
      (thread) => String(thread.channel || "").toLowerCase() === "whatsapp",
    ).length;
    const instagramTotal = threads.filter(
      (thread) => String(thread.channel || "").toLowerCase() === "instagram",
    ).length;

    return [
      { label: "Conversas totais", value: Number(summaryCounts?.all ?? threads.length), tone: "violet" },
      { label: "Pendentes", value: Number(summaryCounts?.pending ?? 0), tone: "orange" },
      { label: "Nao lidas", value: unreadTotal, tone: "blue" },
      { label: "WhatsApp", value: whatsappTotal, tone: "green" },
      { label: "Instagram", value: instagramTotal, tone: "dark" },
      { label: "IA CRM", value: crmAiStatusLabel, tone: canUseCrmAi ? "green" : "neutral" },
    ];
  }, [canUseCrmAi, crmAiStatusLabel, summaryCounts, threads]);
  const generatedLink = useMemo(() => {
    const phone = String(linkPhoneDraft || "").replace(/\D/g, "");
    if (!phone) return "";
    const normalizedPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const text = linkMessageDraft ? `?text=${encodeURIComponent(linkMessageDraft)}` : "";
    return `https://wa.me/${normalizedPhone}${text}`;
  }, [linkMessageDraft, linkPhoneDraft]);

  const visibleThreads = useMemo(
    () =>
      getVisibleThreads(threads, activeTab, deferredSearchQuery, {
        owner: ownerFilter,
        channel: channelFilter,
        onlyUnread,
      }),
    [threads, activeTab, deferredSearchQuery, ownerFilter, channelFilter, onlyUnread],
  );
  const crmVisibleThreads = useMemo(
    () =>
      getVisibleThreads(threads, "all", deferredSearchQuery, {
        owner: ownerFilter,
        channel: channelFilter,
        onlyUnread,
      }),
    [threads, deferredSearchQuery, ownerFilter, channelFilter, onlyUnread],
  );
  const crmBoardGroups = useMemo(() => {
    return crmBoardColumns.map((column) => ({
      ...column,
      threads: crmVisibleThreads.filter(
        (thread) => getThreadCrmStageId(thread, crmBoardConfig) === column.id,
      ),
    }));
  }, [crmBoardColumns, crmBoardConfig, crmVisibleThreads]);
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
    setIsConversationMarked(false);
    setSelectedAttachmentName("");
    setSelectedAttachmentFile(null);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl("");
    setRecordedAudioBlob(null);
  }, [selectedThreadId]);

  useEffect(() => {
    setLinkPhoneDraft(selectedCustomer?.phone || selectedThread?.phone || "");
    setLinkMessageDraft(
      selectedCustomer?.name
        ? `Ola ${selectedCustomer.name}!`
        : selectedThread?.name
          ? `Ola ${selectedThread.name}!`
          : "",
    );
  }, [selectedCustomer?.name, selectedCustomer?.phone, selectedThread?.name, selectedThread?.phone]);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recordedAudioUrl]);

  useEffect(() => {
    if (routeContext.search) {
      setSearchQuery(routeContext.search);
    }
  }, [routeContext.search]);

  useEffect(() => {
    if (!routeContext.menu) return;
    if (!APP_MENU_ITEMS.some((item) => item.id === routeContext.menu)) return;
    setActiveMenuId(routeContext.menu);
  }, [routeContext.menu]);

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
      agendaType: current?.agendaType || "estetica",
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
        agendaType: nextSuggestion.agendaType || current?.agendaType || "estetica",
        serviceQuery: nextSuggestion.serviceQuery || current?.serviceQuery || "Banho",
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

    async function loadCrmBoard() {
      if (isDemo) {
        if (!active) return;
        setCrmBoardConfig(normalizeCrmBoardConfig(buildDefaultCrmBoardConfig()));
        return;
      }

      if (!auth?.token || typeof apiRequest !== "function") {
        if (!active) return;
        setCrmBoardConfig(normalizeCrmBoardConfig(buildDefaultCrmBoardConfig()));
        return;
      }

      try {
        if (active) {
          setIsCrmBoardLoading(true);
        }
        const response = await apiRequest("/crm-conversations/board/config", {
          headers: authHeaders,
        });
        if (!active) return;
        setCrmBoardConfig(
          normalizeCrmBoardConfig(
            response?.data || buildDefaultCrmBoardConfig(),
          ),
        );
      } catch (error) {
        if (!active) return;
        setCrmBoardConfig(normalizeCrmBoardConfig(buildDefaultCrmBoardConfig()));
        setErrorMessage(
          error?.message || "Nao foi possivel carregar o quadro do CRM.",
        );
      } finally {
        if (active) {
          setIsCrmBoardLoading(false);
        }
      }
    }

    loadCrmBoard();

    return () => {
      active = false;
    };
  }, [apiRequest, auth?.token, authHeaders, isDemo]);

  useEffect(() => {
    let active = true;

    async function loadCrmAiSubscriptionStatus() {
      if (isDemo) {
        if (!active) return;
        setCrmAiSubscription({
          canAccess: true,
          plan: {
            name: "IA CRM Premium",
            price: 49.9,
            currency: "BRL",
          },
          subscription: {
            status: "demo",
            payment_status: "demo",
            amount: 49.9,
            currency: "BRL",
          },
        });
        return;
      }

      if (!auth?.token || typeof apiRequest !== "function") {
        if (!active) return;
        setCrmAiSubscription({ plan: null, canAccess: false, subscription: null });
        return;
      }

      try {
        if (active) {
          setIsCrmAiSubscriptionLoading(true);
        }
        const response = await apiRequest("/api/crm-ai/subscription", {
          headers: authHeaders,
        });
        if (!active) return;
        setCrmAiSubscription({
          plan: response?.plan || null,
          canAccess: Boolean(response?.canAccess),
          subscription: response?.subscription || null,
        });
      } catch (error) {
        if (!active) return;
        setCrmAiSubscription({ plan: null, canAccess: false, subscription: null });
        setErrorMessage(
          error?.message || "Nao foi possivel carregar a assinatura da IA.",
        );
      } finally {
        if (active) {
          setIsCrmAiSubscriptionLoading(false);
        }
      }
    }

    loadCrmAiSubscriptionStatus();

    return () => {
      active = false;
    };
  }, [apiRequest, auth?.token, authHeaders, isDemo, refreshKey]);

  useEffect(() => {
    let active = true;

    async function loadAiControlSnapshot() {
      if (isDemo) {
        if (!active) return;
        setAiControl(buildDefaultAiControl());
        return;
      }

      if (!auth?.token || typeof apiRequest !== "function") {
        if (!active) return;
        setAiControl(buildDefaultAiControl());
        return;
      }

      try {
        const response = await apiRequest("/api/crm-ai/control", {
          headers: authHeaders,
        });
        if (!active) return;
        setAiControl(response?.data || buildDefaultAiControl());
      } catch {
        if (!active) return;
        setAiControl(buildDefaultAiControl());
      }
    }

    loadAiControlSnapshot();

    return () => {
      active = false;
    };
  }, [apiRequest, auth?.token, authHeaders, isDemo]);

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
        params.set("status", activeMenuId === "chat" ? activeTab : "all");
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

        setThreads((currentThreads) =>
          mergeConversationThreadState(nextThreads, currentThreads),
        );
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
  }, [activeMenuId, activeTab, apiRequest, auth?.token, authHeaders, deferredSearchQuery, isDemo, refreshKey]);

  useEffect(() => {
    let active = true;
    const selectedConversationId = selectedThread?.id || "";
    const selectedConversationUnread = Number(selectedThread?.unreadCount || 0);

    async function loadMessages() {
      if (!selectedConversationId || isDemo || typeof apiRequest !== "function" || !auth?.token) {
        return;
      }

      setIsMessagesLoading(true);

      try {
        const response = await apiRequest(
          `/crm-conversations/${selectedConversationId}/messages?limit=300`,
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
            thread.id === selectedConversationId
              ? { ...thread, messages: mappedMessages, unreadCount: 0 }
              : thread,
          ),
        );

        if (selectedConversationUnread > 0) {
          await apiRequest(`/crm-conversations/${selectedConversationId}/read`, {
            method: "POST",
            headers: authHeaders,
          });

          if (!active) return;

          setThreads((currentThreads) =>
            currentThreads.map((thread) =>
              thread.id === selectedConversationId
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
  }, [
    apiRequest,
    auth?.token,
    authHeaders,
    isDemo,
    refreshKey,
    selectedThread?.id,
    selectedThread?.unreadCount,
  ]);

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

  // ─── Auto-polling: atualiza conversas a cada 30 segundos ─────────────────
  useEffect(() => {
    if (isDemo || !auth?.token) return;

    const interval = setInterval(() => {
      setRefreshKey((current) => current + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [auth?.token, isDemo]);

  // ─── Carrega status do WhatsApp ao entrar na aba de configurações ─────────
  useEffect(() => {
    if (activeMenuId !== "settings" || isDemo || !auth?.token || typeof apiRequest !== "function") return;
    if (whatsappStatus?.configured != null) return; // já carregado

    const authHeaders = { Authorization: `Bearer ${auth.token}` };

    apiRequest("/crm-whatsapp/status", { headers: authHeaders })
      .then((res) => setWhatsappStatus({ ...buildDefaultWhatsappCrmStatus(), ...(res?.data || {}) }))
      .catch((err) => {
        setWhatsappStatus({
          ...buildDefaultWhatsappCrmStatus(),
          tokenInvalid: true,
          tokenErrorMessage: err?.message || "Nao foi possivel carregar o status do WhatsApp CRM.",
        });
        setWhatsappConfigFeedback(err?.message || "Nao foi possivel carregar o status do WhatsApp CRM.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenuId, auth?.token, isDemo]);

  // ─── Escuta mensagens do popup OAuth ─────────────────────────────────────
  useEffect(() => {
    if (isDemo || !auth?.token) return;

    function handleOAuthMessage(event) {
      if (event.data?.type !== "whatsapp_oauth") return;
      const { status, reason } = event.data || {};
      if (oauthConnectTimeoutRef.current) {
        clearTimeout(oauthConnectTimeoutRef.current);
        oauthConnectTimeoutRef.current = null;
      }
      setIsOauthConnecting(false);

      if (status === "connected") {
        // Recarrega config e status após conexão bem-sucedida
        const hdrs = { Authorization: `Bearer ${auth.token}` };
        Promise.all([
          apiRequest("/whatsapp-crm-config", { headers: hdrs }),
          apiRequest("/crm-whatsapp/status", { headers: hdrs }),
        ])
          .then(([configRes, statusRes]) => {
            setWhatsappConfig({ ...buildDefaultWhatsappCrmConfig(), ...(configRes?.data || {}) });
            setWhatsappStatus({ ...buildDefaultWhatsappCrmStatus(), ...(statusRes?.data || {}) });
            setWhatsappConfigFeedback("WhatsApp conectado com sucesso!");
          })
          .catch(() => setWhatsappConfigFeedback("Conectado! Atualize a página para ver o status."));
      } else if (status === "select") {
        // Múltiplos números — busca a lista para o usuário escolher
        apiRequest("/crm-whatsapp/oauth/pending-phones", {
          headers: { Authorization: `Bearer ${auth.token}` },
        })
          .then((res) => setPendingOauthPhones(res?.data || []))
          .catch(() => setWhatsappConfigFeedback("Erro ao carregar números disponíveis."));
      } else if (status === "cancelled") {
        setWhatsappConfigFeedback("Conexão cancelada.");
      } else {
        setWhatsappConfigFeedback(getWhatsappOauthFeedback(status, reason));
      }
    }

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
      if (oauthConnectTimeoutRef.current) {
        clearTimeout(oauthConnectTimeoutRef.current);
        oauthConnectTimeoutRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token, isDemo]);

  useEffect(() => {
    if (isDemo || !auth?.token || typeof apiRequest !== "function") return;

    const params = new URLSearchParams(location.search);
    const oauthStatus = String(params.get("waoauth") || "").trim().toLowerCase();
    const oauthReason = String(params.get("waoauth_reason") || "").trim().toLowerCase();
    if (!oauthStatus) return;

    setIsOauthConnecting(false);
    const headers = { Authorization: `Bearer ${auth.token}` };

    if (oauthStatus === "connected") {
      Promise.all([
        apiRequest("/whatsapp-crm-config", { headers }),
        apiRequest("/crm-whatsapp/status", { headers }),
      ])
        .then(([configRes, statusRes]) => {
          setWhatsappConfig({ ...buildDefaultWhatsappCrmConfig(), ...(configRes?.data || {}) });
          setWhatsappStatus({ ...buildDefaultWhatsappCrmStatus(), ...(statusRes?.data || {}) });
          setWhatsappConfigFeedback("WhatsApp conectado com sucesso!");
        })
        .catch(() => {
          setWhatsappConfigFeedback("Conectado! Atualize a pagina para ver o status.");
        });
    } else if (oauthStatus === "select") {
      apiRequest("/crm-whatsapp/oauth/pending-phones", { headers })
        .then((res) => {
          setPendingOauthPhones(res?.data || []);
          setWhatsappConfigFeedback("Selecione o numero que deseja usar no CRM.");
        })
        .catch(() => {
          setWhatsappConfigFeedback("Erro ao carregar numeros disponiveis para selecao.");
        });
    } else if (oauthStatus === "cancelled") {
      setWhatsappConfigFeedback("Conexao cancelada.");
    } else {
      setWhatsappConfigFeedback(getWhatsappOauthFeedback(oauthStatus, oauthReason));
    }

    params.delete("waoauth");
    params.delete("waoauth_reason");
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [apiRequest, auth?.token, isDemo, location.pathname, location.search, navigate]);

  // ─── Handlers OAuth ───────────────────────────────────────────────────────
  const handleOAuthConnect = async () => {
    if (isDemo || !auth?.token || typeof apiRequest !== "function") return;
    try {
      setIsOauthConnecting(true);
      setWhatsappConfigFeedback("");
      if (oauthConnectTimeoutRef.current) {
        clearTimeout(oauthConnectTimeoutRef.current);
        oauthConnectTimeoutRef.current = null;
      }
      const res = await apiRequest("/crm-whatsapp/oauth/url", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (!res?.url) {
        throw new Error("Nao foi possivel gerar o link de conexao com a Meta.");
      }
      const popup = window.open(
        res.url,
        "whatsapp_oauth",
        "width=620,height=720,left=400,top=150",
      );
      if (!popup) {
        setIsOauthConnecting(false);
        setWhatsappConfigFeedback("Abrindo conexao da Meta nesta aba...");
        window.location.assign(res.url);
        return;
      }
      setWhatsappConfigFeedback(
        "Janela da Meta aberta. Finalize a conexao e aguarde a confirmacao.",
      );
      oauthConnectTimeoutRef.current = setTimeout(() => {
        setIsOauthConnecting(false);
        setWhatsappConfigFeedback(
          "Se a janela nao abriu, habilite pop-up para este site e clique em 'Tentar novamente'.",
        );
        oauthConnectTimeoutRef.current = null;
      }, 25000);
    } catch (err) {
      setIsOauthConnecting(false);
      setWhatsappConfigFeedback(err?.message || "Não foi possível iniciar a conexão com a Meta.");
    }
  };

  const handleOAuthSelectPhone = async (phoneNumberId) => {
    if (!auth?.token || typeof apiRequest !== "function") return;
    try {
      setIsWhatsappConfigSaving(true);
      await apiRequest("/crm-whatsapp/oauth/select-phone", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ phoneNumberId }),
      });
      setPendingOauthPhones([]);
      const [configRes, statusRes] = await Promise.all([
        apiRequest("/whatsapp-crm-config", { headers: { Authorization: `Bearer ${auth.token}` } }),
        apiRequest("/crm-whatsapp/status", { headers: { Authorization: `Bearer ${auth.token}` } }),
      ]);
      setWhatsappConfig({ ...buildDefaultWhatsappCrmConfig(), ...(configRes?.data || {}) });
      setWhatsappStatus({ ...buildDefaultWhatsappCrmStatus(), ...(statusRes?.data || {}) });
      setWhatsappConfigFeedback("Número conectado com sucesso!");
    } catch (err) {
      setWhatsappConfigFeedback(err?.message || "Não foi possível selecionar o número.");
    } finally {
      setIsWhatsappConfigSaving(false);
    }
  };

  const handleOAuthDisconnect = async () => {
    if (!auth?.token || typeof apiRequest !== "function") return;
    try {
      await apiRequest("/crm-whatsapp/oauth/disconnect", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setWhatsappConfig(buildDefaultWhatsappCrmConfig());
      setWhatsappStatus(buildDefaultWhatsappCrmStatus());
      setPendingOauthPhones([]);
      setWhatsappConfigFeedback("WhatsApp desconectado.");
    } catch (err) {
      setWhatsappConfigFeedback(err?.message || "Não foi possível desconectar.");
    }
  };

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

  const uploadConversationMedia = async (file, preferredMessageType = "") => {
    if (!file) return null;

    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
      return {
        mediaUrl: "",
        mimeType: file.type || "",
        fileName: file.name || "arquivo",
        messageType: preferredMessageType || "document",
      };
    }

    const formData = new FormData();
    formData.append("file", file, file.name || "arquivo");

    const response = await apiRequest("/crm-conversations/upload", {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    return {
      ...(response?.data || {}),
      messageType:
        preferredMessageType ||
        response?.data?.messageType ||
        "document",
    };
  };

  const handleSendMessage = async () => {
    const nextDraft = String(draftMessage || "")
      .replace(/\[Anexo:[^\]]+\]/g, " ")
      .replace(/\[Audio gravado\]/g, " ")
      .trim();
    if (!selectedThread || (!nextDraft && !selectedAttachmentFile && !recordedAudioBlob)) {
      return;
    }

    setErrorMessage("");
    setFeedback("");
    setIsSubmitting(true);

    try {
      let sent = false;
      const attachmentToSend = recordedAudioBlob || selectedAttachmentFile || null;

      if (attachmentToSend) {
        const isAudioAttachment = recordedAudioBlob || String(attachmentToSend.type || "").startsWith("audio/");
        const uploadedMedia = await uploadConversationMedia(
          attachmentToSend,
          isAudioAttachment
            ? "audio"
            : String(attachmentToSend.type || "").startsWith("image/")
              ? "image"
              : "document",
        );

        let nextMessage = {
          id: `${selectedThread.id}-${Date.now()}`,
          side: "outgoing",
          sender: auth?.user?.name || "Pedro",
          text: nextDraft || `[${uploadedMedia?.fileName || "midia"}]`,
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
                messageType: uploadedMedia?.messageType || "document",
                mediaUrl: uploadedMedia?.mediaUrl || null,
                mimeType: uploadedMedia?.mimeType || attachmentToSend.type || null,
                payload: {
                  fileName: uploadedMedia?.fileName || attachmentToSend.name || "arquivo",
                },
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
                  preview: nextDraft || `[${uploadedMedia?.fileName || "midia"}]`,
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
          isDemo
            ? "Midia enviada no preview."
            : "Midia enviada com sucesso.",
        );
        sent = true;
      } else {
        sent = await sendConversationText(nextDraft);
      }

      if (sent) {
        setDraftMessage("");
        setSelectedAttachmentName("");
        setSelectedAttachmentFile(null);
        if (recordedAudioUrl) {
          URL.revokeObjectURL(recordedAudioUrl);
        }
        setRecordedAudioUrl("");
        setRecordedAudioBlob(null);
      }
    } catch (error) {
      const normalizedMessage = String(error?.message || "");
      setErrorMessage(
        normalizedMessage.includes("131030") ||
          normalizedMessage.toLowerCase().includes("allowed list")
          ? "A Meta bloqueou o envio porque esse numero ainda esta na lista permitida do numero de teste. Adicione o telefone em Meta > API Setup > To ou troque para o numero real."
          : error?.message || "Nao foi possivel enviar a mensagem.",
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

  const saveCrmBoardConfig = async (nextConfig) => {
    const normalized = normalizeCrmBoardConfig(nextConfig);

    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
      setCrmBoardConfig(normalized);
      setFeedback("Quadro do CRM atualizado no preview.");
      setErrorMessage("");
      return normalized;
    }

    try {
      setIsCrmBoardSaving(true);
      const response = await apiRequest("/crm-conversations/board/config", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(normalized),
      });
      const savedConfig = normalizeCrmBoardConfig(response?.data || normalized);
      setCrmBoardConfig(savedConfig);
      setFeedback("Quadro do CRM salvo com sucesso.");
      setErrorMessage("");
      return savedConfig;
    } catch (error) {
      setErrorMessage(
        error?.message || "Nao foi possivel salvar o quadro do CRM.",
      );
      return null;
    } finally {
      setIsCrmBoardSaving(false);
    }
  };

  const handleCreateCrmColumn = async () => {
    const label = String(crmColumnDraft || "").trim();
    if (!label) {
      setErrorMessage("Informe o nome da nova coluna do CRM.");
      return;
    }

    const nextConfig = {
      columns: [
        ...crmBoardColumns,
        {
          id: slugifyCrmColumnId(label, `coluna-${crmBoardColumns.length + 1}`),
          label,
          color: "#ffe4e8",
          description: "Categoria criada no quadro do CRM.",
        },
      ],
    };

    const savedConfig = await saveCrmBoardConfig(nextConfig);
    if (savedConfig) {
      setCrmColumnDraft("");
      setIsCreatingCrmColumn(false);
    }
  };

  const startEditingCrmColumn = (column) => {
    if (!canManageCrmBoard || !column?.id) return;
    setEditingCrmColumnId(column.id);
    setEditingCrmColumnLabel(column.label || "");
  };

  const cancelEditingCrmColumn = () => {
    setEditingCrmColumnId("");
    setEditingCrmColumnLabel("");
  };

  const commitCrmColumnLabel = async (column) => {
    if (!column?.id) return;
    const nextLabel = String(editingCrmColumnLabel || "").trim();
    if (!nextLabel) {
      setErrorMessage("Informe um nome valido para a coluna.");
      cancelEditingCrmColumn();
      return;
    }

    if (nextLabel === String(column.label || "").trim()) {
      cancelEditingCrmColumn();
      return;
    }

    const nextConfig = {
      columns: crmBoardColumns.map((item) =>
        item.id === column.id
          ? {
              ...item,
              label: nextLabel,
            }
          : item,
      ),
    };

    const savedConfig = await saveCrmBoardConfig(nextConfig);
    if (savedConfig) {
      cancelEditingCrmColumn();
    }
  };

  const moveConversationToCrmColumn = async (thread, columnId) => {
    if (!thread?.id || !columnId) return;

    const currentStageId = getThreadCrmStageId(thread, crmBoardConfig);
    if (currentStageId === columnId) return;

    const nextMetadata = {
      ...(thread.metadata || {}),
      crmStageId: columnId,
    };

    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
      setThreads((currentThreads) =>
        currentThreads.map((item) =>
          item.id === thread.id
            ? { ...item, metadata: nextMetadata }
            : item,
        ),
      );
      setFeedback("Contato movido no quadro do CRM.");
      setErrorMessage("");
      return;
    }

    try {
      const response = await apiRequest(`/crm-conversations/${thread.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          metadata: nextMetadata,
        }),
      });
      const updatedThread = mapConversationToThread(response?.data || {
        ...thread,
        metadata: nextMetadata,
      });
      setThreads((currentThreads) =>
        currentThreads.map((item) =>
          item.id === thread.id
            ? {
                ...item,
                ...updatedThread,
                messages:
                  Array.isArray(item.messages) && item.messages.length
                    ? item.messages
                    : updatedThread.messages || [],
              }
            : item,
        ),
      );
      setFeedback("Contato movido no quadro do CRM.");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error?.message || "Nao foi possivel mover o contato no CRM.",
      );
    }
  };

  const handleCrmCardDragStart = (event, thread) => {
    if (!thread?.id) return;
    setDraggedCrmThreadId(thread.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", thread.id);
  };

  const handleCrmCardDragEnd = () => {
    setDraggedCrmThreadId("");
    setDragOverCrmColumnId("");
  };

  const handleCrmColumnDragOver = (event, columnId) => {
    event.preventDefault();
    if (dragOverCrmColumnId !== columnId) {
      setDragOverCrmColumnId(columnId);
    }
    event.dataTransfer.dropEffect = "move";
  };

  const handleCrmColumnDrop = async (event, columnId) => {
    event.preventDefault();
    const draggedThreadId =
      draggedCrmThreadId || String(event.dataTransfer.getData("text/plain") || "").trim();
    const thread = threads.find((item) => item.id === draggedThreadId);
    setDragOverCrmColumnId("");
    setDraggedCrmThreadId("");
    if (!thread) return;
    await moveConversationToCrmColumn(thread, columnId);
  };

  const startCrmAiSubscriptionCheckout = async () => {
    if (isDemo) {
      setFeedback("Checkout da IA CRM em modo preview.");
      setErrorMessage("");
      return;
    }

    if (!auth?.token || typeof apiRequest !== "function") {
      setErrorMessage("Entre no sistema para contratar a IA CRM.");
      return;
    }

    try {
      setIsCrmAiCheckoutLoading(true);
      const response = await apiRequest("/api/crm-ai/subscribe", {
        method: "POST",
        headers: authHeaders,
      });
      const checkoutUrl = response?.payment?.checkout_url || "";
      if (checkoutUrl) {
        openPreferredExternalUrl(checkoutUrl);
        setFeedback("Checkout da IA CRM aberto para pagamento.");
        setErrorMessage("");
      } else {
        setErrorMessage("Nao foi possivel abrir o checkout da IA CRM.");
      }
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(
        error?.message || "Nao foi possivel iniciar a assinatura da IA CRM.",
      );
    } finally {
      setIsCrmAiCheckoutLoading(false);
    }
  };

  const cancelCrmAiSubscription = async () => {
    if (isDemo) {
      setFeedback("Assinatura da IA CRM cancelada no preview.");
      setErrorMessage("");
      return;
    }

    if (!auth?.token || typeof apiRequest !== "function") {
      setErrorMessage("Entre no sistema para cancelar a IA CRM.");
      return;
    }

    try {
      setIsCrmAiCheckoutLoading(true);
      await apiRequest("/api/crm-ai/cancel", {
        method: "POST",
        headers: authHeaders,
      });
      setFeedback("Assinatura da IA CRM cancelada com sucesso.");
      setErrorMessage("");
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(
        error?.message || "Nao foi possivel cancelar a assinatura da IA CRM.",
      );
    } finally {
      setIsCrmAiCheckoutLoading(false);
    }
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

  const openSetupWizard = async () => {
    setIsSetupWizardOpen(true);
    setActiveMenuId("home");
    setErrorMessage("");

    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
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
        error?.message || "Nao foi possivel carregar o assistente de primeira configuracao.",
      );
    } finally {
      setIsWhatsappConfigLoading(false);
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

  const startWhatsappOfficialConnect = async () => {
    await openWhatsappConfig();
    await handleOAuthConnect();
  };

  useEffect(() => {
    if (!routeContext.action) return;
    const actionKey = `${location.pathname}?${location.search}`;
    if (routeActionRef.current === actionKey) return;
    routeActionRef.current = actionKey;

    if (routeContext.action === "whatsapp-connect") {
      openWhatsappConfig();
    } else if (routeContext.action === "setup-wizard") {
      openSetupWizard();
    } else if (routeContext.action === "ai-control") {
      openAiControl();
    }

    const nextParams = new URLSearchParams(location.search);
    nextParams.delete("action");
    navigate(
      `${location.pathname}${nextParams.toString() ? `?${nextParams.toString()}` : ""}`,
      { replace: true },
    );
  }, [location.pathname, location.search, navigate, routeContext.action]);

  const openCrmSupport = () => {
    if (!supportPhone) {
      setErrorMessage("WhatsApp de suporte nao configurado.");
      return;
    }

    const customerLabel =
      selectedThread?.customer?.name ||
      selectedThread?.customerName ||
      selectedThread?.name ||
      "cliente";
    const petLabel =
      selectedThread?.pet?.name || selectedThread?.petName || "pet";
    const storeLabel =
      auth?.user?.storeName || auth?.user?.name || "ViaPet";
    const message = encodeURIComponent(
      `Ola ViaPet!%0A%0APreciso de ajuda no CRM de Mensagens.%0A%0ALoja: ${storeLabel}%0ACliente: ${customerLabel}%0APet: ${petLabel}%0AConversa: ${selectedThread?.id || "nao selecionada"}`,
    );
    openPreferredExternalUrl(`https://wa.me/${supportPhone}?text=${message}`);
  };

  const focusSearchAndMenu = (menuId) => {
    setActiveMenuId(menuId);
    window.setTimeout(() => {
      searchInputRef.current?.focus?.();
    }, 0);
  };

  const toggleThemeMode = () => {
    setIsDarkMode((current) => {
      const next = !current;
      setFeedback(next ? "Modo noturno ativado no CRM." : "Modo claro ativado no CRM.");
      setErrorMessage("");
      return next;
    });
  };

  const toggleOwnerFilterPanel = () => {
    setIsOwnerFilterOpen((current) => !current);
    setIsAdvancedFilterOpen(false);
  };

  const toggleAdvancedFilterPanel = () => {
    setIsAdvancedFilterOpen((current) => !current);
    setIsOwnerFilterOpen(false);
  };

  const clearThreadFilters = () => {
    setOwnerFilter("");
    setChannelFilter("");
    setOnlyUnread(false);
    setFeedback("Filtros das conversas limpos.");
    setErrorMessage("");
  };

  const openConversationHistory = () => {
    if (!selectedThread) {
      setErrorMessage("Selecione uma conversa para ver o historico.");
      return;
    }
    setIsHistoryOpen(true);
    setFeedback("");
    setErrorMessage("");
  };

  const openThreadWorkspace = (threadId) => {
    setSelectedThreadId(threadId);
    setActiveMenuId("chat");
    setFeedback("Conversa aberta no CRM.");
    setErrorMessage("");
  };

  const openSystemRoute = (path, label) => {
    navigate(path);
    setFeedback(label ? `${label} aberto com sucesso.` : "");
    setErrorMessage("");
  };

  const copyTextToClipboard = async (value, successMessage) => {
    const normalized = String(value || "").trim();
    if (!normalized) {
      setErrorMessage("Nao ha nada pronto para copiar.");
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(normalized);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = normalized;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setFeedback(successMessage || "Conteudo copiado.");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Nao foi possivel copiar agora.");
    }
  };

  const sendBroadcast = async () => {
    const text = String(broadcastMessage || "").trim();
    if (!text) {
      setErrorMessage("Escreva a mensagem antes de disparar.");
      return;
    }

    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
      setBroadcastResult({ sent: 0, failed: 0, errors: [], demo: true });
      return;
    }

    const authHeaders = { Authorization: `Bearer ${auth.token}` };

    try {
      setIsBroadcastSending(true);
      setBroadcastResult(null);
      setErrorMessage("");

      const response = await apiRequest("/crm-whatsapp/broadcast", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      setBroadcastResult(response?.data || { sent: 0, failed: 0, errors: [] });
      setFeedback(response?.message || "Disparo concluido.");
    } catch (error) {
      setErrorMessage(error?.message || "Nao foi possivel realizar o disparo.");
    } finally {
      setIsBroadcastSending(false);
    }
  };

  const startNewConversation = async () => {
    const phone = String(newConvPhone || "").replace(/\D/g, "");
    if (!phone) {
      setNewConvError("Informe o telefone do contato.");
      return;
    }

    setNewConvError("");

    if (isDemo) {
      setIsNewConvOpen(false);
      setNewConvPhone("");
      setNewConvName("");
      setNewConvMessage("");
      return;
    }

    const authHeaders = { Authorization: `Bearer ${auth.token}` };

    try {
      setIsNewConvSubmitting(true);

      const convResponse = await apiRequest("/crm-conversations", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          customerName: newConvName.trim() || null,
          channel: "whatsapp",
          status: "attending",
          source: "crm",
          assignedUserId: auth?.user?.id || null,
        }),
      });

      const newThread = mapConversationToThread(convResponse?.data || {});

      // Se houver mensagem inicial, envia imediatamente
      if (newConvMessage.trim() && newThread.id) {
        await apiRequest(`/crm-conversations/${newThread.id}/messages`, {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            body: newConvMessage.trim(),
            direction: "outbound",
            messageType: "text",
            sendNow: true,
          }),
        });
      }

      setIsNewConvOpen(false);
      setNewConvPhone("");
      setNewConvName("");
      setNewConvMessage("");
      setSelectedThreadId(newThread.id);
      setActiveMenuId("chat");
      setActiveTab("all");
      setRefreshKey((current) => current + 1);
      setFeedback("Conversa iniciada com sucesso.");
    } catch (error) {
      setNewConvError(error?.message || "Nao foi possivel iniciar a conversa.");
    } finally {
      setIsNewConvSubmitting(false);
    }
  };

  const openExternalUrl = (url) => {
    if (!url) return;
    openPreferredExternalUrl(url);
  };

  const openConversationEmail = () => {
    const email = selectedCustomer?.email || "";
    if (!email) {
      setErrorMessage("Esse tutor nao possui e-mail cadastrado.");
      return;
    }
    openPreferredExternalUrl(`mailto:${email}`);
    setFeedback("Cliente de e-mail aberto.");
    setErrorMessage("");
  };

  const toggleConversationSelection = () => {
    if (!selectedThread) {
      setErrorMessage("Selecione uma conversa antes de marcar.");
      return;
    }
    setIsConversationMarked((current) => {
      const next = !current;
      setFeedback(
        next
          ? "Conversa marcada para acompanhamento."
          : "Marcacao da conversa removida.",
      );
      setErrorMessage("");
      return next;
    });
  };

  const triggerAttachmentPicker = () => {
    attachmentInputRef.current?.click?.();
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedAttachmentName(file.name);
    setSelectedAttachmentFile(file);
    setDraftMessage((current) => {
      const suffix = current && !current.endsWith(" ") ? " " : "";
      return `${current || ""}${suffix}[Anexo: ${file.name}]`.trim();
    });
    setFeedback(`Arquivo "${file.name}" pronto para envio na conversa.`);
    setErrorMessage("");
    event.target.value = "";
  };

  const toggleAudioRecording = async () => {
    if (isRecordingAudio) {
      audioRecorderRef.current?.stop?.();
      setIsRecordingAudio(false);
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setErrorMessage("Gravacao de audio nao suportada neste navegador.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      const preferredMimeType = [
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
        "audio/mpeg",
      ].find((mime) => MediaRecorder.isTypeSupported?.(mime));
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);
      audioRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || preferredMimeType || "audio/webm",
        });
        if (recordedAudioUrl) {
          URL.revokeObjectURL(recordedAudioUrl);
        }
        const nextUrl = URL.createObjectURL(blob);
        const extension = String(blob.type || "").includes("ogg")
          ? "ogg"
          : String(blob.type || "").includes("mp4")
            ? "mp4"
            : String(blob.type || "").includes("mpeg")
              ? "mp3"
              : "webm";
        const audioFile = new File([blob], `gravacao-crm.${extension}`, {
          type: blob.type || preferredMimeType || "audio/webm",
        });
        setRecordedAudioUrl(nextUrl);
        setRecordedAudioBlob(audioFile);
        setDraftMessage((current) => {
          const suffix = current && !current.endsWith(" ") ? " " : "";
          return `${current || ""}${suffix}[Audio gravado]`.trim();
        });
        setFeedback("Audio gravado localmente e anexado ao rascunho.");
        setErrorMessage("");
        stream.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      };
      recorder.start();
      setIsRecordingAudio(true);
      setFeedback("Gravando audio...");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error?.message || "Nao foi possivel acessar o microfone.",
      );
    }
  };

  const removeRecordedAudio = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl("");
    setRecordedAudioBlob(null);
    setDraftMessage((current) =>
      String(current || "").replace(/\s*\[Audio gravado\]\s*/g, " ").trim(),
    );
    setFeedback("Audio removido do rascunho.");
    setErrorMessage("");
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
      setIsWhatsappConfigOpen(false);
    } catch (error) {
      setWhatsappConfigFeedback(
        error?.message || "Nao foi possivel salvar a configuracao do WhatsApp CRM.",
      );
    } finally {
      setIsWhatsappConfigSaving(false);
    }
  };

  const activateSimpleWhatsappMode = async () => {
    if (isDemo || typeof apiRequest !== "function" || !auth?.token) {
      setWhatsappConfigFeedback("Modo simples ativado no preview.");
      setIsWhatsappConfigOpen(false);
      setActiveMenuId("whatsapp");
      return;
    }

    try {
      setIsWhatsappConfigSaving(true);
      await apiRequest("/api/whatsapp-hub/config", {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          integrationMode: "simple",
          businessPhone: whatsappConfig?.businessPhone || "",
          verifyToken: whatsappConfig?.verifyToken || "genius",
        }),
      });

      setWhatsappConfig((current) => ({
        ...buildDefaultWhatsappCrmConfig(),
        ...current,
        provider: "WhatsApp simples",
        status: "configured",
      }));
      setWhatsappStatus((current) => ({
        ...buildDefaultWhatsappCrmStatus(),
        ...current,
        provider: "WhatsApp simples",
        configured: true,
        connected: false,
      }));
      setWhatsappConfigFeedback("Modo simples ativado. Agora voce ja pode usar o WhatsApp por link dentro do CRM.");
      setIsWhatsappConfigOpen(false);
      setActiveMenuId("whatsapp");
    } catch (error) {
      setWhatsappConfigFeedback(
        error?.message || "Nao foi possivel ativar o modo simples agora.",
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
      if (response?.data?.tokenInvalid || response?.requiresReconnect) {
        setWhatsappStatus((current) => ({
          ...current,
          configured: false,
          connected: false,
          tokenInvalid: true,
          tokenErrorMessage:
            response?.message || "A conexao com a Meta expirou. Reconecte o WhatsApp.",
        }));
      } else {
        setWhatsappStatus((current) => ({
          ...current,
          configured: true,
          connected: true,
          tokenInvalid: false,
          tokenErrorMessage: "",
        }));
      }
      setWhatsappConfigFeedback(
        response?.message || "Conexao com a Meta validada com sucesso.",
      );
    } catch (error) {
      setWhatsappTestResult(null);
      if (error?.tokenInvalid || error?.requiresReconnect) {
        setWhatsappStatus((current) => ({
          ...current,
          configured: false,
          connected: false,
          tokenInvalid: true,
          tokenErrorMessage:
            error?.message || "A conexao com a Meta expirou. Reconecte o WhatsApp.",
        }));
      }
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
      setIsAiControlOpen(false);
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
      setIsAiControlOpen(false);
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
      agendaType: aiBathDraft.agendaType,
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
        agendaType: aiBathDraft.agendaType || "estetica",
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
          category: formatAgendaTypeLabel(aiBathDraft.agendaType || "estetica"),
        },
        appointment: {
          label: suggestOnly ? "" : aiBathDraft.appointmentAt,
          type: aiBathDraft.agendaType || "estetica",
        },
        slotSuggestions: previewSuggestions,
        validation,
        assistantReply: suggestOnly
          ? `Encontrei horarios na agenda de ${formatAgendaTypeLabel(aiBathDraft.agendaType || "estetica").toLowerCase()} para ${aiBathDraft.serviceQuery || "atendimento"}: ${previewSuggestions.map((item) => item.label).join(" | ")}.`
          : `Posso seguir com ${aiBathDraft.serviceQuery || "o atendimento"} na agenda de ${formatAgendaTypeLabel(aiBathDraft.agendaType || "estetica").toLowerCase()} para ${selectedPet?.name || aiBathDraft.petName || "o pet"} em ${aiBathDraft.appointmentAt}.`,
        executed: execute && validation.allowed && validation.executionMode !== "blocked",
      };

      setAiBathResult(previewResult);
        setAiControlFeedback(
        suggestOnly
          ? "Preview: horarios sugeridos pela IA local."
          : execute
          ? "Preview: a IA executaria esse atendimento conforme as regras locais."
          : "Preview: proposta montada pela IA local.",
      );
      return;
    }

    try {
      setIsAiBathLoading(true);
      const response = await apiRequest("/api/crm-ai/assistant/schedule-appointment", {
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
  const filteredContactsDirectory = useMemo(() => {
    const term = String(deferredSearchQuery || "").trim().toLowerCase();
    if (!term) return contactsDirectory;
    return contactsDirectory.filter((contact) =>
      [contact.name, contact.phone, contact.petName, contact.email]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [contactsDirectory, deferredSearchQuery]);

  const renderModuleWorkspace = () => {
    switch (activeMenuId) {
      case "home":
        return (
          <section className="messages-redesign-module">
            <header className="messages-redesign-module-header">
              <div>
                <span>Home do CRM</span>
                <h2>Visao rapida do atendimento</h2>
              </div>
              <div className="messages-redesign-module-actions">
                <button type="button" className="messages-redesign-detail-btn" onClick={() => setActiveMenuId("chat")}>
                  Abrir conversas
                </button>
                <button type="button" className="messages-redesign-detail-btn" onClick={openWhatsappConfig}>
                  WhatsApp CRM
                </button>
              </div>
            </header>
            <div className="messages-redesign-module-metrics">
              {reportMetrics.slice(0, 4).map((metric) => (
                <article key={metric.label} className={`messages-redesign-module-metric ${metric.tone || "violet"}`}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </article>
              ))}
            </div>
            <div className="messages-redesign-module-grid two">
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>Atalhos rapidos</strong>
                  <span>O que mais se usa no dia</span>
                </div>
                <div className="messages-redesign-module-actions stack">
                  <button type="button" className="messages-redesign-detail-btn primary" onClick={openSetupWizard}>
                    Primeira configuracao
                  </button>
                  <button type="button" className="messages-redesign-detail-btn" onClick={() => openSystemRoute("/agenda", "Agenda")}>Abrir agenda</button>
                  <button type="button" className="messages-redesign-detail-btn" onClick={() => openSystemRoute("/cadastros", "Cadastros")}>Abrir cadastros</button>
                  <button type="button" className="messages-redesign-detail-btn" onClick={openAiControl}>Controle da IA</button>
                  <button type="button" className="messages-redesign-detail-btn" onClick={openCrmSupport}>Suporte do CRM</button>
                </div>
              </section>
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>Fila de prioridade</strong>
                  <span>Conversas que pedem atencao primeiro</span>
                </div>
                <div className="messages-redesign-module-list">
                  {taskQueue.slice(0, 5).map((thread) => (
                    <button key={thread.id} type="button" className="messages-redesign-module-list-item" onClick={() => openThreadWorkspace(thread.id)}>
                      <div>
                        <strong>{thread.name}</strong>
                        <span>{thread.preview || thread.handle || "Sem resumo"}</span>
                      </div>
                      <small>{formatConversationStatusLabel(thread.status)}</small>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </section>
        );
      case "contacts":
        return (
          <section className="messages-redesign-module">
            <header className="messages-redesign-module-header">
              <div>
                <span>Cadastro rapido</span>
                <h2>Contatos do CRM</h2>
              </div>
              <div className="messages-redesign-module-actions">
                <button type="button" className="messages-redesign-detail-btn" onClick={() => setActiveMenuId("broadcast")}>Envio em massa</button>
                <button type="button" className="messages-redesign-detail-btn" onClick={() => openSystemRoute("/cadastros?tab=Pessoas", "Cadastro de pessoas")}>Abrir pessoas</button>
              </div>
            </header>
            <div className="messages-redesign-module-list cards">
              {filteredContactsDirectory.length ? (
                filteredContactsDirectory.map((contact) => (
                  <article key={contact.key} className="messages-redesign-module-contact">
                    <div>
                      <strong>{contact.name}</strong>
                      <span>
                        {formatPhoneDisplay(contact.phone)}
                        {contact.petName ? ` • ${contact.petName}` : ""}
                        {contact.status ? ` • ${formatConversationStatusLabel(contact.status)}` : ""}
                      </span>
                    </div>
                    <div className="messages-redesign-module-actions">
                      {contact.threadId && (
                        <button type="button" className="messages-redesign-detail-btn" onClick={() => openThreadWorkspace(contact.threadId)}>Abrir conversa</button>
                      )}
                      <button type="button" className="messages-redesign-detail-btn" onClick={() => navigate(`/cadastros?tab=Pessoas&search=${encodeURIComponent(contact.name)}`)}>Ver tutor</button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="messages-redesign-empty">Nenhum contato encontrado. As conversas do WhatsApp aparecem aqui automaticamente.</div>
              )}
            </div>
          </section>
        );
      case "whatsapp":
        return (
          <MessagesWhatsappHubPanel
            apiRequest={apiRequest}
            auth={auth}
            onConnectOfficial={startWhatsappOfficialConnect}
          />
        );
      case "crm":
        return (
          <section className="messages-redesign-module">
            <header className="messages-redesign-module-header">
              <div>
                <span>Operacao do CRM</span>
                <h2>Quadro comercial e de atendimento</h2>
              </div>
              <div className="messages-redesign-module-actions">
                <button type="button" className="messages-redesign-detail-btn" onClick={() => setActiveMenuId("ai")}>Abrir IA</button>
                <button type="button" className="messages-redesign-detail-btn" onClick={openWhatsappConfig}>Ajustar WhatsApp</button>
              </div>
            </header>
            <div className="messages-redesign-module-metrics">
              {reportMetrics.map((metric) => (
                <article key={metric.label} className={`messages-redesign-module-metric ${metric.tone || "violet"}`}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </article>
              ))}
            </div>
            <div className="messages-crm-board-toolbar">
              <div className="messages-crm-board-toolbar-copy">
                <strong>Colunas do CRM</strong>
                <span>Arraste os contatos entre as colunas, crie novas categorias e renomeie com duplo clique.</span>
              </div>
              <div className="messages-crm-board-toolbar-actions">
                <button
                  type="button"
                  className={isCreatingCrmColumn ? "messages-redesign-detail-btn active" : "messages-redesign-detail-btn primary"}
                  onClick={() => {
                    setIsCreatingCrmColumn((current) => !current);
                    setErrorMessage("");
                  }}
                  disabled={!canManageCrmBoard || isCrmBoardSaving}
                >
                  + Nova coluna
                </button>
                {isCreatingCrmColumn ? (
                  <>
                    <input
                      type="text"
                      value={crmColumnDraft}
                      onChange={(event) => setCrmColumnDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleCreateCrmColumn();
                        }
                        if (event.key === "Escape") {
                          setIsCreatingCrmColumn(false);
                          setCrmColumnDraft("");
                        }
                      }}
                      placeholder="Nome da nova coluna"
                      disabled={!canManageCrmBoard || isCrmBoardSaving}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="messages-redesign-detail-btn primary"
                      onClick={handleCreateCrmColumn}
                      disabled={!canManageCrmBoard || isCrmBoardSaving || !crmColumnDraft.trim()}
                    >
                      {isCrmBoardSaving ? "Salvando..." : "Salvar"}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            {isCrmBoardLoading ? (
              <div className="messages-redesign-empty">Carregando quadro do CRM...</div>
            ) : (
              <div className="messages-crm-board-grid">
                {crmBoardGroups.map((column) => (
                  <section
                    key={column.id}
                    className={
                      dragOverCrmColumnId === column.id
                        ? "messages-crm-board-column drag-over"
                        : "messages-crm-board-column"
                    }
                    style={{ "--crm-column-color": column.color }}
                    onDragOver={(event) => handleCrmColumnDragOver(event, column.id)}
                    onDragEnter={(event) => handleCrmColumnDragOver(event, column.id)}
                    onDragLeave={() => {
                      if (dragOverCrmColumnId === column.id) {
                        setDragOverCrmColumnId("");
                      }
                    }}
                    onDrop={(event) => handleCrmColumnDrop(event, column.id)}
                  >
                    <header className="messages-crm-board-column-head">
                      <div>
                        {editingCrmColumnId === column.id ? (
                          <input
                            type="text"
                            className="messages-crm-board-column-title-input"
                            value={editingCrmColumnLabel}
                            onChange={(event) => setEditingCrmColumnLabel(event.target.value)}
                            onBlur={() => commitCrmColumnLabel(column)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                commitCrmColumnLabel(column);
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                cancelEditingCrmColumn();
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <strong
                            role={canManageCrmBoard ? "button" : undefined}
                            tabIndex={canManageCrmBoard ? 0 : undefined}
                            onDoubleClick={() => startEditingCrmColumn(column)}
                            onKeyDown={(event) => {
                              if (canManageCrmBoard && (event.key === "Enter" || event.key === " ")) {
                                event.preventDefault();
                                startEditingCrmColumn(column);
                              }
                            }}
                          >
                            {column.label}
                          </strong>
                        )}
                        <span>{column.description || "Categoria do funil comercial e de atendimento."}</span>
                      </div>
                      <span className="messages-crm-board-count">{column.threads.length}</span>
                    </header>
                    <div className="messages-crm-board-column-body">
                      {column.threads.length ? (
                        column.threads.map((thread) => (
                          <article
                            key={thread.id}
                            className={
                              draggedCrmThreadId === thread.id
                                ? "messages-crm-board-card dragging"
                                : "messages-crm-board-card"
                            }
                            draggable
                            onDragStart={(event) => handleCrmCardDragStart(event, thread)}
                            onDragEnd={handleCrmCardDragEnd}
                          >
                            <div className="messages-crm-board-card-head">
                              <strong>{thread.name}</strong>
                              <span>{thread.channel}</span>
                            </div>
                            <div className="messages-crm-board-card-meta">
                              <span>{thread.petName || "Sem pet"}</span>
                              <span>{formatPhoneDisplay(thread.phone)}</span>
                              <span>{thread.owner || "Sem responsavel"}</span>
                            </div>
                            <p>{thread.preview || "Sem resumo recente."}</p>
                            <div className="messages-crm-board-card-footer">
                              <span className="messages-crm-board-card-draghint">
                                Clique e arraste para outra coluna
                              </span>
                              <button
                                type="button"
                                className="messages-redesign-detail-btn"
                                onClick={() => openThreadWorkspace(thread.id)}
                              >
                                Abrir conversa
                              </button>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="messages-crm-board-empty">
                          Nenhum contato nesta coluna.
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            )}
            <div className="messages-redesign-module-grid two">
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>Resumo do quadro</strong>
                  <span>Visao geral das conversas em aberto agora</span>
                </div>
                <div className="messages-redesign-module-list">
                  {crmBoardGroups.map((column) => (
                    <div key={column.id} className="messages-redesign-module-statline">
                      <strong>{column.label}</strong>
                      <span>{column.threads.length}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>Proxima melhor acao</strong>
                  <span>Para acelerar atendimento e conversao</span>
                </div>
                <div className="messages-redesign-detail-note">
                  {selectedThread
                    ? `Conversa selecionada: ${selectedThread.name}. Use a aba IA para responder, agendar, remarcar, cadastrar ou definir os limites de autonomia do assistente.`
                    : "Selecione uma conversa no chat para usar a IA com contexto completo do tutor e do pet."}
                </div>
                <div className="messages-redesign-module-actions" style={{ marginTop: "0.75rem" }}>
                  <button type="button" className="messages-redesign-detail-btn" onClick={() => setActiveMenuId("ai")}>
                    Abrir aba IA
                  </button>
                </div>
              </section>
            </div>
          </section>
        );
      case "ai":
        return (
          <section className="messages-redesign-module">
            <header className="messages-redesign-module-header">
              <div>
                <span>IA do CRM</span>
                <h2>Controle, liberacao e automacao do atendimento</h2>
              </div>
              <div className="messages-redesign-module-actions">
                <button type="button" className="messages-redesign-detail-btn primary" onClick={openSetupWizard}>
                  Assistente de configuracao
                </button>
                <button type="button" className="messages-redesign-detail-btn" onClick={openAiControl}>
                  Configurar regras
                </button>
                <button type="button" className="messages-redesign-detail-btn" onClick={openWhatsappConfig}>
                  Configurar WhatsApp
                </button>
              </div>
            </header>
            <div className="messages-redesign-module-grid two">
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>Assinatura da IA CRM</strong>
                  <span>Liberacao automatica apos compra aprovada</span>
                </div>
                <div className="messages-redesign-detail-list">
                  <div>
                    <span>Status</span>
                    <strong>{isCrmAiSubscriptionLoading ? "Carregando..." : crmAiStatusLabel}</strong>
                  </div>
                  <div>
                    <span>Plano</span>
                    <strong>{crmAiSubscription?.plan?.name || "IA CRM Premium"}</strong>
                  </div>
                  <div>
                    <span>Valor</span>
                    <strong>
                      {formatCurrencyBRL(
                        crmAiSubscription?.subscription?.amount ??
                          crmAiSubscription?.plan?.price ??
                          49.9,
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Proxima cobranca</span>
                    <strong>
                      {crmAiSubscription?.subscription?.next_billing_date
                        ? formatDateTimeShort(
                            crmAiSubscription.subscription.next_billing_date,
                          )
                        : "Ainda nao definida"}
                    </strong>
                  </div>
                </div>
                <div className="messages-redesign-detail-note">
                  Depois que o pagamento for aprovado, a aba e as automacoes da IA ficam liberadas automaticamente para o usuario.
                </div>
                <div className="messages-redesign-module-actions" style={{ marginTop: "0.75rem" }}>
                  <button
                    type="button"
                    className="messages-redesign-detail-btn primary"
                    onClick={startCrmAiSubscriptionCheckout}
                    disabled={isCrmAiCheckoutLoading || canUseCrmAi}
                  >
                    {isCrmAiCheckoutLoading
                      ? "Abrindo checkout..."
                      : canUseCrmAi
                        ? "IA liberada"
                        : "Comprar IA"}
                  </button>
                  <button
                    type="button"
                    className="messages-redesign-detail-btn"
                    onClick={cancelCrmAiSubscription}
                    disabled={isCrmAiCheckoutLoading || !crmAiSubscription?.subscription}
                  >
                    Cancelar assinatura
                  </button>
                </div>
              </section>
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>O que a IA pode controlar</strong>
                  <span>Conversa, agenda e limites operacionais</span>
                </div>
                <div className="messages-redesign-detail-list">
                  <div>
                    <span>IA no atendimento</span>
                    <strong>{aiControl?.enabled ? "Ligada" : "Desligada"}</strong>
                  </div>
                  <div>
                    <span>Resposta automatica</span>
                    <strong>{aiControl?.autoReplyEnabled ? "Ligada" : "Desligada"}</strong>
                  </div>
                  <div>
                    <span>Execucao sem revisao</span>
                    <strong>{aiControl?.autoExecuteEnabled ? "Permitida" : "Com aprovacao"}</strong>
                  </div>
                  <div>
                    <span>Agenda liberada</span>
                    <strong>{(aiControl?.scheduling?.allowedAgendaTypes || []).join(", ") || "Nao definida"}</strong>
                  </div>
                </div>
                <div className="messages-redesign-detail-note">
                  {aiControl?.instructions ||
                    "Defina aqui o que a IA pode, o que nao pode e ate onde ela pode agir sem supervisao."}
                </div>
                <div className="messages-redesign-module-actions" style={{ marginTop: "0.75rem" }}>
                  <button type="button" className="messages-redesign-detail-btn" onClick={openAiControl}>
                    Abrir controle completo
                  </button>
                </div>
              </section>
            </div>
            <div className="messages-redesign-module-grid two">
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>Auditoria recente</strong>
                  <span>O que a IA tentou ou executou</span>
                </div>
                {selectedThread ? (
                  isAiAuditLoading ? (
                    <div className="messages-redesign-empty">Carregando auditoria...</div>
                  ) : aiAuditLogs.length ? (
                    <div className="messages-redesign-module-list">
                      {aiAuditLogs.slice(0, 6).map((log) => (
                        <div key={log.id} className="messages-redesign-module-statline">
                          <strong>{log.summary || log.actionType || "Acao da IA"}</strong>
                          <span>{formatDateTimeShort(log.createdAt || log.updatedAt)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="messages-redesign-empty">
                      Ainda nao ha auditoria para a conversa selecionada.
                    </div>
                  )
                ) : (
                  <div className="messages-redesign-empty">
                    Abra uma conversa para acompanhar os logs da IA.
                  </div>
                )}
              </section>
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>Administracao do recurso</strong>
                  <span>Como isso ja esta controlado no sistema</span>
                </div>
                <div className="messages-redesign-detail-note">
                  A liberacao manual da IA ja existe na area administrativa do ViaPet. O administrador pode dar trial, liberar sem custo ou bloquear por usuario quando quiser.
                </div>
                <div className="messages-redesign-detail-note" style={{ marginTop: "0.75rem" }}>
                  Aqui em Mensagens, o usuario ve o plano, paga, recebe a liberacao automatica e ajusta exatamente o que a IA pode ou nao fazer.
                </div>
              </section>
            </div>
          </section>
        );
      case "tasks":
        return (
          <section className="messages-redesign-module">
            <header className="messages-redesign-module-header">
              <div>
                <span>Tarefas de atendimento</span>
                <h2>Fila de acompanhamento</h2>
              </div>
            </header>
            <div className="messages-redesign-module-list cards">
              {taskQueue.length ? (
                taskQueue.map((thread) => (
                  <article key={thread.id} className="messages-redesign-module-contact">
                    <div>
                      <strong>{thread.name}</strong>
                      <span>{formatConversationStatusLabel(thread.status)} • {thread.owner || "Sem responsavel"}</span>
                    </div>
                    <div className="messages-redesign-module-actions">
                      <button type="button" className="messages-redesign-detail-btn" onClick={() => openThreadWorkspace(thread.id)}>Abrir tarefa</button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="messages-redesign-empty">Nenhuma tarefa pendente no momento.</div>
              )}
            </div>
          </section>
        );
      case "broadcast":
        return (
          <section className="messages-redesign-module">
            <header className="messages-redesign-module-header">
              <div>
                <span>Comunicacao em lote</span>
                <h2>Envio em massa</h2>
              </div>
            </header>
            <div className="messages-redesign-module-grid two">
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>Mensagem base</strong>
                  <span>Sera enviada para todos os clientes com telefone</span>
                </div>
                <textarea className="messages-redesign-module-textarea" value={broadcastMessage} onChange={(event) => { setBroadcastMessage(event.target.value); setBroadcastResult(null); }} placeholder="Escreva aqui a mensagem da campanha..." />
                <div className="messages-redesign-module-actions">
                  <button type="button" className="messages-redesign-detail-btn" onClick={() => copyTextToClipboard(broadcastMessage, "Mensagem copiada.")}>Copiar</button>
                  <button type="button" className="messages-redesign-detail-btn" onClick={() => setActiveMenuId("contacts")}>Ver contatos</button>
                  <button
                    type="button"
                    className="messages-redesign-detail-btn primary"
                    disabled={isBroadcastSending || !broadcastMessage.trim()}
                    onClick={sendBroadcast}
                  >
                    {isBroadcastSending ? "Enviando..." : `Disparar para ${contactsDirectory.filter((c) => c.phone).length} contatos`}
                  </button>
                </div>
                {broadcastResult && (
                  <div className="messages-redesign-detail-note" style={{ marginTop: "0.75rem" }}>
                    {broadcastResult.demo
                      ? "Modo demo — disparo simulado."
                      : `✅ Enviados: ${broadcastResult.sent}  ❌ Falhas: ${broadcastResult.failed}`}
                    {broadcastResult.errors?.length > 0 && (
                      <ul style={{ marginTop: "0.4rem", paddingLeft: "1rem", fontSize: "0.75rem" }}>
                        {broadcastResult.errors.slice(0, 5).map((e, i) => (
                          <li key={i}>{e.phone}: {e.error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </section>
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>Base de contatos</strong>
                  <span>Quantidade disponivel para disparo</span>
                </div>
                <div className="messages-redesign-module-metrics compact">
                  <article className="messages-redesign-module-metric green"><span>Com telefone</span><strong>{contactsDirectory.filter((c) => c.phone).length}</strong></article>
                  <article className="messages-redesign-module-metric blue"><span>Total CRM</span><strong>{contactsDirectory.length}</strong></article>
                  <article className="messages-redesign-module-metric violet"><span>WhatsApp</span><strong>{threads.filter((thread) => String(thread.channel || "").toLowerCase() === "whatsapp").length}</strong></article>
                </div>
                <div className="messages-redesign-detail-note" style={{ marginTop: "0.75rem" }}>
                  O disparo usa texto simples via WhatsApp Cloud API. Certifique-se de que a configuracao do WhatsApp esta ativa antes de disparar.
                </div>
                <div className="messages-redesign-module-actions" style={{ marginTop: "0.5rem" }}>
                  <button type="button" className="messages-redesign-detail-btn" onClick={openWhatsappConfig}>Verificar config WhatsApp</button>
                </div>
              </section>
            </div>
          </section>
        );
      case "reports":
        return (
          <section className="messages-redesign-module">
            <header className="messages-redesign-module-header">
              <div>
                <span>Analise do CRM</span>
                <h2>Relatorios rapidos</h2>
              </div>
            </header>
            <div className="messages-redesign-module-metrics">
              {reportMetrics.map((metric) => (
                <article key={metric.label} className={`messages-redesign-module-metric ${metric.tone || "violet"}`}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </article>
              ))}
            </div>
          </section>
        );
      case "links":
        return (
          <section className="messages-redesign-module">
            <header className="messages-redesign-module-header">
              <div>
                <span>Link direto</span>
                <h2>Gerador de links do WhatsApp</h2>
              </div>
            </header>
            <div className="messages-redesign-module-grid two">
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-form">
                  <label>
                    <span>Telefone</span>
                    <input value={linkPhoneDraft} onChange={(event) => setLinkPhoneDraft(event.target.value)} placeholder="5511999999999" />
                  </label>
                  <label>
                    <span>Mensagem</span>
                    <textarea className="messages-redesign-module-textarea" value={linkMessageDraft} onChange={(event) => setLinkMessageDraft(event.target.value)} placeholder="Digite a mensagem inicial..." />
                  </label>
                </div>
                <div className="messages-redesign-module-actions">
                  <button type="button" className="messages-redesign-detail-btn" onClick={() => copyTextToClipboard(generatedLink, "Link do WhatsApp copiado.")}>Copiar link</button>
                  <button type="button" className="messages-redesign-detail-btn" onClick={() => openExternalUrl(generatedLink)}>Abrir link</button>
                </div>
              </section>
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>Preview do link</strong>
                </div>
                <code className="messages-redesign-module-code">{generatedLink || "Preencha o telefone para gerar o link."}</code>
              </section>
            </div>
          </section>
        );
      case "profile":
        return (
          <section className="messages-redesign-module">
            <header className="messages-redesign-module-header">
              <div>
                <span>Conta logada</span>
                <h2>Perfil do operador</h2>
              </div>
            </header>
            <div className="messages-redesign-module-grid two">
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-list">
                  <div className="messages-redesign-module-statline"><strong>Nome</strong><span>{auth?.user?.name || "Nao informado"}</span></div>
                  <div className="messages-redesign-module-statline"><strong>Papel</strong><span>{auth?.user?.role || "Nao informado"}</span></div>
                  <div className="messages-redesign-module-statline"><strong>Conta</strong><span>{auth?.user?.storeName || auth?.user?.name || "ViaPet"}</span></div>
                  <div className="messages-redesign-module-statline"><strong>Token</strong><span>{auth?.token ? "Sessao ativa" : "Sessao nao detectada"}</span></div>
                </div>
              </section>
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-detail-note">
                  Esse painel mostra quem esta usando o CRM agora e serve como acesso rapido para configuracoes e suporte.
                </div>
              </section>
            </div>
          </section>
        );
      case "settings":
        return (
          <section className="messages-redesign-module">
            <header className="messages-redesign-module-header">
              <div>
                <span>Configuracoes do modulo</span>
                <h2>Central do CRM de mensagens</h2>
              </div>
            </header>
            <section className="messages-redesign-module-hero">
              <div className="messages-redesign-module-hero-copy">
                <strong>Conecte o WhatsApp em poucos cliques</strong>
                <p>
                  Clique em conectar, autorize na Meta e pronto. Fluxo simples para
                  o usuario final, sem configuracoes tecnicas.
                </p>
              </div>
              <div className="messages-redesign-module-hero-actions">
                <button
                  type="button"
                  className="messages-redesign-module-hero-primary"
                  onClick={startWhatsappOfficialConnect}
                >
                  Conectar WhatsApp
                </button>
                <button
                  type="button"
                  className="messages-redesign-module-hero-secondary"
                  onClick={openWhatsappConfig}
                >
                  Configurar WhatsApp
                </button>
              </div>
            </section>
            <div className="messages-redesign-module-grid three messages-redesign-connection-grid">
              <article className="messages-redesign-connection-card active">
                <span>Meta oficial</span>
                <strong>Pronto para producao</strong>
                <p>Use esse modo para clientes reais, com webhook e historico no CRM.</p>
              </article>
              <article className="messages-redesign-connection-card">
                <span>Modo simples</span>
                <strong>Assistente guiado</strong>
                <p>Abre o painel sem expor os campos tecnicos logo de cara.</p>
              </article>
              <article className="messages-redesign-connection-card">
                <span>Modo QR</span>
                <strong>Proxima etapa</strong>
                <p>Vai entrar depois como conexao rapida usando esse CRM como espelho.</p>
              </article>
            </div>
            <div className="messages-redesign-module-grid two">
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>Conectores</strong>
                </div>
                <div className="messages-redesign-module-actions stack">
                  <button type="button" className="messages-redesign-detail-btn" onClick={openWhatsappConfig}>Configurar WhatsApp CRM</button>
                  <button type="button" className="messages-redesign-detail-btn" onClick={startWhatsappOfficialConnect}>Conectar WhatsApp</button>
                  <button type="button" className="messages-redesign-detail-btn" onClick={openAiControl}>Controle da IA</button>
                  <button type="button" className="messages-redesign-detail-btn" onClick={openCrmSupport}>Suporte do CRM</button>
                  <button type="button" className="messages-redesign-detail-btn" onClick={toggleThemeMode}>Alternar modo {isDarkMode ? "claro" : "noturno"}</button>
                </div>
                {whatsappConfigFeedback ? (
                  <div className="messages-redesign-detail-note">{whatsappConfigFeedback}</div>
                ) : null}
              </section>
              <section className="messages-redesign-module-card">
                <div className="messages-redesign-module-card-head">
                  <strong>Status atual</strong>
                </div>
                <div className="messages-redesign-module-list">
                  <div className="messages-redesign-module-statline"><strong>WhatsApp configurado</strong><span>{whatsappStatus?.configured ? "Sim" : "Nao"}</span></div>
                  <div className="messages-redesign-module-statline"><strong>Webhook pronto</strong><span>{whatsappStatus?.configured && whatsappConfig?.verifyToken && whatsappStatus?.webhookUrl ? "Sim" : "Nao"}</span></div>
                  <div className="messages-redesign-module-statline"><strong>Ultimo webhook recebido</strong><span>{whatsappStatus?.lastWebhookAt ? formatThreadMessageTime(whatsappStatus.lastWebhookAt) : "Aguardando primeiro evento"}</span></div>
                  <div className="messages-redesign-module-statline"><strong>IA ativa</strong><span>{aiControl?.enabled ? "Sim" : "Nao"}</span></div>
                </div>
              </section>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className={isDarkMode ? "messages-redesign-shell dark-mode" : "messages-redesign-shell"}>
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

        </aside>

        <section className="messages-redesign-panel">
          <header className="messages-redesign-topbar">
            <div className="messages-redesign-topbar-left">
              <button
                type="button"
                className={activeMenuId === "home" ? "messages-redesign-topbar-btn active" : "messages-redesign-topbar-btn"}
                aria-label="Home"
                onClick={() => focusSearchAndMenu("home")}
              >
                <HomeIcon />
              </button>
              <button
                type="button"
                className={activeMenuId === "chat" ? "messages-redesign-topbar-btn active" : "messages-redesign-topbar-btn"}
                aria-label="Conversas"
                onClick={() => focusSearchAndMenu("chat")}
              >
                <ChatIcon />
              </button>
              <button
                type="button"
                className={activeMenuId === "contacts" ? "messages-redesign-topbar-btn active" : "messages-redesign-topbar-btn"}
                aria-label="Contatos"
                onClick={() => focusSearchAndMenu("contacts")}
              >
                <ContactsIcon />
              </button>
              <button
                type="button"
                className={activeMenuId === "ai" ? "messages-redesign-topbar-btn active" : "messages-redesign-topbar-btn"}
                aria-label="IA"
                onClick={() => focusSearchAndMenu("ai")}
              >
                <AIIcon />
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
              <button
                type="button"
                className="messages-redesign-topbar-btn"
                aria-label="Suporte do CRM"
                title="Suporte do CRM"
                onClick={openCrmSupport}
              >
                <PhoneIcon />
              </button>
            </div>

            <div className="messages-redesign-topbar-right">
              <strong>OnCenterChat</strong>
              <button
                type="button"
                className={isDarkMode ? "messages-redesign-topbar-btn active" : "messages-redesign-topbar-btn"}
                aria-label="Modo"
                onClick={toggleThemeMode}
              >
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

          {activeMenuId !== "chat" ? (
            renderModuleWorkspace()
          ) : (
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
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Pesquisar"
                  />
                </label>
                <button
                  type="button"
                  className={isOwnerFilterOpen || ownerFilter ? "messages-redesign-mini-btn active" : "messages-redesign-mini-btn"}
                  aria-label="Atendentes"
                  onClick={toggleOwnerFilterPanel}
                >
                  <ContactsIcon />
                </button>
                <button
                  type="button"
                  className={isAdvancedFilterOpen || channelFilter || onlyUnread ? "messages-redesign-mini-btn active" : "messages-redesign-mini-btn"}
                  aria-label="Filtrar"
                  onClick={toggleAdvancedFilterPanel}
                >
                  <SettingsIcon />
                </button>
              </div>

              {isOwnerFilterOpen ? (
                <div className="messages-redesign-filter-bar">
                  <strong>Atendentes</strong>
                  <div className="messages-redesign-filter-chips">
                    <button
                      type="button"
                      className={!ownerFilter ? "messages-redesign-filter-chip active" : "messages-redesign-filter-chip"}
                      onClick={() => setOwnerFilter("")}
                    >
                      Todos
                    </button>
                    {ownerOptions.map((owner) => (
                      <button
                        key={owner}
                        type="button"
                        className={ownerFilter === owner ? "messages-redesign-filter-chip active" : "messages-redesign-filter-chip"}
                        onClick={() => setOwnerFilter(owner)}
                      >
                        {owner}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {isAdvancedFilterOpen ? (
                <div className="messages-redesign-filter-bar">
                  <strong>Filtros</strong>
                  <div className="messages-redesign-filter-chips">
                    <button
                      type="button"
                      className={!channelFilter ? "messages-redesign-filter-chip active" : "messages-redesign-filter-chip"}
                      onClick={() => setChannelFilter("")}
                    >
                      Todos os canais
                    </button>
                    {channelOptions.map((channel) => (
                      <button
                        key={channel}
                        type="button"
                        className={channelFilter === channel ? "messages-redesign-filter-chip active" : "messages-redesign-filter-chip"}
                        onClick={() => setChannelFilter(channel)}
                      >
                        {channel}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={onlyUnread ? "messages-redesign-filter-chip active" : "messages-redesign-filter-chip"}
                      onClick={() => setOnlyUnread((current) => !current)}
                    >
                      So nao lidas
                    </button>
                    <button
                      type="button"
                      className="messages-redesign-filter-chip"
                      onClick={clearThreadFilters}
                    >
                      Limpar filtros
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="messages-redesign-list-header">
                <strong>Atendimentos</strong>
                <span className="messages-redesign-list-subtitle">
                  {isWorkspaceLoading ? "Carregando..." : `${visibleThreads.length} conversa(s)`}
                </span>
                <button
                  type="button"
                  className="messages-redesign-detail-btn"
                  style={{ marginLeft: "auto", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                  onClick={() => { setIsNewConvOpen(true); setNewConvError(""); }}
                  title="Iniciar nova conversa"
                >
                  + Nova
                </button>
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
                      <button
                        type="button"
                        className="messages-redesign-chat-btn"
                        aria-label="Historico"
                        onClick={openConversationHistory}
                      >
                        <ClockIcon />
                      </button>
                      <button
                        type="button"
                        className="messages-redesign-chat-btn"
                        aria-label="Email"
                        onClick={openConversationEmail}
                      >
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
                    <button
                      type="button"
                      className={isConversationMarked ? "messages-redesign-checkbox active" : "messages-redesign-checkbox"}
                      aria-label="Selecionar conversa"
                      onClick={toggleConversationSelection}
                    />
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
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        className="messages-redesign-hidden-input"
                        onChange={handleAttachmentChange}
                      />
                      <button
                        type="button"
                        className={selectedAttachmentName ? "messages-redesign-composer-btn active" : "messages-redesign-composer-btn"}
                        aria-label="Anexo"
                        onClick={triggerAttachmentPicker}
                      >
                        <PaperclipIcon />
                      </button>
                      <button
                        type="button"
                        className={isRecordingAudio || recordedAudioUrl ? "messages-redesign-composer-btn active" : "messages-redesign-composer-btn"}
                        aria-label="Audio"
                        onClick={toggleAudioRecording}
                      >
                        <MicIcon />
                      </button>
                      <button type="button" className="messages-redesign-send-btn" onClick={handleSendMessage} disabled={isSubmitting}>
                        <SendPlaneIcon />
                      </button>
                    </div>
                  </div>
                  {selectedAttachmentName || recordedAudioUrl ? (
                    <div className="messages-redesign-composer-assets">
                      {selectedAttachmentName ? (
                        <span className="messages-redesign-asset-pill">
                          Anexo: {selectedAttachmentName}
                        </span>
                      ) : null}
                      {recordedAudioUrl ? (
                        <div className="messages-redesign-audio-preview">
                          <audio controls src={recordedAudioUrl} />
                          <button
                            type="button"
                            className="messages-redesign-detail-btn"
                            onClick={removeRecordedAudio}
                          >
                            Remover audio
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
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
                        Abrir pet
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
                      <strong>IA Agenda</strong>
                      <span>{isAiBathLoading ? "Processando" : "Proposta assistida"}</span>
                    </div>
                    <div className="messages-redesign-detail-form">
                      <label>
                        <span>Tipo de agenda</span>
                        <select
                          value={aiBathDraft.agendaType}
                          onChange={(event) =>
                            setAiBathDraft((current) => ({
                              ...current,
                              agendaType: event.target.value,
                            }))
                          }
                        >
                          <option value="estetica">Estética</option>
                          <option value="clinica">Clínica</option>
                          <option value="internacao">Internação</option>
                        </select>
                      </label>
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
                          placeholder={getAgendaTypeServicePlaceholder(aiBathDraft.agendaType)}
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
                        Agenda: {formatAgendaTypeLabel(aiBathResult.appointment?.type || aiBathDraft.agendaType)}
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
          )}
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
      <MessagesSetupWizard
        open={isSetupWizardOpen}
        whatsappStatus={whatsappStatus}
        pendingPhones={pendingOauthPhones}
        isOauthConnecting={isOauthConnecting}
        isWhatsappSaving={isWhatsappConfigSaving}
        canUseCrmAi={canUseCrmAi}
        crmAiPlan={crmAiSubscription?.plan || null}
        crmAiStatusLabel={crmAiStatusLabel}
        isCrmAiCheckoutLoading={isCrmAiCheckoutLoading}
        aiControl={aiControl}
        onClose={() => setIsSetupWizardOpen(false)}
        onConnectWhatsapp={handleOAuthConnect}
        onSelectPhone={handleOAuthSelectPhone}
        onBuyCrmAi={startCrmAiSubscriptionCheckout}
        onOpenAiControl={openAiControl}
        onOpenWhatsappConfig={openWhatsappConfig}
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
        pendingPhones={pendingOauthPhones}
        isOauthConnecting={isOauthConnecting}
        oauthOnlyMode
        apiRequest={apiRequest}
        auth={auth}
        onClose={() => setIsWhatsappConfigOpen(false)}
        onSave={saveWhatsappConfig}
        onTest={testWhatsappConfig}
        onOAuthConnect={handleOAuthConnect}
        onSelectPhone={handleOAuthSelectPhone}
        onDisconnect={handleOAuthDisconnect}
        onActivateSimpleMode={activateSimpleWhatsappMode}
      />
      {isHistoryOpen ? (
        <div className="messages-ai-control-overlay" onClick={() => setIsHistoryOpen(false)}>
          <div
            className="messages-ai-control-modal messages-history-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="messages-ai-control-head">
              <div>
                <span>Historico do cliente</span>
                <h2>{selectedCustomer?.name || selectedThread?.customerName || selectedThread?.name || "Cliente"}</h2>
              </div>
              <button
                type="button"
                className="messages-ai-control-close"
                onClick={() => setIsHistoryOpen(false)}
              >
                Fechar
              </button>
            </div>

            <div className="messages-history-summary">
              <article>
                <span>Pet</span>
                <strong>{selectedPet?.name || selectedThread?.petName || "Nao vinculado"}</strong>
              </article>
              <article>
                <span>Telefone</span>
                <strong>{formatPhoneDisplay(selectedCustomer?.phone || selectedThread?.phone)}</strong>
              </article>
              <article>
                <span>Email</span>
                <strong>{selectedCustomer?.email || "Nao informado"}</strong>
              </article>
            </div>

            <div className="messages-history-actions">
              <button type="button" className="messages-redesign-detail-btn" onClick={openCustomerRegister}>
                Abrir tutor
              </button>
              <button type="button" className="messages-redesign-detail-btn" onClick={openPetRegister}>
                Abrir pet
              </button>
            </div>

            <div className="messages-history-list">
              {isAppointmentsLoading ? (
                <div className="messages-redesign-detail-note">Carregando historico...</div>
              ) : customerAppointments.length ? (
                customerAppointments.map((appointment) => (
                  <article key={appointment.id} className="messages-history-item">
                    <strong>{formatAppointmentOptionLabel(appointment)}</strong>
                    <span>{formatConversationStatusLabel(appointment?.status)}</span>
                  </article>
                ))
              ) : (
                <div className="messages-redesign-detail-note">
                  Nenhum agendamento encontrado para este tutor.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isNewConvOpen ? (
        <div className="messages-ai-control-overlay" onClick={() => setIsNewConvOpen(false)}>
          <div
            className="messages-ai-control-modal"
            style={{ maxWidth: "440px" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="messages-ai-control-head">
              <div>
                <span>Atendimento proativo</span>
                <h2>Iniciar nova conversa</h2>
              </div>
              <button type="button" className="messages-ai-control-close" onClick={() => setIsNewConvOpen(false)}>Fechar</button>
            </div>

            <div className="messages-redesign-module-form" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Telefone (obrigatorio)</span>
                <input
                  type="tel"
                  value={newConvPhone}
                  onChange={(event) => { setNewConvPhone(event.target.value); setNewConvError(""); }}
                  placeholder="(11) 99999-9999"
                  style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Nome do contato (opcional)</span>
                <input
                  type="text"
                  value={newConvName}
                  onChange={(event) => setNewConvName(event.target.value)}
                  placeholder="Ex: Maria Silva"
                  style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem" }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Mensagem inicial (opcional)</span>
                <textarea
                  value={newConvMessage}
                  onChange={(event) => setNewConvMessage(event.target.value)}
                  placeholder="Ola! Tudo bem?..."
                  rows={3}
                  style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.9rem", resize: "vertical" }}
                />
              </label>

              {newConvError ? (
                <div style={{ color: "#ef4444", fontSize: "0.8rem" }}>{newConvError}</div>
              ) : null}

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                <button type="button" className="messages-redesign-detail-btn" onClick={() => setIsNewConvOpen(false)}>Cancelar</button>
                <button
                  type="button"
                  className="messages-redesign-detail-btn primary"
                  disabled={isNewConvSubmitting || !newConvPhone.trim()}
                  onClick={startNewConversation}
                >
                  {isNewConvSubmitting ? "Iniciando..." : "Iniciar conversa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
