export type TranscribeResult = { text: string; demo: boolean }

/**
 * Transcribe audio using browser Speech Recognition or Whisper via edge function.
 * For now, we use browser-based STT since Whisper requires special handling.
 * The MicButton + browser SpeechRecognition handles most cases.
 */
export async function transcribeAudio(blob: Blob): Promise<TranscribeResult> {
  // For now, return demo mode - browser STT is the primary input method
  // Whisper transcription can be added as an edge function when needed
  try {
    const form = new FormData()
    form.append('file', blob, 'clip.webm')
    const res = await fetch('/api/transcribe', { method: 'POST', body: form })
    const data = (await res.json()) as {
      text?: string
      demo?: boolean
      error?: string
    }
    if (!res.ok) {
      return { text: '', demo: false }
    }
    return {
      text: data.text?.trim() ?? '',
      demo: Boolean(data.demo),
    }
  } catch {
    return { text: '', demo: true }
  }
}
