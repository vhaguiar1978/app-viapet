"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { time: "09h", odds: 1.82, probability: 52 },
  { time: "11h", odds: 1.88, probability: 55 },
  { time: "13h", odds: 1.94, probability: 58 },
  { time: "15h", odds: 1.91, probability: 61 },
  { time: "17h", odds: 2.05, probability: 63 },
  { time: "19h", odds: 1.98, probability: 67 }
];

export function MomentumChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -20, right: 8, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="probability" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#36f49b" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#36f49b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="time" stroke="#64748b" tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#0d1820", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Area type="monotone" dataKey="probability" stroke="#36f49b" strokeWidth={3} fill="url(#probability)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
