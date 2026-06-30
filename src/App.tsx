import { FormEvent, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, CheckCircle2, Loader2, Phone, ShieldCheck } from 'lucide-react'

type CallState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; ticketId: number; channelId: string }
  | { status: 'error'; message: string }

function normalizePhoneNumber(input: string) {
  const compact = input.replace(/[^\d+]/g, '')

  if (compact.startsWith('+')) {
    return compact
  }

  if (compact.startsWith('00')) {
    return `+${compact.slice(2)}`
  }

  if (compact.startsWith('0')) {
    return `+49${compact.slice(1)}`
  }

  return compact
}

function isValidE164(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value)
}

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callState, setCallState] = useState<CallState>({ status: 'idle' })

  const normalized = useMemo(() => normalizePhoneNumber(phoneNumber), [phoneNumber])
  const canSubmit = isValidE164(normalized) && callState.status !== 'loading'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isValidE164(normalized)) {
      setCallState({
        status: 'error',
        message: 'Please enter a valid phone number, for example +491607763741.',
      })
      return
    }

    setCallState({ status: 'loading' })

    try {
      const response = await fetch('/.netlify/functions/start-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: normalized }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'The outbound call could not be started.')
      }

      setCallState({
        status: 'success',
        ticketId: payload.ticketId,
        channelId: payload.channelId,
      })
    } catch (error) {
      setCallState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'The outbound call could not be started.',
      })
    }
  }

  return (
    <main className="min-h-screen bg-[#eef1f5] text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-5 py-8 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="grid items-center gap-8 lg:grid-cols-[1fr_420px]"
        >
          <div className="max-w-2xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-sm font-medium text-muted shadow-sm">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Enneo outbound voicebot demo
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal text-ink sm:text-6xl">
              Trigger a proactive utility call.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              Enter a phone number and Emma will start the meter-reading demo call.
              The call creates a live Enneo phone ticket with transcript, tool calls,
              and recording.
            </p>

            <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                ['01', 'Outbound call starts'],
                ['02', 'Customer identifies'],
                ['03', 'Meter reading is captured'],
              ].map(([step, label]) => (
                <motion.div
                  key={step}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                  className="rounded-lg border border-white bg-white/70 p-4 shadow-sm"
                >
                  <div className="text-sm font-semibold text-signal">{step}</div>
                  <div className="mt-2 text-sm font-medium leading-5 text-ink">{label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            layout
            className="rounded-lg border border-white bg-white p-5 shadow-soft sm:p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-white">
              <Phone className="h-5 w-5" />
            </div>

            <h2 className="mt-6 text-2xl font-semibold text-ink">Request a call</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Use international format or a German local mobile number.
            </p>

            <label className="mt-7 block text-sm font-medium text-ink" htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(event) => {
                setPhoneNumber(event.target.value)
                if (callState.status !== 'loading') setCallState({ status: 'idle' })
              }}
              placeholder="+491607763741"
              autoComplete="tel"
              className="mt-2 h-12 w-full rounded-lg border border-line bg-panel px-4 text-base text-ink outline-none transition focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
            />

            <div className="mt-2 min-h-5 text-xs text-muted">
              {phoneNumber.trim() ? `Will call: ${normalized}` : ' '}
            </div>

            <motion.button
              type="submit"
              disabled={!canSubmit}
              whileHover={canSubmit ? { y: -2 } : undefined}
              whileTap={canSubmit ? { scale: 0.98 } : undefined}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-muted/40"
            >
              {callState.status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting call
                </>
              ) : (
                <>
                  Start outbound call
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>

            <AnimatePresence mode="wait">
              {callState.status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    Call started
                  </div>
                  <div className="mt-2 text-emerald-800">Ticket #{callState.ticketId}</div>
                </motion.div>
              )}

              {callState.status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
                >
                  {callState.message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        </motion.div>
      </section>
    </main>
  )
}
