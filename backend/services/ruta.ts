import {
  azurirajRutu,
  dohvatiRute,
  dohvatiRutu,
  obrisiRutu,
  stvoriRutu,
  type FilterRuta,
  type PodaciRute,
  type Ruta,
} from "../dao/ruta.js";
import { brojTerminaNaRuti } from "../dao/termin.js";
import { GreskaNijePronadeno, GreskaRutaUUpotrebi } from "../utils/greske.js";

export async function popisRuta(filter: FilterRuta): Promise<Ruta[]> {
  return dohvatiRute(filter);
}

export async function jednaRuta(id: number): Promise<Ruta> {
  const ruta = await dohvatiRutu(id);

  if (!ruta) {
    throw new GreskaNijePronadeno("Ruta ne postoji.");
  }

  return ruta;
}

export async function unesiRutu(podaci: PodaciRute): Promise<Ruta> {
  return stvoriRutu(podaci);
}

export async function izmijeniRutu(id: number, podaci: PodaciRute): Promise<Ruta> {
  const ruta = await azurirajRutu(id, podaci);

  if (!ruta) {
    throw new GreskaNijePronadeno("Ruta ne postoji.");
  }

  return ruta;
}

export async function ukloniRutu(id: number): Promise<void> {
  if (!(await dohvatiRutu(id))) {
    throw new GreskaNijePronadeno("Ruta ne postoji.");
  }

  if ((await brojTerminaNaRuti(id)) > 0) {
    throw new GreskaRutaUUpotrebi();
  }

  await obrisiRutu(id);
}
