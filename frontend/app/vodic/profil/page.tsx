"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { koristiIdentitet } from "../../../lib/auth";
import type { Organizator } from "../../../lib/javno";
import { uPoruku } from "../../../lib/poruke";
import { koristiRadnju } from "../../../lib/radnja";
import { ZnakAlpire } from "../../komponente/znak";

export default function ProfilVodica() {
  const { klijent, korisnik } = koristiIdentitet();
  const korisnikId = korisnik?.id;

  const [bio, postaviBio] = useState("");
  const [certifikati, postaviCertifikate] = useState("");
  const [ime, postaviIme] = useState<string | null>(null);
  const [ucitava, postaviUcitava] = useState(true);
  const [spremljeno, postaviSpremljeno] = useState(false);
  const [nedostupno, postaviNedostupno] = useState<string | null>(null);

  const dohvati = useCallback(async () => {
    try {
      const odgovor = await klijent.get<{ organizator: Organizator }>("/api/organizatori/moj");

      postaviBio(odgovor.organizator.bio ?? "");
      postaviCertifikate(odgovor.organizator.certifikati ?? "");
      postaviNedostupno(null);

      if (odgovor.organizator.ime) {
        postaviIme(odgovor.organizator.ime);
      } else {
        try {
          const { termini } = await klijent.get<{ termini: { vodic: { id: number; ime: string } }[] }>(
            "/api/termini",
          );
          const moj = termini.find((termin) => termin.vodic.id === korisnikId);
          postaviIme(moj?.vodic.ime ?? null);
        } catch {
          postaviIme(null);
        }
      }
    } catch (problem) {
      postaviNedostupno(uPoruku(problem));
    } finally {
      postaviUcitava(false);
    }
  }, [klijent, korisnikId]);

  const { izvedi, radi, greska, poPolju } = koristiRadnju();

  useEffect(() => {
    void dohvati();
  }, [dohvati]);

  function spremi() {
    postaviSpremljeno(false);

    void izvedi(async () => {
      await klijent.put("/api/organizatori/moj", {
        bio: bio.trim() === "" ? null : bio,
        certifikati: certifikati.trim() === "" ? null : certifikati,
      });

      postaviSpremljeno(true);
    });
  }

  const [prvoIme, prezime] = (ime ?? "").split(" ");
  const potpis = ime ? (prezime ? `${prvoIme} ${prezime[0]}.` : prvoIme) : "tvoj potpis";
  const inicijali = ime
    ? ime
        .split(" ")
        .map((rijec) => rijec[0])
        .slice(0, 2)
        .join("")
    : "?";

  return (
    <>
      <span className="biljeska">kako te vide sudionici</span>
      <h1>Profil vodiča</h1>

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
        <Link href="/vodic/rute" className="admin-poveznica">
          <span>
            <h3>Katalog ruta</h3>
            <p>Dodavanje i uređivanje staza.</p>
          </span>
          <svg viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <path d="M1 6h13m0 0L9.5 1.5M14 6l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </nav>

      {nedostupno && <p className="greska">{nedostupno}</p>}

      <div className="detalj">
        <div className="detalj-sadrzaj">
          <section className="detalj-blok">
            <span className="biljeska">živi pregled</span>
            <h2>Tvoja iskaznica</h2>
            <p>
              Ovako izgledaš uz svaki svoj izlet. Pregled se mijenja dok tipkaš. Prazan profil
              ništa ne sprječava: izlete možeš zakazivati i bez njega.
            </p>

            <article className="iskaznica">
              <header className="iskaznica-zaglavlje">
                <span className="marka">
                  <ZnakAlpire />
                  <span>Alpira · vodič</span>
                </span>
                <span>Pregled</span>
              </header>

              <div className="iskaznica-tijelo">
                <span className="iskaznica-foto" aria-hidden="true">
                  {inicijali}
                </span>
                <div>
                  <h3>{ime ?? "Vodič"}</h3>
                  {certifikati.trim() !== "" ? (
                    <p className="iskaznica-ovjera">{certifikati} ✓</p>
                  ) : (
                    <p className="iskaznica-ovjera neovjereno">bez certifikata</p>
                  )}
                  <p className="iskaznica-bio">
                    {bio.trim() !== "" ? bio : "Ovdje će stajati tvoja kratka biografija."}
                  </p>
                </div>
              </div>

              <footer className="iskaznica-dno blizu">
                <span className="biljeska iskaznica-potpis" aria-hidden="true">
                  {potpis}
                </span>
              </footer>
            </article>
          </section>
        </div>

        <aside className="prijavnica">
          <div className="prijavnica-vrh">
            <span className="biljeska">uredi profil</span>
            <p>Bio i certifikati stoje uz svaki tvoj izlet.</p>
          </div>

          <section className="kartica">
            {ucitava ? (
              <p className="prigusen">Učitavanje…</p>
            ) : (
              <form
                onSubmit={(dogadaj) => {
                  dogadaj.preventDefault();
                  spremi();
                }}
              >
                <label htmlFor="bio">Kratka biografija</label>
                <input
                  id="bio"
                  value={bio}
                  onChange={(dogadaj) => postaviBio(dogadaj.target.value)}
                  placeholder="npr. Vodim ture po Velebitu od 2015."
                />
                {poPolju.bio && <p className="greska-polja">{poPolju.bio}</p>}

                <label htmlFor="certifikati">Certifikati</label>
                <input
                  id="certifikati"
                  value={certifikati}
                  onChange={(dogadaj) => postaviCertifikate(dogadaj.target.value)}
                  placeholder="npr. HPS licenca za gorskog vodiča"
                />
                {poPolju.certifikati && <p className="greska-polja">{poPolju.certifikati}</p>}

                <button type="submit" disabled={radi}>
                  {radi ? "Spremanje…" : "Spremi profil"}
                </button>
              </form>
            )}

            {spremljeno && <p className="prigusen">Profil je spremljen.</p>}
            {greska && <p className="greska">{greska}</p>}
          </section>
        </aside>
      </div>
    </>
  );
}
