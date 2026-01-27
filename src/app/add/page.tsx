'use client'

import { useRouter } from 'next/navigation'
import MealForm from '@/components/MealForm'

export default function AddMeal() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/')
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Neues Abendessen hinzufügen
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <MealForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
