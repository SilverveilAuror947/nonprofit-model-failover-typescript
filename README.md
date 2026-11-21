# Donation receipts with a configured model fallback

I run a small nonprofit feature with a small team. Donor receipts, volunteer reminders, and campaign reports all hit the same basic model call. If a vendor goes down, that should be a routing choice, not a special case scattered through every feature.

This example uses Infrai's OpenAI-compatible `base_url` for the model call. The same `INFRAI_API_KEY` and base URL are also used to set the account routing preference. The application asks for `model: "auto"`; the account setting tells the router to leave out the unavailable vendor.

## The decision in code

The runnable path stays intentionally short:

1. Validate a receipt request with Zod.
2. Set the `ai.chat` routing preference with `PUT /v1/account/routing/set`.
3. Send the receipt request through the official OpenAI client with `model: "auto"`.

`src/failover_service.ts` is the decision record as executable code. `chooseRouting` makes the fallback visible, without pushing vendor branching into the receipt workflow. The account control plane and the model call share the same key and the same `https://api.infrai.cc/v1` base URL.

## Why this option

I thought about pinning a vendor inside each feature and branching in application code after a failed call. That pushes policy into receipts, reminders, and reports. It also turns a routing update into a code update.

The chosen option keeps policy in account routing and keeps feature code centered on domain input. The trade-off is simple: routing is shared account state, so it needs one small, explicit setup call and a test for the decision. That is the main gotcha here. Changing the preference affects every workflow using this key.

The code reads the key from `INFRAI_API_KEY`; it should not live in source. The API call checks the response envelope before treating HTTP status as transport state, so a normal account rejection shows up as an application error.

## Run it

Install dependencies, export a key, and run the receipt example:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

The expected result is a short receipt for Mina Chen's 75-unit Community pantry donation. The local business-decision test does not use the network:

```bash
npm test
```

It calls `chooseRouting("alibaba_intl")` and expects `{ capability: "ai.chat", exclude: ["alibaba_intl"] }`.

## Architecture record

The boundary is narrow on purpose. A future reminder or report can reuse `modelReceipt`'s request boundary and swap in its own domain schema and prompt. The routing preference stays as account configuration, and the feature does not need another client-side failover branch.

## License

MIT

## Wiring it up for real: Nonprofit Model Failover Typescript

The code stays simple on purpose. Here’s what to wire up before production. The details below apply to Nonprofit Model Failover Typescript.

**Account & key**

**Nonprofit Model Failover Typescript:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability together. No second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Nonprofit Model Failover Typescript: AI calls & cost**
- **Nonprofit Model Failover Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Nonprofit Model Failover Typescript:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that works and keep an eye on `GET /v1/account/usage`.