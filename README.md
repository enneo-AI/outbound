# Enneo Outbound Demo

Small demo page for triggering an Enneo outbound voicebot call.

Live URL: https://enneo.aleksa.ai/

## What It Does

- Shows one phone-number input.
- Normalizes German local numbers to E.164.
- Calls a Netlify Function.
- The function triggers `POST /api/acd/call/outbound`.
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
ACD_OUTBOUND_URL=https://aleksa-dev.enneo.ai/api/acd/call/outbound
ACD_CALLER_ID=43
ACD_OUTBOUND_PHONE_NUMBER_ID=a5ea8b57-591a-4015-98e6-cbd15b9d799f
ALLOWED_PHONE_NUMBERS=+491607763741
```

`ALLOWED_PHONE_NUMBERS` is optional, but strongly recommended for public demos.

## Demo Script

If Emma asks for customer data:

- Contract number: `715559`
- Postal code: `20249`
- Meter reading: `108234 kWh`
- Optional Abschlag: `190 EUR starting next month`

Latest verified test: ticket `#2194` on aleksa-dev.

## Safety

This app can initiate real outbound calls. Do not expose it broadly without an allowlist, captcha, or rate limiting.
