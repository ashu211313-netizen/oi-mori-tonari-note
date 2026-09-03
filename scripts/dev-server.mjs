import path from "node:path";
import { fileURLToPath } from "node:url";
import { createStaticServer, listen } from "./static-server.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = createStaticServer(root);
const url = await listen(server, "127.0.0.1", Number(process.env.PORT) || 8765);

console.log(`Wild World Companion: ${url}`);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
