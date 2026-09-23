import { app } from "./app.js";
import { konfiguracija } from "./konfiguracija.js";

app.listen(konfiguracija.port, () => {
  console.log(`Server sluša na http://localhost:${konfiguracija.port} (${konfiguracija.okolina})`);
});
