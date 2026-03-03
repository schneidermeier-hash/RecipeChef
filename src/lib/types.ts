export type Meal = {
  id: number
  date: string
  name: string
  note: string | null
  createdAt: string
  updatedAt: string
}

export type DeliveryItem = {
  id: number
  name: string
  note: string | null
  orderId: number
  createdAt: string
  updatedAt: string
}

export type DeliveryOrder = {
  id: number
  date: string
  deliveryService: string
  restaurant: string
  price: string | null
  note: string | null
  items: DeliveryItem[]
  createdAt: string
  updatedAt: string
}

export type TimelineEntry =
  | { kind: 'meal'; data: Meal }
  | { kind: 'delivery'; data: DeliveryOrder }
