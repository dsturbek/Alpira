"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { koristiIdentitet } from "../../../lib/auth";
import type { Ruta, Tezina } from "../../../lib/javno";
import { OznakaTezine, slikaRute } from "../../komponente/tezina";
import { jeAdmin } from "../../../lib/ovlasti";
import type { PoPolju } from "../../../lib/poruke";
import { uPoruku } from "../../../lib/poruke";
import { koristiRadnju } from "../../../lib/radnja";
import { Potvrda } from "../../komponente/potvrda";

const TEZINE: Tezina[] = ["lagana", "srednja", "zahtjevna"];

type PodaciRute = { naziv: string; opis: string | null; tezina: Tezina };

function ObrazacRute({
  pocetna,
  natpis,
  radi,
  poPolju,
  naSpremi,
  naOdustajanje,
}: {
  pocetna?: Ruta;
  natpis: string;
  radi: boolean;
  poPolju: PoPolju;

  naSpremi: (podaci: PodaciRute) => Promise<boolean>;
  naOdustajanje?: () => void;
}) {
  const [naziv, postaviNaziv] = useState(pocetna?.naziv ?? "");
  const [opis, postaviOpis] = useState(pocetna?.opis ?? "");
  const [tezina, postaviTezinu] = useState<Tezina>(pocetna?.tezina ?? "srednja");

  const jeNova = pocetna === undefined;

  return (
    <form
      onSubmit={(dogadaj) => {
        dogadaj.preventDefault();

        void naSpremi({ naziv, opis: opis.trim() === "" ? null : opis, tezina }).then((uspjelo) => {

          if (uspjelo && jeNova) {
            postaviNaziv("");
            postaviOpis("");
          }
        });
      }}
    >
      <label htmlFor="ruta-naziv">Naziv</label>
      <input
        id="ruta-naziv"
        required
        maxLength={255}
        value={naziv}
        onChange={(dogadaj) => postaviNaziv(dogadaj.target.value)}
        placeholder="npr. Bijele stijene"
      />
      {poPolju.naziv && <p className="greska-polja">{poPolju.naziv}</p>}

      <label htmlFor="ruta-opis">Opis (neobavezno)</label>
      <input id="ruta-opis" value={opis} onChange={(dogadaj) => postaviOpis(dogadaj.target.value)} />
      {poPolju.opis && <p className="greska-polja">{poPolju.opis}</p>}

      <label htmlFor="ruta-tezina">Težina</label>
      <select
        id="ruta-tezina"
        value={tezina}
        onChange={(dogadaj) => postaviTezinu(dogadaj.target.value as Tezina)}
      >
        {TEZINE.map((vrijednost) => (
          <option key={vrijednost} value={vrijednost}>
            {vrijednost}
          </option>
        ))}
      </select>
      {poPolju.tezina && <p className="greska-polja">{poPolju.tezina}</p>}

      <button type="submit" disabled={radi}>
        {radi ? "Spremanje…" : natpis}
      </button>

      {naOdustajanje && (
        <button type="button" className="tiho" disabled={radi} onClick={naOdustajanje}>
          Odustani
        </button>
      )}
    </form>
  );
}

export default function KatalogRuta() {
  const { klijent, korisnik } = koristiIdentitet();

  const [rute, postaviRute] = useState<Ruta[]>([]);
  const [ucitava, postaviUcitava] = useState(true);
  const [nedostupno, postaviNedostupno] = useState<string | null>(null);
  const [rutaUUredivanju, postaviUredivanje] = useState<number | null>(null);
  const [rutaZaBrisanje, postaviBrisanje] = useState<number | null>(null);

  const smijeOdrzavati = jeAdmin(korisnik);

  const dohvati = useCallback(async () => {
    try {
      const odgovor = await klijent.get<{ rute: Ruta[] }>("/api/rute");
      postaviRute(odgovor.rute);
      postaviNedostupno(null);
    } catch (problem) {
      postaviNedostupno(uPoruku(problem));
    } finally {
      postaviUcitava(false);
    }
  }, [klijent]);

  const unos = koristiRadnju(dohvati);
  const odrzavanje = koristiRadnju(dohvati);

  useEffect(() => {
    void dohvati();
  }, [dohvati]);

  async function odrzi(radnja: () => Promise<unknown>): Promise<boolean> {
    const uspjelo = await odrzavanje.izvedi(radnja);

    if (uspjelo) {
      postaviUredivanje(null);
      postaviBrisanje(null);
    }

    return uspjelo;
  }

  return (
    <>
      <span className="biljeska">zajedničke staze</span>
      <h1>Katalog ruta</h1>

      <nav className="admin-poveznice" aria-label="Vodičke sekcije">
        <Link href="/vodic" className="admin-poveznica">
          <span>
            <h3>Moji izleti</h3>
            <p>Raspored i zakazivanje termina.</p>
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

      {nedostupno && <p className="greska">{nedostupno}</p>}

      <div className="detalj radni">
        <div className="detalj-sadrzaj">
          <section className="detalj-blok">
            <span className="biljeska">svaka staza jednom</span>
            <h2>Sve rute</h2>

            {ucitava && <p className="prigusen">Učitavanje…</p>}
            {!ucitava && rute.length === 0 && <p className="prazno">Katalog je još prazan.</p>}

            {!smijeOdrzavati && rute.length > 0 && (
              <p className="prigusen sitno">
                Rute su zajedničke svim vodičima, pa ih mijenja i briše samo administrator.
              </p>
            )}

            {odrzavanje.greska && <p className="greska">{odrzavanje.greska}</p>}

            <ul className="ruta-registar">
              {rute.map((ruta) => (
                <li className="ruta-red" key={ruta.id}>
                  {rutaUUredivanju === ruta.id ? (
                    <ObrazacRute
                      pocetna={ruta}
                      natpis="Spremi izmjene"
                      radi={odrzavanje.radi}
                      poPolju={odrzavanje.poPolju}
                      naOdustajanje={() => postaviUredivanje(null)}
                      naSpremi={(podaci) => odrzi(() => klijent.put(`/api/rute/${ruta.id}`, podaci))}
                    />
                  ) : (
                    <>
                      <span className="ruta-sličica" aria-hidden="true">
                        <Image src={slikaRute(ruta.id, ruta.tezina)} alt="" fill sizes="4rem" />
                      </span>

                      <div>
                        <strong>{ruta.naziv}</strong>{" "}
                        <OznakaTezine tezina={ruta.tezina} />
                        {ruta.opis && <p className="prigusen sitno">{ruta.opis}</p>}

                        {rutaZaBrisanje === ruta.id && (
                          <Potvrda
                            pitanje={`Obrisati rutu ${ruta.naziv} iz kataloga?`}
                            potvrdi="Da, obriši"
                            radi={odrzavanje.radi}
                            naPotvrdu={() => void odrzi(() => klijent.obrisi(`/api/rute/${ruta.id}`))}
                            naOdustajanje={() => postaviBrisanje(null)}
                          />
                        )}
                      </div>

                      {smijeOdrzavati && rutaZaBrisanje !== ruta.id && (
                        <div className="ruta-akcije">
                          <button
                            type="button"
                            disabled={odrzavanje.radi}
                            onClick={() => postaviUredivanje(ruta.id)}
                          >
                            Uredi
                          </button>
                          <button
                            type="button"
                            className="tiho"
                            disabled={odrzavanje.radi}
                            onClick={() => postaviBrisanje(ruta.id)}
                          >
                            Obriši
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="prijavnica">
          <div className="prijavnica-vrh">
            <span className="biljeska">nova staza</span>
            <p>Uneseš je jednom, a termine na njoj zakazuju svi vodiči.</p>
          </div>

          <section className="kartica">
            <ObrazacRute
              natpis="Unesi rutu"
              radi={unos.radi}
              poPolju={unos.poPolju}
              naSpremi={(podaci) => unos.izvedi(() => klijent.post("/api/rute", podaci))}
            />

            {unos.greska && <p className="greska">{unos.greska}</p>}
          </section>
        </aside>
      </div>
    </>
  );
}
