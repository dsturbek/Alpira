export type ProblemPolja = { polje: string; poruka: string };

export class GreskaZahtjeva extends Error {
  constructor(
    readonly status: number,
    readonly kod: string,
    poruka: string,
    readonly detalji?: ProblemPolja[],
  ) {
    super(poruka);
  }
}

type Opcije = {
  osnovica: string;
  dohvat?: typeof fetch;

  naOdjavu?: () => void;
};

type Tijelo = Record<string, unknown> | undefined;

const PUTANJA_OBNOVE = "/api/auth/refresh";

export function napraviKlijent({ osnovica, dohvat = fetch, naOdjavu }: Opcije) {
  let token: string | null = null;

  let obnovaUTijeku: Promise<boolean> | null = null;

  async function posalji(metoda: string, putanja: string, tijelo: Tijelo): Promise<Response> {
    const zaglavlja: Record<string, string> = {};
    if (tijelo !== undefined) zaglavlja["Content-Type"] = "application/json";
    if (token) zaglavlja.Authorization = `Bearer ${token}`;

    return dohvat(`${osnovica}${putanja}`, {
      method: metoda,
      headers: zaglavlja,

      credentials: "include",
      body: tijelo === undefined ? undefined : JSON.stringify(tijelo),
    });
  }

  async function obnovi(): Promise<boolean> {
    obnovaUTijeku ??= (async () => {
      try {
        const odgovor = await posalji("POST", PUTANJA_OBNOVE, undefined);

        if (!odgovor.ok) {
          token = null;
          naOdjavu?.();
          return false;
        }

        const podaci = (await odgovor.json()) as { pristupniToken?: string };
        token = podaci.pristupniToken ?? null;

        return token !== null;
      } finally {
        obnovaUTijeku = null;
      }
    })();

    return obnovaUTijeku;
  }

  async function uGresku(odgovor: Response): Promise<GreskaZahtjeva> {

    const tijelo = (await odgovor.json().catch(() => null)) as {
      greska?: { kod?: string; poruka?: string; detalji?: ProblemPolja[] };
    } | null;

    return new GreskaZahtjeva(
      odgovor.status,
      tijelo?.greska?.kod ?? "NEPOZNATA_GRESKA",
      tijelo?.greska?.poruka ?? "Došlo je do neočekivane greške.",
      tijelo?.greska?.detalji,
    );
  }

  async function zahtjev<T>(metoda: string, putanja: string, tijelo?: Tijelo): Promise<T> {
    let odgovor = await posalji(metoda, putanja, tijelo);

    if (odgovor.status === 401 && putanja !== PUTANJA_OBNOVE) {
      if (await obnovi()) {
        odgovor = await posalji(metoda, putanja, tijelo);
      }
    }

    if (!odgovor.ok) throw await uGresku(odgovor);

    return odgovor.status === 204 ? (undefined as T) : ((await odgovor.json()) as T);
  }

  return {
    postaviToken: (novi: string | null) => {
      token = novi;
    },
    dohvatiToken: () => token,

    obnoviPriPodizanju: obnovi,

    get: <T>(putanja: string) => zahtjev<T>("GET", putanja),
    post: <T>(putanja: string, tijelo?: Tijelo) => zahtjev<T>("POST", putanja, tijelo ?? {}),
    put: <T>(putanja: string, tijelo?: Tijelo) => zahtjev<T>("PUT", putanja, tijelo ?? {}),
    patch: <T>(putanja: string, tijelo?: Tijelo) => zahtjev<T>("PATCH", putanja, tijelo ?? {}),
    obrisi: <T>(putanja: string) => zahtjev<T>("DELETE", putanja),
  };
}

export type Klijent = ReturnType<typeof napraviKlijent>;
