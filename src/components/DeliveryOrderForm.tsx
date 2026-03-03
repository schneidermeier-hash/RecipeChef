'use client'

import { useState, useEffect } from 'react'
import { DeliveryOrder } from '@/lib/types'

const DELIVERY_SERVICE_SUGGESTIONS = ['Lieferando', 'Uber Eats', 'Wolt', 'Pizza.de', 'Mjam']

type ItemDraft = { name: string; note: string }

type DeliveryOrderFormProps = {
  onSuccess: () => void
  onCancel?: () => void
  editOrder?: DeliveryOrder | null
}

export default function DeliveryOrderForm({ onSuccess, onCancel, editOrder }: DeliveryOrderFormProps) {
  const [date, setDate] = useState('')
  const [deliveryService, setDeliveryService] = useState('')
  const [restaurant, setRestaurant] = useState('')
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([{ name: '', note: '' }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editOrder) {
      setDate(editOrder.date.split('T')[0])
      setDeliveryService(editOrder.deliveryService)
      setRestaurant(editOrder.restaurant)
      setPrice(editOrder.price ?? '')
      setNote(editOrder.note ?? '')
      setItems(
        editOrder.items.length > 0
          ? editOrder.items.map((i) => ({ name: i.name, note: i.note ?? '' }))
          : [{ name: '', note: '' }]
      )
    } else {
      setDate(new Date().toISOString().split('T')[0])
      setDeliveryService('')
      setRestaurant('')
      setPrice('')
      setNote('')
      setItems([{ name: '', note: '' }])
    }
  }, [editOrder])

  const addItem = () => setItems((prev) => [...prev, { name: '', note: '' }])

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index))

  const updateItem = (index: number, field: keyof ItemDraft, value: string) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const url = editOrder
        ? `/api/delivery-orders/${editOrder.id}`
        : '/api/delivery-orders'
      const method = editOrder ? 'PUT' : 'POST'

      const validItems = items
        .filter((item) => item.name.trim())
        .map((item) => ({ name: item.name.trim(), note: item.note.trim() || null }))

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          deliveryService,
          restaurant,
          price: price ? parseFloat(price.replace(',', '.')) : null,
          note: note || null,
          items: validItems,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ein Fehler ist aufgetreten')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Datum
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="deliveryService" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Lieferdienst
        </label>
        <input
          type="text"
          id="deliveryService"
          list="delivery-service-list"
          value={deliveryService}
          onChange={(e) => setDeliveryService(e.target.value)}
          placeholder="z.B. Lieferando"
          required
          className={inputClass}
        />
        <datalist id="delivery-service-list">
          {DELIVERY_SERVICE_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor="restaurant" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Restaurant
        </label>
        <input
          type="text"
          id="restaurant"
          value={restaurant}
          onChange={(e) => setRestaurant(e.target.value)}
          placeholder="z.B. Pizzeria Roma"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Gesamtpreis (optional)
        </label>
        <input
          type="number"
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="z.B. 32.50"
          step="0.01"
          min="0"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bestellte Gerichte
        </label>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  placeholder="z.B. Margherita"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={item.note}
                  onChange={(e) => updateItem(index, 'note', e.target.value)}
                  placeholder="Notiz (optional)"
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="mt-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                >
                  Entfernen
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
        >
          + Gericht hinzufügen
        </button>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notiz (optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z.B. Lieferung war schnell"
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Speichern...' : editOrder ? 'Aktualisieren' : 'Hinzufügen'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  )
}
