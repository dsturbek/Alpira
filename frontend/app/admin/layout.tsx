import type { ReactNode } from "react";
import { Zasticeno } from "../komponente/zastita";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Zasticeno najmanja="Admin">{children}</Zasticeno>;
}
