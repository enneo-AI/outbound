import type { Handler } from '@netlify/functions'

const ACD_OUTBOUND_URL =
  process.env.ACD_OUTBOUND_URL ?? 'https://aleksa-dev.enneo.ai/api/acd/call/outbound'

const CALLER_ID = Number(process.env.ACD_CALLER_ID ?? '43')
const OUTBOUND_PHONE_NUMBER_ID =
  process.env.ACD_OUTBOUND_PHONE_NUMBER_ID ?? 'a5ea8b57-591a-4015-98e6-cbd15b9d799f'
const DEMO_ACCESS_TOKEN = process.env.DEMO_ACCESS_TOKEN?.trim()

const OUTBOUND_OBJECTIVE = [
  'Run a concise German outbound demo call for an energy utility.',
  'This is not an inbound support call: Enneo called the customer proactively because a meter reading is missing for the next bill.',
  'Primary task: identify the customer, collect the current meter reading, submit it, and confirm success.',
  'Optional follow-up only after the meter reading is saved: ask once whether the customer would like to check or change the monthly Abschlag.',
].join(' ')

const OUTBOUND_CONTEXT = [
  'Internal Enneo demo on aleksa-dev.',
  'The caller acts as demo customer Susanne Ludwig.',
  'Useful demo identity data if asked: contract number 715559 and postal code 20249.',
  'Plausible meter reading example for this contract: 108234 kWh.',
  'Good Abschlag example: 190 EUR starting next month.',
].join(' ')

const OUTBOUND_CONSTRAINTS = [
  'Start with the configured first message.',
  'Ask for consent before collecting data.',
  'If the customer asks to speak to a human, asks to be connected, or rejects the voicebot, immediately use the transfer_to_human_agent tool. Do not identify the customer first, do not continue the meter-reading flow, and do not use hangup_call for a human handover request.',
  'Identify the customer using contract number and postal code before account-specific actions.',
  'After successful identification, do not ask what the customer wants to know about the contract. Instead continue the outbound task immediately and ask for the current meter reading in kWh.',
  'Keep the conversation state anchored on the outbound objective, even after tool calls or customer identification.',
  'Ask one question at a time.',
  'Keep the call short and natural.',
  'Do not collect bank details in this demo.',
  'When the customer wants to end the call or after the task is complete, say a short goodbye and then hang up silently via the available hangup action. Do not say that you are ending the call, hanging up, calling a function, or using a tool.',
].join(' ')

function json(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  }
}

function normalizePhoneNumber(input: string) {
  const compact = input.replace(/[^\d+]/g, '')

  if (compact.startsWith('+')) return compact
  if (compact.startsWith('00')) return `+${compact.slice(2)}`
  if (compact.startsWith('0')) return `+49${compact.slice(1)}`

  return compact
}

function isValidE164(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value)
}

function isAllowed(phoneNumber: string) {
  const rawAllowlist = process.env.ALLOWED_PHONE_NUMBERS

  if (!rawAllowlist) {
    return true
  }

  const allowed = rawAllowlist
    .split(',')
    .map((item) => normalizePhoneNumber(item.trim()))
    .filter(Boolean)

  return allowed.includes(phoneNumber)
}

function hasValidAccessToken(value: unknown) {
  if (!DEMO_ACCESS_TOKEN) {
    return false
  }

  return typeof value === 'string' && value.trim() === DEMO_ACCESS_TOKEN
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { message: 'Method not allowed.' })
  }

  let parsed: { phoneNumber?: unknown; accessToken?: unknown }

  try {
    parsed = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { message: 'Invalid JSON body.' })
  }

  if (typeof parsed.phoneNumber !== 'string') {
    return json(400, { message: 'Phone number is required.' })
  }

  if (!DEMO_ACCESS_TOKEN) {
    return json(503, {
      message: 'The demo access token is not configured.',
    })
  }

  if (!hasValidAccessToken(parsed.accessToken)) {
    return json(401, {
      message: 'Please enter a valid demo access token.',
    })
  }

  const customerPhoneNumber = normalizePhoneNumber(parsed.phoneNumber)

  if (!isValidE164(customerPhoneNumber)) {
    return json(400, {
      message: 'Please enter a valid international phone number.',
    })
  }

  if (!isAllowed(customerPhoneNumber)) {
    return json(403, {
      message: 'This phone number is not enabled for the demo.',
    })
  }

  const acdResponse = await fetch(ACD_OUTBOUND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callerId: CALLER_ID,
      customerPhoneNumber,
      outboundPhoneNumberId: OUTBOUND_PHONE_NUMBER_ID,
      isPhoneNumberHidden: false,
      isDynamicFlowCall: true,
      objective: OUTBOUND_OBJECTIVE,
      context: OUTBOUND_CONTEXT,
      constraints: OUTBOUND_CONSTRAINTS,
    }),
  })

  const responseText = await acdResponse.text()
  let responsePayload: Record<string, unknown> = {}

  try {
    responsePayload = JSON.parse(responseText)
  } catch {
    responsePayload = { raw: responseText }
  }

  if (!acdResponse.ok) {
    return json(acdResponse.status, {
      message:
        typeof responsePayload.message === 'string'
          ? responsePayload.message
          : 'The outbound call could not be started.',
      details: responsePayload,
    })
  }

  return json(200, {
    ticketId: responsePayload.ticketId,
    channelId: responsePayload.channelId,
    phoneNumber: customerPhoneNumber,
  })
}
