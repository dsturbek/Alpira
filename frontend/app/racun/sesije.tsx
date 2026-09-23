"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { koristiIdentitet } from "../../lib/auth";

type Sesija = {
  id: number;
  created_at: string;
  istice: string;
  trenutna: boolean;
};

function trenutak(iso: string): string {
  const d = new Date(iso);
  const dvoznamenkasto = (broj: number) => String(broj).padStart(2, "0");

  return `${dvoznamenkasto(d.getDate())}.${dvoznamenkasto(d.getMonth() + 1)}.${d.getFullYear()}. u ${dvoznamenkasto(d.getHours())}:${dvoznamenkasto(d.getMinutes())}`;
}

export function Sesije() {
  const { klijent, odjaviSe } = koristiIdentitet();
  const usmjerivac = useRouter();

  const [sesije, postaviSesije] = useState<Sesija[]>([]);
  const [greska, postaviGresku] = useState<string | null>(null);
  const [ucitava, postaviUcitava] = useState(true);

  const dohvati = useCallback(async () => {
    try {
      const odgovor = await klijent.get<{ sesije: Sesija[] }>("/api/auth/sesije");
      postaviSesije(odgovor.sesije);
    } catch {
      postaviGresku("Popis sesija trenutno nije dostupan.");
    } finally {
      postaviUcitava(false);
    }
  }, [klijent]);

  useEffect(() => {
    void dohvati();
  }, [dohvati]);

  async function opozovi(sesija: Sesija) {
    postaviGresku(null);

    try {
      await klijent.obrisi(`/api/auth/sesije/${sesija.id}`);

      if (sesija.trenutna) {
        await odjaviSe();
        usmjerivac.push("/prijava");
        return;
      }

      await dohvati();
    } catch {
      postaviGresku("Opoziv trenutno nije moguć.");
    }
  }

  async function odjaviSvugdje() {
    try {
      await klijent.post("/api/auth/odjava-svugdje");
    } finally {
      await odjaviSe();
      usmjerivac.push("/prijava");
    }
  }

  return (
    <section className="kartica">
      <h2>Prijavljeni uređaji</h2>

      {ucitava && <p className="prigusen">Učitavanje…</p>}
      {greska && <p className="greska">{greska}</p>}

      {!ucitava && sesije.length > 0 && (
        <ul className="popis-sesija">
          {sesije.map((sesija) => (
            <li key={sesija.id}>
              <div>
                <strong>{trenutak(sesija.created_at)}</strong>
                {sesija.trenutna && <span className="oznaka">ovaj uređaj</span>}
                <p className="prigusen sitno">Vrijedi do {trenutak(sesija.istice)}</p>
              </div>

              <button type="button" className="tiho" onClick={() => void opozovi(sesija)}>
                Opozovi
              </button>
            </li>
          ))}
        </ul>
      )}

      {!ucitava && sesije.length > 1 && (
        <button type="button" onClick={() => void odjaviSvugdje()}>
          Odjavi me sa svih uređaja
        </button>
      )}
    </section>
  );
}
