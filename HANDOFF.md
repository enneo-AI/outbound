# Enneo Outbound Demo — Handoff

Last updated: 2026-08-17

## Live state

- Production URL: https://enneo.aleksa.ai
- Netlify project: `enneo-outbound`
- GitHub: `enneo-AI/outbound`
- Production branch: `main`
- Latest deployed commit: `0711a30` (`Use dedicated outbound agent prompt`)
- Purpose: protected internal demo page that accepts a phone number plus a separate demo access code and triggers one outbound Enneo voice call.

## Architecture

The browser calls the Netlify function `/.netlify/functions/start-call`. The function validates the demo access code, normalizes the phone number, applies the optional allowlist and then calls:

```text
POST https://aleksa-dev.enneo.ai/api/mind/telephony/outboundCall
Authorization: Bearer <ENNEO_API_TOKEN>
```

The request contains only `phoneNumber`, `subchannelId` and `isPhoneNumberHidden`. The selected subchannel's dedicated AI agent owns the objective and conversation behavior; the website intentionally sends no additional `objective`, `context` or `constraints` briefing.

Netlify environment variables:

- `DEMO_ACCESS_TOKEN` — public demo gate; never commit its value.
- `ENNEO_API_TOKEN` — server-side Enneo API key/JWT; secret, never expose to the client or commit.
- `ENNEO_OUTBOUND_URL` — optional override; defaults to the aleksa-dev Mind endpoint.
- `OUTBOUND_SUBCHANNEL_ID` — defaults to `12`.
- `ALLOWED_PHONE_NUMBERS` — optional comma-separated allowlist.

Supabase, browser sessions, test users and local daemons are not part of this flow.

## Enneo dependency

The public authenticated Mind endpoint is implemented in Draft MR `enneo/mind!1803`:

- Branch: `codex/fix-outbound-proxy`
- Commit: `544cbbe3e`
- Test image: `codex-fix-outbound-proxy-amd64`
- Deployed only to `aleksa-dev`

The old direct ACD endpoint `/api/acd/call/outbound` is internal-only since ACD MR `enneo/acd!137` / commit `f3553d1`. The website must never call it directly.

Before this demo can rely on a normal Enneo release, MR !1803 must be reviewed, merged and shipped through the regular release process. Do not deploy the test image to customer or production instances.

## Voice configuration on aleksa-dev

- AI agent: `Outbound-Service-Agent` (id `78`, phone-only)
- Subchannel: `Voicebot Emma Outbound Test` (id `12`, V2 call flow)
- Objective: identify the customer, collect and submit the missing meter reading, optionally review the monthly payment afterward.

Ticket `2277` exposed a Realtime tool-argument error: the transcript contained the correct contract number and postal code, but the agent changed one contract digit before calling `identify_customer`. Agent 78 now treats identifiers as immutable digit strings, requires digit-by-digit confirmation before the first lookup, copies confirmed values exactly and repeats the real submitted values on failure.

## Verification

- Invalid phone through Mind returns `400 Phone number is invalid` without initiating a call.
- Direct real API test created ticket `2278`; dialing worked and the destination returned SIP `486 busy`.
- Netlify production deploy `0711a30` is published.
- Safe Netlify smoke test with the valid demo gate and an invalid phone returns `400 Please enter a valid international phone number.`

## Next step

Run one new real call through https://enneo.aleksa.ai after explicit confirmation. Verify in the resulting ticket that:

1. Emma reads the contract number and postal code back digit by digit before identification.
2. `identify_customer.parameters.contractId` and `.zip` exactly match the confirmed transcript.
3. A successful lookup continues directly to the missing-meter-reading objective.

