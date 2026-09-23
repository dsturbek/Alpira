"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { koristiIdentitet } from "../../../lib/auth";
import { potrosiStanje, zaboraviStanje } from "../../../lib/google";
import { GreskaZahtjeva } from "../../../lib/klijent";
import { uPoruku } from "../../../lib/poruke";

function uPorukuPovratka(problem: unknown): string {
  if (problem instanceof GreskaZahtjeva && problem.kod === "NEISPRAVNI_PODACI_PRIJAVE") {
    return "Google nije potvrdio ovu prijavu. Pokušajte ponovno.";
  }

  return uPoruku(problem);
}

export default function PovratakSGooglea() {
  const { prijaviGoogleom, dovrsiMfa } = koristiIdentitet();
  const usmjerivac = useRouter();

  const [greska, postaviGresku] = useState<string | null>(null);
  const [prijelazni, postaviPrijelazni] = useState<string | null>(null);
  const [kod, postaviKod] = useState("");
  const [salje, postaviSalje] = useState(false);

  const obradeno = useRef(false);

  useEffect(() => {
    if (obradeno.current) return;
    obradeno.current = true;

    const parametri = new URLSearchParams(window.location.search);
    const kodPovratka = parametri.get("code");
    const odbijenicaGooglea = parametri.get("error");
    const stanje = parametri.get("state");

    window.history.replaceState(null, "", "/prijava/google");

    if (odbijenicaGooglea || !kodPovratka) {
      zaboraviStanje();
      usmjerivac.replace("/prijava");
      return;
    }

    if (!potrosiStanje(stanje)) {
      postaviGresku(
        "Povratak s Googlea ne odgovara prijavi koju ste započeli na ovom uređaju. Pokušajte ponovno.",
      );
      return;
    }

    void prijaviGoogleom(kodPovratka).then(
      (ishod) => {
        if (ishod.trebaMfa) {
          postaviPrijelazni(ishod.prijelazniToken);
          return;
        }

        usmjerivac.replace("/");
        usmjerivac.refresh();
      },
      (problem: unknown) => postaviGresku(uPorukuPovratka(problem)),
    );
  }, [prijaviGoogleom, usmjerivac]);

  async function drugiKorak(dogadaj: React.FormEvent, kodZaSlanje = kod) {
    dogadaj.preventDefault();
    postaviGresku(null);
    postaviSalje(true);

    try {
      await dovrsiMfa(prijelazni!, kodZaSlanje);
      usmjerivac.replace("/");
      usmjerivac.refresh();
    } catch (problem) {
      postaviGresku(uPoruku(problem));
      postaviKod("");
    } finally {
      postaviSalje(false);
    }
  }

  if (greska) {
    return (
      <div className="usko">
        <h1>Prijava Googleom nije uspjela</h1>
        <p className="greska">{greska}</p>
        <p>
          <Link href="/prijava">Natrag na prijavu</Link>
        </p>
      </div>
    );
  }

  if (prijelazni) {
    return (
      <div className="usko">
        <h1>Drugi korak</h1>
        <p className="prigusen">
          Ovaj račun traži kod iz aplikacije za autentikaciju i pri prijavi Googleom.
        </p>

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

          <button type="submit" disabled={salje}>
            {salje ? "Provjera…" : "Prijavi se"}
          </button>
        </form>

        <p className="sitno">
          <Link href="/prijava">Odustani</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="usko">
      <h1>Prijava Googleom</h1>
      <p className="prigusen">Dovršavanje prijave…</p>
    </div>
  );
}
