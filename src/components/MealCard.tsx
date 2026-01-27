'use client'

import { useState } from 'react'

type Meal = {
  id: number
  date: string
  name: string
  note: string | null
  createdAt: string
  updatedAt: string
}

type MealCardProps = {
  meal: Meal
  onDelete: (id: number) => void
  onEdit: (meal: Meal) => void
}

export default function MealCard({ meal, onDelete, onEdit }: MealCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Möchtest du diesen Eintrag wirklich löschen?')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/meals/${meal.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(meal.id)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(meal.date)}
          </p>
          <h3 className="text-lg font-semibold mt-1 text-gray-900 dark:text-white">
            {meal.name}
          </h3>
          {meal.note && (
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
              {meal.note}
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEdit(meal)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            Bearbeiten
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm disabled:opacity-50"
          >
            {isDeleting ? 'Löschen...' : 'Löschen'}
          </button>
        </div>
      </div>
    </div>
  )
}
