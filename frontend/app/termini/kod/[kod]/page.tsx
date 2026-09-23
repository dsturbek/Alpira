import { notFound } from "next/navigation";
import { dohvatiJavnoIliNull, type Termin } from "../../../../lib/javno";
import { DetaljTermina } from "../../../komponente/detalj-termina";

export default async function TerminPoKodu({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;

  const podaci = await dohvatiJavnoIliNull<{ termin: Termin }>(
    `/api/termini/kod/${encodeURIComponent(kod)}`,
  );

  if (!podaci) notFound();

  return <DetaljTermina termin={podaci.termin} prekoKoda />;
}
