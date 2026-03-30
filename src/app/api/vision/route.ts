import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-vision`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: form,
    })

    if (res.status === 429) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }
    if (res.status === 402) {
      return NextResponse.json({ error: 'AI credits exhausted' }, { status: 402 })
    }
    if (!res.ok) {
      console.error('ai-vision proxy error:', res.status)
      return NextResponse.json({
        summary: 'early_fungal_spots',
        mandiHint: 'Sopore mandi - apple ~Rs.42/kg (demo)',
        demo: true,
      })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Vision route error:', error)
    return NextResponse.json({
      summary: 'early_fungal_spots',
      mandiHint: 'Sopore mandi - apple ~Rs.42/kg (demo)',
      demo: true,
    })
  }
}
