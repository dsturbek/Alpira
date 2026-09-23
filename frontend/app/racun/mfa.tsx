"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { koristiIdentitet } from "../../lib/auth";
import { GreskaZahtjeva } from "../../lib/klijent";

type Faza = "iskljucen" | "priprema" | "ukljucen";

export function Mfa({ pocetnoUkljucen }: { pocetnoUkljucen: boolean }) {
  const { klijent } = koristiIdentitet();

  const [faza, postaviFazu] = useState<Faza>(pocetnoUkljucen ? "ukljucen" : "iskljucen");
  const [tajna, postaviTajnu] = useState<string | null>(null);
  const [slika, postaviSliku] = useState<string | null>(null);
  const [kod, postaviKod] = useState("");
  const [lozinka, postaviLozinku] = useState("");
  const [greska, postaviGresku] = useState<string | null>(null);
  const [radi, postaviRadi] = useState(false);

  async function pripremi() {
    postaviGresku(null);
    postaviRadi(true);

    try {
      const odgovor = await klijent.post<{ tajna: string; uri: string }>("/api/auth/mfa/priprema");
      postaviTajnu(odgovor.tajna);

      postaviSliku(await QRCode.toDataURL(odgovor.uri, { margin: 1, width: 200 }));
      postaviFazu("priprema");
    } catch {
      postaviGresku("Priprema trenutno nije moguća.");
    } finally {
      postaviRadi(false);
    }
  }

  async function potvrdi(dogadaj: React.FormEvent) {
    dogadaj.preventDefault();
    postaviGresku(null);
    postaviRadi(true);

    try {
      await klijent.post("/api/auth/mfa/potvrda", { kod });
      postaviFazu("ukljucen");
      postaviTajnu(null);
      postaviSliku(null);
      postaviKod("");
    } catch (problem) {
      postaviGresku(
        problem instanceof GreskaZahtjeva
          ? "Kod nije ispravan. Provjerite je li tajna dobro prepisana."
          : "Potvrda trenutno nije moguća.",
      );
    } finally {
      postaviRadi(false);
    }
  }

  async function iskljuci(dogadaj: React.FormEvent) {
    dogadaj.preventDefault();
    postaviGresku(null);
    postaviRadi(true);

    try {
      await klijent.post("/api/auth/mfa/iskljucivanje", { lozinka });
      postaviFazu("iskljucen");
      postaviLozinku("");
    } catch (problem) {
      postaviGresku(
        problem instanceof GreskaZahtjeva && problem.status === 401
          ? "Lozinka nije ispravna."
          : "Isključivanje trenutno nije moguće.",
      );
    } finally {
      postaviRadi(false);
    }
  }

  return (
    <section className="kartica">
      <h2>Dvofaktorska prijava</h2>

      {faza === "iskljucen" && (
        <>
          <p className="prigusen">
            Uz drugi faktor ukradena lozinka nije dovoljna za ulazak u račun.
          </p>

          <p className="upozorenje-okvir">
            Rezervnih kodova nema. Ako izgubite uređaj s aplikacijom, u račun se
            nećete moći vratiti sami, trebat će vam Admin.
          </p>

          <button type="button" onClick={() => void pripremi()} disabled={radi}>
            {radi ? "Priprema…" : "Uključi dvofaktorsku prijavu"}
          </button>
        </>
      )}

      {faza === "priprema" && (
        <>
          <p>Skenirajte kod aplikacijom za autentikaciju, pa upišite šest znamenki koje pokaže.</p>

          {slika && <img src={slika} alt="QR kod za aplikaciju" width={200} height={200} />}

          <p className="prigusen sitno">
            Ili upišite tajnu ručno: <code>{tajna}</code>
          </p>

          <p className="prigusen sitno">Dvofaktorska prijava još nije uključena.</p>

          <form onSubmit={(d) => void potvrdi(d)}>
            <label htmlFor="mfa-kod">Kod iz aplikacije</label>
            <input
              id="mfa-kod"
              inputMode="numeric"
              maxLength={6}
              required
              value={kod}
              onChange={(d) => postaviKod(d.target.value)}
            />
            <button type="submit" disabled={radi}>
              {radi ? "Provjera…" : "Potvrdi i uključi"}
            </button>
          </form>
        </>
      )}

      {faza === "ukljucen" && (
        <>
          <p>Dvofaktorska prijava je uključena.</p>

          <form onSubmit={(d) => void iskljuci(d)}>
            <label htmlFor="mfa-lozinka">Lozinka</label>
            <input
              id="mfa-lozinka"
              type="password"
              autoComplete="current-password"
              required
              value={lozinka}
              onChange={(d) => postaviLozinku(d.target.value)}
            />
            <button type="submit" disabled={radi}>
              {radi ? "Isključivanje…" : "Isključi dvofaktorsku prijavu"}
            </button>
          </form>
        </>
      )}

      {greska && <p className="greska">{greska}</p>}
    </section>
  );
}
