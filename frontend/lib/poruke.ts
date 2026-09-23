import { GreskaZahtjeva } from "./klijent";

const DOPUNE: Record<string, string> = {
  TERMIN_POPUNJEN:
    "Sva su mjesta popunjena, pa se prijava ne može odobriti. Oslobodite mjesto odbijanjem neke već potvrđene prijave.",
  RUTA_U_UPOTREBI:
    "Ruta ima zakazane termine, pa se ne može obrisati. Prvo obrišite te termine.",
  RADNJA_NAD_SOBOM:
    "Tu radnju ne možete izvesti nad vlastitim računom, inače bi platforma mogla ostati bez ijednog administratora.",
  RECENZIJA_NIJE_DOPUSTENA:
    "Ocijeniti izlet može samo sudionik čija je prijava bila potvrđena i tek nakon što izlet završi.",
  DVOSTRUKA_PRIJAVA: "Na ovaj izlet ste već prijavljeni.",
  GOOGLE_POVEZIVANJE_ODBIJENO:
    "Račun s tom adresom već postoji, ali mu adresa nije potvrđena. Prijavite se lozinkom, potvrdite adresu iz e-maila, pa Google pokušajte ponovno.",
};

export function uPoruku(problem: unknown): string {
  if (!(problem instanceof GreskaZahtjeva)) {
    return "Radnja trenutno nije moguća. Pokušajte ponovno.";
  }

  return DOPUNE[problem.kod] ?? problem.message;
}

export type PoPolju = Record<string, string>;

export type Odbijenica = { poPolju: PoPolju; opcenita: string | null };

export function razdvoji(problem: unknown): Odbijenica {
  if (problem instanceof GreskaZahtjeva && problem.detalji?.length) {
    return {
      poPolju: Object.fromEntries(problem.detalji.map((d) => [d.polje, d.poruka])),
      opcenita: null,
    };
  }

  return { poPolju: {}, opcenita: uPoruku(problem) };
}
