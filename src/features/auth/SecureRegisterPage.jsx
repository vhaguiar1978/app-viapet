import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import "./secureRegister.css";

const REFERRAL_STORAGE_KEY = "viapet.seller-referral";

function readStoredReferral() {
  try {
    const value = JSON.parse(localStorage.getItem(REFERRAL_STORAGE_KEY) || "null");
    return value?.expiresAt > Date.now() ? value : null;
  } catch { return null; }
}

async function makeFingerprint() {
  const source = [navigator.userAgent, navigator.language, screen.width, screen.height, Intl.DateTimeFormat().resolvedOptions().timeZone].join("|");
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return [...new Uint8Array(bytes)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

export default function SecureRegisterPage({ apiRequest, auth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPlan = useMemo(() => new URLSearchParams(location.search).get("plan") || "", [location.search]);
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phone: "", password: "", confirmPassword: "", acceptedTerms: false, acceptedPrivacy: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const captchaRef = useRef(null);
  const captchaTokenRef = useRef("");
  const captchaWidgetRef = useRef(null);
  const captchaEnabled = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim());
  const [captchaReady, setCaptchaReady] = useState(!captchaEnabled);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("ref");
    if (!code || readStoredReferral()) return;
    const referral = { code: code.toUpperCase(), sessionId: crypto.randomUUID(), expiresAt: Date.now() + 30 * 86400000 };
    localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(referral));
    apiRequest("/seller-referrals/visit", { method: "POST", body: JSON.stringify({ code: referral.code, sessionId: referral.sessionId, utmSource: params.get("utm_source"), utmMedium: params.get("utm_medium"), utmCampaign: params.get("utm_campaign"), landingPage: `${location.pathname}${location.search}` }) }).catch(() => {});
  }, [apiRequest, location.pathname, location.search]);

  useEffect(() => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();
    if (!siteKey) return undefined;
    const render = () => {
      if (!captchaRef.current || !window.turnstile || captchaWidgetRef.current !== null) return;
      captchaWidgetRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: siteKey, size: "flexible",
        callback: (token) => { captchaTokenRef.current = token; setCaptchaReady(true); setError(""); },
        "expired-callback": () => { captchaTokenRef.current = ""; setCaptchaReady(false); },
        "error-callback": () => { captchaTokenRef.current = ""; setCaptchaReady(false); setError("Não foi possível carregar a verificação de segurança. Verifique sua conexão e tente novamente."); },
      });
    };
    let script = document.querySelector("script[data-viapet-turnstile]");
    if (!script) {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true; script.defer = true; script.dataset.viapetTurnstile = "true";
      document.head.appendChild(script);
    }
    script.addEventListener("load", render); render();
    return () => script.removeEventListener("load", render);
  }, []);

  if (auth?.isReady && auth?.isAuthenticated) return <Navigate to={auth.user?.role === "admin" ? "/admin" : "/dashboard"} replace />;
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function submitRegistration(event) {
    event.preventDefault(); setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Informe um e-mail válido.");
    if (form.password !== form.confirmPassword) return setError("As senhas não coincidem.");
    if (!form.acceptedTerms || !form.acceptedPrivacy) return setError("Aceite os Termos de Uso e a Política de Privacidade.");
    if (captchaEnabled && !captchaTokenRef.current) return setError("Aguarde a verificação de segurança e tente novamente.");
    setBusy(true);
    try {
      const referral = readStoredReferral();
      const deviceFingerprint = await makeFingerprint();
      const response = await apiRequest("/register", { method: "POST", headers: { "X-Device-Fingerprint": deviceFingerprint }, body: JSON.stringify({ ...form, email: form.email.trim(), requestedPlan, captchaToken: captchaTokenRef.current, deviceFingerprint, referralSessionId: referral?.sessionId || null, referralCode: referral?.code || null }) });
      if (!response?.token) throw new Error("A conta foi criada, mas o acesso automático não foi liberado.");
      await auth.login(form.email, form.password);
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Não foi possível criar o cadastro.");
      if (captchaEnabled && captchaWidgetRef.current !== null && window.turnstile) {
        window.turnstile.reset(captchaWidgetRef.current); captchaTokenRef.current = ""; setCaptchaReady(false);
      }
    } finally { setBusy(false); }
  }

  return <main className="secure-register-page"><section className="secure-register-aside"><img src="/viapet-mascote.png" alt="Mascote ViaPet"/><span>ViaPet</span><h1>Seu negócio pet começa agora.</h1><p>Crie sua conta e entre direto no sistema para organizar sua operação.</p><div className="secure-benefits"><span>✓ Acesso imediato ao sistema</span><span>✓ Dados da empresa isolados e protegidos</span><span>✓ Pronto para usar no celular</span></div></section><section className="secure-register-card"><form onSubmit={submitRegistration}><header><small>COMECE AGORA</small><h2>Crie sua conta</h2><p>Preencha seus dados e comece a usar o ViaPet imediatamente.</p></header><div className="secure-form-grid"><label>Nome completo<input value={form.name} onChange={(e) => update("name", e.target.value)} required autoComplete="name"/></label><label>Empresa ou estabelecimento<input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} required/></label><label className="wide">E-mail<input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required autoComplete="email"/></label><label>WhatsApp<input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(11) 99999-9999" required autoComplete="tel"/></label><label>Senha<input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required autoComplete="new-password"/><small>8+ caracteres, maiúscula, minúscula e número</small></label><label>Confirmar senha<input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required autoComplete="new-password"/></label></div><div className="secure-checks"><label><input type="checkbox" checked={form.acceptedTerms} onChange={(e) => update("acceptedTerms", e.target.checked)}/> Aceito os <a href="/termos" target="_blank" rel="noreferrer">Termos de Uso</a></label><label><input type="checkbox" checked={form.acceptedPrivacy} onChange={(e) => update("acceptedPrivacy", e.target.checked)}/> Aceito a <a href="/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a></label></div><div ref={captchaRef} className="secure-captcha"/>{error && <div className="auth-error">{error}</div>}<button className="auth-submit" disabled={busy || !captchaReady}>{busy ? "Criando seu espaço..." : "Criar conta e entrar"}</button><button type="button" className="auth-link-btn" onClick={() => navigate("/login")}>Já tenho conta</button></form></section></main>;
}
