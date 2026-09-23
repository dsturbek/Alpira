import { notFound } from "next/navigation";
import { dohvatiJavnoIliNull, type Termin } from "../../../lib/javno";
import { DetaljTermina } from "../../komponente/detalj-termina";

export default async function StranicaTermina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const podaci = await dohvatiJavnoIliNull<{ termin: Termin }>(`/api/termini/${id}`);

  if (!podaci) notFound();

  return <DetaljTermina termin={podaci.termin} />;
}
