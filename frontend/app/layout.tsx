import type { ReactNode } from "react";
import { Anton, Caveat, Inter } from "next/font/google";
import { PruzateljIdentiteta } from "../lib/auth";
import { Zaglavlje } from "./komponente/zaglavlje";
import { Podnozje } from "./komponente/podnozje";
import "./globals.css";

const naslovni = Anton({
  weight: "400",
  subsets: ["latin-ext"],
  variable: "--font-naslov",
});

const tekstualni = Inter({
  subsets: ["latin-ext"],
  variable: "--font-tekst",
});

const rukopisni = Caveat({
  subsets: ["latin-ext"],
  variable: "--font-rukopis",
});

export const metadata = {
  title: "Alpira",
  description: "Alpira: organizacija planinarskih izleta",
};

export default function KorijenskiLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hr" className={`${naslovni.variable} ${tekstualni.variable} ${rukopisni.variable}`}>
      <body>
        <noscript>
          <style>{`.otkrij { opacity: 1; transform: none; }`}</style>
        </noscript>
        <PruzateljIdentiteta>
          <Zaglavlje />
          <main className="sadrzaj">{children}</main>
          <Podnozje />
        </PruzateljIdentiteta>
      </body>
    </html>
  );
}
