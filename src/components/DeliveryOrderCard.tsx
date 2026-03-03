'use client'

import { useState } from 'react'
import { DeliveryOrder } from '@/lib/types'

type DeliveryOrderCardProps = {
  order: DeliveryOrder
  onDelete: (id: number) => void
  onEdit: (order: DeliveryOrder) => void
}

export default function DeliveryOrderCard({ order, onDelete, onEdit }: DeliveryOrderCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Möchtest du diese Lieferung wirklich löschen?')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/delivery-orders/${order.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(order.id)
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

  const formatPrice = (price: string | null) =>
    price ? `${parseFloat(price).toFixed(2).replace('.', ',')} €` : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(order.date)}
            </p>
            <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">
              {order.deliveryService}
            </span>
          </div>
          <h3 className="text-lg font-semibold mt-1 text-gray-900 dark:text-white">
            {order.restaurant}
          </h3>
          {order.price && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {formatPrice(order.price)}
            </p>
          )}
          {order.items.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {order.items.map((item) => (
                <li key={item.id} className="text-sm text-gray-700 dark:text-gray-300">
                  • {item.name}
                  {item.note && (
                    <span className="text-gray-500 dark:text-gray-400"> ({item.note})</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {order.note && (
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">{order.note}</p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEdit(order)}
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
