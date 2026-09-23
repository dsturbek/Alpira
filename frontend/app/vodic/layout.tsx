import type { ReactNode } from "react";
import { Zasticeno } from "../komponente/zastita";

export default function VodicLayout({ children }: { children: ReactNode }) {
  return <Zasticeno najmanja="Vodic">{children}</Zasticeno>;
}
