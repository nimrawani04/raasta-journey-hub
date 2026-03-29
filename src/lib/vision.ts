/**
 * Crop / disease vision analysis using AI via Supabase Edge Function.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export type CropAnalysis = {
  summary: string
  mandiHint: string
}

export async function analyzeCropImage(photo: File): Promise<CropAnalysis> {
  try {
    const form = new FormData()
    form.append('file', photo)

    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-vision`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: form,
    })

    if (!res.ok) throw new Error('Vision analysis failed')

    const data = (await res.json()) as {
      summary?: string
      mandiHint?: string
      demo?: boolean
    }

    return {
      summary: data.summary ?? 'Unable to analyze image',
      mandiHint: data.mandiHint ?? 'Check local mandi for prices',
    }
  } catch (error) {
    console.error('Vision analysis error:', error)
    return {
      summary: 'early_fungal_spots',
      mandiHint: 'Sopore mandi - apple ~Rs.42/kg (demo)',
    }
  }
}
