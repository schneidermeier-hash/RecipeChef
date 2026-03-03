'use client'

import { useState, useEffect, useCallback } from 'react'
import MealCard from './MealCard'
import MealForm from './MealForm'
import DeliveryOrderCard from './DeliveryOrderCard'
import DeliveryOrderForm from './DeliveryOrderForm'
import { Meal, DeliveryOrder, TimelineEntry } from '@/lib/types'

type Filter = 'alle' | 'selbst' | 'lieferung'

type TimelineProps = {
  searchQuery?: string
}

export default function Timeline({ searchQuery = '' }: TimelineProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('alle')
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [editingOrder, setEditingOrder] = useState<DeliveryOrder | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (searchQuery) params.set('search', searchQuery)

      const [mealsRes, ordersRes] = await Promise.all([
        fetch(`/api/meals?${params}`),
        fetch(`/api/delivery-orders?${params}`),
      ])

      const mealsData = await mealsRes.json()
      const ordersData = await ordersRes.json()

      const newEntries: TimelineEntry[] = [
        ...(mealsData.meals as Meal[]).map((m): TimelineEntry => ({ kind: 'meal', data: m })),
        ...(ordersData.orders as DeliveryOrder[]).map((o): TimelineEntry => ({ kind: 'delivery', data: o })),
      ].sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())

      setEntries(newEntries)
      setHasMore(
        mealsData.pagination.totalPages > page ||
        ordersData.pagination.totalPages > page
      )
    } finally {
      setIsLoading(false)
    }
  }, [page, searchQuery])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [searchQuery])

  const handleMealDelete = (id: number) =>
    setEntries((prev) => prev.filter((e) => !(e.kind === 'meal' && e.data.id === id)))

  const handleOrderDelete = (id: number) =>
    setEntries((prev) => prev.filter((e) => !(e.kind === 'delivery' && e.data.id === id)))

  const handleMealEditSuccess = () => {
    setEditingMeal(null)
    fetchData()
  }

  const handleOrderEditSuccess = () => {
    setEditingOrder(null)
    fetchData()
  }

  const filtered = entries.filter((e) => {
    if (filter === 'selbst') return e.kind === 'meal'
    if (filter === 'lieferung') return e.kind === 'delivery'
    return true
  })

  return (
    <div>
      {/* Filter-Tabs */}
      <div className="flex gap-1 mb-4">
        {(['alle', 'selbst', 'lieferung'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {f === 'alle' ? 'Alle' : f === 'selbst' ? 'Selbst gekocht' : 'Lieferungen'}
          </button>
        ))}
      </div>

      {/* Edit-Modals */}
      {editingMeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Eintrag bearbeiten
            </h2>
            <MealForm
              editMeal={editingMeal}
              onSuccess={handleMealEditSuccess}
              onCancel={() => setEditingMeal(null)}
            />
          </div>
        </div>
      )}

      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md my-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Lieferung bearbeiten
            </h2>
            <DeliveryOrderForm
              editOrder={editingOrder}
              onSuccess={handleOrderEditSuccess}
              onCancel={() => setEditingOrder(null)}
            />
          </div>
        </div>
      )}

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Laden...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'Keine Einträge gefunden.'
              : 'Noch keine Einträge vorhanden. Füge dein erstes Abendessen hinzu!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) =>
            entry.kind === 'meal' ? (
              <MealCard
                key={`meal-${entry.data.id}`}
                meal={entry.data}
                onDelete={handleMealDelete}
                onEdit={setEditingMeal}
              />
            ) : (
              <DeliveryOrderCard
                key={`delivery-${entry.data.id}`}
                order={entry.data}
                onDelete={handleOrderDelete}
                onEdit={setEditingOrder}
              />
            )
          )}
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Mehr laden
          </button>
        </div>
      )}
    </div>
  )
}
