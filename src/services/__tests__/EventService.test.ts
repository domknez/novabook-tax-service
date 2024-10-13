import { EventService } from '../EventService'
import { SalesEvent } from '../../entities/SalesEvent'
import { TaxPaymentEvent } from '../../entities/TaxPaymentEvent'
import { Amendment } from '../../entities/Amendment'
import { AppDataSource } from '../../../ormconfig'
import { Repository } from 'typeorm'

jest.mock('../../../ormconfig', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}))

describe('EventService', () => {
  let eventService: EventService
  let salesEventRepo: Repository<SalesEvent>
  let taxPaymentRepo: Repository<TaxPaymentEvent>
  let amendmentRepo: Repository<Amendment>

  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks()

    eventService = new EventService()

    // Mock repositories
    salesEventRepo = {
      find: jest.fn(),
      save: jest.fn(),
    } as any

    taxPaymentRepo = {
      find: jest.fn(),
      save: jest.fn(),
    } as any

    amendmentRepo = {
      find: jest.fn(),
      save: jest.fn(),
    } as any

    // Mock getRepository to return the mocked repositories
    ;(AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === SalesEvent) {
        return salesEventRepo
      } else if (entity === TaxPaymentEvent) {
        return taxPaymentRepo
      } else if (entity === Amendment) {
        return amendmentRepo
      }
    })
  })

  test('should return zero tax position when no events are present', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([])

    const result = await eventService.getTaxPosition('2024-02-22T08:00:00Z')

    expect(result).toEqual({
      date: '2024-02-22T08:00:00Z',
      taxPosition: 0,
    })
  })

  test('should calculate tax position after first tax payment', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-22T09:00:00Z',
        amount: 500,
      },
    ])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([])

    const result = await eventService.getTaxPosition('2024-02-22T09:30:00Z')

    expect(result).toEqual({
      date: '2024-02-22T09:30:00Z',
      taxPosition: -500,
    })
  })

  test('should calculate tax position after first sales event', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-001',
        date: '2024-02-22T10:00:00Z',
        items: [
          {
            itemId: 'item-001',
            cost: 1000,
            taxRate: 0.2,
          },
          {
            itemId: 'item-002',
            cost: 2000,
            taxRate: 0.2,
          },
        ],
      },
    ])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-22T09:00:00Z',
        amount: 500,
      },
    ])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([])

    const result = await eventService.getTaxPosition('2024-02-22T11:00:00Z')

    expect(result).toEqual({
      date: '2024-02-22T11:00:00Z',
      taxPosition: 100,
    })
  })

  test('should calculate tax position after second sales event', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      // First sales event
      {
        invoiceId: 'invoice-001',
        date: '2024-02-22T10:00:00Z',
        items: [
          {
            itemId: 'item-001',
            cost: 1000,
            taxRate: 0.2,
          },
          {
            itemId: 'item-002',
            cost: 2000,
            taxRate: 0.2,
          },
        ],
      },
      // Second sales event
      {
        invoiceId: 'invoice-002',
        date: '2024-02-23T12:00:00Z',
        items: [
          {
            itemId: 'item-003',
            cost: 1500,
            taxRate: 0.1,
          },
        ],
      },
    ])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-22T09:00:00Z',
        amount: 500,
      },
    ])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([])

    const result = await eventService.getTaxPosition('2024-02-23T13:00:00Z')

    expect(result).toEqual({
      date: '2024-02-23T13:00:00Z',
      taxPosition: 250,
    })
  })

  test('should calculate tax position after amendment is applied', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-001',
        date: '2024-02-22T10:00:00Z',
        items: [
          {
            itemId: 'item-001',
            cost: 1000,
            taxRate: 0.2,
          },
          {
            itemId: 'item-002',
            cost: 2000,
            taxRate: 0.2,
          },
        ],
      },
      {
        invoiceId: 'invoice-002',
        date: '2024-02-23T12:00:00Z',
        items: [
          {
            itemId: 'item-003',
            cost: 1500,
            taxRate: 0.1,
          },
        ],
      },
    ])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-22T09:00:00Z',
        amount: 500,
      },
    ])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-23T10:00:00Z',
        invoiceId: 'invoice-001',
        itemId: 'item-002',
        cost: 1800,
        taxRate: 0.17,
      },
    ])

    const result = await eventService.getTaxPosition('2024-02-23T13:00:00Z')

    expect(result).toEqual({
      date: '2024-02-23T13:00:00Z',
      taxPosition: 156,
    })
  })

  test('should calculate tax position after second tax payment and before third sales event', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      // First sales event
      {
        invoiceId: 'invoice-001',
        date: '2024-02-22T10:00:00Z',
        items: [
          {
            itemId: 'item-001',
            cost: 1000,
            taxRate: 0.2,
          },
          {
            itemId: 'item-002',
            cost: 2000,
            taxRate: 0.2,
          },
        ],
      },
      // Second sales event
      {
        invoiceId: 'invoice-002',
        date: '2024-02-23T12:00:00Z',
        items: [
          {
            itemId: 'item-003',
            cost: 1500,
            taxRate: 0.1,
          },
        ],
      },
    ])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-22T09:00:00Z',
        amount: 500,
      },
      {
        date: '2024-02-24T14:00:00Z',
        amount: 1000,
      },
    ])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-23T10:00:00Z',
        invoiceId: 'invoice-001',
        itemId: 'item-002',
        cost: 1800,
        taxRate: 0.17,
      },
    ])

    const result = await eventService.getTaxPosition('2024-02-24T14:30:00Z')

    expect(result).toEqual({
      date: '2024-02-24T14:30:00Z',
      taxPosition: -844,
    })
  })

  test('should calculate tax position after third sales event and second amendment', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      // First sales event
      {
        invoiceId: 'invoice-001',
        date: '2024-02-22T10:00:00Z',
        items: [
          {
            itemId: 'item-001',
            cost: 1000,
            taxRate: 0.2,
          },
          {
            itemId: 'item-002',
            cost: 2000,
            taxRate: 0.2,
          },
        ],
      },
      // Second sales event
      {
        invoiceId: 'invoice-002',
        date: '2024-02-23T12:00:00Z',
        items: [
          {
            itemId: 'item-003',
            cost: 1500,
            taxRate: 0.1,
          },
        ],
      },
      // Third sales event
      {
        invoiceId: 'invoice-003',
        date: '2024-02-24T15:00:00Z',
        items: [
          {
            itemId: 'item-004',
            cost: 2500,
            taxRate: 0.15,
          },
          {
            itemId: 'item-005',
            cost: 3000,
            taxRate: 0.18,
          },
        ],
      },
    ])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-22T09:00:00Z',
        amount: 500,
      },
      {
        date: '2024-02-24T14:00:00Z',
        amount: 1000,
      },
    ])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-23T10:00:00Z',
        invoiceId: 'invoice-001',
        itemId: 'item-002',
        cost: 1800,
        taxRate: 0.17,
      },
      {
        date: '2024-02-24T16:30:00Z',
        invoiceId: 'invoice-003',
        itemId: 'item-005',
        cost: 2800,
        taxRate: 0.15,
      },
    ])

    const result = await eventService.getTaxPosition('2024-02-24T17:00:00Z')

    expect(result).toEqual({
      date: '2024-02-24T17:00:00Z',
      taxPosition: -49,
    })
  })

  test('should handle amendments to non-existent sales events', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-22T12:00:00Z',
        invoiceId: 'non-existent-invoice',
        itemId: 'non-existent-item',
        cost: 500,
        taxRate: 0.1,
      },
    ])

    const result = await eventService.getTaxPosition('2024-02-22T13:00:00Z')

    expect(result).toEqual({
      date: '2024-02-22T13:00:00Z',
      taxPosition: 50, // 500 * 0.1
    })
  })

  test('should apply multiple amendments to the same item', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-004',
        date: '2024-02-25T10:00:00Z',
        items: [
          {
            itemId: 'item-006',
            cost: 1000,
            taxRate: 0.2,
          },
        ],
      },
    ])

    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])

    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-25T11:00:00Z',
        invoiceId: 'invoice-004',
        itemId: 'item-006',
        cost: 900,
        taxRate: 0.18,
      },
      {
        date: '2024-02-25T12:00:00Z',
        invoiceId: 'invoice-004',
        itemId: 'item-006',
        cost: 800,
        taxRate: 0.15,
      },
    ])

    const result = await eventService.getTaxPosition('2024-02-25T13:00:00Z')

    expect(result).toEqual({
      date: '2024-02-25T13:00:00Z',
      taxPosition: 120, // 800 * 0.15
    })
  })

  test('should apply amendment before sales event is ingested', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-005',
        date: '2024-02-26T10:00:00Z',
        items: [
          {
            itemId: 'item-007',
            cost: 2000,
            taxRate: 0.2,
          },
        ],
      },
    ])

    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])

    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-26T09:00:00Z',
        invoiceId: 'invoice-005',
        itemId: 'item-007',
        cost: 1800,
        taxRate: 0.18,
      },
    ])

    const result = await eventService.getTaxPosition('2024-02-26T11:00:00Z')

    expect(result).toEqual({
      date: '2024-02-26T11:00:00Z',
      taxPosition: 324, // 1800 * 0.18
    })
  })

  test('should handle amendment that reduces cost to zero', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-006',
        date: '2024-02-27T10:00:00Z',
        items: [
          {
            itemId: 'item-008',
            cost: 1500,
            taxRate: 0.1,
          },
        ],
      },
    ])

    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])

    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-27T11:00:00Z',
        invoiceId: 'invoice-006',
        itemId: 'item-008',
        cost: 0,
        taxRate: 0.1,
      },
    ])

    const result = await eventService.getTaxPosition('2024-02-27T12:00:00Z')

    expect(result).toEqual({
      date: '2024-02-27T12:00:00Z',
      taxPosition: 0, // 0 * 0.1
    })
  })

  test('should handle amendment to non-existent item in existing sale', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-007',
        date: '2024-02-28T10:00:00Z',
        items: [
          {
            itemId: 'item-009',
            cost: 1200,
            taxRate: 0.2,
          },
        ],
      },
    ])

    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])

    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-28T11:00:00Z',
        invoiceId: 'invoice-007',
        itemId: 'item-010', // Non-existent item
        cost: 1000,
        taxRate: 0.15,
      },
    ])

    const result = await eventService.getTaxPosition('2024-02-28T12:00:00Z')

    // Tax from existing item
    const taxExistingItem = 1200 * 0.2 // 240
    // Tax from amendment to non-existent item
    const taxAmendedItem = 1000 * 0.15 // 150
    // Total tax
    const totalTax = 240 + 150 // 390

    expect(result).toEqual({
      date: '2024-02-28T12:00:00Z',
      taxPosition: 390,
    })
  })

  test('should apply amendment with same date as query date', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-008',
        date: '2024-02-29T10:00:00Z',
        items: [
          {
            itemId: 'item-011',
            cost: 2000,
            taxRate: 0.2,
          },
        ],
      },
    ])

    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])

    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-02-29T11:00:00Z',
        invoiceId: 'invoice-008',
        itemId: 'item-011',
        cost: 1800,
        taxRate: 0.18,
      },
    ])

    const result = await eventService.getTaxPosition('2024-02-29T11:00:00Z')

    expect(result).toEqual({
      date: '2024-02-29T11:00:00Z',
      taxPosition: 324, // 1800 * 0.18
    })
  })

  test('should not apply amendments with dates after the query date', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-009',
        date: '2024-03-01T10:00:00Z',
        items: [
          {
            itemId: 'item-012',
            cost: 2500,
            taxRate: 0.2,
          },
        ],
      },
    ])

    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])

    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-03-01T12:00:00Z',
        invoiceId: 'invoice-009',
        itemId: 'item-012',
        cost: 2300,
        taxRate: 0.18,
      },
    ])

    const result = await eventService.getTaxPosition('2024-03-01T11:00:00Z')

    expect(result).toEqual({
      date: '2024-03-01T11:00:00Z',
      taxPosition: 500, // 2500 * 0.2
    })
  })

  test('should apply latest amendment when multiple amendments have the same date', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-010',
        date: '2024-03-02T10:00:00Z',
        items: [
          {
            itemId: 'item-013',
            cost: 3000,
            taxRate: 0.2,
          },
        ],
      },
    ])

    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])

    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-03-02T11:00:00Z',
        invoiceId: 'invoice-010',
        itemId: 'item-013',
        cost: 2800,
        taxRate: 0.18,
      },
      {
        date: '2024-03-02T11:00:00Z', // Same date as previous amendment
        invoiceId: 'invoice-010',
        itemId: 'item-013',
        cost: 2600,
        taxRate: 0.15,
      },
    ])

    const result = await eventService.getTaxPosition('2024-03-02T12:00:00Z')

    // Assuming that when amendments have the same date, the latest one applied (e.g., by insertion order) is used.

    expect(result).toEqual({
      date: '2024-03-02T12:00:00Z',
      taxPosition: 390, // 2600 * 0.15
    })
  })
})
