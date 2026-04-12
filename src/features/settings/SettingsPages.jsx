import { EditableField, EditableSelectField, EditableTextArea, Field } from "../../components/fields.jsx";
import { SettingsShell } from "./SettingsShell.jsx";

const backgroundScopeOptions = [
  { value: "all", label: "Sistema inteiro" },
  { value: "dashboard", label: "Dashboard" },
  { value: "agenda", label: "Agenda" },
  { value: "financeiro", label: "Financeiro" },
  { value: "crm", label: "CRM" },
  { value: "cadastros", label: "Cadastros" },
  { value: "viacentral", label: "ViaCentral" },
  { value: "pesquisa", label: "Pesquisa" },
  { value: "configuracao", label: "Configuração" },
  { value: "admin", label: "Admin" },
];

export function SettingsProfilePageView({
  settings,
  feedback,
  saving,
  renewingPlan,
  onSelectTheme,
  onLogoChange,
  onRemoveLogo,
  onBackgroundLogoChange,
  onRemoveBackgroundLogo,
  onBackgroundOpacityChange,
  onBackgroundScopeChange,
  onSignatureChange,
  onRemoveSignature,
  onRenewPlan,
  saveProfileSettings,
}) {
  const colorOptions = [
    "#7ad93a",
    "#587de1",
    "#9fb6ea",
    "#48c4d0",
    "#7fd9b4",
    "#53c047",
    "#ffe066",
    "#ffb870",
    "#ff7f73",
    "#ef2028",
    "#ca9aea",
    "#d1d1d1",
    "#7e2e2e",
    "#417fe5",
    "#7d4e8f",
    "#be443f",
    "#cf8558",
    "#e54b9c",
    "#60b4df",
    "#12748d",
  ];

  return (
    <SettingsShell activeTab="Perfil">
      <div className="settings-stack">
        <section className="settings-card">
          {feedback ? <div className="registers-feedback">{feedback}</div> : null}
          <div className="settings-color-line">
            <span>Cor selecionada:</span>
            <div className="settings-selected-swatch" style={{ background: settings?.theme || "#ca9aea" }} />
          </div>
          <div className="settings-color-grid">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                className={`settings-color-swatch ${settings?.theme === color ? "is-active" : ""}`}
                style={{ background: color }}
                onClick={() => onSelectTheme?.(color)}
                aria-label={`Selecionar cor ${color}`}
              />
            ))}
          </div>
          <label className="settings-checkline">
            <span className="person-box" />
            <span>Tema escuro</span>
          </label>
          <div className="settings-footer">
            <button className="soft-btn" onClick={saveProfileSettings}>
              {saving ? "Salvando..." : "Salvar cor"}
            </button>
          </div>
        </section>

        <section className="settings-card settings-inline-card settings-logo-card">
          <div>
            <strong>Logo da página principal</strong>
            <p className="settings-help-text">
              Envie uma imagem para substituir o nome ViaPet no topo da página principal.
            </p>
            {settings?.logoUrl ? (
              <div className="settings-logo-preview-wrap">
                <img className="settings-logo-preview" src={settings.logoUrl} alt="Logo da página principal" />
              </div>
            ) : (
              <div className="settings-logo-placeholder">Nenhuma imagem selecionada</div>
            )}
          </div>
          <div className="settings-logo-actions">
            <label className="soft-btn settings-upload-btn">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => onLogoChange?.(event.target.files?.[0] || null)}
                hidden
              />
              Incluir imagem
            </label>
            {settings?.logoUrl ? (
              <button className="soft-btn soft-btn-danger" onClick={onRemoveLogo}>
                Remover imagem
              </button>
            ) : null}
            <button className="soft-btn" onClick={saveProfileSettings}>
              {saving ? "Salvando..." : "Salvar logo"}
            </button>
          </div>
        </section>

        <section className="settings-card settings-inline-card settings-logo-card">
          <div>
            <strong>Logo de fundo das páginas</strong>
            <p className="settings-help-text">
              Use o logo do negócio como marca d'água suave no sistema.
            </p>
            {settings?.backgroundLogoUrl ? (
              <div className="settings-logo-preview-wrap">
                <img className="settings-logo-preview" src={settings.backgroundLogoUrl} alt="Logo de fundo" />
              </div>
            ) : (
              <div className="settings-logo-placeholder">Nenhuma marca d'água selecionada</div>
            )}
            <div className="settings-form-row settings-form-row-compact">
              <div className="field-block">
                <label>Aplicar em</label>
                <div className="settings-scope-grid">
                  {backgroundScopeOptions.map((option) => {
                    const selectedScopes = Array.isArray(settings?.backgroundLogoScope)
                      ? settings.backgroundLogoScope
                      : [settings?.backgroundLogoScope || "all"];
                    const isActive = selectedScopes.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={isActive ? "settings-scope-chip is-active" : "settings-scope-chip"}
                        onClick={() => onBackgroundScopeChange?.(option.value)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <EditableField
                label="Transparência"
                value={settings?.backgroundLogoOpacity || "0.08"}
                onChange={(value) => onBackgroundOpacityChange?.(value)}
              />
            </div>
          </div>
          <div className="settings-logo-actions">
            <label className="soft-btn settings-upload-btn">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => onBackgroundLogoChange?.(event.target.files?.[0] || null)}
                hidden
              />
              Incluir marca d'água
            </label>
            {settings?.backgroundLogoUrl ? (
              <button className="soft-btn soft-btn-danger" onClick={onRemoveBackgroundLogo}>
                Remover marca d'água
              </button>
            ) : null}
            <button className="soft-btn" onClick={saveProfileSettings}>
              {saving ? "Salvando..." : "Salvar marca d'água"}
            </button>
          </div>
        </section>

        <section className="settings-card settings-inline-card settings-logo-card">
          <div>
            <strong>Assinatura nas receitas</strong>
            <p className="settings-help-text">
              Envie a imagem da assinatura que será usada nas receitas e documentos.
            </p>
            {settings?.signatureImageUrl ? (
              <div className="settings-logo-preview-wrap">
                <img className="settings-logo-preview" src={settings.signatureImageUrl} alt="Assinatura nas receitas" />
              </div>
            ) : (
              <div className="settings-logo-placeholder">Nenhuma assinatura selecionada</div>
            )}
          </div>
          <div className="settings-logo-actions">
            <label className="soft-btn settings-upload-btn">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => onSignatureChange?.(event.target.files?.[0] || null)}
                hidden
              />
              Adicionar assinatura
            </label>
            {settings?.signatureImageUrl ? (
              <button className="soft-btn soft-btn-danger" onClick={onRemoveSignature}>
                Remover assinatura
              </button>
            ) : null}
            <button className="soft-btn" onClick={saveProfileSettings}>
              {saving ? "Salvando..." : "Salvar assinatura"}
            </button>
          </div>
        </section>

        <section className="settings-card settings-inline-card">
          <div>
            <strong>Validade do ViaPet</strong>
            <p className="settings-validity">
              Validade do ViaPet: {settings?.expirationDate ? new Date(settings.expirationDate).toLocaleDateString("pt-BR") : "Sem data"}
            </p>
          </div>
          <button className="soft-btn" onClick={onRenewPlan}>
            {renewingPlan ? "Renovando..." : "Renovar"}
          </button>
        </section>
      </div>
    </SettingsShell>
  );
}

export function SettingsAgendaPageView({
  settings,
  feedback,
  saving,
  statusOptions,
  workingDaysPreset,
  onWorkingDaysPresetChange,
  onIntervalClinicChange,
  onIntervalAestheticsChange,
  onStatusLabelChange,
  saveAgendaSettings,
}) {
  return (
    <SettingsShell activeTab="Agenda">
      <div className="settings-stack">
        {feedback ? <div className="registers-feedback">{feedback}</div> : null}
        <div className="settings-form-row settings-form-row-compact">
          <EditableSelectField
            label="Dias Trabalhados"
            value={workingDaysPreset}
            onChange={onWorkingDaysPresetChange}
            options={[
              { value: "all", label: "Todos os dias" },
              { value: "monday-friday", label: "Segunda a Sexta" },
              { value: "monday-saturday", label: "Segunda a Sábado" },
              { value: "tuesday-saturday", label: "Terça a Sábado" },
            ]}
          />
        </div>

        <div className="settings-form-row">
          <EditableSelectField
            label="Eventos Estética"
            value={String(settings?.intervalAesthetics || 60)}
            onChange={onIntervalAestheticsChange}
            options={[
              { value: "60", label: "A cada 1 hora" },
              { value: "30", label: "A cada 30 min" },
              { value: "20", label: "A cada 20 min" },
              { value: "15", label: "A cada 15 min" },
              { value: "10", label: "A cada 10 min" },
            ]}
          />
          <EditableSelectField
            label="Eventos Clínica"
            value={String(settings?.intervalClinic || 60)}
            onChange={onIntervalClinicChange}
            options={[
              { value: "60", label: "A cada 1 hora" },
              { value: "30", label: "A cada 30 min" },
              { value: "20", label: "A cada 20 min" },
              { value: "15", label: "A cada 15 min" },
              { value: "10", label: "A cada 10 min" },
            ]}
          />
        </div>

        <section className="settings-card">
          <strong>Etiquetas de Situação</strong>
          <div className="settings-status-grid">
            {statusOptions.map((status) => (
              <div key={status.key} className="settings-status-row">
                <span className="settings-check-fill">OK</span>
                <div className="settings-status-edit">
                  <span className="settings-status-pill" style={{ background: status.background, color: status.color }}>
                    {status.label}
                  </span>
                  <EditableField
                    label="Nome da etiqueta"
                    value={status.label}
                    onChange={(value) => onStatusLabelChange?.(status.key, value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="settings-footer">
            <button className="soft-btn" onClick={saveAgendaSettings}>
              {saving ? "Salvando..." : "Salvar agenda"}
            </button>
          </div>
        </section>
      </div>
    </SettingsShell>
  );
}

export function SettingsAccountPageView({
  accountSettings,
  setAccountSettings,
  saveAccountSettings,
  feedback,
  saving,
  renewingPlan,
  onRenewPlan,
  onElectronicSignatureChange,
  onRemoveElectronicSignature,
}) {
  return (
    <SettingsShell activeTab="Conta">
      <div className="settings-stack">
        <div className="settings-account-row">
          <div className="settings-account-grow">
            <EditableField
              label="Titular/Estabelecimento"
              value={accountSettings.establishmentName}
              onChange={(value) => setAccountSettings((current) => ({ ...current, establishmentName: value }))}
            />
          </div>
          <button className="soft-btn" onClick={saveAccountSettings}>{saving ? "Salvando..." : "Salvar"}</button>
        </div>

        <div className="settings-form-row settings-form-row-compact">
          <EditableField
            label="Nomenclatura"
            value={accountSettings.naming}
            onChange={(value) => setAccountSettings((current) => ({ ...current, naming: value }))}
          />
        </div>

        <div className="settings-form-row">
          <EditableField
            label="Email de Contato"
            value={accountSettings.contactEmail}
            onChange={(value) => setAccountSettings((current) => ({ ...current, contactEmail: value }))}
          />
          <EditableField
            label="Telefone de Contato"
            value={accountSettings.contactPhone}
            onChange={(value) => setAccountSettings((current) => ({ ...current, contactPhone: value }))}
          />
        </div>

        <div className="settings-form-row settings-form-row-compact">
          <EditableField
            label="WhatsApp número de acesso CRM"
            value={accountSettings.crmAccessWhatsapp}
            onChange={(value) => setAccountSettings((current) => ({ ...current, crmAccessWhatsapp: value }))}
          />
        </div>

        <section className="settings-card">
          <strong>WhatsApp para Lista do Motorista</strong>
          <p className="settings-help-text">Cadastre um número por linha. Exemplo: 5511999999999</p>
          <EditableTextArea
            label="Números de destino"
            value={accountSettings.driverWhatsappRecipients}
            onChange={(value) => setAccountSettings((current) => ({ ...current, driverWhatsappRecipients: value }))}
            placeholder={"5511999999999\n5511988887777"}
          />
          {feedback ? <div className="registers-feedback">{feedback}</div> : null}
          <div className="settings-footer">
            <button className="soft-btn" onClick={saveAccountSettings}>{saving ? "Salvando..." : "Salvar números"}</button>
          </div>
        </section>

        <section className="settings-card settings-inline-card settings-logo-card">
          <div>
            <strong>Assinatura eletrônica</strong>
            <p className="settings-help-text">
              Use este campo para a assinatura do veterinário ou do responsável. Ela aparecerá no rodapé da impressão.
            </p>
            {accountSettings?.electronicSignatureUrl ? (
              <div className="settings-logo-preview-wrap">
                <img className="settings-logo-preview" src={accountSettings.electronicSignatureUrl} alt="Assinatura eletrônica" />
              </div>
            ) : (
              <div className="settings-logo-placeholder">Nenhuma assinatura eletrônica selecionada</div>
            )}
            <EditableField
              label="Nome"
              value={accountSettings.electronicSignatureName}
              onChange={(value) => setAccountSettings((current) => ({ ...current, electronicSignatureName: value }))}
            />
          </div>
          <div className="settings-logo-actions">
            <label className="soft-btn settings-upload-btn">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => onElectronicSignatureChange?.(event.target.files?.[0] || null)}
                hidden
              />
              Incluir assinatura
            </label>
            {accountSettings?.electronicSignatureUrl ? (
              <button className="soft-btn soft-btn-danger" onClick={onRemoveElectronicSignature}>
                Remover assinatura
              </button>
            ) : null}
            <button className="soft-btn" onClick={saveAccountSettings}>
              {saving ? "Salvando..." : "Salvar assinatura"}
            </button>
          </div>
        </section>

        <section className="settings-card settings-inline-card settings-account-card">
          <div>
            <strong>Validade do ViaPet</strong>
            <p className="settings-validity">
              Válido até:{" "}
              {accountSettings?.expirationDate
                ? new Date(accountSettings.expirationDate).toLocaleDateString("pt-BR")
                : "Sem data"}
            </p>
          </div>
          <div className="settings-account-actions">
            <button className="soft-btn" onClick={onRenewPlan}>{renewingPlan ? "Renovando..." : "Renovar"}</button>
            <span>Ver Termos do Contrato</span>
          </div>
        </section>
      </div>
    </SettingsShell>
  );
}

export function SettingsTaxesPageView({ accountSettings, setAccountSettings, saveAccountSettings, feedback }) {
  return (
    <SettingsShell activeTab="Taxas">
      <div className="settings-stack">
        {feedback ? <div className="registers-feedback">{feedback}</div> : null}
        <section className="settings-card">
          <strong>Taxas de pagamento</strong>
          <p className="settings-help-text">
            Configure aqui as taxas globais do banco ou da maquininha. Essas taxas serão usadas
            automaticamente na agenda, no PDV, no financeiro e no ViaCentral.
          </p>

          <div className="settings-form-row settings-form-row-compact">
            <EditableField
              label="Banco / operadora"
              value={accountSettings.bankName}
              onChange={(value) => setAccountSettings((current) => ({ ...current, bankName: value }))}
            />
          </div>

          <div className="settings-form-row settings-form-row-compact">
            <EditableField
              label="Taxa Débito (%)"
              value={accountSettings.debitFee}
              onChange={(value) => setAccountSettings((current) => ({ ...current, debitFee: value }))}
            />
            <EditableField
              label="Taxa Crédito (%)"
              value={accountSettings.creditFee}
              onChange={(value) => setAccountSettings((current) => ({ ...current, creditFee: value }))}
            />
          </div>

          <div className="settings-form-row settings-form-row-compact">
            <EditableField
              label="Taxa Crédito parcelado (%)"
              value={accountSettings.installmentFee}
              onChange={(value) => setAccountSettings((current) => ({ ...current, installmentFee: value }))}
            />
            <EditableField
              label="Taxa Pix (%)"
              value={accountSettings.pixFee}
              onChange={(value) => setAccountSettings((current) => ({ ...current, pixFee: value }))}
            />
          </div>

          <div className="settings-form-row settings-form-row-compact">
            <EditableField
              label="Taxa Pix pela maquina (%)"
              value={accountSettings.pixMachineFee}
              onChange={(value) => setAccountSettings((current) => ({ ...current, pixMachineFee: value }))}
            />
            <EditableField
              label="Taxa Dinheiro (%)"
              value={accountSettings.cashFee}
              onChange={(value) => setAccountSettings((current) => ({ ...current, cashFee: value }))}
            />
          </div>

          <div className="settings-footer">
            <button className="soft-btn" onClick={saveAccountSettings}>Salvar taxas</button>
          </div>
        </section>
      </div>
    </SettingsShell>
  );
}

export function SettingsResourcesPageView({ feedback, resourceItems, selected, toggleResource, saveResources }) {
  return (
    <SettingsShell activeTab="Recursos">
      <section className="settings-card settings-resource-card">
        {feedback ? <div className="registers-feedback">{feedback}</div> : null}
        <h3>Marque os recursos que deseja utilizar</h3>
        <div className="settings-resource-list">
          {resourceItems.map((item) => (
            <label key={item.key} className="settings-checkline settings-checkline-large">
              <input type="checkbox" checked={selected.includes(item.key)} onChange={() => toggleResource(item.key)} />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
        <div className="settings-footer">
          <button className="soft-btn" onClick={saveResources}>Salvar</button>
        </div>
      </section>
    </SettingsShell>
  );
}

export function SettingsPrintPageView({ feedback, printSettings, setPrintSettings, savePrintSettings }) {
  const printOptionItems = [
    {
      key: "useCompact",
      title: "Layout compacto",
      description: "Deixa a folha mais enxuta, ocupando menos espaço na impressão.",
    },
    {
      key: "showHeader",
      title: "Cabeçalho",
      description: "Mostra o topo do documento com identificação principal antes da lista impressa.",
    },
    {
      key: "showFooter",
      title: "Rodapé",
      description: "Mostra a parte final do documento com observações e fechamento da impressão.",
    },
  ];

  return (
    <SettingsShell activeTab="Impressão">
      <div className="settings-stack">
        {feedback ? <div className="registers-feedback">{feedback}</div> : null}
        <section className="settings-card">
          <EditableField
            label="Impressora padrão"
            value={printSettings.printerName}
            onChange={(value) => setPrintSettings((current) => ({ ...current, printerName: value }))}
          />
          <EditableSelectField
            label="Tamanho do papel"
            value={printSettings.paperSize}
            onChange={(value) => setPrintSettings((current) => ({ ...current, paperSize: value }))}
            options={[
              { value: "A4", label: "A4" },
              { value: "80mm", label: "Térmica 80mm" },
              { value: "58mm", label: "Térmica 58mm" },
            ]}
          />
        </section>

        <section className="settings-card settings-resource-card">
          <h3>Opções de impressão</h3>
          <div className="settings-print-list">
            {printOptionItems.map((item) => {
              const isActive = Boolean(printSettings?.[item.key]);
              return (
                <div key={item.key} className="settings-print-row">
                  <div className="settings-print-copy">
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  <button
                    type="button"
                    className={isActive ? "soft-btn settings-print-toggle is-active" : "soft-btn settings-print-toggle"}
                    onClick={() =>
                      setPrintSettings((current) => ({
                        ...current,
                        [item.key]: !current?.[item.key],
                      }))
                    }
                  >
                    {isActive ? "Mostrar" : "Ocultar"}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="settings-footer">
            <button className="soft-btn" onClick={savePrintSettings}>Salvar</button>
          </div>
        </section>
      </div>
    </SettingsShell>
  );
}
