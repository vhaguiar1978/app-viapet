"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MessageCircle, Mail, Check } from "lucide-react";
import { mailtoLink, whatsappLink } from "@/lib/planos/config";

type Plan = "free" | "pro" | "elite";

const STORAGE_KEY = "viabet_plan_interest_v1";

type InterestRecord = { plan: Plan; clickedAt: string; channel: "whatsapp" | "email" };

function readInterest(): InterestRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeInterest(records: InterestRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function PlanCTA({ plan, planName }: { plan: Plan; planName: string }) {
  const [registered, setRegistered] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const records = readInterest();
    setCount(records.filter((r) => r.plan === plan).length);
    setRegistered(records.some((r) => r.plan === plan));
  }, [plan]);

  const recordClick = (channel: "whatsapp" | "email") => {
    const records = readInterest();
    records.push({ plan, clickedAt: new Date().toISOString(), channel });
    writeInterest(records);
    setRegistered(true);
    setCount(count + 1);
  };

  if (plan === "free") {
    return (
      <a
        href="/jogos"
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-neon/30 bg-neon/10 px-5 py-3 font-bold text-neon transition hover:bg-neon/20"
      >
        Começar grátis
        <ArrowRight className="h-4 w-4" />
      </a>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <a
          href={whatsappLink(planName)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordClick("whatsapp")}
          className={
            plan === "pro"
              ? "inline-flex items-center justify-center gap-2 rounded-lg bg-neon px-3 py-3 font-bold text-ink transition hover:brightness-110"
              : "inline-flex items-center justify-center gap-2 rounded-lg border border-gold/40 bg-gold/15 px-3 py-3 font-bold text-gold transition hover:bg-gold/25"
          }
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <a
          href={mailtoLink(planName)}
          onClick={() => recordClick("email")}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-3 font-bold text-white transition hover:bg-white/10"
        >
          <Mail className="h-4 w-4" />
          Email
        </a>
      </div>
      {registered ? (
        <p className="flex items-center justify-center gap-1 text-xs text-neon">
          <Check className="h-3 w-3" />
          Você demonstrou interesse · te avisamos no lançamento
        </p>
      ) : (
        <p className="text-center text-xs text-slate-400">
          {count > 0 ? `${count} pessoa(s) demonstraram interesse neste plano` : "Pré-cadastro · seja o primeiro"}
        </p>
      )}
    </div>
  );
}
