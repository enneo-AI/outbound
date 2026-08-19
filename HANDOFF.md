# Enneo Outbound Demo — Handoff

Last updated: 2026-08-19

## Live state

- Production URL: https://enneo.aleksa.ai
- Netlify project: `enneo-outbound`
- GitHub: `enneo-AI/outbound`
- Production branch: `main`
- Latest deployed commit: `9430bd8` (`Treat accepted outbound calls as successful`)
- Purpose: protected internal demo page that accepts a phone number plus a separate demo access code and triggers one outbound Enneo voice call.

## Architecture

The browser calls the Netlify function `/.netlify/functions/start-call`. The function validates the demo access code, normalizes the phone number, applies the optional allowlist and then calls:

```text
POST https://aleksa-dev.enneo.ai/api/mind/telephony/testOutboundCall
Authorization: Bearer <ENNEO_API_TOKEN>
```

The request contains only `phoneNumber` and `subchannelId`. Important: this endpoint does not forward `objective`, `context` or `constraints`; this website is therefore a basic dial trigger, not a valid harness for dynamic briefing tests.

`testOutboundCall` confirms synchronous request acceptance but creates the phone ticket asynchronously. The Netlify function therefore treats top-level `success: true` as accepted and does not require an immediate `ticketId` or `channelId`. Requiring those fields caused a false error even though tickets 2279 and 2280 were created and dialed.

Netlify environment variables:

- `DEMO_ACCESS_TOKEN` — public demo gate; never commit its value.
- `ENNEO_API_TOKEN` — server-side Enneo API key/JWT; secret, never expose to the client or commit.
- `ENNEO_TEST_OUTBOUND_URL` — optional override; defaults to the regular aleksa-dev Mind test endpoint.
- `OUTBOUND_SUBCHANNEL_ID` — defaults to `12`.
- `ALLOWED_PHONE_NUMBERS` — optional comma-separated allowlist.

Supabase, browser sessions, test users and local daemons are not part of this flow.

## Enneo dependency

The website uses the existing authenticated Mind route `POST /telephony/testOutboundCall`, which is available in the regular `2.0.121` build and accepts `phoneNumber` plus `subchannelId` overrides. The demo therefore requires no custom Mind image, Admin-Portal deployment or instance-setting change, but it cannot test Alina's per-call briefing behavior.

The old direct ACD endpoint `/api/acd/call/outbound` remains internal-only. Draft MR `enneo/mind!1803` created the correct authenticated public endpoint `/telephony/outboundCall`, including `objective`, `context` and `constraints`. The website must switch back to that endpoint only after !1803 is merged or deployed; never expose the internal ACD token in Netlify or the browser.

## Voice configuration on aleksa-dev

- AI agent: `Outbound Base Agent` (id `78`, phone-only, generic briefing placeholders)
- Subchannel: `ACD Autonomous Outbound Test` (id `12`, V2 call flow)
- Flow: `Start -> Voicebot -> Hangup/Error`, no human-routing node
- Voicebot: `allowForwardToHuman=false`, `allowHangup=true`; meter/payment/general tools explicitly disabled
- Recording: on
- AI Insights: satisfaction level, technician feedback, issue resolution, follow-up required

This is now the setup for Alina's autonomous satisfaction-follow-up scenario. The internal platform's Dynamic Call Flow drawer supplies the three runtime briefing fields. Dynamic calls create an out-of-routing `Unknown` queue entry, use the caller only as `triggeredBy`, do not change agent presence and automatically try to link customer/contract from the called number.

## Verification

- A valid phone with a deliberately nonexistent subchannel returns `404 Subchannel with id 999999 not found` before dialing, proving normal API authentication and body overrides.
- Direct real API test created ticket `2278`; dialing worked and the destination returned SIP `486 busy` before the later fleet regression.
- Netlify production deploy `9430bd8` is published.
- Safe Netlify smoke test with the valid demo gate and an invalid phone returns `400 Please enter a valid international phone number.`
- Post-rollout tickets `2279–2281` were accepted but timed out with SIP `480/noAnswer`; tracked separately as ACD issue #89 and not caused by the website.

## Next step

After ACD issue #89 is fixed, run Alina's scenario from the internal platform drawer using Dynamic Call Flow and the exact Objective/Context/Constraints from Notion. Verify bot-only execution, Unknown/out-of-routing queue state, untouched agent presence, customer linking, MP3, transcript, tool details and all four insights.

To make this public website test the same scenario, first deploy/merge Mind MR !1803, then send the three exact briefing fields to `/telephony/outboundCall` and update the UI copy from meter reading to satisfaction follow-up.
