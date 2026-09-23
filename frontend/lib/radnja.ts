"use client";

import { useCallback, useState } from "react";
import { razdvoji, type PoPolju } from "./poruke";

export function koristiRadnju(nakon?: () => Promise<unknown> | void) {
  const [poPolju, postaviPoPolju] = useState<PoPolju>({});
  const [greska, postaviGresku] = useState<string | null>(null);
  const [radi, postaviRadi] = useState(false);

  const izvedi = useCallback(
    async (radnja: () => Promise<unknown>): Promise<boolean> => {
      postaviPoPolju({});
      postaviGresku(null);
      postaviRadi(true);

      try {
        await radnja();
        await nakon?.();
        return true;
      } catch (problem) {
        const odbijenica = razdvoji(problem);
        postaviPoPolju(odbijenica.poPolju);
        postaviGresku(odbijenica.opcenita);
        await nakon?.();
        return false;
      } finally {
        postaviRadi(false);
      }
    },
    [nakon],
  );

  return { izvedi, radi, greska, poPolju, postaviGresku };
}
