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
