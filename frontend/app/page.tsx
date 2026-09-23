import Image from "next/image";
import Link from "next/link";
import { dohvatiJavno, type Recenzija, type Ruta, type Termin } from "../lib/javno";
import { danIKratkiMjesec, hrvatskiDatum, mjesecIGodina } from "../lib/datum";
import { Karusel } from "./komponente/karusel";
import { Otkrij } from "./komponente/otkrij";
import { Razglednica } from "./komponente/razglednica";
import { IkonaTezine, OznakaTezine, slikaRute } from "./komponente/tezina";
import { PoderaniRub, Zvjezdice } from "./komponente/ukrasi";
import { ZnakAlpire } from "./komponente/znak";

const KADROVI: { slika: string; legenda: string }[] = [
  { slika: "/slike/srednja.webp", legenda: "dolina pod grebenima" },
  { slika: "/slike/zahtjevna-2.webp", legenda: "noć iznad grebena" },
  { slika: "/slike/lagana-2.webp", legenda: "svjetlo kroz maglu" },
  { slika: "/slike/cta.webp", legenda: "iznad mora oblaka" },
];

function Staza() {
  return (
    <svg className="staza" viewBox="0 0 1100 56" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M8 46 C 120 8, 240 54, 366 30 S 610 4, 733 32 S 980 52, 1092 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={640}
      />
    </svg>
  );
}

export default async function Naslovnica() {
  let termini: Termin[] = [];
  let rute: Ruta[] = [];
  let zavrseni: Termin[] = [];

  let recenzije: { recenzija: Recenzija; termin: Termin }[] = [];
  let greska: string | null = null;

  try {
    [{ termini }, { rute }, { termini: zavrseni }] = await Promise.all([
      dohvatiJavno<{ termini: Termin[] }>("/api/termini?status=najavljen"),
      dohvatiJavno<{ rute: Ruta[] }>("/api/rute"),
      dohvatiJavno<{ termini: Termin[] }>("/api/termini?status=zavrsen"),
    ]);

    const poRecenzije = await Promise.all(
      zavrseni.slice(0, 3).map(async (termin) => {
        const odgovor = await dohvatiJavno<{ recenzije: Recenzija[] }>(
          `/api/termini/${termin.id}/recenzije`,
        );
        return odgovor.recenzije.map((recenzija) => ({ recenzija, termin }));
      }),
    );
    recenzije = poRecenzije.flat().slice(0, 3);
  } catch {
    greska = "Popis izleta trenutno nije dostupan. Pokušajte za koji trenutak.";
  }

  const sljedeci = termini[0];

  const vodici = [
    ...new Map(
      [...termini, ...zavrseni]
        .map((termin) => termin.vodic)
        .filter((vodic) => vodic.bio)
        .map((vodic) => [vodic.id, vodic]),
    ).values(),
  ].slice(0, 4);

  const prosjek = recenzije.length
    ? (
        recenzije.reduce((zbroj, { recenzija }) => zbroj + recenzija.ocjena, 0) / recenzije.length
      ).toFixed(1)
    : null;

  return (
    <>
      <section className="uvod">
        <Image src="/slike/hero.webp" alt="Borova šuma u magli" fill preload sizes="100vw" />

        <p className="uvod-biljeska biljeska" aria-hidden="true">
          gore je tiše →
        </p>

        <h1>
          Priroda zove.
          <br />
          Javi se.
        </h1>
        <p>Organizirani planinarski izleti s provjerenim vodičima.</p>

        <form action="/termini" method="get" className="uvod-pretraga">
          <label className="uvod-polje">
            <small>Kamo</small>
            <select name="ruta_id" defaultValue="">
              <option value="">Sve rute</option>
              {rute.map((ruta) => (
                <option value={ruta.id} key={ruta.id}>
                  {ruta.naziv}
                </option>
              ))}
            </select>
          </label>
          <label className="uvod-polje">
            <small>Od datuma</small>
            <input type="date" name="od" defaultValue={sljedeci?.datum} />
          </label>
          <label className="uvod-polje">
            <small>Težina</small>
            <select name="tezina" defaultValue="">
              <option value="">Sve tri</option>
              <option value="lagana">Lagana</option>
              <option value="srednja">Srednja</option>
              <option value="zahtjevna">Zahtjevna</option>
            </select>
          </label>
          <button type="submit" className="uvod-trazi" aria-label="Traži termine">
            →
          </button>
        </form>
      </section>

      <div className="uvod-statistike">
        <div className="uvod-stat">
          <strong>{rute.length}</strong>
          <span>ruta u katalogu</span>
        </div>
        <div className="uvod-stat">
          <strong>{termini.length}</strong>
          <span>nadolazećih termina</span>
        </div>
        {prosjek && (
          <div className="uvod-stat">
            <strong>{prosjek}</strong>
            <span>prosječna ocjena</span>
          </div>
        )}
        <div className="uvod-stat">
          <strong>3</strong>
          <span>stupnja težine</span>
        </div>
      </div>

      <Otkrij kao="section" className="sekcija sredina pojas pojas-papir">
        <PoderaniRub naVrhu />
        <span className="biljeska">raspored polazaka ↓</span>
        <h2>Kamo se ide ovih tjedana</h2>

        {greska && <p className="greska">{greska}</p>}

        {!greska && termini.length === 0 && (
          <p className="prazno">Trenutno nema najavljenih izleta.</p>
        )}

        <ul className="razglednice">
          {termini.map((termin, redni) => (
            <Otkrij kao="li" kasni={redni % 2} key={termin.id}>
              <Razglednica termin={termin} />
            </Otkrij>
          ))}
        </ul>
        <PoderaniRub />
      </Otkrij>

      <Otkrij kao="section" className="sekcija">
        <span className="biljeska">kako funkcionira</span>
        <h2>Od karte do vrha</h2>

        <ol className="koraci">
          <Staza />
          <li className="korak">
            <span className="biljeska">1.</span>
            <h3>Odaberi izlet</h3>
            <p>Pregledaj nadolazeće termine i rute po težini, od šumskih šetnji do zahtjevnih grebena.</p>
          </li>
          <li className="korak">
            <span className="biljeska">2.</span>
            <h3>Pošalji prijavu</h3>
            <p>Vodič osobno potvrđuje svaku prijavu, pa grupa ostaje sigurna i uigrana.</p>
          </li>
          <li className="korak">
            <span className="biljeska">3.</span>
            <h3>Kreni u planine</h3>
            <p>Nakon potvrde nalaziš se s grupom na polazištu. Oprema, tempo i ruta već su dogovoreni.</p>
          </li>
        </ol>
      </Otkrij>

      {rute.length > 0 && (
        <section className="izlog">
          <Image src="/slike/magla-planine.webp" alt="" fill sizes="100vw" />

          <div>
            <span className="biljeska">katalog ruta</span>
            <h2>Istraži rute</h2>
            <p>
              Od šumskih šetnji do krova Hrvatske: svaka ruta nosi oznaku
              težine i svoje termine kroz sezonu. Prolistaj i pronađi svoju.
            </p>
            <Link href="/rute" className="gumb">
              Sve rute
            </Link>
          </div>

          <Karusel>
            {rute.map((ruta) => (
              <Link href={`/rute/${ruta.id}`} className="karusel-stavka" key={ruta.id}>
                <span className="karusel-slika">
                  <Image src={slikaRute(ruta.id, ruta.tezina)} alt="" fill sizes="15rem" />
                  <OznakaTezine tezina={ruta.tezina} />
                  <span className="karusel-dno">
                    <h3>{ruta.naziv}</h3>
                    {ruta.opis && (
                      <span>{ruta.opis.length > 52 ? `${ruta.opis.slice(0, 52)}…` : ruta.opis}</span>
                    )}
                  </span>
                </span>
              </Link>
            ))}
          </Karusel>
        </section>
      )}

      <Otkrij kao="section" className="sekcija">
        <div className="editorial">
          <div className="editorial-slike">
            <span className="editorial-slika mala" aria-hidden="true">
              <span className="editorial-foto">
                <Image src="/slike/zahtjevna.webp" alt="" fill sizes="14rem" />
              </span>
            </span>

            <figure className="editorial-slika">
              <span className="editorial-foto">
                <Image
                  src="/slike/magla-planine.webp"
                  alt="Snježni vrhovi u plavom sumraku iznad mora magle"
                  fill
                  sizes="(max-width: 48rem) 100vw, 26rem"
                />
              </span>
              <figcaption className="biljeska">iznad mora magle, 6:40 ujutro</figcaption>
            </figure>
          </div>

          <div className="editorial-tekst">
            <span className="biljeska">zašto s vodičem</span>
            <h2>Planina ne oprašta improvizaciju</h2>
            <p>
              Vremenska prognoza koja se čita s grebena, tempo koji drži cijelu
              grupu, staza koja se zna i po magli. To se ne nauči iz aplikacije.
              Svaki izlet na Alpiri vodi čovjek koji je tu rutu prošao mnogo
              puta i koji tvoju prijavu{" "}
              <em className="podcrtano">
                potvrđuje osobno
                <svg viewBox="0 0 120 8" preserveAspectRatio="none" aria-hidden="true">
                  <path
                    d="M2 5 C 30 2, 55 7, 80 4 S 112 3, 118 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </em>
              .
            </p>
            <p>Ti biraš planinu i datum; brigu o svemu ostalom preuzima vodič.</p>

            <p className="biljeska brojke-crta">
              {rute.length} ruta · 3 stupnja težine · svaki termin s vodičem
            </p>

            <a href="#vodici" className="editorial-cta">
              Upoznaj naše vodiče <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </Otkrij>

      {recenzije.length > 0 && (
        <Otkrij kao="section" className="sekcija pojas pojas-magla">
          <PoderaniRub naVrhu />
          <span className="biljeska">poruke sa staze</span>
          <h2>Kako je bilo onima prije tebe</h2>

          <ul className="recenzije">
            {recenzije.map(({ recenzija, termin }, redni) => (
              <Otkrij kao="li" kasni={redni} key={recenzija.id}>
                <Link href={`/termini/${termin.id}`} className="bez-crte">
                  <figure className="recenzija-kartica">
                    <Zvjezdice ocjena={recenzija.ocjena} />
                    {recenzija.komentar && <blockquote>„{recenzija.komentar}”</blockquote>}
                    <figcaption>
                      {recenzija.korisnik.ime} · {termin.ruta.naziv},{" "}
                      {mjesecIGodina(termin.datum).toLowerCase()}
                    </figcaption>
                  </figure>
                </Link>
              </Otkrij>
            ))}
          </ul>
          <PoderaniRub />
        </Otkrij>
      )}

      <Otkrij kao="section" className="filmska">
        <PoderaniRub naVrhu />

        <span className="biljeska">iz naprtnjače</span>
        <h2>Dokazi s vrhova</h2>
        <p>
          Nerežirani kadrovi s naših izleta. Netko uvijek ponese aparat.
          Sljedeći kadar može biti tvoj.
        </p>

        <div className="film">
          <div className="film-traka">
            {KADROVI.map((kadar) => (
              <figure className="film-kadar" key={kadar.slika}>
                <span className="film-slika">
                  <Image src={kadar.slika} alt={kadar.legenda} fill sizes="14rem" />
                </span>
                <figcaption className="biljeska">{kadar.legenda}</figcaption>
              </figure>
            ))}

            <Link href="/galerija" className="film-cta">
              Cijela galerija <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </Otkrij>

      {vodici.length > 0 && (
        <Otkrij kao="section" className="sekcija" id="vodici">
          <span className="biljeska">upoznaj vodiče</span>
          <h2>Ljudi koji znaju put</h2>

          <ul className="vodici">
            {vodici.map((vodic, redni) => {
              const inicijali = vodic.ime
                .split(" ")
                .map((rijec) => rijec[0])
                .slice(0, 2)
                .join("");
              const [prvoIme, prezime] = vodic.ime.split(" ");
              const potpis = prezime ? `${prvoIme} ${prezime[0]}.` : prvoIme;
              const njegoviTermini = termini.filter((termin) => termin.vodic.id === vodic.id).slice(0, 3);

              return (
                <Otkrij kao="li" kasni={redni} key={vodic.id}>
                  <article className="iskaznica">
                    <header className="iskaznica-zaglavlje">
                      <span className="marka">
                        <ZnakAlpire />
                        <span>Alpira · vodič</span>
                      </span>
                      <span>Br. {String(vodic.id).padStart(3, "0")}</span>
                    </header>

                    <div className="iskaznica-tijelo">
                      <span className="iskaznica-foto" aria-hidden="true">
                        {inicijali}
                      </span>
                      <div>
                        <h3>{vodic.ime}</h3>
                        {vodic.certifikati && <p className="iskaznica-ovjera">{vodic.certifikati} ✓</p>}
                        <p className="iskaznica-bio">{vodic.bio}</p>
                      </div>
                    </div>

                    <div className="iskaznica-raspored">
                      <span className="biljeska">najbliži polasci:</span>
                      {njegoviTermini.length === 0 && (
                        <p className="prazno">trenutno bez najavljenih polazaka</p>
                      )}
                      {njegoviTermini.map((termin) => {
                        const { dan, mjesec } = danIKratkiMjesec(termin.datum);
                        return (
                          <Link href={`/termini/${termin.id}`} className="iskaznica-polazak" key={termin.id}>
                            <strong>
                              {dan}. {mjesec}
                            </strong>
                            <span>{termin.ruta.naziv}</span>
                            <svg viewBox="0 0 16 12" fill="none" aria-hidden="true">
                              <path
                                d="M1 6h13m0 0L9.5 1.5M14 6l-4.5 4.5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </Link>
                        );
                      })}
                    </div>

                    <footer className="iskaznica-dno">
                      <span className="biljeska iskaznica-potpis" aria-hidden="true">
                        {potpis}
                      </span>
                    </footer>
                  </article>
                </Otkrij>
              );
            })}
          </ul>
        </Otkrij>
      )}

      <Otkrij kao="section" className="sekcija sredina pojas pojas-papir" id="pitanja">
        <PoderaniRub naVrhu />
        <span className="biljeska">prije nego što kreneš</span>
        <h2>Česta pitanja</h2>

        <div className="pitanja">
          <details>
            <summary>Treba li mi planinarsko iskustvo?</summary>
            <p>
              Za lagane rute ne. Dovoljna je osnovna kondicija i volja. Svaka
              ruta nosi oznaku težine, pa za prvi izlet biraj laganu; vodič će
              ti rado pomoći s procjenom ako se dvoumiš.
            </p>
          </details>
          <details>
            <summary>Kako se prijavljujem na izlet?</summary>
            <p>
              Registriraš se, odabereš termin i pošalješ prijavu. Prijava nije
              rezervacija: svaku osobno potvrđuje vodič, pa mjesto imaš tek kad
              stigne potvrda.
            </p>
          </details>
          <details>
            <summary>Što trebam ponijeti?</summary>
            <p>
              Gojzerice ili čvrste tenisice, slojevitu odjeću, kabanicu i barem
              litru i pol vode. Detaljan popis za konkretnu rutu dobiješ od
              vodiča uz potvrdu prijave.
            </p>
          </details>
          <details>
            <summary>Mogu li se odjaviti ako se predomislim?</summary>
            <p>
              Možeš. Odjava jednostavno uklanja tvoju prijavu. Javi se što
              ranije, da tvoje mjesto stigne dobiti netko drugi.
            </p>
          </details>
          <details>
            <summary>Može li pas sa mnom?</summary>
            <p>
              Ovisi o ruti i grupi. Napiši to u prijavi, pa vodič odlučuje.
              na laganim šumskim rutama odgovor je najčešće da.
            </p>
          </details>
        </div>
        <PoderaniRub />
      </Otkrij>

      <section className="zavrsni-poziv">
        <PoderaniRub naVrhu />
        <Image src="/slike/cta.webp" alt="" fill sizes="100vw" />
        <h2>Iznad oblaka se ide pješice</h2>
        <Link href="/registracija" className="gumb">
          Registriraj se
        </Link>
      </section>
    </>
  );
}
