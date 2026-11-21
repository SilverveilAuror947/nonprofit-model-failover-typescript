import assert from "node:assert/strict";
import { chooseRouting } from "./failover_service.ts";

const decision = chooseRouting("alibaba_intl");
assert.deepEqual(decision, {
  capability: "ai.chat",
  exclude: ["alibaba_intl"],
});
console.log("routing decision selects the configured fallback");
