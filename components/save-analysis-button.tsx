"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookmarkPlus, Check, History } from "lucide-react";
import { listSaved, saveAnalysis, type SavedAnalysis } from "@/lib/history/storage";

export type SaveAnalysisInput = {
  matchId: string;
  sportKey: string;
  sport: string;
  league: string;
  home: string;
  away: string;
  startTime: string;
  pick: {
    label: string;
    side: "home" | "draw" | "away" | "other";
    fairProb: number;
    bestPrice: number;
    bestBookmaker: string;
    edgePct: number;
  };
};

export function SaveAnalysisButton({ input }: { input: SaveAnalysisInput }) {
  const [saved, setSaved] = useState<SavedAnalysis | null>(null);

  useEffect(() => {
    const existing = listSaved().find(
      (e) => e.matchId === input.matchId && e.pick.label === input.pick.label
    );
    if (existing) setSaved(existing);
  }, [input.matchId, input.pick.label]);

  const handle = () => {
    const created = saveAnalysis({ ...input, stake: 1 });
    setSaved(created);
  };

  if (saved) {
    return (
      <div className="inline-flex items-center gap-3 rounded-lg border border-neon/30 bg-neon/10 px-4 py-3">
        <Check className="h-5 w-5 text-neon" />
        <div>
          <p className="text-sm font-bold text-white">Salvo no seu histórico</p>
          <p className="text-xs text-slate-400">
            Marque o resultado depois do jogo em{" "}
            <Link href="/historico" className="font-bold text-neon hover:underline">
              <History className="mr-0.5 inline h-3 w-3" />
              Histórico
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/15 px-4 py-3 text-sm font-bold text-gold transition hover:bg-gold/25"
    >
      <BookmarkPlus className="h-4 w-4" />
      Salvar análise no meu histórico
    </button>
  );
}
