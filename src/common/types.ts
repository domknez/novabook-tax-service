export interface Error {
  stack?: string
}

export interface ItemEvent {
  date: Date
  cost: number
  taxRate: number
  eventType: 'sale' | 'amendment'
  index: number
}
