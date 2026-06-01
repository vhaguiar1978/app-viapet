import Link from "next/link";
import { Crown } from "lucide-react";
import { PageTitle, Panel, ResponsibleNotice, Shell } from "@/components/ui";

export default function SignupPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-md">
        <PageTitle eyebrow="Cadastro" title="Comece no plano grátis" subtitle="Crie uma conta para salvar favoritos, configurar alertas e acompanhar análises." />
        <Panel>
          <Crown className="h-6 w-6 text-gold" />
          <form className="mt-5 space-y-4">
            <input className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-neon/50" placeholder="Nome" disabled />
            <input className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-neon/50" placeholder="E-mail" type="email" disabled />
            <input className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-neon/50" placeholder="Senha" type="password" disabled />
            <button className="w-full rounded-lg bg-neon/40 px-4 py-3 font-black text-ink/60" type="button" disabled>
              Criar conta
            </button>
          </form>
          <div className="mt-4 rounded-md border border-gold/30 bg-gold/10 p-3 text-xs leading-5 text-gold">
            Cadastro real aguarda o Supabase Auth. A tela mostra apenas o visual final.
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Já tem conta? <Link className="font-bold text-neon" href="/login">Entrar</Link>
          </p>
        </Panel>
        <div className="mt-4">
          <ResponsibleNotice />
        </div>
      </div>
    </Shell>
  );
}
