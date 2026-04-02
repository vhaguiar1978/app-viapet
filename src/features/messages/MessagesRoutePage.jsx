import { MessagesWorkspacePage } from "./MessagesWorkspacePage.jsx";

export default function MessagesRoutePage({
  auth,
  apiRequest,
  isDemo = false,
  supportWhatsapp = "",
}) {
  return (
    <MessagesWorkspacePage
      auth={auth}
      apiRequest={apiRequest}
      isDemo={isDemo}
      supportWhatsapp={supportWhatsapp}
    />
  );
}
