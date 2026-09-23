"use client";

import { use, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { koristiIdentitet } from "../../../../lib/auth";
import { danIKratkiMjesec, hrvatskiDatum } from "../../../../lib/datum";
import type { Ruta, Termin } from "../../../../lib/javno";
import {
  NAZIV_STATUSA_PRIJAVE,
  NAZIV_STATUSA_TERMINA,
  type StatusPrijave,
} from "../../../../lib/nazivi";
import { smijeUrediti } from "../../../../lib/ovlasti";
import { uPoruku } from "../../../../lib/poruke";
import { koristiRadnju } from "../../../../lib/radnja";
import { ObrazacTermina, type PodaciTermina } from "../../../komponente/obrazac-termina";
import { Potvrda } from "../../../komponente/potvrda";
import { IkonaTezine, slikaRute } from "../../../komponente/tezina";
import { PoderaniRub, PostanskiZig } from "../../../komponente/ukrasi";

type Prijava = {
  id: number;
  status: StatusPrijave;
  napomena: string | null;
  korisnik: { id: number; ime: string };
};

const NATPIS_ZIGA: Record<StatusPrijave, string> = {
  na_cekanju: "ČEKA",
  potvrdeno: "POTVRĐENA",
  odbijeno: "ODBIJENA",
};

type Potvrdivo = "zavrsen" | "otkazan" | "brisanje" | null;

function Sadrzaj({ id }: { id: number }) {
  const { klijent, korisnik } = koristiIdentitet();
  const usmjerivac = useRouter();

  const [termin, postaviTermin] = useState<Termin | null>(null);
  const [rute, postaviRute] = useState<Ruta[]>([]);
  const [prijave, postaviPrijave] = useState<Prijava[]>([]);
  const [kod, postaviKod] = useState<string | null>(null);
  const [prepisano, postaviPrepisano] = useState(false);
  const [potvrda, postaviPotvrdu] = useState<Potvrdivo>(null);
  const [ucitava, postaviUcitava] = useState(true);
  const [nedostupno, postaviNedostupno] = useState<string | null>(null);
  const [pomocno, postaviPomocno] = useState<string | null>(null);

  const dohvati = useCallback(async () => {
    let ucitani: Termin;

    try {
      const odgovor = await klijent.get<{ termin: Termin }>(`/api/termini/${id}`);
      ucitani = odgovor.termin;

      postaviTermin(ucitani);
      postaviNedostupno(null);
    } catch (problem) {
      postaviNedostupno(uPoruku(problem));
      return;
    } finally {
      postaviUcitava(false);
    }

    postaviPomocno(null);

    try {
      const katalog = await klijent.get<{ rute: Ruta[] }>("/api/rute");
      postaviRute(katalog.rute);
    } catch {
      postaviPomocno("Katalog ruta trenutno nije dostupan, pa uređivanje nije moguće.");
    }

    if (!smijeUrediti(korisnik, ucitani)) {
      postaviPrijave([]);
      postaviKod(null);
      return;
    }

    try {
      const [popisPrijava, link] = await Promise.all([
        klijent.get<{ prijave: Prijava[] }>(`/api/termini/${id}/prijave`),
        klijent.get<{ privatniLink: { kod: string } | null }>(`/api/termini/${id}/privatni-link`),
      ]);

      postaviPrijave(popisPrijava.prijave);
      postaviKod(link.privatniLink?.kod ?? null);
    } catch {
      postaviPomocno("Popis prijava trenutno nije dostupan.");
    }
  }, [klijent, korisnik, id]);

  const { izvedi, radi, greska, poPolju, postaviGresku } = koristiRadnju(dohvati);

  useEffect(() => {
    void dohvati();
  }, [dohvati]);

  async function obrisi() {
    postaviPotvrdu(null);

    try {
      await klijent.obrisi(`/api/termini/${id}`);
      usmjerivac.push("/vodic");
      usmjerivac.refresh();
    } catch (problem) {
      postaviGresku(uPoruku(problem));
    }
  }

  function kopiraj(poveznica: string) {

    navigator.clipboard.writeText(poveznica).then(
      () => postaviPrepisano(true),
      () =>
        postaviGresku(
          "Poveznicu nije bilo moguće kopirati automatski. Označite je i kopirajte ručno.",
        ),
    );
  }

  if (ucitava) return <p className="prigusen">Učitavanje…</p>;

  if (nedostupno || !termin) {
    return (
      <div className="poruka">
        <h1>Izlet nije dostupan</h1>
        <p>{nedostupno ?? "Taj izlet ne postoji."}</p>
        <p>
          <Link href="/vodic">Natrag na popis izleta</Link>
        </p>
      </div>
    );
  }

  const smije = smijeUrediti(korisnik, termin);
  const konacan = termin.status !== "najavljen";
  const { potvrdenih, kapacitet } = termin.popunjenost;
  const cekaju = prijave.filter((prijava) => prijava.status === "na_cekanju").length;
  const { dan, mjesec } = danIKratkiMjesec(termin.datum);
  const poveznica =
    kod === null ? null : `${typeof window === "undefined" ? "" : window.location.origin}/termini/kod/${kod}`;

  return (
    <>
      <section className="detalj-hero niska">
        <Image src={slikaRute(termin.ruta.id, termin.ruta.tezina)} alt="" fill preload sizes="100vw" />

        {konacan && (
          <span className={`detalj-status detalj-status-${termin.status}`}>
            {NAZIV_STATUSA_TERMINA[termin.status]}
          </span>
        )}

        <div className="detalj-hero-sadrzaj">
          <span className={`pecat tezina-${termin.ruta.tezina}`}>
            <IkonaTezine tezina={termin.ruta.tezina} />
            {termin.ruta.tezina}
          </span>
          <span className="biljeska">{hrvatskiDatum(termin.datum)}</span>
          <h1>{termin.ruta.naziv}</h1>
          {termin.je_privatan && <p className="detalj-privatan">privatni termin</p>}
        </div>

        <PoderaniRub />
      </section>

      {greska && <p className="greska">{greska}</p>}
      {pomocno && <p className="prigusen sitno">{pomocno}</p>}

      {!smije && (
        <p className="upozorenje-okvir">
          Ovaj izlet vodi {termin.vodic.ime}, pa ga ne možete uređivati. Možete ga pogledati na{" "}
          <Link href={`/termini/${termin.id}`}>javnoj stranici</Link>.
        </p>
      )}

      {smije && (
        <div className="detalj radni">
          <div className="detalj-sadrzaj">
            <section className="detalj-blok">
              <span className="biljeska">
                {cekaju > 0 ? `${cekaju} čeka tvoju odluku!` : "tko ide s tobom"}
              </span>
              <h2>Prijave</h2>

              <p className="prigusen sitno">
                Popunjenost: {potvrdenih} od {kapacitet} mjesta · slobodno {kapacitet - potvrdenih}
              </p>
              {kapacitet > 0 && (
                <span className="popunjenost-traka" aria-hidden="true" style={{ maxWidth: "16rem" }}>
                  <span style={{ width: `${Math.round((potvrdenih / kapacitet) * 100)}%` }} />
                </span>
              )}

              {prijave.length === 0 && <p className="prazno">Još se nitko nije prijavio.</p>}

              <ul className="korisnik-registar">
                {prijave.map((prijava) => (
                  <li className="korisnik-red" key={prijava.id}>
                    <span className="korisnik-avatar" aria-hidden="true">
                      {prijava.korisnik.ime
                        .split(" ")
                        .map((rijec) => rijec[0])
                        .slice(0, 2)
                        .join("")}
                    </span>

                    <div>
                      <strong>{prijava.korisnik.ime}</strong>
                      {prijava.napomena && (
                        <p className="prigusen sitno">Napomena: {prijava.napomena}</p>
                      )}
                    </div>

                    <span
                      className={`zig zig-${prijava.status}`}
                      title={`Prijava ${NAZIV_STATUSA_PRIJAVE[prijava.status]}`}
                    >
                      <PostanskiZig natpis={NATPIS_ZIGA[prijava.status]} datum={`${dan}. ${mjesec}`} />
                    </span>

                    <div className="ruta-akcije">
                      {prijava.status !== "potvrdeno" && (
                        <button
                          type="button"
                          disabled={radi}
                          onClick={() =>
                            void izvedi(() =>
                              klijent.patch(`/api/prijave/${prijava.id}`, { status: "potvrdeno" }),
                            )
                          }
                        >
                          Odobri
                        </button>
                      )}
                      {prijava.status !== "odbijeno" && (
                        <button
                          type="button"
                          className="tiho"
                          disabled={radi}
                          onClick={() =>
                            void izvedi(() =>
                              klijent.patch(`/api/prijave/${prijava.id}`, { status: "odbijeno" }),
                            )
                          }
                        >
                          Odbij
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {termin.je_privatan && (
              <section className="detalj-blok">
                <span className="biljeska">samo preko poveznice</span>
                <h2>Privatna poveznica</h2>

                <p className="prigusen sitno">
                  Privatan izlet ne stoji u javnom popisu. Do njega se dolazi jedino ovom
                  poveznicom. Generiranje nove <strong>gasi prethodnu</strong>, pa svi kojima ste
                  staru poslali ostaju bez pristupa.
                </p>

                {poveznica === null ? (
                  <p className="prigusen">Poveznica još nije izdana.</p>
                ) : (
                  <>
                    <p className="sitno">
                      <code>{poveznica}</code>
                    </p>
                    <button
                      type="button"
                      className="tiho"
                      disabled={radi}
                      onClick={() => kopiraj(poveznica)}
                    >
                      {prepisano ? "Kopirano" : "Kopiraj poveznicu"}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  disabled={radi}
                  onClick={() => {
                    postaviPrepisano(false);
                    void izvedi(() => klijent.post(`/api/termini/${id}/privatni-link`));
                  }}
                >
                  {poveznica === null ? "Generiraj poveznicu" : "Generiraj novu poveznicu"}
                </button>
              </section>
            )}

            <section className="detalj-blok opasna-zona">
              <span className="biljeska">bez povratka</span>
              <h2>Konačne radnje</h2>

              {konacan && (
                <p className="prigusen">
                  Izlet je {termin.status === "zavrsen" ? "završen" : "otkazan"}. Oba su stanja
                  konačna, pa se status više ne mijenja.
                </p>
              )}

              {!konacan && potvrda !== "zavrsen" && potvrda !== "otkazan" && (
                <div className="ruta-akcije">
                  <button type="button" disabled={radi} onClick={() => postaviPotvrdu("zavrsen")}>
                    Označi završenim
                  </button>
                  <button
                    type="button"
                    className="tiho"
                    disabled={radi}
                    onClick={() => postaviPotvrdu("otkazan")}
                  >
                    Otkaži izlet
                  </button>
                </div>
              )}

              {!konacan && (potvrda === "zavrsen" || potvrda === "otkazan") && (
                <Potvrda
                  radi={radi}
                  pitanje={
                    <>
                      {potvrda === "zavrsen"
                        ? "Označiti izlet završenim? Nakon toga se sudionici više ne mogu odjaviti, a oni s potvrđenom prijavom mogu napisati recenziju."
                        : "Otkazati izlet? Prijave ostaju zapisane, ali se izlet više ne održava."}{" "}
                      Oba su stanja konačna i ne mogu se poništiti.
                    </>
                  }
                  potvrdi={potvrda === "zavrsen" ? "Da, označi završenim" : "Da, otkaži izlet"}
                  naPotvrdu={() => {
                    const status = potvrda;
                    postaviPotvrdu(null);
                    void izvedi(() => klijent.patch(`/api/termini/${id}/status`, { status }));
                  }}
                  naOdustajanje={() => postaviPotvrdu(null)}
                />
              )}

              <div className="opasna-crta">
                {potvrda === "brisanje" ? (
                  <Potvrda
                    radi={radi}
                    pitanje={
                      <>
                        Brisanjem izleta nestaju i <strong>sve prijave</strong> na njega i{" "}
                        <strong>sve recenzije</strong> koje su sudionici napisali. To se ne može
                        poništiti.
                      </>
                    }
                    potvrdi="Da, obriši izlet s prijavama i recenzijama"
                    naPotvrdu={() => void obrisi()}
                    naOdustajanje={() => postaviPotvrdu(null)}
                  />
                ) : (
                  <button
                    type="button"
                    className="tiho"
                    disabled={radi}
                    onClick={() => postaviPotvrdu("brisanje")}
                  >
                    Obriši izlet
                  </button>
                )}
              </div>
            </section>
          </div>

          <aside className="prijavnica">
            <div className="prijavnica-vrh">
              <span className="biljeska">podaci o izletu</span>
              <p>Ruta, datum, mjesta i vidljivost.</p>
            </div>

            <section className="kartica">
              <ObrazacTermina
                rute={rute}
                pocetni={{
                  ruta_id: termin.ruta.id,
                  datum: termin.datum,
                  kapacitet: termin.kapacitet,
                  je_privatan: termin.je_privatan,
                }}
                natpis="Spremi izmjene"
                radi={radi}
                poPolju={poPolju}
                naSpremi={(podaci: PodaciTermina) =>
                  void izvedi(() => klijent.put(`/api/termini/${id}`, podaci))
                }
              />
            </section>
          </aside>
        </div>
      )}
    </>
  );
}

export default function UpravljanjeTerminom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <Sadrzaj id={Number(id)} />;
}
