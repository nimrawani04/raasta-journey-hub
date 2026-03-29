import type { UiLocale } from '@/lib/localeForLlm'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export type TaleemRequest = {
  locale: UiLocale
  pillar: string
  sub?: string
  message?: string
  ocrText?: string
}

export async function taleemLlm(req: TaleemRequest): Promise<string> {
  // Import taleem prompts dynamically to get system/user prompt
  const { taleemPrompts } = await import('@/lib/taleem-server')
  const prompts = taleemPrompts({
    pillar: req.pillar,
    sub: req.sub,
    message: req.message,
    ocrText: req.ocrText,
  })

  if (!prompts) {
    return 'Please provide more details for this feature.'
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({
      mode: 'taleem',
      locale: req.locale,
      system: prompts.system,
      prompt: prompts.user,
    }),
  })
  if (!res.ok) throw new Error('Taleem LLM failed')
  const data = (await res.json()) as { text?: string }
  return data.text ?? ''
}
