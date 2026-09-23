"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { koristiIdentitet } from "../../lib/auth";
import { GreskaZahtjeva, type ProblemPolja } from "../../lib/klijent";

function Sadrzaj() {
  const { klijent } = koristiIdentitet();
  const kod = useSearchParams().get("kod");

  const [lozinka, postaviLozinku] = useState("");
  const [greska, postaviGresku] = useState<string | null>(null);
  const [poPolju, postaviPoPolju] = useState<string | null>(null);
  const [salje, postaviSalje] = useState(false);
  const [gotovo, postaviGotovo] = useState(false);

  function poruka(problem: GreskaZahtjeva): string {
    if (problem.kod === "KOD_ISTEKAO") {
      return "Poveznica je istekla. Zatražite novu i pokušajte ponovno.";
    }

    return "Poveznica nije ispravna ili je već iskorištena.";
  }

  async function posalji(dogadaj: React.FormEvent) {
    dogadaj.preventDefault();
    postaviGresku(null);
    postaviPoPolju(null);
    postaviSalje(true);

    try {
      await klijent.post("/api/auth/nova-lozinka", { kod, lozinka });
      postaviGotovo(true);
    } catch (problem) {
      if (problem instanceof GreskaZahtjeva) {
        const poljeLozinke = problem.detalji?.find((d: ProblemPolja) => d.polje === "lozinka");

        if (poljeLozinke) postaviPoPolju(poljeLozinke.poruka);
        else postaviGresku(poruka(problem));
      } else {
        postaviGresku("Promjena trenutno nije moguća. Pokušajte za koji trenutak.");
      }
    } finally {
      postaviSalje(false);
    }
  }

  if (!kod) {
    return (
      <div className="poruka">
        <h1>Poveznica nije potpuna</h1>
        <p>
          Otvorite poveznicu iz e-maila u cijelosti, ili{" "}
          <Link href="/zaboravljena-lozinka">zatražite novu</Link>.
        </p>
      </div>
    );
  }

  if (gotovo) {
    return (
      <div className="poruka">
        <h1>Lozinka je promijenjena</h1>
        <p>
          Iz sigurnosnih razloga <strong>odjavljeni ste sa svih uređaja</strong>, pa se prijavite
          novom lozinkom.
        </p>
        <p>
          <Link href="/prijava">Prijava</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="usko">
      <h1>Nova lozinka</h1>

      <form onSubmit={(d) => void posalji(d)}>
        <label htmlFor="lozinka">Nova lozinka</label>
        <input
          id="lozinka"
          type="password"
          autoComplete="new-password"
          required
          value={lozinka}
          onChange={(d) => postaviLozinku(d.target.value)}
        />
        <p className="prigusen sitno">Najmanje 10 znakova.</p>
        {poPolju && <p className="greska-polja">{poPolju}</p>}

        {greska && <p className="greska">{greska}</p>}

        <button type="submit" disabled={salje}>
          {salje ? "Spremanje…" : "Postavi lozinku"}
        </button>
      </form>
    </div>
  );
}

export default function NovaLozinka() {
  return (
    <Suspense fallback={<p className="prigusen">Učitavanje…</p>}>
      <Sadrzaj />
    </Suspense>
  );
}
