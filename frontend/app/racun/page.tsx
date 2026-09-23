"use client";

import { useEffect, useState } from "react";
import { koristiIdentitet, type Uloga } from "../../lib/auth";
import { NAZIV_ULOGE } from "../../lib/nazivi";
import { Zasticeno } from "../komponente/zastita";
import { ZnakAlpire } from "../komponente/znak";
import { Mfa } from "./mfa";
import { Sesije } from "./sesije";

const OPIS_ULOGE: Record<Uloga, string> = {
  Sudionik: "Prijavljuješ se na termine i pišeš recenzije nakon izleta.",
  Vodic: "Kreiraš i vodiš termine te osobno potvrđuješ prijave.",
  Admin: "Uređuješ bilo koji termin i upravljaš korisnicima i ulogama.",
};

function Sadrzaj() {
  const { klijent, korisnik } = koristiIdentitet();

  const [poruka, postaviPoruku] = useState<string | null>(null);
  const [salje, postaviSalje] = useState(false);
  const [mfaAktivan, postaviMfa] = useState<boolean | null>(null);

  useEffect(() => {

    void klijent
      .get<{ mfaAktivan: boolean }>("/api/auth/mfa")
      .then((o) => postaviMfa(o.mfaAktivan))
      .catch(() => postaviMfa(false));
  }, [klijent]);

  async function posaljiNoviKod() {
    postaviPoruku(null);
    postaviSalje(true);

    try {
      await klijent.post("/api/auth/verifikacija/ponovno");
      postaviPoruku("Poslali smo novu poruku. Prethodni kod više ne vrijedi.");
    } catch {
      postaviPoruku("Slanje trenutno nije moguće. Pokušajte za koji trenutak.");
    } finally {
      postaviSalje(false);
    }
  }

  return (
    <>
      <span className="biljeska">tvoja iskaznica</span>
      <h1>Moj račun</h1>

      <div className="detalj">
        <div className="detalj-sadrzaj">
          {!korisnik?.email_verificiran && (
            <div className="poruka">
              <h2>Adresa još nije potvrđena</h2>
              <p>
                Do potvrde možete pregledavati Rute i Termine, ali se <strong>ne možete</strong>{" "}
                prijaviti na izlet, pisati Recenzije ni zakazivati Termine.
              </p>

              <button type="button" onClick={() => void posaljiNoviKod()} disabled={salje}>
                {salje ? "Slanje…" : "Pošalji novi kod"}
              </button>

              {poruka && <p className="prigusen">{poruka}</p>}
            </div>
          )}

          {mfaAktivan !== null && <Mfa pocetnoUkljucen={mfaAktivan} />}

          <Sesije />
        </div>

        {korisnik && (
          <aside>
            <article className="iskaznica">
              <header className="iskaznica-zaglavlje">
                <span className="marka">
                  <ZnakAlpire />
                  <span>Alpira · račun</span>
                </span>
                <span>Br. {String(korisnik.id).padStart(3, "0")}</span>
              </header>

              <div className="iskaznica-tijelo">
                <span className="iskaznica-foto" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M5 19.5c1.4-3.4 3.9-5.1 7-5.1s5.6 1.7 7 5.1"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div>
                  <h3>{NAZIV_ULOGE[korisnik.uloga]}</h3>
                  <p className={korisnik.email_verificiran ? "iskaznica-ovjera" : "iskaznica-ovjera neovjereno"}>
                    {korisnik.email_verificiran ? "e-adresa potvrđena ✓" : "adresa nije potvrđena"}
                  </p>
                  <p className="iskaznica-bio">{OPIS_ULOGE[korisnik.uloga]}</p>
                </div>
              </div>

              <footer className="iskaznica-dno blizu">
                <span className="biljeska iskaznica-potpis" aria-hidden="true">
                  sretno na stazi!
                </span>
              </footer>
            </article>
          </aside>
        )}
      </div>
    </>
  );
}

export default function Racun() {
  return (
    <Zasticeno najmanja="Sudionik">
      <Sadrzaj />
    </Zasticeno>
  );
}
