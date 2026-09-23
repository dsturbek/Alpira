"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { imaBarem, koristiIdentitet } from "../../lib/auth";
import { NAZIV_ULOGE } from "../../lib/nazivi";
import { ZnakAlpire } from "./znak";

export function Zaglavlje() {
  const { korisnik, ucitava, odjaviSe } = koristiIdentitet();
  const usmjerivac = useRouter();
  const putanja = usePathname();

  async function odjava() {
    await odjaviSe();
    usmjerivac.push("/");
    usmjerivac.refresh();
  }

  function razred(put: string): string | undefined {
    return putanja === put || putanja.startsWith(`${put}/`) ? "aktivna" : undefined;
  }

  return (
    <header className="zaglavlje">
      <Link href="/" className="marka">
        <ZnakAlpire />
        <span className="logo">Alpira</span>
      </Link>

      <nav>
        <Link href="/rute" className={razred("/rute")}>
          Rute
        </Link>
        <Link href="/termini" className={razred("/termini")}>
          Raspored
        </Link>
        <Link href="/galerija" className={razred("/galerija")}>
          Galerija
        </Link>
        {korisnik && (
          <Link href="/prijave" className={razred("/prijave")}>
            Moje prijave
          </Link>
        )}
        {imaBarem(korisnik, "Vodic") && (
          <Link href="/vodic" className={razred("/vodic")}>
            Moji izleti
          </Link>
        )}
        {imaBarem(korisnik, "Admin") && (
          <Link href="/admin" className={razred("/admin")}>
            Administracija
          </Link>
        )}
      </nav>

      <div className="identitet">
        {ucitava && <span className="prigusen">…</span>}

        {!ucitava && korisnik && (
          <>
            {!korisnik.email_verificiran && (
              <Link href="/racun" className="upozorenje-oznaka">
                adresa nije potvrđena
              </Link>
            )}
            <span className="racun-grupa">
              <Link href="/racun" className="racun-cip">
                <span className="racun-ikona" aria-hidden="true">
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
                {NAZIV_ULOGE[korisnik.uloga]}
              </Link>
              <button
                type="button"
                className="odjava"
                aria-label="Odjava"
                title="Odjava"
                onClick={() => void odjava()}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M14 4H6v16h8M11 12h9m0 0-3.5-3.5M20 12l-3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </span>
          </>
        )}

        {!ucitava && !korisnik && (
          <>
            <Link href="/prijava" className={razred("/prijava")}>
              Prijava
            </Link>
            <Link href="/registracija" className="gumb mala">
              Registracija
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
