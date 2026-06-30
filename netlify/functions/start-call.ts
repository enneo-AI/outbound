import type { Handler } from '@netlify/functions'

const ACD_OUTBOUND_URL =
  process.env.ACD_OUTBOUND_URL ?? 'https://aleksa-dev.enneo.ai/api/acd/call/outbound'

const CALLER_ID = Number(process.env.ACD_CALLER_ID ?? '43')
const OUTBOUND_PHONE_NUMBER_ID =
  process.env.ACD_OUTBOUND_PHONE_NUMBER_ID ?? 'a5ea8b57-591a-4015-98e6-cbd15b9d799f'

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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { message: 'Method not allowed.' })
  }

  let parsed: { phoneNumber?: unknown }

  try {
    parsed = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { message: 'Invalid JSON body.' })
  }

  if (typeof parsed.phoneNumber !== 'string') {
    return json(400, { message: 'Phone number is required.' })
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
      isDynamicCall: true,
      objective:
        'Run a concise outbound demo call for an energy utility. Proactively collect the customer meter reading for an upcoming bill and, if the customer wants, collect a requested monthly Abschlag change.',
      context:
        'Internal Enneo demo on aleksa-dev. The caller acts as demo customer Susanne Ludwig. Useful demo identity data if asked: contract number 715559 and postal code 20249. Plausible meter reading example for this contract: 108234 kWh. Good Abschlag example: 190 EUR starting next month.',
      constraints:
        'Start with the configured first message. Ask for consent before collecting data. Identify the customer using contract number and postal code before account-specific actions. Ask one question at a time. Keep the call short and natural. Do not collect bank details in this demo. If the customer asks to end the call, close politely and hang up.',
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
