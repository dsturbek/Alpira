import Image from "next/image";
import Link from "next/link";
import { Otkrij } from "../komponente/otkrij";
import { PoderaniRub } from "../komponente/ukrasi";

const OTISCI: { slika: string; legenda: string }[] = [
  { slika: "/slike/hero.webp", legenda: "magla u borovoj šumi" },
  { slika: "/slike/srednja.webp", legenda: "dolina pod grebenima" },
  { slika: "/slike/zahtjevna-2.webp", legenda: "noć iznad grebena" },
  { slika: "/slike/lagana.webp", legenda: "jutro na šumskoj stazi" },
  { slika: "/slike/magla-planine.webp", legenda: "sumrak iznad mora magle" },
  { slika: "/slike/srednja-2.webp", legenda: "prema prijevoju" },
  { slika: "/slike/lagana-2.webp", legenda: "svjetlo kroz maglu" },
  { slika: "/slike/cta.webp", legenda: "iznad oblaka se ide pješice" },
  { slika: "/slike/zahtjevna.webp", legenda: "snijeg koji ne kopni" },
];

export default function Galerija() {
  return (
    <>
      <span className="biljeska">iz našeg dnevnika</span>
      <h1>Galerija</h1>
      <p className="galerija-uvod">
        Trenuci s naših staza: magla, grebeni i jutra kakva se pamte.
        Sljedeća fotografija može biti tvoja.
      </p>

      <Otkrij kao="section" className="sekcija sredina pojas pojas-papir galerija-ploca">
        <PoderaniRub naVrhu />

        <div className="galerija">
          {OTISCI.map((otisak, redni) => (
            <Otkrij kasni={redni % 3} key={otisak.slika}>
              <figure className="galerija-otisak">
                <span className="galerija-foto">
                  <Image
                    src={otisak.slika}
                    alt={otisak.legenda}
                    fill
                    sizes="(max-width: 40rem) 100vw, (max-width: 64rem) 50vw, 20rem"
                  />
                </span>
                <figcaption className="biljeska">{otisak.legenda}</figcaption>
              </figure>
            </Otkrij>
          ))}
        </div>

        <p className="galerija-poziv">
          <Link href="/termini" className="gumb">
            Uslikaj svoju
          </Link>
        </p>

        <PoderaniRub />
      </Otkrij>

      <Otkrij kao="section" className="citat-vrpca">
        <PoderaniRub naVrhu />

        <blockquote>Iznad oblaka se ide pješice.</blockquote>
        <p>iz našeg dnevnika</p>
      </Otkrij>
    </>
  );
}
