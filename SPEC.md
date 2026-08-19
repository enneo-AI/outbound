# Outbound Demo Trigger

## Goal

Create a tiny public demo page where a visitor enters one phone number and triggers an Enneo outbound demo call.

Current public demo URL: https://enneo.aleksa.ai/

## User

Internal Enneo demo users and prospects during live demos. They should be able to request a call without seeing any technical details.

## Flow

1. User opens the page.
2. User enters a phone number and the demo access token.
3. Frontend validates and normalizes the number.
4. Frontend calls a serverless endpoint.
5. Serverless endpoint triggers authenticated `POST https://aleksa-dev.enneo.ai/api/mind/telephony/testOutboundCall`.
6. UI shows request acceptance or a helpful error. Acceptance means dialing was requested, not that the phone rang or connected.

## Scope

- Single screen only.
- Required inputs: phone number and demo access token.
- No auth.
- No customer data collection.
- No bank data.
- Server-side authenticated Mind trigger to keep credentials out of the client bundle.
- Server-side access-token check to prevent anonymous call spam.

## Current Demo Defaults

- Subchannel id: `12`
- Live agent: generic `Outbound Base Agent` (id `78`)
- Live target scenario: dynamic post-service satisfaction follow-up controlled by Objective, Context and Constraints in the internal platform.
- Website limitation: `testOutboundCall` does not forward those three briefing fields. The website remains a basic dial trigger until Mind MR `!1803` is available.
- Required Netlify secret: `DEMO_ACCESS_TOKEN`.

## Safety Notes

This page can initiate real phone calls. Before public production use, add at least one of:

- captcha
- per-number rate limiting
- internal access protection
- phone-number allowlist
- dedicated demo access token
