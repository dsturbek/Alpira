"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { koristiIdentitet } from "../../lib/auth";
import { GreskaZahtjeva } from "../../lib/klijent";

type Ishod = "traje" | "uspjeh" | "istekao" | "neispravan" | "problem" | "cekaKod";

function Sadrzaj() {
  const { klijent, korisnik, osvjeziIdentitet } = koristiIdentitet();
  const parametri = useSearchParams();
  const kod = parametri.get("kod");

  const [ishod, postaviIshod] = useState<Ishod>(kod ? "traje" : "cekaKod");
  const [rucniKod, postaviRucniKod] = useState("");
  const [salje, postaviSalje] = useState(false);
  const poslano = useRef(false);

  async function posalji(kodZaSlanje: string) {
    try {
      await klijent.post("/api/auth/verifikacija", { kod: kodZaSlanje });
      postaviIshod("uspjeh");

      if (korisnik) await osvjeziIdentitet().catch(() => undefined);
    } catch (problem) {
      if (problem instanceof GreskaZahtjeva) {
        postaviIshod(problem.kod === "KOD_ISTEKAO" ? "istekao" : "neispravan");
      } else {
        postaviIshod("problem");
      }
    }
  }

  useEffect(() => {
    if (!kod || poslano.current) return;
    poslano.current = true;

    void posalji(kod);
  }, [kod]);

  async function rucnaPotvrda(dogadaj: React.FormEvent) {
    dogadaj.preventDefault();
    postaviSalje(true);
    postaviIshod("traje");

    await posalji(rucniKod.trim());
    postaviSalje(false);
  }

  if (ishod === "traje") {
    return <p className="prigusen">Potvrđujemo adresu…</p>;
  }

  if (ishod === "uspjeh") {
    return (
      <div className="poruka">
        <h1>Adresa je potvrđena</h1>
        <p>Račun je sada potpun. Možete se prijaviti na izlete i pisati Recenzije.</p>
        <p>
          <Link href="/termini">Pregledaj izlete</Link>
        </p>
      </div>
    );
  }

  const obrazac = (
    <form onSubmit={(d) => void rucnaPotvrda(d)}>
      <label htmlFor="rucni-kod">Kod iz poruke</label>
      <input
        id="rucni-kod"
        required
        autoFocus
        value={rucniKod}
        onChange={(d) => postaviRucniKod(d.target.value)}
      />
      <button type="submit" disabled={salje || rucniKod.trim().length === 0}>
        {salje ? "Provjera…" : "Potvrdi adresu"}
      </button>
    </form>
  );

  if (ishod === "cekaKod") {
    return (
      <div className="poruka">
        <h1>Potvrda e-mail adrese</h1>
        <p>Prepišite kod iz poruke koju smo poslali na vašu adresu.</p>
        {obrazac}
      </div>
    );
  }

  return (
    <div className="poruka">
      <h1>Potvrda nije uspjela</h1>
      <p>
        {ishod === "istekao"
          ? "Kod je istekao. Zatražite novi iz svog računa i pokušajte ponovno."
          : ishod === "neispravan"
            ? "Kod nije prepoznat. Ako ste otvorili poveznicu iz poruke, mogla se prelomiti. Prepišite kod ručno."
            : "Potvrda trenutno nije moguća. Pokušajte za koji trenutak."}
      </p>
      {ishod !== "istekao" && obrazac}
      {korisnik && (
        <p>
          <Link href="/racun">Zatraži novi kod</Link>
        </p>
      )}
    </div>
  );
}

export default function Potvrda() {
  return (
    <Suspense fallback={<p className="prigusen">Učitavanje…</p>}>
      <Sadrzaj />
    </Suspense>
  );
}
