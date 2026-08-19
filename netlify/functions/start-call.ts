import type { Handler } from '@netlify/functions'

const ENNEO_TEST_OUTBOUND_URL =
  process.env.ENNEO_TEST_OUTBOUND_URL ??
  'https://aleksa-dev.enneo.ai/api/mind/telephony/testOutboundCall'
const ENNEO_API_TOKEN = process.env.ENNEO_API_TOKEN?.trim()
const OUTBOUND_SUBCHANNEL_ID = Number(process.env.OUTBOUND_SUBCHANNEL_ID ?? '12')
const DEMO_ACCESS_TOKEN = process.env.DEMO_ACCESS_TOKEN?.trim()

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

  if (!ENNEO_API_TOKEN) {
    return json(503, {
      message: 'The Enneo API token is not configured.',
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

  const enneoResponse = await fetch(ENNEO_TEST_OUTBOUND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ENNEO_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumber: customerPhoneNumber,
      subchannelId: OUTBOUND_SUBCHANNEL_ID,
    }),
  })

  const responseText = await enneoResponse.text()
  let responsePayload: Record<string, unknown> = {}

  try {
    responsePayload = JSON.parse(responseText)
  } catch {
    responsePayload = { raw: responseText }
  }

  if (!enneoResponse.ok) {
    return json(enneoResponse.status, {
      message:
        typeof responsePayload.message === 'string'
          ? responsePayload.message
          : typeof responsePayload.error === 'string'
            ? responsePayload.error
          : 'The outbound call could not be started.',
      details: responsePayload,
    })
  }

  const downstreamResponse = isObject(responsePayload.response)
    ? responsePayload.response
    : null
  const downstreamFailed =
    downstreamResponse?.success === false ||
    typeof downstreamResponse?.error === 'string' ||
    Array.isArray(downstreamResponse?.detail)

  if (responsePayload.success !== true || downstreamFailed) {
    return json(502, {
      message: 'The outbound call could not be started.',
      details: responsePayload,
    })
  }

  return json(200, {
    accepted: true,
    phoneNumber: customerPhoneNumber,
  })
}
