import { MessagesWorkspacePage } from "./MessagesWorkspacePage.jsx";

export default function MessagesRoutePage({
  auth,
  apiRequest,
  isDemo = false,
}) {
  return (
    <MessagesWorkspacePage
      auth={auth}
      apiRequest={apiRequest}
      isDemo={isDemo}
    />
  );
}
