import { z, type ZodType } from "zod";
import { GreskaValidacije } from "./greske.js";

export function validiraj<T>(shema: ZodType<T>, ulaz: unknown): T {
  const rezultat = shema.safeParse(ulaz);

  if (!rezultat.success) {
    throw new GreskaValidacije(
      rezultat.error.issues.map((problem) => ({
        polje: problem.path.join(".") || "(tijelo)",
        poruka: problem.message,
      })),
    );
  }

  return rezultat.data;
}

export const shemaIdIzPutanje = z.object({
  id: z.coerce.number().int().positive("ID mora biti pozitivan cijeli broj."),
});
