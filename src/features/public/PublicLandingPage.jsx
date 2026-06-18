import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./publicLanding.css";

const STATUS_LABELS = {
  beta: "Beta",
  soon: "Em breve",
};

function formatPrice(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function planLink(planId, intent) {
  return `/cadastro?plan=${encodeURIComponent(planId)}&intent=${intent}`;
}

function FeatureMark({ feature, compact = false }) {
  const available = feature?.included === true && feature?.status !== "soon";
  return (
    <span
      className={[
        "public-feature-mark",
        available ? "is-included" : "is-unavailable",
        compact ? "is-compact" : "",
      ].join(" ")}
      aria-label={available ? "Incluído" : "Não incluído"}
    >
      {available ? "✓" : "—"}
    </span>
  );
}

export default function PublicLandingPage({ apiRequest }) {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    document.title = "ViaPet | Gestão completa para negócios pet";

    apiRequest("/api/subscriptions/plans")
      .then((response) => {
        if (!active) return;
        setCatalog(response?.data || response);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setError("Não foi possível carregar os planos agora. Tente novamente em instantes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [apiRequest]);

  const plans = useMemo(
    () => (Array.isArray(catalog?.plans) ? catalog.plans.filter((plan) => plan.active !== false) : []),
    [catalog],
  );

  const featureRows = useMemo(() => {
    const rows = new Map();
    plans.forEach((plan) => {
      (plan.features || []).forEach((feature) => {
        if (!rows.has(feature.key)) {
          rows.set(feature.key, { key: feature.key, label: feature.label });
        }
      });
    });
    return [...rows.values()];
  }, [plans]);

  const trialDays = Number(catalog?.trialDays || 30);

  return (
    <main className="public-site">
      <header className="public-header">
        <div className="public-container public-nav">
          <Link className="public-brand" to="/" aria-label="ViaPet - início">
            <img src="/viapet-logo.svg" alt="" />
            <span>ViaPet</span>
          </Link>
          <button
            type="button"
            className="public-menu-button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-expanded={mobileMenuOpen}
            aria-label="Abrir menu"
          >
            <span />
            <span />
            <span />
          </button>
          <nav className={mobileMenuOpen ? "public-links is-open" : "public-links"}>
            <a href="#recursos" onClick={() => setMobileMenuOpen(false)}>Recursos</a>
            <a href="#planos" onClick={() => setMobileMenuOpen(false)}>Planos</a>
            <a href="#comparativo" onClick={() => setMobileMenuOpen(false)}>Comparativo</a>
            <Link to="/login">Entrar</Link>
            <Link className="public-nav-cta" to="/cadastro">Começar grátis</Link>
          </nav>
        </div>
      </header>

      <section className="public-hero">
        <div className="public-container public-hero-grid">
          <div className="public-hero-copy">
            <span className="public-eyebrow">Gestão inteligente para negócios pet</span>
            <h1>Mais tempo para cuidar. Mais controle para crescer.</h1>
            <p>
              Agenda, tutores, pets, pacotinhos, financeiro, CRM e automações em uma
              experiência simples para toda a sua equipe.
            </p>
            <div className="public-hero-actions">
              <Link className="public-primary-button" to="/cadastro">
                Começar {trialDays} dias grátis
              </Link>
              <a className="public-secondary-button" href="#planos">Conhecer os planos</a>
            </div>
            <div className="public-trust-row">
              <span>✓ Sem cartão para testar</span>
              <span>✓ Implantação simples</span>
              <span>✓ Cancele quando quiser</span>
            </div>
          </div>
          <div className="public-hero-visual" aria-label="ViaPet organizando a rotina do pet shop">
            <div className="public-dashboard-card">
              <div className="public-dashboard-top">
                <div>
                  <span>Hoje no ViaPet</span>
                  <strong>Sua operação em ordem</strong>
                </div>
                <span className="public-live-pill">Ao vivo</span>
              </div>
              <div className="public-metrics">
                <div><span>Agenda</span><strong>18</strong><small>atendimentos</small></div>
                <div><span>Receita</span><strong>R$ 2,4 mil</strong><small>no dia</small></div>
              </div>
              <div className="public-schedule-preview">
                {[
                  ["09:00", "Mel", "Banho e tosa", "Confirmado"],
                  ["10:30", "Thor", "Consulta", "Aguardando"],
                  ["13:00", "Luna", "Banho", "Confirmado"],
                ].map(([time, pet, service, status]) => (
                  <div key={`${time}-${pet}`}>
                    <span>{time}</span>
                    <span className="public-pet-avatar">🐾</span>
                    <span><strong>{pet}</strong><small>{service}</small></span>
                    <em>{status}</em>
                  </div>
                ))}
              </div>
            </div>
            <div className="public-floating-card public-floating-card-top">
              <span>Próximo horário</span>
              <strong>10:30 • Thor</strong>
            </div>
            <div className="public-floating-card public-floating-card-bottom">
              <span>Resultado do mês</span>
              <strong>+18,4%</strong>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="public-section public-features-section">
        <div className="public-container">
          <div className="public-section-heading">
            <span className="public-eyebrow">Tudo conectado</span>
            <h2>O ViaPet acompanha a rotina inteira do seu negócio</h2>
            <p>Menos planilhas e retrabalho. Mais clareza para atender, vender e decidir.</p>
          </div>
          <div className="public-feature-grid">
            {[
              ["📅", "Agenda rápida", "Visualize o dia, remarque, finalize e acompanhe pagamentos sem perder tempo."],
              ["🐾", "Tutores e pets", "Histórico organizado para sua equipe encontrar tudo em poucos cliques."],
              ["💬", "CRM e WhatsApp", "Centralize conversas, retornos, cobranças e oportunidades de venda."],
              ["💰", "Financeiro simples", "Entradas, saídas, contas, comissões e resultado em uma visão clara."],
              ["📦", "Pacotinhos", "Controle sessões, recorrências, saldo e pagamentos com facilidade."],
              ["✨", "IA e automações", "Ganhe agilidade em mensagens, lembretes e tarefas repetitivas."],
            ].map(([icon, title, text]) => (
              <article key={title}>
                <span className="public-feature-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="public-section public-pricing-section">
        <div className="public-container">
          <div className="public-section-heading">
            <span className="public-eyebrow">Planos para cada fase</span>
            <h2>Escolha o ViaPet que combina com o seu momento</h2>
            <p>Todos os planos começam com {trialDays} dias grátis e podem evoluir com o seu negócio.</p>
          </div>

          {loading ? (
            <div className="public-plans-loading" aria-label="Carregando planos">
              <span />
              <span />
              <span />
            </div>
          ) : null}

          {error ? <div className="public-plans-error">{error}</div> : null}

          {!loading && !error ? (
            <div className="public-pricing-grid">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  className={plan.recommended ? "public-price-card is-recommended" : "public-price-card"}
                >
                  {plan.recommended ? <span className="public-recommended-badge">Mais escolhido</span> : null}
                  <div className="public-price-card-head">
                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>
                  </div>
                  <div className="public-price">
                    <strong>{formatPrice(plan.monthlyPrice)}</strong>
                    <span>por mês</span>
                  </div>
                  {plan.annualPrice ? (
                    <p className="public-annual-price">
                      Anual: <strong>{formatPrice(plan.annualPrice)}</strong>
                    </p>
                  ) : (
                    <p className="public-annual-price is-muted">Plano anual ainda não configurado</p>
                  )}
                  <ul>
                    {(plan.features || []).map((feature) => (
                      <li key={`${plan.id}-${feature.key}`} className={feature.included ? "" : "is-unavailable"}>
                        <FeatureMark feature={feature} />
                        <span>{feature.label}</span>
                        {STATUS_LABELS[feature.status] ? (
                          <em className={`public-status-tag is-${feature.status}`}>
                            {STATUS_LABELS[feature.status]}
                          </em>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <div className="public-plan-actions">
                    <Link className="public-primary-button" to={planLink(plan.id, "trial")}>
                      Começar {trialDays} dias grátis
                    </Link>
                    <Link className="public-secondary-button" to={planLink(plan.id, "choose")}>
                      Escolher este plano
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {catalog?.fiscalMessage ? (
            <div className="public-fiscal-notice">
              <span>🧾</span>
              <strong>{catalog.fiscalMessage}</strong>
            </div>
          ) : null}
        </div>
      </section>

      {!loading && !error && plans.length ? (
        <section id="comparativo" className="public-section public-comparison-section">
          <div className="public-container">
            <div className="public-section-heading">
              <span className="public-eyebrow">Compare com clareza</span>
              <h2>Veja o que está incluído em cada plano</h2>
              <p>Recursos em Beta ou Em breve ficam identificados para você decidir sem surpresas.</p>
            </div>
            <div className="public-comparison-scroll">
              <table className="public-comparison-table">
                <thead>
                  <tr>
                    <th>Recursos</th>
                    {plans.map((plan) => (
                      <th key={`head-${plan.id}`} className={plan.recommended ? "is-recommended" : ""}>
                        <span>{plan.name}</span>
                        <strong>{formatPrice(plan.monthlyPrice)}<small>/mês</small></strong>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureRows.map((row) => (
                    <tr key={row.key}>
                      <th>{row.label}</th>
                      {plans.map((plan) => {
                        const feature = (plan.features || []).find((item) => item.key === row.key);
                        return (
                          <td key={`${row.key}-${plan.id}`}>
                            <FeatureMark feature={feature} compact />
                            {feature && STATUS_LABELS[feature.status] ? (
                              <small className={`public-table-status is-${feature.status}`}>
                                {STATUS_LABELS[feature.status]}
                              </small>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      <section className="public-section public-final-cta">
        <div className="public-container">
          <div>
            <span className="public-eyebrow">Pronto para simplificar?</span>
            <h2>Coloque sua operação no controle em poucos minutos.</h2>
            <p>Teste o ViaPet por {trialDays} dias e escolha o plano ideal depois.</p>
          </div>
          <Link className="public-primary-button" to="/cadastro">
            Começar {trialDays} dias grátis
          </Link>
        </div>
      </section>

      <footer className="public-footer">
        <div className="public-container">
          <Link className="public-brand" to="/">
            <img src="/viapet-logo.svg" alt="" />
            <span>ViaPet</span>
          </Link>
          <p>Gestão simples, profissional e feita para negócios pet.</p>
          <div>
            <Link to="/login">Entrar</Link>
            <Link to="/cadastro">Criar conta</Link>
            <a href="#planos">Planos</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
