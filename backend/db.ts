import pg from "pg";
import { konfiguracija } from "./konfiguracija.js";

pg.types.setTypeParser(pg.types.builtins.DATE, (vrijednost) => vrijednost);

export const bazaPool = new pg.Pool({
  connectionString: konfiguracija.urlBaze,
  max: 10,
});
