import { AppDataSource } from '../../ormconfig'
import { SalesEvent } from '../entities/SalesEvent'
import { TaxPaymentEvent } from '../entities/TaxPaymentEvent'
import { Amendment } from '../entities/Amendment'
import { LessThanOrEqual } from 'typeorm'
import { addToItemEventsMap, getItemKey, compareEvents, getLatestEvent } from '../utils/eventUtils'
import { ItemEvent } from '../common/types'
import { Decimal } from 'decimal.js'

export class EventService {
  private salesEventRepo = AppDataSource.getRepository(SalesEvent)
  private taxPaymentRepo = AppDataSource.getRepository(TaxPaymentEvent)
  private amendmentRepo = AppDataSource.getRepository(Amendment)

  constructor(
    salesEventRepo = AppDataSource.getRepository(SalesEvent),
    taxPaymentRepo = AppDataSource.getRepository(TaxPaymentEvent),
    amendmentRepo = AppDataSource.getRepository(Amendment)
  ) {
    this.salesEventRepo = salesEventRepo
    this.taxPaymentRepo = taxPaymentRepo
    this.amendmentRepo = amendmentRepo
  }

  async addSalesEvent(salesEvent: SalesEvent): Promise<void> {
    await this.salesEventRepo.save(salesEvent)
  }

  async addTaxPaymentEvent(taxPaymentEvent: TaxPaymentEvent): Promise<void> {
    await this.taxPaymentRepo.save(taxPaymentEvent)
  }

  async addAmendment(amendment: Amendment): Promise<void> {
    await this.amendmentRepo.save(amendment)
  }

  async getTaxPosition(queryDate: Date): Promise<{ date: string; taxPosition: number }> {
    const [salesEvents, amendments, taxPayments] = await Promise.all([
      this.getAllSalesEvents(),
      this.getAllAmendments(),
      this.getTaxPaymentsUpToDate(queryDate),
    ])

    const itemsMap = this.buildItemsAsOfDate(salesEvents, amendments, queryDate)

    const totalTaxFromSales = this.calculateTotalTaxFromItemsMap(itemsMap)
    const totalTaxPayments = this.calculateTotalTaxPayments(taxPayments)

    const taxPosition = totalTaxFromSales - totalTaxPayments

    return {
      date: queryDate.toISOString(),
      taxPosition: taxPosition,
    }
  }

  private async getAllSalesEvents(): Promise<SalesEvent[]> {
    return this.salesEventRepo.find({
      relations: ['items'],
    })
  }

  private async getAllAmendments(): Promise<Amendment[]> {
    return this.amendmentRepo.find()
  }

  private async getTaxPaymentsUpToDate(date: Date): Promise<TaxPaymentEvent[]> {
    return this.taxPaymentRepo.find({
      where: { date: LessThanOrEqual(date.toISOString()) },
    })
  }

  private buildItemsAsOfDate(
    salesEvents: SalesEvent[],
    amendments: Amendment[],
    queryDate: Date
  ): Map<string, ItemEvent> {
    const itemEventsMap = new Map<string, ItemEvent[]>()
    let eventIndex = 0

    this.processSalesEvents(salesEvents, itemEventsMap, eventIndex)
    this.processAmendments(amendments, itemEventsMap, eventIndex)

    const finalItemsMap = this.selectLatestEvents(itemEventsMap, queryDate)

    return finalItemsMap
  }

  private processSalesEvents(
    salesEvents: SalesEvent[],
    itemEventsMap: Map<string, ItemEvent[]>,
    eventIndex: number
  ): void {
    salesEvents.forEach((salesEvent) => {
      salesEvent.items.forEach((item) => {
        const key = getItemKey(salesEvent.invoiceId, item.itemId)
        const event: ItemEvent = {
          date: new Date(salesEvent.date),
          cost: item.cost,
          taxRate: item.taxRate,
          eventType: 'sale',
          index: eventIndex++,
        }
        addToItemEventsMap(itemEventsMap, key, event)
      })
    })
  }

  private processAmendments(
    amendments: Amendment[],
    itemEventsMap: Map<string, ItemEvent[]>,
    eventIndex: number
  ): void {
    amendments.forEach((amendment) => {
      const key = getItemKey(amendment.invoiceId, amendment.itemId)
      const event: ItemEvent = {
        date: new Date(amendment.date),
        cost: amendment.cost,
        taxRate: amendment.taxRate,
        eventType: 'amendment',
        index: eventIndex++,
      }
      addToItemEventsMap(itemEventsMap, key, event)
    })
  }

  private selectLatestEvents(itemEventsMap: Map<string, ItemEvent[]>, queryDate: Date): Map<string, ItemEvent> {
    const finalItemsMap = new Map<string, ItemEvent>()

    itemEventsMap.forEach((events, key) => {
      const validEvents = events.filter((event) => event.date <= queryDate)

      if (validEvents.length > 0) {
        const latestEvent = getLatestEvent(validEvents)
        finalItemsMap.set(key, latestEvent)
      }
    })

    return finalItemsMap
  }

  private calculateTotalTaxFromItemsMap(itemsMap: Map<string, ItemEvent>): number {
    let totalTax = new Decimal(0)
    itemsMap.forEach((item) => {
      const cost = new Decimal(item.cost || 0)
      const taxRate = new Decimal(item.taxRate || 0)
      totalTax = totalTax.plus(cost.times(taxRate))
    })
    return totalTax.toNumber()
  }

  private calculateTotalTaxPayments(taxPayments: TaxPaymentEvent[]): number {
    return taxPayments
      .reduce((total, payment) => {
        const amount = new Decimal(payment.amount || 0)
        return total.plus(amount)
      }, new Decimal(0))
      .toNumber()
  }
}
