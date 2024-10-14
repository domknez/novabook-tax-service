import { Repository } from 'typeorm'
import { Amendment } from '../../entities/Amendment'
import { SalesEvent } from '../../entities/SalesEvent'
import { TaxPaymentEvent } from '../../entities/TaxPaymentEvent'
import { EventService } from '../EventService'

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
    jest.resetAllMocks()

    eventService = new EventService()

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

    eventService = new EventService(salesEventRepo, taxPaymentRepo, amendmentRepo)
  })

  test('should return zero tax position when no events are present', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([])

    const queryDate = new Date('2024-02-22T08:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
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

    const queryDate = new Date('2024-02-22T09:30:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
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

    const queryDate = new Date('2024-02-22T11:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: 100,
    })
  })

  test('should calculate tax position after second sales event', async () => {
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
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([])

    const queryDate = new Date('2024-02-23T13:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
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

    const queryDate = new Date('2024-02-23T13:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: 156,
    })
  })

  test('should calculate tax position after second tax payment and before third sales event', async () => {
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

    const queryDate = new Date('2024-02-24T13:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: -844,
    })
  })

  test('should calculate tax position after third sales event and second amendment', async () => {
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

    const queryDate = new Date('2024-02-24T17:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
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

    const queryDate = new Date('2024-02-22T13:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
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

    const queryDate = new Date('2024-02-25T13:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
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

    const queryDate = new Date('2024-02-26T11:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
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

    const queryDate = new Date('2024-02-27T12:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
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

    const queryDate = new Date('2024-02-28T12:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
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

    const queryDate = new Date('2024-02-29T11:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
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

    const queryDate = new Date('2024-03-01T11:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
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

    const queryDate = new Date('2024-03-02T12:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: 390, // 2600 * 0.15
    })
  })
  test('should handle amendment with negative cost', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-03-03T10:00:00Z',
        invoiceId: 'invoice-011',
        itemId: 'item-014',
        cost: -1000,
        taxRate: 0.2,
      },
    ])

    const queryDate = new Date('2024-03-03T11:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: -200, // -1000 * 0.2
    })
  })

  test('should handle amendment with tax rate exceeding 1', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-03-04T10:00:00Z',
        invoiceId: 'invoice-012',
        itemId: 'item-015',
        cost: 1000,
        taxRate: 1.2,
      },
    ])

    const queryDate = new Date('2024-03-04T11:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: 1200, // 1000 * 1.2
    })
  })

  test('should handle multiple sales events for the same invoice and item', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-013',
        date: '2024-03-05T10:00:00Z',
        items: [
          {
            itemId: 'item-016',
            cost: 1000,
            taxRate: 0.2,
          },
        ],
      },
      {
        invoiceId: 'invoice-013',
        date: '2024-03-05T12:00:00Z',
        items: [
          {
            itemId: 'item-016',
            cost: 1500,
            taxRate: 0.18,
          },
        ],
      },
    ])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([])

    const queryDate = new Date('2024-03-05T13:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: 270, // 1500 * 0.18
    })
  })

  test('should handle amendments with future dates', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-014',
        date: '2024-03-06T10:00:00Z',
        items: [
          {
            itemId: 'item-017',
            cost: 1000,
            taxRate: 0.2,
          },
        ],
      },
    ])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-03-06T12:00:00Z',
        invoiceId: 'invoice-014',
        itemId: 'item-017',
        cost: 900,
        taxRate: 0.18,
      },
    ])

    const queryDate = new Date('2024-03-06T11:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: 200, // 1000 * 0.2
    })
  })

  test('should handle amendment that removes an item (cost and tax rate zero)', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-015',
        date: '2024-03-07T10:00:00Z',
        items: [
          {
            itemId: 'item-018',
            cost: 1000,
            taxRate: 0.2,
          },
        ],
      },
    ])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-03-07T11:00:00Z',
        invoiceId: 'invoice-015',
        itemId: 'item-018',
        cost: 0,
        taxRate: 0,
      },
    ])

    const queryDate = new Date('2024-03-07T12:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: 0,
    })
  })

  test('should handle multiple amendments before sales event', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-03-08T09:00:00Z',
        invoiceId: 'invoice-016',
        itemId: 'item-019',
        cost: 1000,
        taxRate: 0.2,
      },
      {
        date: '2024-03-08T10:00:00Z',
        invoiceId: 'invoice-016',
        itemId: 'item-019',
        cost: 1100,
        taxRate: 0.22,
      },
    ])

    const queryDate = new Date('2024-03-08T11:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: 242, // 1100 * 0.22
    })
  })

  test('should handle items with zero tax rate', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-017',
        date: '2024-03-09T10:00:00Z',
        items: [
          {
            itemId: 'item-020',
            cost: 1000,
            taxRate: 0,
          },
        ],
      },
    ])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([])

    const queryDate = new Date('2024-03-09T11:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: 0, // 1000 * 0
    })
  })

  test('should handle large numerical values', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-018',
        date: '2024-03-10T10:00:00Z',
        items: [
          {
            itemId: 'item-021',
            cost: 1e9,
            taxRate: 0.2,
          },
        ],
      },
    ])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([])

    const queryDate = new Date('2024-03-10T11:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: 200_000_000, // 1e9 * 0.2
    })
  })

  test('should handle missing or null fields in events', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-019',
        date: '2024-03-11T10:00:00Z',
        items: [
          {
            itemId: 'item-022',
            cost: null,
            taxRate: null,
          },
        ],
      },
    ])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([])

    const queryDate = new Date('2024-03-11T11:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: 0,
    })
  })

  test('should handle amendments that completely remove an invoice', async () => {
    ;(salesEventRepo.find as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'invoice-021',
        date: '2024-03-13T10:00:00Z',
        items: [
          {
            itemId: 'item-024',
            cost: 1000,
            taxRate: 0.2,
          },
          {
            itemId: 'item-025',
            cost: 2000,
            taxRate: 0.2,
          },
        ],
      },
    ])
    ;(taxPaymentRepo.find as jest.Mock).mockResolvedValue([])
    ;(amendmentRepo.find as jest.Mock).mockResolvedValue([
      {
        date: '2024-03-13T11:00:00Z',
        invoiceId: 'invoice-021',
        itemId: 'item-024',
        cost: 0,
        taxRate: 0,
      },
      {
        date: '2024-03-13T11:00:00Z',
        invoiceId: 'invoice-021',
        itemId: 'item-025',
        cost: 0,
        taxRate: 0,
      },
    ])

    const queryDate = new Date('2024-03-13T12:00:00Z')
    const result = await eventService.getTaxPosition(queryDate)

    expect(result).toEqual({
      date: queryDate.toISOString(),
      taxPosition: 0,
    })
  })
})
