'use client'

import { useMemo } from 'react'

type Props = { text: string; className?: string }

/** Renders basic markdown bold (**text**) as <strong> tags */
export function MarkdownText({ text, className = '' }: Props) {
  const parts = useMemo(() => {
    const segments: { text: string; bold: boolean }[] = []
    const regex = /\*\*(.+?)\*\*/g
    let last = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) segments.push({ text: text.slice(last, match.index), bold: false })
      segments.push({ text: match[1], bold: true })
      last = match.index + match[0].length
    }
    if (last < text.length) segments.push({ text: text.slice(last), bold: false })
    return segments
  }, [text])

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.bold ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>
      )}
    </span>
  )
}
