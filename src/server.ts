// [INFO] This file is finished. It only starts the server.
// Splitting app.ts (the app) from server.ts (listening on a port) is a common habit:
// it keeps the app easy to test later without opening a real port.
import { app } from "./app.js";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Bookmark API listening on http://localhost:${PORT}`);
});
