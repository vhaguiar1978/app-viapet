import { NavLink, useNavigate } from "react-router-dom";

export function SettingsShell({ activeTab, children }) {
  const navigate = useNavigate();
  const tabs = [
    { label: "Perfil", path: "/configuracao" },
    { label: "Recursos", path: "/configuracao/recursos" },
    { label: "Agenda", path: "/configuracao/agenda" },
    { label: "Taxas", path: "/configuracao/taxas" },
    { label: "Impressão", path: "/configuracao/impressao" },
    { label: "Conta", path: "/configuracao/conta" },
  ];

  return (
    <div className="settings-page">
      <section className="settings-modal">
        <div className="settings-head">
          <h1>Configurar</h1>
        </div>

        <div className="settings-tabs">
          {tabs.map((tab) => (
            <NavLink key={tab.path} to={tab.path} className={tab.label === activeTab ? "settings-tab active" : "settings-tab"}>
              {tab.label}
            </NavLink>
          ))}
        </div>

        <div className="settings-body">{children}</div>

        <div className="settings-footer">
          <button className="footer-btn footer-btn-green" onClick={() => navigate("/dashboard")}>Fechar</button>
        </div>
      </section>
    </div>
  );
}
