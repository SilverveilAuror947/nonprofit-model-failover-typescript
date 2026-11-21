import { modelReceipt } from "./failover_service.ts";

const receipt = await modelReceipt({
  donorName: "Mina Chen",
  amount: 75,
  campaign: "Community pantry",
});
console.log(receipt);
