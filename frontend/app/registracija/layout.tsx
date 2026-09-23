import type { ReactNode } from "react";
import { AuthScena } from "../komponente/auth-scena";

export default function Raspored({ children }: { children: ReactNode }) {
  return <AuthScena>{children}</AuthScena>;
}
