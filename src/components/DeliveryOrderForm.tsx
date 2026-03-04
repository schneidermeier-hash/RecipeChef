'use client'

import { useState, useEffect } from 'react'
import { DeliveryOrder } from '@/lib/types'

const DELIVERY_SERVICE_SUGGESTIONS = ['Lieferando', 'Uber Eats', 'Wolt', 'Pizza.de', 'Mjam']

type ItemDraft = { name: string; note: string }

type MenuItem = { name: string; category: string; price?: string }

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

  // Menu lookup state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedMenuItems, setSelectedMenuItems] = useState<Set<string>>(new Set())
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuError, setMenuError] = useState('')
  const [showMenu, setShowMenu] = useState(false)

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
    setMenuItems([])
    setSelectedMenuItems(new Set())
    setShowMenu(false)
    setMenuError('')
  }, [editOrder])

  const addItem = () => setItems((prev) => [...prev, { name: '', note: '' }])

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index))

  const updateItem = (index: number, field: keyof ItemDraft, value: string) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )

  const isWolt = deliveryService.toLowerCase() === 'wolt'
  const canLoadMenu = restaurant.trim() !== '' && deliveryService.trim() !== ''

  const loadMenu = async () => {
    setMenuLoading(true)
    setMenuError('')
    setShowMenu(false)
    setMenuItems([])
    setSelectedMenuItems(new Set())

    try {
      const res = await fetch(
        `/api/menu-lookup?restaurant=${encodeURIComponent(restaurant)}&service=${encodeURIComponent(deliveryService)}`
      )
      const data = await res.json()

      if (!res.ok) {
        setMenuError(data.error ?? 'Fehler beim Laden der Speisekarte')
        return
      }

      if (data.message) {
        setMenuError(data.message)
        return
      }

      if (!data.items || data.items.length === 0) {
        setMenuError('Keine Gerichte gefunden')
        return
      }

      setMenuItems(data.items)
      setShowMenu(true)
    } catch {
      setMenuError('Verbindungsfehler beim Laden der Speisekarte')
    } finally {
      setMenuLoading(false)
    }
  }

  const toggleMenuItem = (name: string) => {
    setSelectedMenuItems((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const applyMenuSelection = () => {
    const selected = menuItems.filter((m) => selectedMenuItems.has(m.name))
    if (selected.length === 0) return

    const newItems: ItemDraft[] = selected.map((m) => ({ name: m.name, note: '' }))

    setItems((prev) => {
      // Replace empty entries at the start, then append remaining
      const nonEmpty = prev.filter((i) => i.name.trim() !== '')
      return [...nonEmpty, ...newItems]
    })

    setShowMenu(false)
    setSelectedMenuItems(new Set())
  }

  // Group menu items by category
  const groupedMenu: Record<string, MenuItem[]> = {}
  for (const item of menuItems) {
    const cat = item.category || 'Sonstiges'
    if (!groupedMenu[cat]) groupedMenu[cat] = []
    groupedMenu[cat].push(item)
  }

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
        <div className="flex gap-2">
          <input
            type="text"
            id="restaurant"
            value={restaurant}
            onChange={(e) => setRestaurant(e.target.value)}
            placeholder="z.B. Pizzeria Roma"
            required
            className={inputClass}
          />
          <div className="relative flex-shrink-0 group">
            <button
              type="button"
              onClick={loadMenu}
              disabled={!canLoadMenu || !isWolt || menuLoading}
              className="h-full px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white disabled:text-gray-500 dark:disabled:text-gray-400 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed whitespace-nowrap"
            >
              {menuLoading ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Laden...
                </span>
              ) : (
                'Karte laden'
              )}
            </button>
            {canLoadMenu && !isWolt && (
              <div className="absolute bottom-full mb-1 right-0 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                Nur für Wolt verfügbar
              </div>
            )}
          </div>
        </div>

        {menuError && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{menuError}</p>
        )}

        {showMenu && (
          <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Speisekarte ({menuItems.length} Gerichte)
              </span>
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
              >
                Schließen
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {Object.entries(groupedMenu).map(([category, catItems]) => (
                <div key={category}>
                  <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-750 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {category}
                  </div>
                  {catItems.map((item) => (
                    <label
                      key={item.name}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMenuItems.has(item.name)}
                        onChange={() => toggleMenuItem(item.name)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{item.name}</span>
                      {item.price && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">{item.price}</span>
                      )}
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={applyMenuSelection}
                disabled={selectedMenuItems.size === 0}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white disabled:text-gray-500 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                {selectedMenuItems.size === 0
                  ? 'Keine Auswahl'
                  : `${selectedMenuItems.size} Gericht${selectedMenuItems.size > 1 ? 'e' : ''} übernehmen`}
              </button>
            </div>
          </div>
        )}
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
