import type { Tezina } from "../../lib/javno";

const BAZEN_SLIKA: Record<Tezina, [string, string]> = {
  lagana: ["/slike/lagana.webp", "/slike/lagana-2.webp"],
  srednja: ["/slike/srednja.webp", "/slike/srednja-2.webp"],
  zahtjevna: ["/slike/zahtjevna.webp", "/slike/zahtjevna-2.webp"],
};

export function slikaRute(kljuc: number, tezina: Tezina): string {
  const [prva, druga] = BAZEN_SLIKA[tezina];
  return kljuc % 2 === 0 ? prva : druga;
}

const VRHOVI: Record<Tezina, string> = {
  lagana: "M8 12 14 4l6 8",
  srednja: "M3 12 9 4l4.5 6L17 6l7 6",
  zahtjevna: "M1 12 6 5l4 5 4-7 4 7 4-5 5 7",
};

export function IkonaTezine({ tezina }: { tezina: Tezina }) {
  return (
    <svg viewBox="0 0 28 14" fill="none" aria-hidden="true">
      <path d={VRHOVI[tezina]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OznakaTezine({ tezina }: { tezina: Tezina }) {
  return (
    <span className={`oznaka-tezine tezina-${tezina}`}>
      <IkonaTezine tezina={tezina} />
      {tezina}
    </span>
  );
}
