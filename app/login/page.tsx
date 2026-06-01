import Link from "next/link";
import { Lock } from "lucide-react";
import { PageTitle, Panel, Shell } from "@/components/ui";

export default function LoginPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-md">
        <PageTitle eyebrow="Acesso" title="Entrar na plataforma" subtitle="Tela visual pronta para conectar Supabase Auth ou outro provedor seguro." />
        <Panel>
          <Lock className="h-6 w-6 text-neon" />
          <form className="mt-5 space-y-4">
            <input className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-neon/50" placeholder="E-mail" type="email" disabled />
            <input className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-neon/50" placeholder="Senha" type="password" disabled />
            <button className="w-full rounded-lg bg-neon/40 px-4 py-3 font-black text-ink/60" type="button" disabled>
              Entrar
            </button>
          </form>
          <div className="mt-4 rounded-md border border-gold/30 bg-gold/10 p-3 text-xs leading-5 text-gold">
            Login real aguarda o Supabase Auth ser conectado. Por ora a tela mostra apenas o visual.
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Ainda não tem conta? <Link className="font-bold text-neon" href="/cadastro">Criar cadastro</Link>
          </p>
        </Panel>
      </div>
    </Shell>
  );
}
