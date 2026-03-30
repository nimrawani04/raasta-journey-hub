import type { UiLocale } from '@/lib/localeForLlm'

async function postChat(body: Record<string, string>): Promise<string> {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 429) throw new Error('Rate limited — please try again shortly.')
  if (res.status === 402) throw new Error('AI credits exhausted. Please add funds.')
  if (!res.ok) throw new Error('AI request failed')
  const data = (await res.json()) as { text?: string }
  return data.text ?? ''
}

export async function explainDocumentSimpleUrdu(
  ocrText: string,
  locale: UiLocale,
): Promise<string> {
  return postChat({
    mode: 'samjho',
    locale,
    ocrText,
  })
}

export async function explainCropAdvice(
  visionSummary: string,
  mandiHint: string,
  locale: UiLocale,
): Promise<string> {
  return postChat({
    mode: 'zameen',
    locale,
    visionSummary,
    mandiHint,
  })
}

export async function answerVoiceQuestion(
  question: string,
  locale: UiLocale,
): Promise<string> {
  return postChat({
    mode: 'raah',
    locale,
    question,
  })
}
