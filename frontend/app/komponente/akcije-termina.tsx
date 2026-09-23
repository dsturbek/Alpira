"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { koristiIdentitet } from "../../lib/auth";
import type { Recenzija, Termin } from "../../lib/javno";
import { koristiRadnju } from "../../lib/radnja";
import { Potvrda } from "./potvrda";

type MojaPrijava = {
  id: number;
  termin_id: number;
  status: "na_cekanju" | "potvrdeno" | "odbijeno";
};

const OPIS_STATUSA: Record<MojaPrijava["status"], string> = {
  na_cekanju: "Vaša prijava čeka odluku Vodiča.",
  potvrdeno: "Vaša prijava je potvrđena, mjesto je vaše.",
  odbijeno: "Vodič je odbio vašu prijavu za ovaj izlet.",
};

export function AkcijeTermina({ termin }: { termin: Termin }) {
  const { klijent, korisnik, ucitava } = koristiIdentitet();
  const usmjerivac = useRouter();

  const [prijava, postaviPrijavu] = useState<MojaPrijava | null>(null);
  const [mojaRecenzija, postaviRecenziju] = useState<Recenzija | null>(null);
  const [uredujemRecenziju, postaviUredivanje] = useState(false);
  const [napomena, postaviNapomenu] = useState("");
  const [ocjena, postaviOcjenu] = useState(5);
  const [komentar, postaviKomentar] = useState("");
  const [spremno, postaviSpremno] = useState(false);

  const [potvrda, postaviPotvrdu] = useState<"odjava" | "recenzija" | null>(null);

  const osvjezi = useCallback(async () => {
    if (!korisnik) {
      postaviSpremno(true);
      return;
    }

    try {
      const [moje, recenzije] = await Promise.all([
        klijent.get<{ prijave: MojaPrijava[] }>("/api/prijave/moje"),
        klijent.get<{ recenzije: Recenzija[] }>(`/api/termini/${termin.id}/recenzije`),
      ]);

      postaviPrijavu(moje.prijave.find((p) => p.termin_id === termin.id) ?? null);

      const moja = recenzije.recenzije.find((r) => r.korisnik.id === korisnik.id) ?? null;
      postaviRecenziju(moja);

      if (moja) {
        postaviOcjenu(moja.ocjena);
        postaviKomentar(moja.komentar ?? "");
      }
    } catch {

    } finally {
      postaviSpremno(true);
    }
  }, [klijent, korisnik, termin.id]);

  const nakon = useCallback(async () => {
    await osvjezi();

    usmjerivac.refresh();
  }, [osvjezi, usmjerivac]);

  const { izvedi, radi, greska, poPolju } = koristiRadnju(nakon);

  useEffect(() => {
    if (!ucitava) void osvjezi();
  }, [ucitava, osvjezi]);

  if (ucitava || !spremno) return null;

  if (!korisnik) {
    return (
      <section className="kartica">
        <p>
          <Link href="/prijava">Prijavite se</Link> da biste se javili na ovaj izlet.
        </p>
      </section>
    );
  }

  if (!korisnik.email_verificiran) {
    return (
      <section className="kartica">
        <p>
          Prije prijave na izlet <Link href="/racun">potvrdite e-mail adresu</Link>.
        </p>
      </section>
    );
  }

  const smijeRecenzirati = termin.status === "zavrsen" && prijava?.status === "potvrdeno";

  return (
    <section className="kartica">
      <h2>Vaše sudjelovanje</h2>

      {prijava && <p>{OPIS_STATUSA[prijava.status]}</p>}

      {!prijava && termin.status === "najavljen" && (
        <form
          onSubmit={(dogadaj) => {
            dogadaj.preventDefault();
            void izvedi(() =>
              klijent.post("/api/prijave", { termin_id: termin.id, napomena: napomena || null }),
            );
          }}
        >
          <label htmlFor="napomena">Napomena za vodiča (neobavezno)</label>
          <input
            id="napomena"
            value={napomena}
            onChange={(dogadaj) => postaviNapomenu(dogadaj.target.value)}
            placeholder="npr. dolazim svojim autom"
          />
          {poPolju.napomena && <p className="greska-polja">{poPolju.napomena}</p>}

          <button type="submit" disabled={radi}>
            {radi ? "Slanje…" : "Prijavi se na izlet"}
          </button>
        </form>
      )}

      {!prijava && termin.status !== "najavljen" && (
        <p className="prigusen">
          {termin.status === "otkazan"
            ? "Izlet je otkazan, prijave više nisu moguće."
            : "Izlet je završen, prijave više nisu moguće."}
        </p>
      )}

      {prijava && termin.status !== "zavrsen" && potvrda !== "odjava" && (
        <button
          type="button"
          className="tiho"
          disabled={radi}
          onClick={() => postaviPotvrdu("odjava")}
        >
          Odjavi se s izleta
        </button>
      )}

      {prijava && termin.status !== "zavrsen" && potvrda === "odjava" && (
        <Potvrda
          radi={radi}
          pitanje="Odjaviti se s ovog izleta? Prijava se briše, pa ćete se za mjesto morati javiti iznova i ponovno čekati odluku Vodiča."
          potvrdi="Da, odjavi me"
          naPotvrdu={() => {
            postaviPotvrdu(null);
            void izvedi(() => klijent.obrisi(`/api/prijave/${prijava.id}`));
          }}
          naOdustajanje={() => postaviPotvrdu(null)}
        />
      )}

      {prijava && termin.status === "zavrsen" && (
        <p className="prigusen sitno">Izlet je završen, pa odjava više nije moguća.</p>
      )}

      <h2>Recenzija</h2>

      {mojaRecenzija !== null && !uredujemRecenziju && (
        <>
          <p className="ocjena">{"★".repeat(mojaRecenzija.ocjena)}</p>
          {mojaRecenzija.komentar && <p>{mojaRecenzija.komentar}</p>}
          <p className="prigusen sitno">Ovo je vaša recenzija ovog izleta.</p>

          {potvrda === "recenzija" ? (
            <Potvrda
              radi={radi}
              pitanje="Obrisati vašu recenziju? Nakon brisanja možete napisati novu."
              potvrdi="Da, obriši recenziju"
              naPotvrdu={() => {
                postaviPotvrdu(null);
                void izvedi(() => klijent.obrisi(`/api/recenzije/${mojaRecenzija.id}`));
              }}
              naOdustajanje={() => postaviPotvrdu(null)}
            />
          ) : (
            <>
              <button type="button" disabled={radi} onClick={() => postaviUredivanje(true)}>
                Izmijeni recenziju
              </button>
              <button
                type="button"
                className="tiho"
                disabled={radi}
                onClick={() => postaviPotvrdu("recenzija")}
              >
                Obriši recenziju
              </button>
            </>
          )}
        </>
      )}

      {(uredujemRecenziju || (mojaRecenzija === null && smijeRecenzirati)) && (
        <form
          onSubmit={(dogadaj) => {
            dogadaj.preventDefault();
            const postojeca = mojaRecenzija;

            void izvedi(async () => {
              if (postojeca) {
                await klijent.put(`/api/recenzije/${postojeca.id}`, {
                  ocjena,
                  komentar: komentar || null,
                });
              } else {
                await klijent.post("/api/recenzije", {
                  termin_id: termin.id,
                  ocjena,
                  komentar: komentar || null,
                });
              }

              postaviUredivanje(false);
            });
          }}
        >
          <label htmlFor="ocjena">Ocjena</label>
          <select
            id="ocjena"
            value={ocjena}
            onChange={(dogadaj) => postaviOcjenu(Number(dogadaj.target.value))}
          >
            {[5, 4, 3, 2, 1].map((broj) => (
              <option key={broj} value={broj}>
                {broj}
              </option>
            ))}
          </select>
          {poPolju.ocjena && <p className="greska-polja">{poPolju.ocjena}</p>}

          <label htmlFor="komentar">Komentar (neobavezno)</label>
          <input
            id="komentar"
            value={komentar}
            onChange={(dogadaj) => postaviKomentar(dogadaj.target.value)}
          />
          {poPolju.komentar && <p className="greska-polja">{poPolju.komentar}</p>}

          <button type="submit" disabled={radi}>
            {radi ? "Slanje…" : uredujemRecenziju ? "Spremi izmjenu" : "Objavi recenziju"}
          </button>

          {uredujemRecenziju && (
            <button
              type="button"
              className="tiho"
              disabled={radi}
              onClick={() => postaviUredivanje(false)}
            >
              Odustani
            </button>
          )}
        </form>
      )}

      {mojaRecenzija === null && !smijeRecenzirati && (
        <p className="prigusen">
          {termin.status !== "zavrsen"
            ? "Recenzija se piše nakon što Vodič označi izlet završenim."
            : "Recenziju smije napisati samo Sudionik čija je prijava bila potvrđena."}
        </p>
      )}

      {greska && <p className="greska">{greska}</p>}
    </section>
  );
}
