'use client'

import { useRouter } from 'next/navigation'
import DeliveryOrderForm from '@/components/DeliveryOrderForm'

export default function AddDelivery() {
  const router = useRouter()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Neue Lieferung hinzufügen
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <DeliveryOrderForm
          onSuccess={() => router.push('/')}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  )
}
