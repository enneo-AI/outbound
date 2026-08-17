# Enneo Outbound Demo

Small demo page for triggering an Enneo outbound voicebot call.

Live URL: https://enneo.aleksa.ai/

## What It Does

- Shows one phone-number input.
- Requires a demo access token before a call can be started.
- Normalizes German local numbers to E.164.
- Calls a Netlify Function.
- The function calls Mind's authenticated `POST /telephony/outboundCall` endpoint.
- Mind initiates the configured Enneo ACD outbound call internally.
- The selected subchannel's dedicated AI agent owns the call objective and behavior; the demo does not append a second per-call briefing.
- The response shows the created Enneo ticket id.
- Current demo flow: Emma proactively collects a meter reading and can optionally ask about Abschlag changes.

## Local Development

```bash
npm install
npm run dev
```

Open the Netlify dev URL and enter a phone number.

## Environment Variables

All values have aleksa-dev demo defaults, but should be set explicitly in Netlify:

```bash
ENNEO_API_TOKEN=replace-with-an-enneo-api-token
ENNEO_OUTBOUND_URL=https://aleksa-dev.enneo.ai/api/mind/telephony/outboundCall
OUTBOUND_SUBCHANNEL_ID=12
DEMO_ACCESS_TOKEN=replace-with-a-long-random-demo-token
ALLOWED_PHONE_NUMBERS=+491607763741
```

`DEMO_ACCESS_TOKEN` is required. If it is missing, the function fails closed and does not trigger calls.

`ENNEO_API_TOKEN` is required and stays server-side in the Netlify Function. Direct public calls to ACD are intentionally blocked; Mind authenticates the request and calls ACD over the internal service network.

`ALLOWED_PHONE_NUMBERS` is optional, but strongly recommended for public demos.

## Demo Script

If Emma asks for customer data:

- Contract number: `715559`
- Postal code: `20249`
- Meter reading: `108234 kWh`
- Optional Abschlag: `190 EUR starting next month`

Latest verified test: ticket `#2194` on aleksa-dev.

## Safety

This app can initiate real outbound calls. Keep `DEMO_ACCESS_TOKEN` private and rotate it if shared too broadly. Do not expose the page broadly without an allowlist, captcha, or rate limiting.
