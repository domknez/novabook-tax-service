import { ItemEvent } from '../common/types'

export function getItemKey(invoiceId: string, itemId: string): string {
  return `${invoiceId}_${itemId}`
}

export function addToItemEventsMap(map: Map<string, ItemEvent[]>, key: string, event: ItemEvent): void {
  if (!map.has(key)) {
    map.set(key, [event])
  } else {
    const events = map.get(key)
    if (events) {
      events.push(event)
    }
  }
}

export function compareEvents(a: ItemEvent, b: ItemEvent): number {
  const dateDiff = b.date.getTime() - a.date.getTime()
  if (dateDiff !== 0) {
    return dateDiff
  } else {
    return b.index - a.index
  }
}

export function getLatestEvent(events: ItemEvent[]): ItemEvent {
  // Separate amendments and sales
  const amendments = events.filter((e) => e.eventType === 'amendment')
  const sales = events.filter((e) => e.eventType === 'sale')

  if (amendments.length > 0) {
    // Sort amendments and return the latest
    amendments.sort(compareEvents)
    return amendments[0]
  } else {
    // Sort sales and return the latest
    sales.sort(compareEvents)
    return sales[0]
  }
}
