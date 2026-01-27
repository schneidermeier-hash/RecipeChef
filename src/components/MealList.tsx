'use client'

import { useState, useEffect, useCallback } from 'react'
import MealCard from './MealCard'
import MealForm from './MealForm'

type Meal = {
  id: number
  date: string
  name: string
  note: string | null
  createdAt: string
  updatedAt: string
}

type MealListProps = {
  searchQuery?: string
}

export default function MealList({ searchQuery = '' }: MealListProps) {
  const [meals, setMeals] = useState<Meal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchMeals = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const res = await fetch(`/api/meals?${params}`)
      const data = await res.json()
      setMeals(data.meals)
      setTotalPages(data.pagination.totalPages)
    } finally {
      setIsLoading(false)
    }
  }, [page, searchQuery])

  useEffect(() => {
    fetchMeals()
  }, [fetchMeals])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const handleDelete = (id: number) => {
    setMeals(meals.filter((meal) => meal.id !== id))
  }

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal)
  }

  const handleEditSuccess = () => {
    setEditingMeal(null)
    fetchMeals()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Laden...</div>
      </div>
    )
  }

  if (meals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          {searchQuery
            ? 'Keine Gerichte gefunden.'
            : 'Noch keine Einträge vorhanden. Füge dein erstes Abendessen hinzu!'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {editingMeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Eintrag bearbeiten
            </h2>
            <MealForm
              editMeal={editingMeal}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingMeal(null)}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Zurück
          </button>
          <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
            Seite {page} von {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  )
}
