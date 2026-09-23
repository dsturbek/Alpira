import express from "express";
import { cors } from "./middleware/cors.js";
import { nepoznataRuta, obradaGresaka } from "./middleware/obrada-gresaka.js";
import { authRute } from "./routes/auth.js";
import { adminRute } from "./routes/admin.js";
import { rutaRute } from "./routes/ruta.js";
import { terminRute } from "./routes/termin.js";
import { prijavaRute } from "./routes/prijava.js";
import { recenzijaRute } from "./routes/recenzija.js";
import { organizatorRute } from "./routes/organizator.js";

export const app = express();

app.set("trust proxy", 1);

app.use(cors);
app.use(express.json());

app.get("/api/zdravlje", (_zahtjev, odgovor) => {
  odgovor.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRute);
app.use("/api/admin", adminRute);
app.use("/api/rute", rutaRute);
app.use("/api/termini", terminRute);
app.use("/api/prijave", prijavaRute);
app.use("/api/recenzije", recenzijaRute);
app.use("/api/organizatori", organizatorRute);

app.use(nepoznataRuta);
app.use(obradaGresaka);
