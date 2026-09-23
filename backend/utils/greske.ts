export abstract class GreskaAplikacije extends Error {
  abstract readonly kod: string;
  abstract readonly status: number;
}

export class GreskaNijePronadeno extends GreskaAplikacije {
  readonly kod = "NIJE_PRONADENO";
  readonly status = 404;

  constructor(poruka = "Traženi resurs ne postoji.") {
    super(poruka);
  }
}

export type ProblemPolja = { polje: string; poruka: string };

export class GreskaValidacije extends GreskaAplikacije {
  readonly kod = "NEISPRAVAN_ULAZ";
  readonly status = 400;

  constructor(readonly detalji: ProblemPolja[]) {
    super("Poslani podaci nisu ispravni.");
  }
}

export class GreskaPreviseZahtjeva extends GreskaAplikacije {
  readonly kod = "PREVISE_ZAHTJEVA";
  readonly status = 429;

  constructor(poruka = "Previše pokušaja. Pokušajte ponovno kasnije.") {
    super(poruka);
  }
}

export class GreskaNedovoljnaOvlast extends GreskaAplikacije {
  readonly kod = "NEDOVOLJNA_OVLAST";
  readonly status = 403;

  constructor(poruka = "Nemate ovlast za ovu radnju.") {
    super(poruka);
  }
}

export class GreskaEmailNijeVerificiran extends GreskaAplikacije {
  readonly kod = "EMAIL_NIJE_VERIFICIRAN";
  readonly status = 403;

  constructor(poruka = "Potvrdite e-mail adresu prije nastavka.") {
    super(poruka);
  }
}

export class GreskaNeautenticiran extends GreskaAplikacije {
  readonly kod = "NEAUTENTICIRAN";
  readonly status = 401;

  constructor(poruka = "Potrebna je prijava.") {
    super(poruka);
  }
}

export class GreskaNeispravniPodaciPrijave extends GreskaAplikacije {
  readonly kod = "NEISPRAVNI_PODACI_PRIJAVE";
  readonly status = 401;

  constructor(poruka = "E-mail adresa ili lozinka nisu ispravni.") {
    super(poruka);
  }
}

export class GreskaEmailZauzet extends GreskaAplikacije {
  readonly kod = "EMAIL_ZAUZET";
  readonly status = 409;

  constructor(poruka = "Korisnik s tom e-mail adresom već postoji.") {
    super(poruka);
  }
}

export class GreskaTudiResurs extends GreskaAplikacije {
  readonly kod = "TUDI_RESURS";
  readonly status = 403;

  constructor(poruka = "Taj zapis nije vaš.") {
    super(poruka);
  }
}

export class GreskaRutaUUpotrebi extends GreskaAplikacije {
  readonly kod = "RUTA_U_UPOTREBI";
  readonly status = 409;

  constructor(poruka = "Ruta ima zakazane Termine i ne može se obrisati.") {
    super(poruka);
  }
}

export class GreskaNedopustenPrijelaz extends GreskaAplikacije {
  readonly kod = "NEDOPUSTEN_PRIJELAZ";
  readonly status = 409;

  constructor(poruka = "Ta promjena nije moguća u trenutnom stanju.") {
    super(poruka);
  }
}

export class GreskaDvostrukaPrijava extends GreskaAplikacije {
  readonly kod = "DVOSTRUKA_PRIJAVA";
  readonly status = 409;

  constructor(poruka = "Već ste prijavljeni na taj Termin.") {
    super(poruka);
  }
}

export class GreskaTerminPopunjen extends GreskaAplikacije {
  readonly kod = "TERMIN_POPUNJEN";
  readonly status = 409;

  constructor(poruka = "Termin je popunjen.") {
    super(poruka);
  }
}

export class GreskaRecenzijaNijeDopustena extends GreskaAplikacije {
  readonly kod = "RECENZIJA_NIJE_DOPUSTENA";
  readonly status = 409;

  constructor(poruka = "Taj Termin ne možete recenzirati.") {
    super(poruka);
  }
}

export class GreskaKodNijeValjan extends GreskaAplikacije {
  readonly kod = "KOD_NIJE_VALJAN";
  readonly status = 400;

  constructor(poruka = "Kod nije ispravan ili je već iskorišten.") {
    super(poruka);
  }
}

export class GreskaKodIstekao extends GreskaAplikacije {
  readonly kod = "KOD_ISTEKAO";
  readonly status = 400;

  constructor(poruka = "Kod je istekao. Zatražite novi.") {
    super(poruka);
  }
}

export class GreskaRadnjaNadSobom extends GreskaAplikacije {
  readonly kod = "RADNJA_NAD_SOBOM";
  readonly status = 409;

  constructor(poruka = "Tu radnju ne možete izvesti nad vlastitim računom.") {
    super(poruka);
  }
}

export class GreskaGooglePovezivanje extends GreskaAplikacije {
  readonly kod = "GOOGLE_POVEZIVANJE_ODBIJENO";
  readonly status = 409;

  constructor(poruka = "Račun s tom adresom postoji, ali adresa nije potvrđena.") {
    super(poruka);
  }
}
