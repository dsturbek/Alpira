import "dotenv/config";
import { Client } from "pg";

const ROLA = "planinarenje";
const LOZINKA = "planinarenje";
const BAZE = ["planinarenje_mp"];

const setupUrl = process.env.SETUP_DATABASE_URL;
if (!setupUrl) {
  console.error("SETUP_DATABASE_URL nije postavljen. Kopiraj .env.example u .env.");
  process.exit(1);
}

const klijent = new Client({ connectionString: setupUrl });

try {
  await klijent.connect();

  const rola = await klijent.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [ROLA]);
  if (rola.rowCount === 0) {

    await klijent.query(`CREATE ROLE "${ROLA}" LOGIN PASSWORD '${LOZINKA}'`);
    console.log(`Rola "${ROLA}" stvorena.`);
  } else {
    console.log(`Rola "${ROLA}" već postoji.`);
  }

  for (const baza of BAZE) {
    const postoji = await klijent.query("SELECT 1 FROM pg_database WHERE datname = $1", [baza]);
    if (postoji.rowCount === 0) {
      await klijent.query(`CREATE DATABASE "${baza}" OWNER "${ROLA}"`);
      console.log(`Baza "${baza}" stvorena.`);
    } else {
      console.log(`Baza "${baza}" već postoji.`);
    }
  }

  console.log("\nBaze su spremne. Sljedeći korak: npm run migriraj");
} catch (greska) {
  console.error("Postavljanje baza nije uspjelo:", greska instanceof Error ? greska.message : greska);
  process.exit(1);
} finally {
  await klijent.end();
}
