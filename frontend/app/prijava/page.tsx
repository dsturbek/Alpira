"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { koristiIdentitet } from "../../lib/auth";
import { koristiGoogleKonfiguraciju, posaljiNaGoogle } from "../../lib/google";
import { GreskaZahtjeva } from "../../lib/klijent";

export default function Prijava() {
  const { prijaviSe, dovrsiMfa } = koristiIdentitet();
  const usmjerivac = useRouter();

  const google = koristiGoogleKonfiguraciju();

  const [email, postaviEmail] = useState("");
  const [lozinka, postaviLozinku] = useState("");
  const [kod, postaviKod] = useState("");
  const [prekinut, postaviPrekinut] = useState(false);
  const [prijelazni, postaviPrijelazni] = useState<string | null>(null);
  const [greska, postaviGresku] = useState<string | null>(null);
  const [salje, postaviSalje] = useState(false);

  function uPoruku(problem: unknown): string {

    return problem instanceof GreskaZahtjeva
      ? problem.message
      : "Prijava trenutno nije moguća. Pokušajte ponovno.";
  }

  async function prviKorak(dogadaj: React.FormEvent) {
    dogadaj.preventDefault();
    postaviGresku(null);
    postaviSalje(true);

    try {
      const ishod = await prijaviSe(email, lozinka);

      if (ishod.trebaMfa) {
        postaviPrijelazni(ishod.prijelazniToken);
        return;
      }

      usmjerivac.push("/");
      usmjerivac.refresh();
    } catch (problem) {
      postaviGresku(uPoruku(problem));
    } finally {
      postaviSalje(false);
    }
  }

  async function drugiKorak(dogadaj: React.FormEvent, kodZaSlanje = kod) {
    dogadaj.preventDefault();
    postaviGresku(null);
    postaviSalje(true);

    try {
      await dovrsiMfa(prijelazni!, kodZaSlanje);
      usmjerivac.push("/");
      usmjerivac.refresh();
    } catch (problem) {
      postaviGresku(uPoruku(problem));
      postaviKod("");
    } finally {
      postaviSalje(false);
    }
  }

  if (prijelazni) {
    return (
      <div className="usko">
        <h1>Drugi korak</h1>
        <p className="prigusen">Upišite šest znamenki iz aplikacije za autentikaciju.</p>

        <form onSubmit={(d) => void drugiKorak(d)}>
          <label htmlFor="kod">Kod</label>
          <input
            id="kod"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            value={kod}
            onChange={(d) => {
              const znamenke = d.target.value.replace(/\D/g, "").slice(0, 6);
              postaviKod(znamenke);

              if (znamenke.length === 6 && !salje) {
                void drugiKorak(new Event("submit") as unknown as React.FormEvent, znamenke);
              }
            }}
          />

          {greska && <p className="greska">{greska}</p>}

          <button type="submit" disabled={salje}>
            {salje ? "Provjera…" : "Prijavi se"}
          </button>
        </form>

        <p className="sitno">
          <button
            type="button"
            className="tiho"
            onClick={() => {
              postaviPrijelazni(null);
              postaviPrekinut(true);
              postaviKod("");
            }}
          >
            Natrag na prijavu
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="usko">
      <h1>Prijava</h1>

      {prekinut && (
        <p className="prigusen">
          Drugi korak je prekinut. Prijavite se ponovno. Kod iz aplikacije traži
          se tek nakon lozinke.
        </p>
      )}

      <form onSubmit={(d) => void prviKorak(d)}>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(d) => postaviEmail(d.target.value)}
        />

        <label htmlFor="lozinka">Lozinka</label>
        <input
          id="lozinka"
          type="password"
          autoComplete="current-password"
          required
          value={lozinka}
          onChange={(d) => postaviLozinku(d.target.value)}
        />

        {greska && <p className="greska">{greska}</p>}

        <button type="submit" disabled={salje}>
          {salje ? "Prijava u tijeku…" : "Prijavi se"}
        </button>
      </form>

      {google?.dostupno && (
        <>
          <p className="prigusen sitno">ili</p>
          <button type="button" className="tiho" onClick={() => posaljiNaGoogle(google)}>
            Nastavi s Googleom
          </button>
        </>
      )}

      <p className="sitno">
        <Link href="/zaboravljena-lozinka">Zaboravljena lozinka?</Link>
        {" · "}
        <Link href="/registracija">Nemate račun?</Link>
      </p>
    </div>
  );
}
