"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { koristiIdentitet } from "../../lib/auth";
import type { Termin } from "../../lib/javno";
import { jeAdmin } from "../../lib/ovlasti";
import { KarticaTermina } from "./kartica-termina";

export function PrivatniZaAdmina({ upitniNiz }: { upitniNiz: string }) {
  const { klijent, korisnik, ucitava } = koristiIdentitet();

  const [privatni, postaviPrivatne] = useState<Termin[]>([]);

  useEffect(() => {
    if (ucitava || !jeAdmin(korisnik)) {
      postaviPrivatne([]);
      return;
    }

    let otkazano = false;

    void klijent.get<{ termini: Termin[] }>(`/api/termini${upitniNiz}`).then(
      (odgovor) => {
        if (!otkazano) postaviPrivatne(odgovor.termini.filter((termin) => termin.je_privatan));
      },
      () => {

      },
    );

    return () => {
      otkazano = true;
    };
  }, [klijent, korisnik, ucitava, upitniNiz]);

  if (privatni.length === 0) return null;

  return (
    <section>
      <h2>Privatni izleti</h2>

      <p className="prigusen sitno">
        Ovi izleti ne stoje u javnom popisu. Do njih se inače dolazi samo poveznicom. Vidite ih
        jer ste administrator.
      </p>

      <ul className="popis">
        {privatni.map((termin) => (
          <li key={termin.id}>
            <Link href={`/termini/${termin.id}`} className="bez-crte">
              <KarticaTermina termin={termin} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
