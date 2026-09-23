"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { koristiIdentitet } from "../../lib/auth";
import { danIKratkiMjesec } from "../../lib/datum";
import type { Ruta, Termin } from "../../lib/javno";
import { NAZIV_STATUSA_TERMINA } from "../../lib/nazivi";
import { jeAdmin } from "../../lib/ovlasti";
import { uPoruku } from "../../lib/poruke";
import { koristiRadnju } from "../../lib/radnja";
import { ObrazacTermina, type PodaciTermina } from "../komponente/obrazac-termina";

export default function VodicPocetna() {
  const { klijent, korisnik } = koristiIdentitet();

  const [termini, postaviTermine] = useState<Termin[]>([]);
  const [rute, postaviRute] = useState<Ruta[]>([]);
  const [cekaju, postaviCekanja] = useState<Map<number, number>>(new Map());
  const [ucitava, postaviUcitava] = useState(true);
  const [nedostupno, postaviNedostupno] = useState<string | null>(null);

  const korisnikId = korisnik?.id;
  const svi = jeAdmin(korisnik);

  const dohvati = useCallback(async () => {
    try {
      const [popisTermina, popisRuta] = await Promise.all([
        klijent.get<{ termini: Termin[] }>("/api/termini"),
        klijent.get<{ rute: Ruta[] }>("/api/rute"),
      ]);

      const zaPregled = popisTermina.termini.filter(
        (termin) =>
          termin.status === "najavljen" && (svi || termin.vodic.id === korisnikId),
      );
      const parovi = await Promise.all(
        zaPregled.map(async (termin) => {
          try {
            const { prijave } = await klijent.get<{ prijave: { status: string }[] }>(
              `/api/termini/${termin.id}/prijave`,
            );
            return [termin.id, prijave.filter((prijava) => prijava.status === "na_cekanju").length] as const;
          } catch {
            return [termin.id, 0] as const;
          }
        }),
      );

      postaviTermine(popisTermina.termini);
      postaviRute(popisRuta.rute);
      postaviCekanja(new Map(parovi));
      postaviNedostupno(null);
    } catch (problem) {
      postaviNedostupno(uPoruku(problem));
    } finally {
      postaviUcitava(false);
    }
  }, [klijent, korisnikId, svi]);

  const { izvedi, radi, greska, poPolju } = koristiRadnju(dohvati);

  useEffect(() => {
    void dohvati();
  }, [dohvati]);

  const moji = svi ? termini : termini.filter((termin) => termin.vodic.id === korisnik?.id);
  const najavljeni = moji.filter((termin) => termin.status === "najavljen");
  const prosli = moji.filter((termin) => termin.status !== "najavljen");
  const ukupnoCeka = [...cekaju.values()].reduce((zbroj, broj) => zbroj + broj, 0);

  return (
    <>
      <span className="biljeska">vodičev stol</span>
      <h1>{svi ? "Svi izleti" : "Moji izleti"}</h1>

      <nav className="admin-poveznice" aria-label="Vodičke sekcije">
        <Link href="/vodic/rute" className="admin-poveznica">
          <span>
            <h3>Katalog ruta</h3>
            <p>Dodavanje i uređivanje staza.</p>
          </span>
          <svg viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <path d="M1 6h13m0 0L9.5 1.5M14 6l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link href="/vodic/profil" className="admin-poveznica">
          <span>
            <h3>Profil vodiča</h3>
            <p>Bio i certifikati koje sudionici vide.</p>
          </span>
          <svg viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <path d="M1 6h13m0 0L9.5 1.5M14 6l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </nav>

      {korisnik && !korisnik.email_verificiran && (
        <p className="upozorenje-okvir">
          Dok e-mail adresa nije potvrđena, zakazivanje i uređivanje nisu mogući.{" "}
          <Link href="/racun">Potvrdite adresu</Link>.
        </p>
      )}

      {nedostupno && <p className="greska">{nedostupno}</p>}

      <div className="detalj radni">
        <div className="detalj-sadrzaj">
          <section className="detalj-blok">
            <span className="biljeska">
              raspored{ukupnoCeka > 0 && `, ${ukupnoCeka} čeka odluku!`}
            </span>
            <h2>Najavljeni izleti</h2>

            {ucitava && <p className="prigusen">Učitavanje…</p>}

            {!ucitava && najavljeni.length === 0 && (
              <p className="prazno">Još nemate nijedan zakazan izlet. Obrazac je desno.</p>
            )}

            <ol className="polasci">
              {najavljeni.map((termin) => (
                <PolazakVodica
                  termin={termin}
                  ceka={cekaju.get(termin.id) ?? 0}
                  tudji={svi && termin.vodic.id !== korisnik?.id}
                  key={termin.id}
                />
              ))}
            </ol>
          </section>

          {prosli.length > 0 && (
            <section className="detalj-blok">
              <span className="biljeska">iz dnevnika</span>
              <h2>Prošli i otkazani</h2>

              <ol className="polasci prosli">
                {prosli.map((termin) => (
                  <PolazakVodica
                    termin={termin}
                    ceka={0}
                    tudji={svi && termin.vodic.id !== korisnik?.id}
                    key={termin.id}
                  />
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="prijavnica">
          <div className="prijavnica-vrh">
            <span className="biljeska">novi polazak</span>
            <p>Zakaži izlet na jednoj od ruta iz kataloga.</p>
          </div>

          <section className="kartica">
            {ucitava ? (
              <p className="prigusen">Učitavanje…</p>
            ) : (
              <ObrazacTermina
                rute={rute}
                natpis="Zakaži izlet"
                radi={radi}
                poPolju={poPolju}
                naSpremi={(podaci: PodaciTermina) =>
                  void izvedi(() => klijent.post("/api/termini", podaci))
                }
              />
            )}

            {greska && <p className="greska">{greska}</p>}
          </section>
        </aside>
      </div>
    </>
  );
}

function PolazakVodica({ termin, ceka, tudji }: { termin: Termin; ceka: number; tudji: boolean }) {
  const { dan, mjesec } = danIKratkiMjesec(termin.datum);
  const { potvrdenih, kapacitet } = termin.popunjenost;

  return (
    <li className="polazak">
      <Link href={`/vodic/termini/${termin.id}`}>
        <span className="polazak-datum">
          <strong>{dan}</strong>
          <span>{mjesec}</span>
        </span>

        <span className="polazak-info">
          <h3>
            {termin.ruta.naziv}
            {termin.je_privatan && <span className="oznaka"> privatan</span>}
          </h3>
          <p>
            {termin.status === "najavljen"
              ? `${potvrdenih} od ${kapacitet} mjesta popunjeno`
              : NAZIV_STATUSA_TERMINA[termin.status]}
            {tudji && ` · vodi ${termin.vodic.ime}`}
          </p>
          {termin.status === "najavljen" && kapacitet > 0 && (
            <span className="popunjenost-traka" aria-hidden="true">
              <span style={{ width: `${Math.round((potvrdenih / kapacitet) * 100)}%` }} />
            </span>
          )}
        </span>

        {ceka > 0 ? (
          <span className="biljeska ceka-odluku">
            {ceka} čeka odluku!
          </span>
        ) : (
          <span className={termin.status === "najavljen" ? "slobodno" : "prigusen"}>
            {termin.status === "najavljen" ? "Uredi →" : NAZIV_STATUSA_TERMINA[termin.status]}
          </span>
        )}
      </Link>
    </li>
  );
}
