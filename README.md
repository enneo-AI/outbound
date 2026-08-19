# Enneo Outbound Demo

Small demo page for triggering an Enneo outbound voicebot call.

Live URL: https://enneo.aleksa.ai/

## What It Does

- Shows one phone-number input.
- Requires a demo access token before a call can be started.
- Normalizes German local numbers to E.164.
- Calls a Netlify Function.
- The function calls Mind's existing authenticated `POST /telephony/testOutboundCall` endpoint.
- Mind initiates the configured Enneo ACD outbound call internally.
- The response confirms that the outbound request was accepted; dialing and connection happen asynchronously.
- The selected subchannel currently uses a generic outbound base agent.
- Limitation: this endpoint does not forward Objective, Context or Constraints, so the website is not the test harness for Alina's dynamic satisfaction scenario.

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
ENNEO_TEST_OUTBOUND_URL=https://aleksa-dev.enneo.ai/api/mind/telephony/testOutboundCall
OUTBOUND_SUBCHANNEL_ID=12
DEMO_ACCESS_TOKEN=replace-with-a-long-random-demo-token
ALLOWED_PHONE_NUMBERS=+491607763741
```

`DEMO_ACCESS_TOKEN` is required. If it is missing, the function fails closed and does not trigger calls.

`ENNEO_API_TOKEN` is required and stays server-side in the Netlify Function. The website uses the regular authenticated Mind test endpoint and requires no Admin-Portal or instance-setting changes.

`ALLOWED_PHONE_NUMBERS` is optional, but strongly recommended for public demos.

## Dynamic Briefing Test

Use the internal Enneo External Call drawer with Dynamic Call Flow for briefing-driven tests. The live agent on subchannel `12` expects the per-call Objective, Context and Constraints and currently targets Alina's post-technician satisfaction scenario.

The public website can support the same scenario only after Mind MR `!1803` is deployed or merged and the Netlify function is switched to authenticated `/telephony/outboundCall`.

## Safety

This app can initiate real outbound calls. Keep `DEMO_ACCESS_TOKEN` private and rotate it if shared too broadly. Do not expose the page broadly without an allowlist, captcha, or rate limiting.
