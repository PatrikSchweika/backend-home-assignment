import { worker } from "./features/writer/worker";

console.log("Writer started");

worker().catch((error) => {
  console.error("Writer failed", error);
  process.exit(1);
});
