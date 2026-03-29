'use client'

import { useCallback, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { answerVoiceQuestion } from '@/lib/llm'
import { speechRecognitionLang } from '@/lib/localeForLlm'
import { speakForLocale, stopSpeaking } from '@/lib/tts'

type WebSpeechRec = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  onresult: ((ev: { results: Array<Array<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

function createSpeechRecognition(lang: string) {
  const W = window as unknown as {
    SpeechRecognition?: new () => WebSpeechRec
    webkitSpeechRecognition?: new () => WebSpeechRec
  }
  const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition
  if (!Ctor) return null
  const rec = new Ctor()
  rec.lang = lang
  rec.continuous = false
  rec.interimResults = false
  return rec
}

export function HomeHeroMic() {
  const { locale, t } = useI18n()
  const [state, setState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  const activate = useCallback(() => {
    if (state !== 'idle') return
    setError('')
    setAnswer('')

    const rec = createSpeechRecognition(speechRecognitionLang(locale))
    if (!rec) {
      setError('Speech recognition not supported in this browser.')
      return
    }

    setState('listening')

    rec.onresult = (e) => {
      const spoken = e.results[0]?.[0]?.transcript ?? ''
      if (!spoken.trim()) {
        setState('idle')
        return
      }
      setState('thinking')
      stopSpeaking()
      answerVoiceQuestion(spoken, locale)
        .then((a) => {
          setAnswer(a)
          setState('speaking')
          return speakForLocale(a, locale)
        })
        .then(() => setState('idle'))
        .catch(() => {
          setError('Could not get a response. Try again.')
          setState('idle')
        })
    }
    rec.onerror = () => {
      setError('Could not hear you. Please try again.')
      setState('idle')
    }
    rec.onend = () => {
      setState((s) => (s === 'listening' ? 'idle' : s))
    }
    try {
      rec.start()
    } catch {
      setError('Microphone access denied.')
      setState('idle')
    }
  }, [state, locale])

  const label =
    state === 'listening'
      ? 'Listening…'
      : state === 'thinking'
        ? 'Thinking…'
        : state === 'speaking'
          ? 'Speaking…'
          : 'Tap to converse in Kashmiri or English'

  return (
    <div className="flex flex-col items-center">
      <div className="relative group cursor-pointer mt-8">
        <button
          onClick={activate}
          disabled={state !== 'idle'}
          className={`w-28 h-28 md:w-32 md:h-32 bg-[var(--color-primary-container)] text-white flex items-center justify-center relative z-10 hover:opacity-90 transition-all rounded-full shadow-2xl ${
            state === 'listening' ? 'animate-pulse ring-4 ring-[var(--color-secondary)]' : ''
          } ${state === 'thinking' ? 'opacity-60' : ''}`}
        >
          <span
            className="material-symbols-outlined text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {state === 'listening' ? 'hearing' : state === 'thinking' ? 'hourglass_top' : 'mic'}
          </span>
        </button>
        <div className="absolute -inset-4 border border-[var(--color-secondary)] opacity-20 pointer-events-none rounded-full"></div>
      </div>

      <p
        className="font-label text-[10px] uppercase tracking-widest mt-8 opacity-90"
        style={{
          color: 'var(--color-on-surface)',
          textShadow: '0 1px 6px rgba(255,255,255,0.5)',
        }}
      >
        {label}
      </p>

      {error && (
        <p className="mt-4 text-xs text-[var(--color-error)] bg-[var(--color-error-container)] px-4 py-2 rounded">
          {error}
        </p>
      )}

      {answer && (
        <div className="mt-6 max-w-md mx-auto bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] p-4 rounded-lg">
          <p className="font-body text-sm text-[var(--color-on-surface)] leading-relaxed italic">
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}
