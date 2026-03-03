import { NextRequest, NextResponse } from 'next/server'
import { prisma, describePrismaError } from '@/lib/db'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 })
    }

    const order = await prisma.deliveryOrder.findUnique({
      where: { id: orderId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    })

    if (!order) {
      return NextResponse.json({ error: 'Lieferung nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('GET /api/delivery-orders/[id] error:', error)
    const { message, status } = describePrismaError(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 })
    }

    const body = await request.json()
    const { date, deliveryService, restaurant, price, note, items } = body

    if (!date || !deliveryService || !restaurant) {
      return NextResponse.json(
        { error: 'Datum, Lieferdienst und Restaurant sind erforderlich' },
        { status: 400 }
      )
    }

    const order = await prisma.$transaction(async (tx) => {
      await tx.deliveryItem.deleteMany({ where: { orderId } })
      return tx.deliveryOrder.update({
        where: { id: orderId },
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
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('PUT /api/delivery-orders/[id] error:', error)
    const { message, status } = describePrismaError(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 })
    }

    await prisma.deliveryOrder.delete({ where: { id: orderId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/delivery-orders/[id] error:', error)
    const { message, status } = describePrismaError(error)
    return NextResponse.json({ error: message }, { status })
  }
}
