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

export function compareEvents(firstEvent: ItemEvent, secondEvent: ItemEvent): number {
  const dateDiff = secondEvent.date.getTime() - firstEvent.date.getTime()
  if (dateDiff !== 0) {
    return dateDiff
  } else {
    return secondEvent.index - firstEvent.index
  }
}

export function getLatestEvent(events: ItemEvent[]): ItemEvent {
  // Separate amendments and sales
  const amendments = events.filter((e) => e.eventType === 'amendment')

  if (amendments.length > 0) {
    // Sort amendments and return the latest
    amendments.sort(compareEvents)
    return amendments[0]
  }

  const sales = events.filter((e) => e.eventType === 'sale')

  // Sort sales and return the latest
  sales.sort(compareEvents)
  return sales[0]
}
