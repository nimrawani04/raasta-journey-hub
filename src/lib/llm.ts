import type { UiLocale } from '@/lib/localeForLlm'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

async function postChat(body: Record<string, string>): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
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
    system: 'You are Samjho, powered by HAQQ. Explain government or legal documents in simple language for people with low literacy. Short paragraphs, warm and clear. Include deadlines and next steps.',
    prompt: `Document text:\n${ocrText}\n\nExplain what this means and what the reader should do.`,
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
    system: 'You are Zameen, powered by WADI. Give practical crop and disease advice. Mention treatment timing and mandi (market) price when data is provided. Keep it voice-friendly.',
    prompt: `Vision summary: ${visionSummary}\nMarket note: ${mandiHint}`,
  })
}

export async function answerVoiceQuestion(
  question: string,
  locale: UiLocale,
): Promise<string> {
  return postChat({
    mode: 'raah',
    locale,
    system: 'You are Raah, the voice layer of RAASTA. Help people in Kashmir and rural India with government schemes, farming, documents, jobs, and education (Taleem). Be concise. No long bullet lists unless asked.',
    prompt: question,
  })
}
