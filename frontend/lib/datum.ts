export function hrvatskiDatum(datum: string): string {
  const [godina, mjesec, dan] = datum.split("-");
  return `${dan}. ${mjesec}. ${godina}.`;
}

const KRATKI_MJESECI = ["sij", "vlj", "ožu", "tra", "svi", "lip", "srp", "kol", "ruj", "lis", "stu", "pro"];

const PUNI_MJESECI = [
  "Siječanj",
  "Veljača",
  "Ožujak",
  "Travanj",
  "Svibanj",
  "Lipanj",
  "Srpanj",
  "Kolovoz",
  "Rujan",
  "Listopad",
  "Studeni",
  "Prosinac",
];

export function mjesecIGodina(datum: string): string {
  const [godina, mjesec] = datum.split("-");
  return `${PUNI_MJESECI[Number(mjesec) - 1] ?? mjesec} ${godina}.`;
}

export function danIKratkiMjesec(datum: string): { dan: string; mjesec: string } {
  const [, mjesec = "", dan = ""] = datum.split("-");
  return { dan, mjesec: KRATKI_MJESECI[Number(mjesec) - 1] ?? mjesec };
}
