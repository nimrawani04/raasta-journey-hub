import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: 'Missing audio file' }, { status: 400 })
  }

  // Use Lovable AI Gateway (Whisper is not supported, so use speech-to-text via the chat model)
  // For now, return demo mode — browser STT is the primary path
  // The Raah page uses browser SpeechRecognition for the main mic button
  // This endpoint is a fallback for the "Record via Whisper" button
  return NextResponse.json({
    text: '',
    demo: true,
    error: 'Whisper transcription not available. Use the microphone button for voice input.',
  })
}
