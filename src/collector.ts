import { worker } from "./features/collector/worker";

console.log("Collector started");

worker().catch((error) => {
  console.error("Collector failed", error);
  process.exit(1);
});
