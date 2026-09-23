"use client";

import { useState } from "react";
import Link from "next/link";
import { koristiIdentitet } from "../../lib/auth";
import { razdvoji } from "../../lib/poruke";

export default function Registracija() {
  const { klijent } = koristiIdentitet();

  const [ime, postaviIme] = useState("");
  const [email, postaviEmail] = useState("");
  const [lozinka, postaviLozinku] = useState("");
  const [poPolju, postaviPoPolju] = useState<Record<string, string>>({});
  const [opcenita, postaviOpcenitu] = useState<string | null>(null);
  const [salje, postaviSalje] = useState(false);
  const [gotovo, postaviGotovo] = useState(false);

  async function posalji(dogadaj: React.FormEvent) {
    dogadaj.preventDefault();
    postaviPoPolju({});
    postaviOpcenitu(null);
    postaviSalje(true);

    try {
      await klijent.post("/api/auth/registracija", { ime, email, lozinka });
      postaviGotovo(true);
    } catch (problem) {
      const odbijenica = razdvoji(problem);
      postaviPoPolju(odbijenica.poPolju);
      postaviOpcenitu(odbijenica.opcenita);
    } finally {
      postaviSalje(false);
    }
  }

  if (gotovo) {
    return (
      <div className="usko">
        <h1>Račun je otvoren</h1>
        <p>
          Poslali smo poruku na <strong>{email}</strong>. Otvorite poveznicu iz nje da potvrdite
          adresu.
        </p>
        <p className="prigusen">
          Do potvrde možete pregledavati Rute i Termine, ali se ne možete prijaviti na izlet ni
          pisati Recenzije.
        </p>
        <p>
          <Link href="/prijava">Prijava</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="usko">
      <h1>Registracija</h1>

      <form onSubmit={(d) => void posalji(d)}>
        <label htmlFor="ime">Ime</label>
        <input id="ime" required value={ime} onChange={(d) => postaviIme(d.target.value)} />
        {poPolju.ime && <p className="greska-polja">{poPolju.ime}</p>}

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(d) => postaviEmail(d.target.value)}
        />
        {poPolju.email && <p className="greska-polja">{poPolju.email}</p>}

        <label htmlFor="lozinka">Lozinka</label>
        <input
          id="lozinka"
          type="password"
          autoComplete="new-password"
          required
          value={lozinka}
          onChange={(d) => postaviLozinku(d.target.value)}
        />
        <p className="prigusen sitno">Najmanje 10 znakova.</p>
        {poPolju.lozinka && <p className="greska-polja">{poPolju.lozinka}</p>}

        {opcenita && <p className="greska">{opcenita}</p>}

        <button type="submit" disabled={salje}>
          {salje ? "Otvaranje računa…" : "Otvori račun"}
        </button>
      </form>
    </div>
  );
}
