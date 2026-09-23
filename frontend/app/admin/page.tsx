"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { koristiIdentitet, type Uloga } from "../../lib/auth";
import { NAZIV_ULOGE } from "../../lib/nazivi";
import { uPoruku } from "../../lib/poruke";
import { koristiRadnju } from "../../lib/radnja";
import { Potvrda } from "../komponente/potvrda";

type KorisnikZaAdmina = {
  id: number;
  ime: string;
  email: string;
  uloga: Uloga;
  aktivan: boolean;
};

const ULOGE: Uloga[] = ["Sudionik", "Vodic", "Admin"];

export default function Administracija() {
  const { klijent, korisnik: prijavljeni } = koristiIdentitet();

  const [korisnici, postaviKorisnike] = useState<KorisnikZaAdmina[]>([]);
  const [ucitava, postaviUcitava] = useState(true);
  const [nedostupno, postaviNedostupno] = useState<string | null>(null);
  const [potvrda, postaviPotvrdu] = useState<number | null>(null);

  const dohvati = useCallback(async () => {
    try {
      const odgovor = await klijent.get<{ korisnici: KorisnikZaAdmina[] }>("/api/admin/korisnici");
      postaviKorisnike(odgovor.korisnici);
      postaviNedostupno(null);
    } catch (problem) {
      postaviNedostupno(uPoruku(problem));
    } finally {
      postaviUcitava(false);
    }
  }, [klijent]);

  const { izvedi, radi, greska } = koristiRadnju(dohvati);

  useEffect(() => {
    void dohvati();
  }, [dohvati]);

  function izvediPaZatvori(radnja: () => Promise<unknown>) {
    void izvedi(radnja).then(() => postaviPotvrdu(null));
  }

  return (
    <>
      <span className="biljeska">upravljanje</span>
      <h1>Administracija</h1>

      <nav className="admin-poveznice" aria-label="Administratorske sekcije">
        <Link href="/vodic" className="admin-poveznica">
          <span>
            <h3>Svi izleti</h3>
            <p>Termini svih vodiča, uključujući privatne.</p>
          </span>
          <svg viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <path
              d="M1 6h13m0 0L9.5 1.5M14 6l-4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <Link href="/vodic/rute" className="admin-poveznica">
          <span>
            <h3>Katalog ruta</h3>
            <p>Dodavanje i uređivanje staza.</p>
          </span>
          <svg viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <path
              d="M1 6h13m0 0L9.5 1.5M14 6l-4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </nav>

      {greska && <p className="greska">{greska}</p>}
      {nedostupno && <p className="greska">{nedostupno}</p>}

      <section className="detalj-blok">
        <span className="biljeska">tko je tko</span>
        <h2>Korisnici</h2>

        {ucitava && <p className="prigusen">Učitavanje…</p>}

        <ul className="korisnik-registar">
          {korisnici.map((korisnik) => {
            const jaSam = korisnik.id === prijavljeni?.id;
            const inicijali = korisnik.ime
              .split(" ")
              .map((rijec) => rijec[0])
              .slice(0, 2)
              .join("");

            return (
              <li className={korisnik.aktivan ? "korisnik-red" : "korisnik-red neaktivan"} key={korisnik.id}>
                <span className="korisnik-avatar" aria-hidden="true">
                  {inicijali}
                </span>

                <div>
                  <strong>{korisnik.ime}</strong>
                  {jaSam && <span className="oznaka"> vi</span>}
                  {!korisnik.aktivan && <span className="upozorenje-oznaka"> deaktiviran</span>}
                  <p className="prigusen sitno">
                    {korisnik.email} · uloga {NAZIV_ULOGE[korisnik.uloga]}
                  </p>

                  {potvrda === korisnik.id && (
                    <Potvrda
                      radi={radi}
                      pitanje={
                        korisnik.aktivan
                          ? `Deaktivirati račun korisnika ${korisnik.ime}? Sesije mu se odmah opozivaju i više se ne može prijaviti.`
                          : `Ponovno aktivirati račun korisnika ${korisnik.ime}?`
                      }
                      potvrdi={korisnik.aktivan ? "Da, deaktiviraj" : "Da, aktiviraj"}
                      naPotvrdu={() =>
                        izvediPaZatvori(() =>
                          klijent.patch(`/api/admin/korisnici/${korisnik.id}/aktivan`, {
                            aktivan: !korisnik.aktivan,
                          }),
                        )
                      }
                      naOdustajanje={() => postaviPotvrdu(null)}
                    />
                  )}
                </div>

                {!jaSam && potvrda !== korisnik.id && (
                  <div>
                    <select
                      aria-label={`Uloga korisnika ${korisnik.ime}`}
                      disabled={radi}
                      value={korisnik.uloga}
                      onChange={(dogadaj) =>
                        void izvedi(() =>
                          klijent.patch(`/api/admin/korisnici/${korisnik.id}/uloga`, {
                            uloga: dogadaj.target.value,
                          }),
                        )
                      }
                    >
                      {ULOGE.map((uloga) => (
                        <option key={uloga} value={uloga}>
                          {NAZIV_ULOGE[uloga]}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="tiho"
                      disabled={radi}
                      onClick={() => postaviPotvrdu(korisnik.id)}
                    >
                      {korisnik.aktivan ? "Deaktiviraj" : "Aktiviraj"}
                    </button>
                  </div>
                )}

                {jaSam && (
                  <span className="prigusen sitno">
                    Nad vlastitim računom nema radnji, da platforma ne ostane bez administratora.
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
