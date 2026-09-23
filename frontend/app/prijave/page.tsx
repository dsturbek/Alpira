"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { koristiIdentitet } from "../../lib/auth";
import { danIKratkiMjesec, hrvatskiDatum } from "../../lib/datum";
import { NAZIV_STATUSA_PRIJAVE, NAZIV_STATUSA_TERMINA, type StatusPrijave } from "../../lib/nazivi";
import type { Termin } from "../../lib/javno";
import { Razglednica } from "../komponente/razglednica";
import { PostanskiZig } from "../komponente/ukrasi";
import { Zasticeno } from "../komponente/zastita";

type Prijava = {
  id: number;
  termin_id: number;
  status: StatusPrijave;
  napomena: string | null;
  termin: { id: number; datum: string; status: string; ruta_naziv: string };
};

const NATPIS_ZIGA: Record<StatusPrijave, string> = {
  na_cekanju: "ČEKA",
  potvrdeno: "POTVRĐENA",
  odbijeno: "ODBIJENA",
};

function datumZiga(datum: string): string {
  const { dan, mjesec } = danIKratkiMjesec(datum);
  return `${dan}. ${mjesec}`;
}

function danaDo(datum: string): number {
  const [g = 0, m = 1, d = 1] = datum.split("-").map(Number);
  const cilj = new Date(g, m - 1, d);
  const sada = new Date();
  const danas = new Date(sada.getFullYear(), sada.getMonth(), sada.getDate());
  return Math.round((cilj.getTime() - danas.getTime()) / 86400000);
}

function Zig({ status, datum }: { status: StatusPrijave; datum: string }) {
  return (
    <span className={`zig zig-${status}`} title={`Prijava ${NAZIV_STATUSA_PRIJAVE[status]}`}>
      <PostanskiZig natpis={NATPIS_ZIGA[status]} datum={datumZiga(datum)} />
    </span>
  );
}

function Sadrzaj() {
  const { klijent, korisnik } = koristiIdentitet();

  const [sve, postaviSve] = useState<Prijava[]>([]);
  const [nadolazece, postaviNadolazece] = useState<Prijava[]>([]);
  const [javniTermini, postaviJavne] = useState<Map<number, Termin>>(new Map());
  const [recenzirani, postaviRecenzirane] = useState<Set<number>>(new Set());
  const [ucitava, postaviUcitava] = useState(true);
  const [greska, postaviGresku] = useState<string | null>(null);

  const korisnikId = korisnik?.id;

  const dohvati = useCallback(async () => {
    try {

      const [popis, izdvojeno, raspored] = await Promise.all([
        klijent.get<{ prijave: Prijava[] }>("/api/prijave/moje"),
        klijent.get<{ prijave: Prijava[] }>("/api/prijave/moje?status=potvrdeno&nadolazeci=true"),
        klijent.get<{ termini: Termin[] }>("/api/termini"),
      ]);

      const zavrsene = popis.prijave.filter(
        (prijava) => prijava.status === "potvrdeno" && prijava.termin.status === "zavrsen",
      );
      const vecRecenzirani = new Set<number>();
      await Promise.all(
        zavrsene.map(async (prijava) => {
          const { recenzije } = await klijent.get<{
            recenzije: { korisnik: { id: number } }[];
          }>(`/api/termini/${prijava.termin_id}/recenzije`);
          if (recenzije.some((recenzija) => recenzija.korisnik.id === korisnikId)) {
            vecRecenzirani.add(prijava.termin_id);
          }
        }),
      );

      postaviSve(popis.prijave);
      postaviNadolazece(izdvojeno.prijave);
      postaviJavne(new Map(raspored.termini.map((termin) => [termin.id, termin])));
      postaviRecenzirane(vecRecenzirani);
    } catch {
      postaviGresku("Popis prijava trenutno nije dostupan.");
    } finally {
      postaviUcitava(false);
    }
  }, [klijent, korisnikId]);

  useEffect(() => {
    void dohvati();
  }, [dohvati]);

  const zaRecenziju = sve.filter(
    (prijava) =>
      prijava.status === "potvrdeno" &&
      prijava.termin.status === "zavrsen" &&
      !recenzirani.has(prijava.termin_id),
  );
  const proslih = sve.filter(
    (prijava) => prijava.status === "potvrdeno" && prijava.termin.status === "zavrsen",
  ).length;
  const prijavljeniTermini = new Set(sve.map((prijava) => prijava.termin_id));
  const preporuka = [...javniTermini.values()].find(
    (termin) => termin.status === "najavljen" && !prijavljeniTermini.has(termin.id),
  );

  return (
    <>
      <span className="biljeska">moj dnevnik</span>
      <h1>Moje prijave</h1>

      {ucitava && <p className="prigusen">Učitavanje…</p>}
      {greska && <p className="greska">{greska}</p>}

      {!ucitava && !greska && (
        <>
          {sve.length > 0 && (
            <p className="biljeska brojke-crta">
              prošlih izleta: {proslih} · nadolazećih: {nadolazece.length}
              {sve.some((prijava) => prijava.status === "na_cekanju") &&
                ` · čeka odluku: ${sve.filter((prijava) => prijava.status === "na_cekanju").length}`}
            </p>
          )}

          <section className="detalj-blok">
            <span className="biljeska">spakiraj ruksak</span>
            <h2>Idem na ovo</h2>

            {nadolazece.length === 0 ? (
              <p className="prazno">
                Nemate potvrđenih prijava na izlete koji tek dolaze.{" "}
                <Link href="/termini">Pogledajte što je najavljeno.</Link>
              </p>
            ) : (
              <ul className="razglednice">
                {nadolazece.map((prijava, redni) => {
                  const termin = javniTermini.get(prijava.termin_id);
                  const dana = danaDo(prijava.termin.datum);
                  return (
                    <li className="zig-omot" key={prijava.id}>
                      {termin ? (
                        <>
                          <Razglednica termin={termin} />
                          <Zig status={prijava.status} datum={prijava.termin.datum} />
                          {redni === 0 && dana > 0 && (
                            <span className="biljeska odbrojavanje" aria-hidden="true">
                              za {dana} {dana === 1 ? "dan" : "dana"}!
                            </span>
                          )}
                        </>
                      ) : (

                        <Link href={`/termini/${prijava.termin_id}`} className="prijava-red">
                          <strong>{datumZiga(prijava.termin.datum)}</strong>
                          <span>
                            <h3>{prijava.termin.ruta_naziv}</h3>
                            <p>{hrvatskiDatum(prijava.termin.datum)} · privatni termin</p>
                          </span>
                          <Zig status={prijava.status} datum={prijava.termin.datum} />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {zaRecenziju.length > 0 && (
            <section className="detalj-blok">
              <span className="biljeska">kako je bilo?</span>
              <h2>Čeka tvoju recenziju</h2>

              <ul className="prijava-registar">
                {zaRecenziju.map((prijava) => (
                  <li key={prijava.id}>
                    <Link href={`/termini/${prijava.termin_id}`} className="prijava-red">
                      <strong>{datumZiga(prijava.termin.datum)}</strong>
                      <span>
                        <h3>{prijava.termin.ruta_naziv}</h3>
                        <p>bio si na ovom izletu, podijeli dojam</p>
                      </span>
                      <span className="razglednica-cta">
                        Napiši recenziju
                        <svg viewBox="0 0 16 12" fill="none" aria-hidden="true">
                          <path
                            d="M1 6h13m0 0L9.5 1.5M14 6l-4.5 4.5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="detalj-blok">
            <span className="biljeska">sve po redu</span>
            <h2>Povijest prijava</h2>

            {sve.length === 0 ? (
              <p className="prazno">Još se niste prijavili ni na jedan izlet.</p>
            ) : (
              <ul className="prijava-registar">
                {sve.map((prijava) => (
                  <li key={prijava.id}>
                    <Link href={`/termini/${prijava.termin_id}`} className="prijava-red">
                      <strong>{datumZiga(prijava.termin.datum)}</strong>
                      <span>
                        <h3>{prijava.termin.ruta_naziv}</h3>
                        <p>
                          izlet {NAZIV_STATUSA_TERMINA[prijava.termin.status as Termin["status"]] ?? prijava.termin.status}
                          {prijava.napomena && ` · napomena: ${prijava.napomena}`}
                        </p>
                      </span>
                      <Zig status={prijava.status} datum={prijava.termin.datum} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {preporuka && (
            <section className="detalj-blok">
              <span className="biljeska">možda te zove →</span>
              <h2>Sljedeći u rasporedu</h2>
              <ul className="razglednice">
                <li>
                  <Razglednica termin={preporuka} />
                </li>
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}

export default function MojePrijave() {
  return (
    <Zasticeno najmanja="Sudionik">
      <Sadrzaj />
    </Zasticeno>
  );
}
