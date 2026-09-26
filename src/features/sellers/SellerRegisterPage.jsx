import { useState } from "react";
import { Link } from "react-router-dom";
import "./commercial.css";
import "./commercialBrand.css";

export default function SellerRegisterPage({ apiRequest }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", document: "", password: "", confirmation: "" });
  const [state, setState] = useState({ loading: false, error: "", done: false });
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    if (form.password !== form.confirmation) return setState({ loading: false, error: "As senhas não coincidem.", done: false });
    setState({ loading: true, error: "", done: false });
    try { await apiRequest("/seller-register", { method: "POST", body: JSON.stringify(form) }); setState({ loading: false, error: "", done: true }); }
    catch (error) { setState({ loading: false, error: error.message, done: false }); }
  }
  if (state.done) return <main className="commercial-auth"><section className="commercial-auth-card commercial-success"><div className="commercial-mark">✓</div><span>CADASTRO RECEBIDO</span><h1>Agora é só aguardar a liberação</h1><p>O administrador do ViaPet vai revisar seu cadastro. Depois da aprovação, você entra normalmente pelo login do site.</p><Link to="/login">Ir para o login</Link></section></main>;
  return <main className="commercial-auth"><section className="commercial-auth-card">
    <div className="commercial-brand"><img src="/viapet-logo.svg" alt="ViaPet"/><div><b>ViaPet</b><span>Central Comercial</span></div></div>
    <span>ÁREA DO VENDEDOR</span><h1>Faça parte da nossa equipe comercial</h1><p>Crie seu acesso. Por segurança, sua conta será liberada pelo administrador.</p>
    <form onSubmit={submit}><label>Nome completo<input required value={form.name} onChange={update("name")} autoComplete="name" /></label><div className="commercial-form-row"><label>E-mail<input required type="email" value={form.email} onChange={update("email")} autoComplete="email" /></label><label>WhatsApp<input required value={form.phone} onChange={update("phone")} inputMode="tel" /></label></div><label>CPF ou documento <small>(opcional)</small><input value={form.document} onChange={update("document")} /></label><div className="commercial-form-row"><label>Senha<input required minLength="8" type="password" value={form.password} onChange={update("password")} autoComplete="new-password" /></label><label>Confirmar senha<input required minLength="8" type="password" value={form.confirmation} onChange={update("confirmation")} autoComplete="new-password" /></label></div>{state.error && <div className="commercial-error">{state.error}</div>}<button disabled={state.loading}>{state.loading ? "Enviando..." : "Enviar cadastro"}</button></form>
    <footer>Já foi aprovado? <Link to="/login">Entrar no ViaPet</Link></footer>
  </section></main>;
}
