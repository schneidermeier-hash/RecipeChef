import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

type MenuItem = {
  name: string
  category: string
  price?: string
}

async function lookupMenuWithAI(restaurant: string, service: string): Promise<MenuItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY nicht konfiguriert')

  const anthropic = new Anthropic({ apiKey, timeout: 30_000 })

  const userQuery = `Suche die aktuelle Speisekarte des Restaurants "${restaurant}" auf ${service} und liste alle Gerichte auf.

Antworte ausschließlich mit einem JSON-Array in folgendem Format (kein anderer Text):
[{"name": "Gerichtname", "category": "Kategorie", "price": "12.90 €"}]

Falls kein Preis gefunden wird, lasse "price" weg. Falls das Restaurant nicht gefunden wird, antworte mit: []`

  let messages: Anthropic.MessageParam[] = [{ role: 'user', content: userQuery }]
  let response: Anthropic.Message

  // Re-send if server-side tool loop hit its iteration limit
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
  if (!textBlock) return []

  const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  return JSON.parse(jsonMatch[0]) as MenuItem[]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const restaurant = searchParams.get('restaurant')?.trim()
  const service = searchParams.get('service')?.trim()

  if (!restaurant || !service) {
    return NextResponse.json({ error: 'restaurant und service sind erforderlich' }, { status: 400 })
  }

  if (service.toLowerCase() !== 'wolt') {
    try {
      const items = await lookupMenuWithAI(restaurant, service)
      if (items.length === 0) {
        return NextResponse.json({ error: `Keine Gerichte für "${restaurant}" auf ${service} gefunden` }, { status: 404 })
      }
      return NextResponse.json({ items, source: 'ai' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
      return NextResponse.json({ error: `KI-Suche fehlgeschlagen: ${message}` }, { status: 503 })
    }
  }

  const lat = process.env.WOLT_LAT ?? '48.1374'
  const lon = process.env.WOLT_LON ?? '11.5755'

  // Step 1: Search for the restaurant
  let slug: string
  try {
    const searchUrl = `https://restaurant-api.wolt.com/v3/venues/search?q=${encodeURIComponent(restaurant)}&lat=${lat}&lon=${lon}`
    const searchRes = await fetch(searchUrl, {
      headers: { 'Accept-Language': 'de' },
      signal: AbortSignal.timeout(8000),
    })

    if (!searchRes.ok) {
      return NextResponse.json({ error: 'Wolt-API nicht erreichbar' }, { status: 503 })
    }

    const searchData = await searchRes.json()
    const venues: { slug?: string }[] = searchData?.results?.venues ?? []

    if (venues.length === 0) {
      return NextResponse.json({ error: `Kein Wolt-Restaurant gefunden für "${restaurant}"` }, { status: 404 })
    }

    slug = venues[0].slug ?? ''
    if (!slug) {
      return NextResponse.json({ error: 'Kein gültiges Restaurant gefunden' }, { status: 404 })
    }
  } catch {
    return NextResponse.json({ error: 'Wolt-API nicht erreichbar' }, { status: 503 })
  }

  // Step 2: Load menu
  try {
    const menuUrl = `https://restaurant-api.wolt.com/v3/venues/slug/${slug}/menu`
    const menuRes = await fetch(menuUrl, {
      headers: { 'Accept-Language': 'de' },
      signal: AbortSignal.timeout(8000),
    })

    if (!menuRes.ok) {
      return NextResponse.json({ error: 'Menü konnte nicht geladen werden' }, { status: 503 })
    }

    const menuData = await menuRes.json()

    // Extract items from categories
    const items: MenuItem[] = []

    // Wolt menu structure: menuData.categories (array) each with .items (array)
    // items have: name (object with translations), description, price (in cents)
    const categories: {
      name?: Record<string, string> | string
      items?: {
        name?: Record<string, string> | string
        price?: number
        baseprice?: number
      }[]
    }[] = menuData?.categories ?? []

    const resolveName = (field: Record<string, string> | string | undefined): string => {
      if (!field) return ''
      if (typeof field === 'string') return field
      return field['de'] ?? field['en'] ?? Object.values(field)[0] ?? ''
    }

    for (const cat of categories) {
      const categoryName = resolveName(cat.name)
      for (const item of cat.items ?? []) {
        const itemName = resolveName(item.name)
        if (!itemName) continue
        const rawPrice = item.price ?? item.baseprice
        const price = rawPrice != null ? `${(rawPrice / 100).toFixed(2)} €` : undefined
        items.push({ name: itemName, category: categoryName, price })
      }
    }

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: 'Menü konnte nicht geladen werden' }, { status: 503 })
  }
}
