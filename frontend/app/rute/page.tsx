import Image from "next/image";
import Link from "next/link";
import { dohvatiJavno, upit, type Ruta, type Termin, type Tezina } from "../../lib/javno";
import { danIKratkiMjesec } from "../../lib/datum";
import { Filtar, Pretraga } from "../komponente/filtri";
import { Otkrij } from "../komponente/otkrij";
import { IkonaTezine, OznakaTezine, slikaRute } from "../komponente/tezina";
import { PoderaniRub } from "../komponente/ukrasi";

type Parametri = { searchParams: Promise<{ tezina?: string; q?: string }> };

const LEGENDA: { kljuc: Tezina; opis: string }[] = [
  { kljuc: "lagana", opis: "šumske šetnje i lagani grebeni" },
  { kljuc: "srednja", opis: "cjelodnevne ture s pravim usponom" },
  { kljuc: "zahtjevna", opis: "dugi usponi za spremne noge" },
];

function rijecRuta(broj: number) {
  if (broj % 10 === 1 && broj % 100 !== 11) return "ruta";
  if (broj % 10 >= 2 && broj % 10 <= 4 && (broj % 100 < 12 || broj % 100 > 14)) return "rute";
  return "ruta";
}

function rijecPolazaka(broj: number) {
  if (broj % 10 === 1 && broj % 100 !== 11) return "najavljeni polazak";
  if (broj % 10 >= 2 && broj % 10 <= 4 && (broj % 100 < 12 || broj % 100 > 14))
    return "najavljena polaska";
  return "najavljenih polazaka";
}

export default async function Rute({ searchParams }: Parametri) {
  const { tezina, q } = await searchParams;

  let rute: Ruta[] = [];
  let greska: string | null = null;

  const prviPolazak = new Map<number, string>();
  let brojPolazaka = 0;

  try {
    const podaci = await dohvatiJavno<{ rute: Ruta[] }>(`/api/rute${upit({ tezina, q })}`);
    rute = podaci.rute;

    try {
      const { termini } = await dohvatiJavno<{ termini: Termin[] }>(
        "/api/termini?status=najavljen",
      );
      brojPolazaka = termini.length;

      for (const termin of termini) {
        if (!prviPolazak.has(termin.ruta.id)) prviPolazak.set(termin.ruta.id, termin.datum);
      }
    } catch {

    }
  } catch {

    greska = tezina
      ? "Filtar težine nije ispravan. Odaberite jednu od ponuđenih vrijednosti."
      : "Katalog trenutno nije dostupan.";
  }

  const brojTezina = new Set(rute.map((ruta) => ruta.tezina)).size;

  return (
    <>
      <section className="detalj-hero rute-hero">
        <Image src="/slike/srednja-2.webp" alt="" fill preload sizes="100vw" />

        <div className="detalj-hero-sadrzaj">
          <span className="biljeska">kamo idemo?</span>
          <h1>Rute</h1>
          <p className="rute-hero-uvod">
            Svaka staza nosi težinu i svoje termine kroz sezonu. Biraš prema
            nogama, ne prema slikama.
          </p>

          <ul className="legenda-tezina">
            {LEGENDA.map(({ kljuc, opis }) => {
              const aktivna = tezina === kljuc;
              return (
                <li key={kljuc}>
                  <Link
                    href={`/rute${upit({ tezina: aktivna ? undefined : kljuc, q })}`}
                    className={aktivna ? "legenda-oznaka aktivna" : "legenda-oznaka"}
                    aria-current={aktivna ? "true" : undefined}
                  >
                    <IkonaTezine tezina={kljuc} />
                    <span className="legenda-tekst">
                      <strong>{kljuc}</strong>
                      <span>{opis}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <PoderaniRub />
      </section>

      {!greska && !tezina && !q && rute.length > 0 && (
        <Otkrij kao="section" className="pojas pojas-papir rute-brojke">
          <PoderaniRub naVrhu />

          <ul className="brojke-staza">
            <li>
              <strong>{rute.length}</strong> {rijecRuta(rute.length)} u katalogu
            </li>
            <li>
              <strong>{brojTezina}</strong>{" "}
              {brojTezina === 1 ? "težina" : brojTezina < 5 ? "težine" : "težina"}
            </li>
            <li>
              <strong>{brojPolazaka}</strong> {rijecPolazaka(brojPolazaka)}
            </li>
          </ul>
          <span className="biljeska">sve ih vodimo osobno</span>

          <PoderaniRub />
        </Otkrij>
      )}

      <div className="alatna-traka">
        <Filtar ime="tezina" oznaka="Težina">
          <option value="">sve</option>
          <option value="lagana">lagana</option>
          <option value="srednja">srednja</option>
          <option value="zahtjevna">zahtjevna</option>
        </Filtar>

        <Pretraga ime="q" oznaka="Naziv" />
      </div>

      {!greska && (
        <p className="rezultat-red">
          <span>
            {rute.length} {rute.length % 10 === 1 && rute.length % 100 !== 11 ? "ruta" : rute.length % 10 >= 2 && rute.length % 10 <= 4 && (rute.length % 100 < 12 || rute.length % 100 > 14) ? "rute" : "ruta"}
          </span>
          {Boolean(tezina ?? q) && (
            <Link href="/rute" className="ponisti">
              Poništi filtre
              <svg viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M1.5 1.5 8.5 8.5M8.5 1.5 1.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </Link>
          )}
        </p>
      )}

      {greska && <p className="greska">{greska}</p>}

      {!greska && rute.length === 0 && <p className="prazno">Nijedna Ruta ne odgovara filtru.</p>}

      <ul className="popis">
        {rute.map((ruta, redni, sve) => (
          <li key={ruta.id}>
            <Link href={`/rute/${ruta.id}`} className="bez-crte">
              <article className="kartica ruta-kartica">
                <div className="ruta-slika">
                  <Image
                    src={slikaRute(
                      sve.slice(0, redni).filter((r) => r.tezina === ruta.tezina).length,
                      ruta.tezina,
                    )}
                    alt=""
                    fill
                    sizes="(max-width: 48rem) 100vw, 21rem"
                  />
                  <OznakaTezine tezina={ruta.tezina} />
                </div>

                <div className="ruta-tijelo">
                  <h2>{ruta.naziv}</h2>
                  {ruta.opis && <p>{ruta.opis}</p>}
                  <p className={prviPolazak.has(ruta.id) ? "ruta-cta" : "ruta-cta bez-polaska"}>
                    {(() => {
                      const datum = prviPolazak.get(ruta.id);
                      if (!datum) return "Trenutno bez termina";
                      const { dan, mjesec } = danIKratkiMjesec(datum);
                      return `Sljedeći polazak: ${dan}. ${mjesec}`;
                    })()}
                    <svg viewBox="0 0 16 12" fill="none" aria-hidden="true">
                      <path
                        d="M1 6h13m0 0L9.5 1.5M14 6l-4.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </p>
                </div>
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
