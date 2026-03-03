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
      ? {
          OR: [
            { deliveryService: { contains: search, mode: 'insensitive' as const } },
            { restaurant: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [orders, total] = await Promise.all([
      prisma.deliveryOrder.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: { items: { orderBy: { createdAt: 'asc' } } },
      }),
      prisma.deliveryOrder.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/delivery-orders error:', error)
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
    const { date, deliveryService, restaurant, price, note, items } = body

    if (!date || !deliveryService || !restaurant) {
      return NextResponse.json(
        { error: 'Datum, Lieferdienst und Restaurant sind erforderlich' },
        { status: 400 }
      )
    }

    const order = await prisma.deliveryOrder.create({
      data: {
        date: new Date(date),
        deliveryService,
        restaurant,
        price: price != null ? price : null,
        note: note || null,
        items: {
          create: (items || []).map((item: { name: string; note?: string }) => ({
            name: item.name,
            note: item.note || null,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('POST /api/delivery-orders error:', error)
    const { message, status } = describePrismaError(error)
    return NextResponse.json({ error: message }, { status })
  }
}
