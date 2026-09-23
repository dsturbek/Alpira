"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { imaBarem, koristiIdentitet, type Uloga } from "../../lib/auth";
import { NAZIV_ULOGE } from "../../lib/nazivi";

export function Zasticeno({ najmanja, children }: { najmanja: Uloga; children: ReactNode }) {
  const { korisnik, ucitava } = koristiIdentitet();

  if (ucitava) {
    return <p className="prigusen">Učitavanje…</p>;
  }

  if (!korisnik) {
    return (
      <div className="poruka">
        <h1>Potrebna je prijava</h1>
        <p>
          Ova stranica traži prijavljen račun. <Link href="/prijava">Prijavite se</Link>.
        </p>
      </div>
    );
  }

  if (!imaBarem(korisnik, najmanja)) {
    return (
      <div className="poruka">
        <h1>Nemate pristup</h1>
        <p>
          Ova sekcija traži ulogu <strong>{NAZIV_ULOGE[najmanja]}</strong>, a vaša je{" "}
          <strong>{NAZIV_ULOGE[korisnik.uloga]}</strong>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
