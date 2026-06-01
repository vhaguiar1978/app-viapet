import { Database, ShieldAlert } from "lucide-react";
import { Panel } from "@/components/ui";

export function BackendPendingNotice({
  title = "Aguardando backend Supabase",
  description = "Esta seção depende de banco de dados e login do usuário. Para evitar mostrar números falsos, ela só será preenchida quando o Supabase estiver conectado."
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Panel accent="border-gold/30">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-bold text-gold">
            <ShieldAlert className="h-3.5 w-3.5" />
            Modo real ativo · sem dados simulados
          </p>
        </div>
      </div>
    </Panel>
  );
}

export function PendingMetric({ label }: { label: string }) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-500">—</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-500">
          <Database className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">Aguardando backend</p>
    </Panel>
  );
}
