import { NextRequest, NextResponse } from 'next/server'
import { prisma, describePrismaError } from '@/lib/db'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const mealId = parseInt(id)

    if (isNaN(mealId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 })
    }

    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
    })

    if (!meal) {
      return NextResponse.json({ error: 'Mahlzeit nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(meal)
  } catch (error) {
    console.error(`GET /api/meals/[id] error:`, error)
    const { message, status } = describePrismaError(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const mealId = parseInt(id)

    if (isNaN(mealId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 })
    }

    const body = await request.json()
    const { date, name, note } = body

    if (!date || !name) {
      return NextResponse.json(
        { error: 'Datum und Name sind erforderlich' },
        { status: 400 }
      )
    }

    const meal = await prisma.meal.update({
      where: { id: mealId },
      data: {
        date: new Date(date),
        name,
        note: note || null,
      },
    })

    return NextResponse.json(meal)
  } catch (error) {
    console.error(`PUT /api/meals/[id] error:`, error)
    const { message, status } = describePrismaError(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const mealId = parseInt(id)

    if (isNaN(mealId)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 })
    }

    await prisma.meal.delete({
      where: { id: mealId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`DELETE /api/meals/[id] error:`, error)
    const { message, status } = describePrismaError(error)
    return NextResponse.json({ error: message }, { status })
  }
}
