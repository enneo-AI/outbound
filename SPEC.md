# Outbound Demo Trigger

## Goal

Create a tiny public demo page where a visitor enters one phone number and triggers an Enneo outbound demo call.

## User

Internal Enneo demo users and prospects during live demos. They should be able to request a call without seeing any technical details.

## Flow

1. User opens the page.
2. User enters a phone number.
3. Frontend validates and normalizes the number.
4. Frontend calls a serverless endpoint.
5. Serverless endpoint triggers `POST https://aleksa-dev.enneo.ai/api/acd/call/outbound`.
6. UI shows progress, success with ticket id, or a helpful error.

## Scope

- Single screen only.
- One required input: phone number.
- No auth.
- No customer data collection.
- No bank data.
- Server-side ACD trigger to keep config out of the client bundle.

## Current Demo Defaults

- Outbound line id: `a5ea8b57-591a-4015-98e6-cbd15b9d799f`
- Caller id: `43`
- Demo scenario: proactive meter reading and optional Abschlag check.
- Demo identity if asked by voicebot: contract `715559`, postal code `20249`, plausible meter reading `108234 kWh`.

## Safety Notes

This page can initiate real phone calls. Before public production use, add at least one of:

- captcha
- per-number rate limiting
- internal access protection
- phone-number allowlist

