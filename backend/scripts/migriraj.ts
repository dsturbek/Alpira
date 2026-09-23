import { bazaPool } from "../db.js";
import { pokreniMigracije } from "../utils/migracije.js";
import { seedajPrvogAdmina } from "../utils/seed.js";

try {
  const primijenjene = await pokreniMigracije(bazaPool);
  const stvorenAdmin = await seedajPrvogAdmina();

  if (primijenjene.length === 0) {
    console.log("Baza je već ažurna, nema novih migracija.");
  } else {
    console.log(`Primijenjeno migracija: ${primijenjene.length}`);
    for (const naziv of primijenjene) console.log(`  - ${naziv}`);
  }

  console.log(stvorenAdmin ? "Prvi Admin stvoren." : "Admin već postoji.");
} catch (greska) {
  console.error(greska instanceof Error ? greska.message : greska);
  process.exit(1);
} finally {
  await bazaPool.end();
}
