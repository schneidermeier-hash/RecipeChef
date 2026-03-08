import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

type MenuItem = {
  name: string
  category: string
  price?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const restaurant = searchParams.get('restaurant')?.trim()
  const service = searchParams.get('service')?.trim()

  if (!restaurant || !service) {
    return NextResponse.json({ error: 'restaurant und service sind erforderlich' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Menü-Lookup nicht konfiguriert (API Key fehlt)' }, { status: 503 })
  }

  const anthropic = new Anthropic({ apiKey, timeout: 30_000 })

  const userQuery = `Suche die aktuelle Speisekarte des Restaurants "${restaurant}" auf ${service} und liste alle Gerichte auf.

Antworte ausschließlich mit einem JSON-Array in folgendem Format (kein anderer Text):
[{"name": "Gerichtname", "category": "Kategorie", "price": "12.90 €"}]

Falls kein Preis gefunden wird, lasse "price" weg. Falls das Restaurant nicht gefunden wird, antworte mit: []`

  let messages: Anthropic.MessageParam[] = [{ role: 'user', content: userQuery }]
  let response: Anthropic.Message

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 2048,
        tools: [{ type: 'web_search_20260209', name: 'web_search' }],
        messages,
      })

      if (response.stop_reason !== 'pause_turn') break

      messages = [
        { role: 'user', content: userQuery },
        { role: 'assistant', content: response.content },
      ]
    }

    const textBlock = response!.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    if (!textBlock) {
      return NextResponse.json({ error: 'Keine Antwort vom KI-Dienst' }, { status: 503 })
    }

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: `Keine Gerichte für "${restaurant}" auf ${service} gefunden` }, { status: 404 })
    }

    const items: MenuItem[] = JSON.parse(jsonMatch[0])
    if (items.length === 0) {
      return NextResponse.json({ error: `Keine Gerichte für "${restaurant}" auf ${service} gefunden` }, { status: 404 })
    }

    return NextResponse.json({ items, source: 'ai' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: `KI-Suche fehlgeschlagen: ${message}` }, { status: 503 })
  }
}
