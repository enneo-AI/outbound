import { FormEvent, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, CheckCircle2, Loader2, Phone } from 'lucide-react'

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
    <main className="brand-shell min-h-screen overflow-hidden bg-brand-navy text-white">
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 py-8 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <motion.form
            onSubmit={handleSubmit}
            layout
            className="mx-auto w-full rounded-2xl border border-white/15 bg-white/[0.08] p-6 shadow-glass backdrop-blur-2xl sm:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <img
                src="/brand/enneo-logo-light.svg"
                alt="Enneo"
                className="h-8 w-auto"
              />
              <div className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 font-mono text-[11px] uppercase leading-none text-lavender">
                Outbound Demo
              </div>
            </div>

            <div className="mt-12 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-white/[0.09] text-lavender shadow-inner-soft">
                <Phone className="h-6 w-6" />
              </div>
            </div>

            <h1 className="mx-auto mt-7 max-w-xl text-center text-4xl font-semibold leading-[1.04] text-white sm:text-5xl">
              Emma ruft Sie gleich an.
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-center text-base leading-7 text-white/70 sm:text-lg">
              Geben Sie eine Telefonnummer ein. Enneo startet einen proaktiven
              Demo-Anruf zur Zählerstandserfassung.
            </p>

            <label className="mt-10 block font-mono text-xs uppercase text-lavender" htmlFor="phone">
              Telefonnummer
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
              className="mt-3 h-14 w-full rounded-xl border border-white/15 bg-white/[0.1] px-4 text-base text-white outline-none transition placeholder:text-white/35 focus:border-lavender focus:bg-white/[0.14] focus:ring-4 focus:ring-purple/20"
            />

            <div className="mt-3 min-h-5 font-mono text-xs text-white/45">
              {phoneNumber.trim() ? `Anrufziel: ${normalized}` : ' '}
            </div>

            <motion.button
              type="submit"
              disabled={!canSubmit}
              whileHover={canSubmit ? { y: -1 } : undefined}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-purple px-4 text-sm font-semibold text-white shadow-purple transition hover:bg-purple-dark disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40 disabled:shadow-none"
            >
              {callState.status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Anruf wird gestartet
                </>
              ) : (
                <>
                  Outbound Call starten
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>

            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 font-mono text-[11px] uppercase text-white/45">
              <div>Zählerstand</div>
              <div className="text-center">Live Ticket</div>
              <div className="text-right">Emma</div>
            </div>

            <AnimatePresence mode="wait">
              {callState.status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-5 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm text-emerald-50"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    Anruf gestartet
                  </div>
                  <div className="mt-2 font-mono text-xs text-emerald-50/70">
                    Ticket #{callState.ticketId}
                  </div>
                </motion.div>
              )}

              {callState.status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-5 rounded-xl border border-red-300/30 bg-red-300/10 p-4 text-sm leading-6 text-red-50"
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
