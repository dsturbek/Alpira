import Link from "next/link";
import { dohvatiJavno, upit, type Ruta, type Termin } from "../../lib/javno";
import { hrvatskiDatum, mjesecIGodina } from "../../lib/datum";
import { Filtar, FiltarDatuma } from "../komponente/filtri";
import { PrivatniZaAdmina } from "../komponente/privatni-za-admina";
import { Razglednica } from "../komponente/razglednica";

type Parametri = {
  searchParams: Promise<{ ruta_id?: string; status?: string; tezina?: string; od?: string; do?: string }>;
};

function polasci(broj: number): string {
  const zadnja = broj % 10;
  const zadnjeDvije = broj % 100;
  if (zadnja === 1 && zadnjeDvije !== 11) return "polazak";
  if (zadnja >= 2 && zadnja <= 4 && (zadnjeDvije < 12 || zadnjeDvije > 14)) return "polaska";
  return "polazaka";
}

function danaDo(datum: string): number {
  const [g = "", m = "", d = ""] = datum.split("-");
  const cilj = new Date(Number(g), Number(m) - 1, Number(d));
  const sada = new Date();
  const danas = new Date(sada.getFullYear(), sada.getMonth(), sada.getDate());
  return Math.round((cilj.getTime() - danas.getTime()) / 86_400_000);
}

function rukopisOdbrojavanja(dana: number): string {
  if (dana <= 0) return "danas!";
  if (dana === 1) return "već sutra!";
  return `za ${dana} dana!`;
}

export default async function Termini({ searchParams }: Parametri) {

  const { ruta_id, status, tezina, od, do: doDatuma } = await searchParams;
  const filtri = { ruta_id, status, tezina, od, do: doDatuma };
  const upitniNiz = upit(filtri);

  let termini: Termin[] = [];
  let rute: Ruta[] = [];
  let greska: string | null = null;

  try {
    const [popis, katalog] = await Promise.all([
      dohvatiJavno<{ termini: Termin[] }>(`/api/termini${upitniNiz}`),
      dohvatiJavno<{ rute: Ruta[] }>("/api/rute"),
    ]);
    termini = popis.termini;
    rute = katalog.rute;
  } catch {
    greska = "Popis izleta trenutno nije dostupan ili filtar nije ispravan.";
  }

  const mjeseci: { naslov: string; termini: Termin[] }[] = [];
  for (const termin of termini) {
    const naslov = mjesecIGodina(termin.datum);
    const zadnji = mjeseci[mjeseci.length - 1];
    if (zadnji && zadnji.naslov === naslov) {
      zadnji.termini.push(termin);
    } else {
      mjeseci.push({ naslov, termini: [termin] });
    }
  }

  const imaFiltara = Boolean(ruta_id ?? status ?? tezina ?? od ?? doDatuma);

  const sada = new Date();
  const danas = `${sada.getFullYear()}-${String(sada.getMonth() + 1).padStart(2, "0")}-${String(sada.getDate()).padStart(2, "0")}`;
  const sljedeci = imaFiltara
    ? undefined
    : termini.find((termin) => termin.status === "najavljen" && termin.datum >= danas);

  return (
    <>
      <span className="biljeska">kada krećemo?</span>
      <h1>Raspored polazaka</h1>

      {sljedeci && (
        <Link href={`/termini/${sljedeci.id}`} className="najava bez-crte">
          <span className="najava-tekst">
            <span className="biljeska">{rukopisOdbrojavanja(danaDo(sljedeci.datum))}</span>
            <strong>Sljedeći polazak: {sljedeci.ruta.naziv}</strong>
            <span className="najava-detalj">
              {hrvatskiDatum(sljedeci.datum)} · vodi {sljedeci.vodic.ime}
            </span>
          </span>
          <span className="najava-strelica" aria-hidden="true">
            <svg viewBox="0 0 16 12" fill="none">
              <path
                d="M1 6h13m0 0L9.5 1.5M14 6l-4.5 4.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>
      )}

      <div className="alatna-traka">
        <Filtar ime="ruta_id" oznaka="Ruta">
          <option value="">sve</option>
          {rute.map((ruta) => (
            <option key={ruta.id} value={String(ruta.id)}>
              {ruta.naziv}
            </option>
          ))}
        </Filtar>

        <Filtar ime="status" oznaka="Status">
          <option value="">svi</option>
          <option value="najavljen">najavljen</option>
          <option value="zavrsen">završen</option>
          <option value="otkazan">otkazan</option>
        </Filtar>

        <Filtar ime="tezina" oznaka="Težina">
          <option value="">sve</option>
          <option value="lagana">lagana</option>
          <option value="srednja">srednja</option>
          <option value="zahtjevna">zahtjevna</option>
        </Filtar>

        <div className="filtar-razdoblje">
          <FiltarDatuma ime="od" oznaka="Od" />
          <span className="filtar-crtica" aria-hidden="true">
            do
          </span>
          <FiltarDatuma ime="do" oznaka="Do" />
        </div>
      </div>

      {!greska && (
        <p className="rezultat-red">
          <span>
            {termini.length} {polasci(termini.length)}
          </span>
          {Boolean(ruta_id ?? status ?? tezina ?? od ?? doDatuma) && (
            <Link href="/termini" className="ponisti">
              Poništi filtre
              <svg viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M1.5 1.5 8.5 8.5M8.5 1.5 1.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </Link>
          )}
        </p>
      )}

      {greska && <p className="greska">{greska}</p>}

      {!greska && termini.length === 0 && (
        <p className="prazno">Nijedan izlet ne odgovara filtru.</p>
      )}

      {mjeseci.map((mjesec) => (
        <section className="raspored-mjesec" key={mjesec.naslov}>
          <h2 className="mjesec-naslov">
            {mjesec.naslov}
            <span>
              {mjesec.termini.length} {polasci(mjesec.termini.length)}
            </span>
          </h2>

          <ul className="razglednice">
            {mjesec.termini.map((termin) => (
              <li key={termin.id}>
                <Razglednica termin={termin} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <PrivatniZaAdmina upitniNiz={upitniNiz} />
    </>
  );
}
