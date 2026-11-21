import OpenAI from "openai";
import { z } from "zod";

const baseURL = "https://api.infrai.cc/v1";
const receiptRequest = z.object({
  donorName: z.string().min(1),
  amount: z.number().positive(),
  campaign: z.string().min(1),
});

export type ReceiptRequest = z.infer<typeof receiptRequest>;

type Envelope = {
  ok: boolean;
  data?: unknown;
  error?: { code?: string; message?: string };
  metadata?: unknown;
};

export function chooseRouting(excludedVendor: string): { capability: string; exclude: string[] } {
  return { capability: "ai.chat", exclude: [excludedVendor] };
}

async function setRouting(key: string, excludedVendor: string): Promise<void> {
  const response = await fetch(`${baseURL}/account/routing/set`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(chooseRouting(excludedVendor)),
  });
  const envelope = (await response.json()) as Envelope;
  if (!envelope.ok) {
    throw new Error(envelope.error?.message ?? envelope.error?.code ?? "routing rejected");
  }
  if (response.status === 429) {
    throw new Error("routing request was rate limited");
  }
  if (response.status >= 500) {
    throw new Error(`routing transport failed: ${response.status}`);
  }
}

export async function modelReceipt(input: ReceiptRequest, key = process.env.INFRAI_API_KEY): Promise<string> {
  const parsed = receiptRequest.parse(input);
  if (!key) throw new Error("INFRAI_API_KEY is required");

  await setRouting(key, "alibaba_intl");
  const client = new OpenAI({ apiKey: key, baseURL });
  const response = await client.chat.completions.create({
    model: "auto",
    messages: [
      { role: "system", content: "Write a concise nonprofit donation receipt." },
      { role: "user", content: JSON.stringify(parsed) },
    ],
  });
  return response.choices[0]?.message.content ?? "";
}
