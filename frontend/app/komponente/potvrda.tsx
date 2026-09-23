"use client";

import type { ReactNode } from "react";

export function Potvrda({
  pitanje,
  potvrdi,
  radi = false,
  naPotvrdu,
  naOdustajanje,
}: {
  pitanje: ReactNode;

  potvrdi: string;
  radi?: boolean;
  naPotvrdu: () => void;
  naOdustajanje: () => void;
}) {
  return (
    <div className="upozorenje-okvir">
      <p>{pitanje}</p>

      <button type="button" disabled={radi} onClick={naPotvrdu}>
        {potvrdi}
      </button>
      <button type="button" className="tiho" disabled={radi} onClick={naOdustajanje}>
        Odustani
      </button>
    </div>
  );
}
