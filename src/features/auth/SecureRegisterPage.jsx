import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import "./secureRegister.css";

const STATUS = { EMAIL: "aguardando_confirmacao_email", PHONE: "aguardando_confirmacao_telefone", ACTIVE: "cadastro_ativo" };
const REFERRAL_STORAGE_KEY = "viapet.seller-referral";

function readStoredReferral() {
  try { const value = JSON.parse(localStorage.getItem(REFERRAL_STORAGE_KEY) || "null");
    return value?.expiresAt > Date.now() ? value : null; } catch { return null; }
}

async function makeFingerprint() {
  const source = [navigator.userAgent, navigator.language, screen.width, screen.height, Intl.DateTimeFormat().resolvedOptions().timeZone].join("|");
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return [...new Uint8Array(bytes)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

export default function SecureRegisterPage({ apiRequest, auth }) {
  const navigate = useNavigate(); const location = useLocation();
  const requestedPlan = useMemo(() => new URLSearchParams(location.search).get("plan") || "", [location.search]);
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phone: "", password: "", confirmPassword: "", acceptedTerms: false, acceptedPrivacy: false });
  const [step, setStep] = useState("form"); const [registrationId, setRegistrationId] = useState(""); const [code, setCode] = useState("");
  const [error, setError] = useState(""); const [info, setInfo] = useState(""); const [busy, setBusy] = useState(false); const [seconds, setSeconds] = useState(0);
  const captchaRef = useRef(null); const captchaTokenRef = useRef("");

  useEffect(() => {
    const params = new URLSearchParams(location.search); const code = params.get("ref");
    if (!code || readStoredReferral()) return;
    const sessionId = crypto.randomUUID();
    const referral = { code: code.toUpperCase(), sessionId, expiresAt: Date.now() + 30 * 86400000 };
    localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(referral));
    apiRequest("/seller-referrals/visit", { method: "POST", body: JSON.stringify({ code: referral.code, sessionId,
      utmSource: params.get("utm_source"), utmMedium: params.get("utm_medium"), utmCampaign: params.get("utm_campaign"),
      landingPage: `${location.pathname}${location.search}` }) }).catch(() => {});
  }, [apiRequest, location.pathname, location.search]);

  useEffect(() => { if (seconds <= 0) return undefined; const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [seconds]);
  useEffect(() => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY; if (!siteKey || step !== "form") return undefined;
    const render = () => { if (captchaRef.current && window.turnstile && !captchaRef.current.dataset.rendered) { window.turnstile.render(captchaRef.current, { sitekey: siteKey, callback: (token) => { captchaTokenRef.current = token; }, "expired-callback": () => { captchaTokenRef.current = ""; } }); captchaRef.current.dataset.rendered = "true"; } };
    let script = document.querySelector('script[data-viapet-turnstile]'); if (!script) { script = document.createElement("script"); script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; script.async = true; script.defer = true; script.dataset.viapetTurnstile = "true"; document.head.appendChild(script); }
    script.addEventListener("load", render); render(); return () => script.removeEventListener("load", render);
  }, [step]);
  if (auth?.isReady && auth?.isAuthenticated) return <Navigate to={auth.user?.role === "admin" ? "/admin" : "/dashboard"} replace />;
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function submitRegistration(event) {
    event.preventDefault(); setError(""); setInfo("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Informe um e-mail válido.");
    if (form.password !== form.confirmPassword) return setError("As senhas não coincidem.");
    if (!form.acceptedTerms || !form.acceptedPrivacy) return setError("Aceite os Termos de Uso e a Política de Privacidade.");
    setBusy(true);
    try {
      const referral = readStoredReferral();
      const response = await apiRequest("/register", { method: "POST", headers: { "X-Device-Fingerprint": await makeFingerprint() }, body: JSON.stringify({ ...form, email: form.email.trim(), requestedPlan, captchaToken: captchaTokenRef.current, deviceFingerprint: await makeFingerprint(), referralSessionId: referral?.sessionId || null, referralCode: referral?.code || null }) });
      setRegistrationId(response.registrationId); setStep("email"); setSeconds(60); setInfo(response.message); if (response.devCode) setCode(response.devCode);
    } catch (err) { setError(err.message || "Não foi possível criar o cadastro."); } finally { setBusy(false); }
  }
  async function verify(event) {
    event.preventDefault(); if (!/^\d{6}$/.test(code)) return setError("Digite os 6 números do código."); setBusy(true); setError("");
    try { const channel = step === "email" ? "email" : "phone"; const response = await apiRequest(`/register/verify-${channel}`, { method: "POST", body: JSON.stringify({ registrationId, code }) }); setInfo(response.message); setCode(response.devCode || ""); setSeconds(60); if (response.status === STATUS.PHONE) setStep("phone"); if (response.status === STATUS.ACTIVE) setStep("success"); }
    catch (err) { setError(err.message || "Código inválido."); } finally { setBusy(false); }
  }
  async function resend() { if (seconds) return; setBusy(true); setError(""); try { const response = await apiRequest("/register/resend", { method: "POST", body: JSON.stringify({ registrationId }) }); setInfo(response.message); setSeconds(60); if (response.devCode) setCode(response.devCode); } catch (err) { setError(err.message); if (err.retryAfter) setSeconds(err.retryAfter); } finally { setBusy(false); } }

  return <main className="secure-register-page"><section className="secure-register-aside"><img src="/viapet-mascote.png" alt="Mascote ViaPet"/><span>ViaPet</span><h1>Seu negócio pet começa com segurança.</h1><p>Protegemos sua conta e os dados dos seus clientes desde o primeiro acesso.</p><div className="secure-benefits"><span>✓ Confirmação em duas etapas</span><span>✓ Dados isolados e protegidos</span><span>✓ Pronto para usar no celular</span></div></section><section className="secure-register-card">
    <div className="secure-progress"><span className="active">1</span><i/><span className={step !== "form" ? "active" : ""}>2</span><i/><span className={step === "success" ? "active" : ""}>3</span></div>
    {step === "form" ? <form onSubmit={submitRegistration}><header><small>COMECE AGORA</small><h2>Crie sua conta</h2><p>Preencha seus dados. O acesso será liberado após confirmar e-mail e telefone.</p></header><div className="secure-form-grid"><label>Nome completo<input value={form.name} onChange={(e) => update("name", e.target.value)} required autoComplete="name"/></label><label>Empresa ou estabelecimento<input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} required/></label><label className="wide">E-mail<input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required autoComplete="email"/></label><label>WhatsApp<input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(11) 99999-9999" required/></label><label>Senha<input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required autoComplete="new-password"/><small>8+ caracteres, maiúscula, minúscula e número</small></label><label>Confirmar senha<input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required/></label></div><div className="secure-checks"><label><input type="checkbox" checked={form.acceptedTerms} onChange={(e) => update("acceptedTerms", e.target.checked)}/> Aceito os <a href="/termos" target="_blank">Termos de Uso</a></label><label><input type="checkbox" checked={form.acceptedPrivacy} onChange={(e) => update("acceptedPrivacy", e.target.checked)}/> Aceito a <a href="/privacidade" target="_blank">Política de Privacidade</a></label></div><div ref={captchaRef} className="secure-captcha"/>{error && <div className="auth-error">{error}</div>}<button className="auth-submit" disabled={busy}>{busy ? "Protegendo cadastro..." : "Continuar com segurança"}</button><button type="button" className="auth-link-btn" onClick={() => navigate("/login")}>Já tenho conta</button></form> : step === "success" ? <div className="secure-success"><div className="secure-success-icon">✓</div><small>CADASTRO ATIVO</small><h2>Identidade confirmada!</h2><p>Seu e-mail e telefone foram validados. Agora você já pode entrar no ViaPet.</p><button className="auth-submit" onClick={() => navigate("/login", { state: { prefillEmail: form.email, infoMessage: "Cadastro confirmado. Entre para começar." } })}>Entrar no ViaPet</button></div> : <form className="secure-code-form" onSubmit={verify}><div className="secure-channel-icon">{step === "email" ? "✉" : "◉"}</div><small>ETAPA {step === "email" ? "2 DE 3" : "3 DE 3"}</small><h2>Confirme seu {step === "email" ? "e-mail" : "telefone"}</h2><p>{step === "email" ? `Enviamos um código para ${form.email}.` : `Enviamos um código por WhatsApp ou SMS para o telefone final ${form.phone.replace(/\D/g, "").slice(-4)}.`}</p><label className="secure-code-label">Código de 6 números<input inputMode="numeric" autoFocus maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000"/></label>{info && <div className="secure-info">{info}</div>}{error && <div className="auth-error">{error}</div>}<button className="auth-submit" disabled={busy}>{busy ? "Validando..." : "Confirmar código"}</button><button type="button" className="auth-link-btn" onClick={resend} disabled={busy || seconds > 0}>{seconds > 0 ? `Reenviar em ${seconds}s` : "Reenviar código"}</button><p className="secure-hint">O código expira em 10 minutos e permite até 5 tentativas.</p></form>}
  </section></main>;
}
