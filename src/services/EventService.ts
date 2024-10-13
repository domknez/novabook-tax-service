import { AppDataSource } from '../../ormconfig'
import { SalesEvent } from '../entities/SalesEvent'
import { TaxPaymentEvent } from '../entities/TaxPaymentEvent'
import { Amendment } from '../entities/Amendment'
import { LessThanOrEqual } from 'typeorm'
import { addToItemEventsMap, getItemKey } from '../utils/eventUtils'

interface ItemEvent {
  date: Date
  cost: number
  taxRate: number
}

export class EventService {
  async addSalesEvent(salesEvent: SalesEvent): Promise<void> {
    const salesEventRepo = AppDataSource.getRepository(SalesEvent)
    await salesEventRepo.save(salesEvent)
  }

  async addTaxPaymentEvent(taxPaymentEvent: TaxPaymentEvent): Promise<void> {
    const taxPaymentRepo = AppDataSource.getRepository(TaxPaymentEvent)
    await taxPaymentRepo.save(taxPaymentEvent)
  }

  async addAmendment(amendment: Amendment): Promise<void> {
    const amendmentRepo = AppDataSource.getRepository(Amendment)
    await amendmentRepo.save(amendment)
  }

  async getTaxPosition(dateString: string): Promise<{ date: string; taxPosition: number }> {
    const queryDate = new Date(dateString)

    const salesEvents = await this.getAllSalesEvents()
    const taxPayments = await this.getTaxPaymentsUpToDate(queryDate)
    const amendments = await this.getAllAmendments()

    const itemsMap = this.buildItemsAsOfDate(salesEvents, amendments, queryDate)

    const totalTaxFromSales = this.calculateTotalTaxFromItemsMap(itemsMap)
    const totalTaxPayments = this.calculateTotalTaxPayments(taxPayments)

    const taxPosition = totalTaxFromSales - totalTaxPayments

    return {
      date: dateString,
      taxPosition: taxPosition,
    }
  }

  private async getAllSalesEvents(): Promise<SalesEvent[]> {
    const salesEventRepo = AppDataSource.getRepository(SalesEvent)
    return salesEventRepo.find({
      relations: ['items'],
    })
  }

  private async getAllAmendments(): Promise<Amendment[]> {
    const amendmentRepo = AppDataSource.getRepository(Amendment)
    return amendmentRepo.find()
  }

  private async getTaxPaymentsUpToDate(date: Date): Promise<TaxPaymentEvent[]> {
    const taxPaymentRepo = AppDataSource.getRepository(TaxPaymentEvent)
    return taxPaymentRepo.find({
      where: { date: LessThanOrEqual(date.toISOString()) },
    })
  }

  private buildItemsAsOfDate(
    salesEvents: SalesEvent[],
    amendments: Amendment[],
    queryDate: Date
  ): Map<string, ItemEvent> {
    const itemEventsMap = new Map<string, ItemEvent[]>()

    // Process sales events
    salesEvents.forEach((salesEvent) => {
      salesEvent.items.forEach((item) => {
        const key = getItemKey(salesEvent.invoiceId, item.itemId)
        const event: ItemEvent = {
          date: new Date(salesEvent.date),
          cost: item.cost,
          taxRate: item.taxRate,
        }
        addToItemEventsMap(itemEventsMap, key, event)
      })
    })

    // Process amendments
    amendments.forEach((amendment) => {
      const key = getItemKey(amendment.invoiceId, amendment.itemId)
      const event: ItemEvent = {
        date: new Date(amendment.date),
        cost: amendment.cost,
        taxRate: amendment.taxRate,
      }
      addToItemEventsMap(itemEventsMap, key, event)
    })

    // For each item, pick the latest event before or on the query date
    const finalItemsMap = new Map<string, ItemEvent>()

    itemEventsMap.forEach((events, key) => {
      // Filter events up to the query date
      const validEvents = events.filter((e) => e.date <= queryDate)
      if (validEvents.length > 0) {
        // Sort events by date descending
        validEvents.sort((a, b) => b.date.getTime() - a.date.getTime())
        // Pick the latest event
        finalItemsMap.set(key, validEvents[0])
      }
    })

    return finalItemsMap
  }

  private calculateTotalTaxFromItemsMap(itemsMap: Map<string, ItemEvent>): number {
    let totalTax = 0
    itemsMap.forEach((item) => {
      totalTax += item.cost * item.taxRate
    })
    return totalTax
  }

  private calculateTotalTaxPayments(taxPayments: TaxPaymentEvent[]): number {
    return taxPayments.reduce((total, payment) => total + payment.amount, 0)
  }
}
