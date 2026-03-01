import { NextRequest, NextResponse } from 'next/server'
import { prisma, checkDatabaseConnection, describePrismaError } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where = search
      ? { name: { contains: search } }
      : {}

    const [meals, total] = await Promise.all([
      prisma.meal.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.meal.count({ where }),
    ])

    return NextResponse.json({
      meals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/meals error:', error)
    const { message, status } = describePrismaError(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbCheck = await checkDatabaseConnection()
    if (!dbCheck.ok) {
      console.error('Datenbankverbindung fehlgeschlagen:', dbCheck.error)
      return NextResponse.json(
        { error: `Datenbank nicht erreichbar: ${dbCheck.error}` },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { date, name, note } = body

    if (!date || !name) {
      return NextResponse.json(
        { error: 'Datum und Name sind erforderlich' },
        { status: 400 }
      )
    }

    const meal = await prisma.meal.create({
      data: {
        date: new Date(date),
        name,
        note: note || null,
      },
    })

    return NextResponse.json(meal, { status: 201 })
  } catch (error) {
    console.error('POST /api/meals error:', error)
    const { message, status } = describePrismaError(error)
    return NextResponse.json({ error: message }, { status })
  }
}
