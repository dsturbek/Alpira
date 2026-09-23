import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dohvatiJavno, dohvatiJavnoIliNull, upit, type Ruta, type Termin } from "../../../lib/javno";
import { danIKratkiMjesec } from "../../../lib/datum";
import { NAZIV_STATUSA_TERMINA } from "../../../lib/nazivi";
import { IkonaTezine, slikaRute } from "../../komponente/tezina";
import { PoderaniRub } from "../../komponente/ukrasi";

type Parametri = { params: Promise<{ id: string }> };

export default async function DetaljRute({ params }: Parametri) {
  const { id } = await params;

  const podaci = await dohvatiJavnoIliNull<{ ruta: Ruta }>(`/api/rute/${id}`);

  if (!podaci) notFound();

  const ruta = podaci.ruta;

  let termini: Termin[] = [];
  let greska: string | null = null;

  try {
    const popis = await dohvatiJavno<{ termini: Termin[] }>(
      `/api/termini${upit({ ruta_id: String(ruta.id) })}`,
    );
    termini = popis.termini;
  } catch {

    greska = "Popis izleta na ovoj ruti trenutno nije dostupan.";
  }

  const najavljeni = termini.filter((termin) => termin.status === "najavljen");
  const ostali = termini.filter((termin) => termin.status !== "najavljen");

  let srodne: Ruta[] = [];
  try {
    const katalog = await dohvatiJavno<{ rute: Ruta[] }>(
      `/api/rute${upit({ tezina: ruta.tezina })}`,
    );
    srodne = katalog.rute.filter((druga) => druga.id !== ruta.id).slice(0, 3);
  } catch {

  }

  return (
    <>
      <section className="detalj-hero">
        <Image src={slikaRute(ruta.id, ruta.tezina)} alt="" fill preload sizes="100vw" />

        <div className="detalj-hero-sadrzaj">
          <span className={`pecat tezina-${ruta.tezina}`}>
            <IkonaTezine tezina={ruta.tezina} />
            {ruta.tezina}
          </span>
          {najavljeni.length > 0 && (
            <span className="biljeska">
              {najavljeni.length}{" "}
              {najavljeni.length === 1 ? "najavljeni polazak" : "najavljena polaska"}
            </span>
          )}
          <h1>{ruta.naziv}</h1>
        </div>

        <PoderaniRub />
      </section>

      <div className="detalj-sadrzaj ruta-detalj">
        <p className="sitno">
          <Link href="/rute">← Sve rute</Link>
        </p>

        {ruta.opis && <p className="ruta-opis">{ruta.opis}</p>}

        <section className="detalj-blok">
          <span className="biljeska">raspored ove staze</span>
          <h2>Najavljeni izleti</h2>

          {greska && <p className="greska">{greska}</p>}

          {!greska && najavljeni.length === 0 && (
            <p className="prazno">
              Na ovoj ruti trenutno nema najavljenih izleta.{" "}
              <Link href="/termini">Pogledajte sve najavljene izlete.</Link>
            </p>
          )}

          <ol className="polasci">
            {najavljeni.map((termin) => (
              <Polazak termin={termin} key={termin.id} />
            ))}
          </ol>
        </section>

        {ostali.length > 0 && (
          <section className="detalj-blok">
            <span className="biljeska">iz dnevnika staze</span>
            <h2>Prošli i otkazani izleti</h2>

            <ol className="polasci prosli">
              {ostali.map((termin) => (
                <Polazak termin={termin} key={termin.id} />
              ))}
            </ol>
          </section>
        )}

        {srodne.length > 0 && (
          <section className="detalj-blok">
            <span className="biljeska">ako ti ova ne odgovara</span>
            <h2>Još staza ove težine</h2>

            <ul className="srodne-staze">
              {srodne.map((druga, redni) => (
                <li key={druga.id}>
                  <Link href={`/rute/${druga.id}`} className="srodna bez-crte">
                    <span className="srodna-slika">
                      <Image
                        src={slikaRute(redni, druga.tezina)}
                        alt=""
                        fill
                        sizes="(max-width: 40rem) 100vw, 14rem"
                      />
                    </span>
                    <span className="srodna-tekst">
                      <strong>{druga.naziv}</strong>
                      {druga.opis && (
                        <span>
                          {druga.opis.length > 64 ? `${druga.opis.slice(0, 64)}…` : druga.opis}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function Polazak({ termin }: { termin: Termin }) {
  const { dan, mjesec } = danIKratkiMjesec(termin.datum);
  const { potvrdenih, kapacitet } = termin.popunjenost;
  const slobodno = kapacitet - potvrdenih;

  return (
    <li className="polazak">
      <Link href={`/termini/${termin.id}`}>
        <span className="polazak-datum">
          <strong>{dan}</strong>
          <span>{mjesec}</span>
        </span>

        <span className="polazak-info">
          <h3>
            vodi {termin.vodic.ime}
            {termin.je_privatan && <span className="oznaka"> privatan</span>}
          </h3>
          <p>
            {termin.status === "najavljen"
              ? slobodno === 0
                ? "sva mjesta popunjena"
                : `${slobodno} od ${kapacitet} mjesta slobodno`
              : NAZIV_STATUSA_TERMINA[termin.status]}
          </p>
        </span>

        <span className={termin.status !== "najavljen" ? "prigusen" : slobodno === 0 ? "popunjeno" : "slobodno"}>
          {termin.status === "najavljen"
            ? slobodno === 0
              ? "Popunjeno"
              : "Pogledaj →"
            : NAZIV_STATUSA_TERMINA[termin.status]}
        </span>
      </Link>
    </li>
  );
}
