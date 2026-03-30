import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(body),
    })

    if (res.status === 429) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }
    if (res.status === 402) {
      return NextResponse.json({ error: 'AI credits exhausted' }, { status: 402 })
    }
    if (!res.ok) {
      console.error('ai-chat proxy error:', res.status, await res.text().catch(() => ''))
      return NextResponse.json({ error: 'AI service error' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('LLM route error:', error)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
