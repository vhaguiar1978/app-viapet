import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViaBet Analytics",
  description: "Inteligência esportiva com IA para odds, probabilidades e análises responsáveis."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
