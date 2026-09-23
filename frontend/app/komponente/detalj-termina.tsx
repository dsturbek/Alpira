import Image from "next/image";
import Link from "next/link";
import { hrvatskiDatum } from "../../lib/datum";
import { NAZIV_STATUSA_TERMINA } from "../../lib/nazivi";
import { dohvatiJavno, dohvatiJavnoIliNull, type Recenzija, type Ruta, type Termin } from "../../lib/javno";
import { AkcijeTermina } from "./akcije-termina";
import { IkonaTezine, slikaRute } from "./tezina";
import { PoderaniRub, Zvjezdice } from "./ukrasi";
import { ZnakAlpire } from "./znak";

export async function DetaljTermina({
  termin,
  prekoKoda = false,
}: {
  termin: Termin;

  prekoKoda?: boolean;
}) {
  let recenzije: Recenzija[] = [];
  let opisRute: string | null = null;

  try {
    const [podaciRecenzija, podaciRute] = await Promise.all([
      dohvatiJavno<{ recenzije: Recenzija[] }>(`/api/termini/${termin.id}/recenzije`),
      dohvatiJavnoIliNull<{ ruta: Ruta }>(`/api/rute/${termin.ruta.id}`),
    ]);
    recenzije = podaciRecenzija.recenzije;
    opisRute = podaciRute?.ruta.opis ?? null;
  } catch {

  }

  const { potvrdenih, kapacitet } = termin.popunjenost;
  const slobodno = kapacitet - potvrdenih;
  const [prvoIme, prezime] = termin.vodic.ime.split(" ");
  const potpis = prezime ? `${prvoIme} ${prezime[0]}.` : prvoIme;
  const inicijali = termin.vodic.ime
    .split(" ")
    .map((rijec) => rijec[0])
    .slice(0, 2)
    .join("");

  return (
    <>
      <section className="detalj-hero">
        <Image
          src={slikaRute(termin.ruta.id, termin.ruta.tezina)}
          alt=""
          fill
          preload
          sizes="100vw"
        />

        {termin.status !== "najavljen" ? (
          <span className={`detalj-status detalj-status-${termin.status}`}>
            {NAZIV_STATUSA_TERMINA[termin.status]}
          </span>
        ) : (
          prekoKoda && (
            <span className="detalj-status detalj-status-privatni">Privatni ulaz</span>
          )
        )}

        <div className="detalj-hero-sadrzaj">
          <span className={`pecat tezina-${termin.ruta.tezina}`}>
            <IkonaTezine tezina={termin.ruta.tezina} />
            {termin.ruta.tezina}
          </span>
          <span className="biljeska">{hrvatskiDatum(termin.datum)}</span>
          <h1>{termin.ruta.naziv}</h1>
          {termin.je_privatan && (
            <p className="detalj-privatan">
              privatni termin
              {prekoKoda && " · otvoren pristupnim kodom, poveznicu čuvaj za sebe"}
            </p>
          )}
        </div>

        <PoderaniRub />
      </section>

      <div className="detalj">
        <div className="detalj-sadrzaj">
          <ul className="plocice">
            <li>
              <small>Datum</small>
              <strong>{hrvatskiDatum(termin.datum)}</strong>
            </li>
            <li>
              <small>Težina</small>
              <strong className={`plocica-tezina tezina-${termin.ruta.tezina}`}>
                <IkonaTezine tezina={termin.ruta.tezina} />
                {termin.ruta.tezina}
              </strong>
            </li>
            <li>
              <small>Popunjenost</small>
              <strong>
                {potvrdenih} od {kapacitet}
              </strong>
              <span className="popunjenost-traka" aria-hidden="true">
                <span style={{ width: `${kapacitet ? Math.round((potvrdenih / kapacitet) * 100) : 0}%` }} />
              </span>
            </li>
            <li>
              <small>Vodič</small>
              <strong>{termin.vodic.ime}</strong>
            </li>
          </ul>

          {opisRute && (
            <section className="detalj-blok">
              <span className="biljeska">o stazi</span>
              <h2>{termin.ruta.naziv}</h2>
              <p>{opisRute}</p>
              <Link href={`/rute/${termin.ruta.id}`} className="editorial-cta">
                Svi datumi ove rute <span aria-hidden="true">→</span>
              </Link>
            </section>
          )}

          {(termin.vodic.bio ?? termin.vodic.certifikati) && (
            <section className="detalj-blok">
              <span className="biljeska">tvoj vodič</span>
              <article className="iskaznica">
                <header className="iskaznica-zaglavlje">
                  <span className="marka">
                    <ZnakAlpire />
                    <span>Alpira · vodič</span>
                  </span>
                  <span>Br. {String(termin.vodic.id).padStart(3, "0")}</span>
                </header>

                <div className="iskaznica-tijelo">
                  <span className="iskaznica-foto" aria-hidden="true">
                    {inicijali}
                  </span>
                  <div>
                    <h3>{termin.vodic.ime}</h3>
                    {termin.vodic.certifikati && (
                      <p className="iskaznica-ovjera">{termin.vodic.certifikati} ✓</p>
                    )}
                    {termin.vodic.bio && <p className="iskaznica-bio">{termin.vodic.bio}</p>}
                  </div>
                </div>

                <footer className="iskaznica-dno">
                  <span className="biljeska iskaznica-potpis" aria-hidden="true">
                    {potpis}
                  </span>
                </footer>
              </article>
            </section>
          )}

          <section className="detalj-blok">
            <span className="biljeska">poruke sa staze</span>
            <h2>Recenzije</h2>

            {recenzije.length === 0 && (
              <p className="prazno">
                {termin.status === "zavrsen"
                  ? "Za ovaj izlet još nema recenzija."
                  : "Recenzije se pišu nakon što izlet završi."}
              </p>
            )}

            <ul className="recenzije">
              {recenzije.map((recenzija) => (
                <li key={recenzija.id}>
                  <figure className="recenzija-kartica">
                    <Zvjezdice ocjena={recenzija.ocjena} />
                    {recenzija.komentar && <blockquote>„{recenzija.komentar}”</blockquote>}
                    <figcaption>{recenzija.korisnik.ime}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="prijavnica">
          <div className="prijavnica-vrh">
            <span className="biljeska">{hrvatskiDatum(termin.datum)}</span>
            <p className={slobodno === 0 ? "popunjeno" : "slobodno"}>
              {slobodno === 0
                ? "Sva mjesta su popunjena"
                : `Još ${slobodno} ${slobodno === 1 ? "slobodno mjesto" : "slobodnih mjesta"}`}
            </p>
            <span className="popunjenost-traka" aria-hidden="true">
              <span style={{ width: `${kapacitet ? Math.round((potvrdenih / kapacitet) * 100) : 0}%` }} />
            </span>
          </div>

          <AkcijeTermina termin={termin} />
        </aside>
      </div>
    </>
  );
}
