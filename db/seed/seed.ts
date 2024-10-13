import { v4 as uuidv4 } from 'uuid'
import { AppDataSource } from '../../ormconfig'
import { SalesEvent } from '../../src/entities/SalesEvent'
import { SalesItem } from '../../src/entities/SalesItem'
import { TaxPaymentEvent } from '../../src/entities/TaxPaymentEvent'

AppDataSource.initialize()
  .then(async () => {
    console.log('Database initialized for seeding')

    const salesEventRepo = AppDataSource.getRepository(SalesEvent)
    const taxPaymentRepo = AppDataSource.getRepository(TaxPaymentEvent)

    // Clear existing data
    await taxPaymentRepo.delete({})
    await salesEventRepo.delete({})

    // Sales Event 1
    const salesEvent1 = new SalesEvent()
    salesEvent1.invoiceId = uuidv4()
    salesEvent1.date = '2024-02-22T10:00:00Z'

    const salesItem1 = new SalesItem()
    salesItem1.itemId = uuidv4()
    salesItem1.cost = 1000
    salesItem1.taxRate = 0.2
    salesItem1.salesEvent = salesEvent1

    const salesItem2 = new SalesItem()
    salesItem2.itemId = uuidv4()
    salesItem2.cost = 2000
    salesItem2.taxRate = 0.2
    salesItem2.salesEvent = salesEvent1

    salesEvent1.items = [salesItem1, salesItem2]

    await salesEventRepo.save(salesEvent1)
    console.log('Sales Event 1 seeded')

    // Sales Event 2
    const salesEvent2 = new SalesEvent()
    salesEvent2.invoiceId = uuidv4()
    salesEvent2.date = '2024-02-23T12:00:00Z'

    const salesItem3 = new SalesItem()
    salesItem3.itemId = uuidv4()
    salesItem3.cost = 1500
    salesItem3.taxRate = 0.1
    salesItem3.salesEvent = salesEvent2

    salesEvent2.items = [salesItem3]

    await salesEventRepo.save(salesEvent2)
    console.log('Sales Event 2 seeded')

    const salesEvent3 = new SalesEvent()
    salesEvent3.invoiceId = uuidv4()
    salesEvent3.date = '2024-02-24T15:00:00Z'

    const salesItem4 = new SalesItem()
    salesItem4.itemId = uuidv4()
    salesItem4.cost = 2500
    salesItem4.taxRate = 0.15
    salesItem4.salesEvent = salesEvent3

    const salesItem5 = new SalesItem()
    salesItem5.itemId = uuidv4()
    salesItem5.cost = 3000
    salesItem5.taxRate = 0.18
    salesItem5.salesEvent = salesEvent3

    salesEvent3.items = [salesItem4, salesItem5]

    await salesEventRepo.save(salesEvent3)
    console.log('Sales Event 3 seeded')

    // Tax Payment Event 1
    const taxPayment1 = new TaxPaymentEvent()
    taxPayment1.date = '2024-02-22T09:00:00Z'
    taxPayment1.amount = 500

    await taxPaymentRepo.save(taxPayment1)
    console.log('Tax Payment Event 1 seeded')

    // Tax Payment Event 2
    const taxPayment2 = new TaxPaymentEvent()
    taxPayment2.date = '2024-02-24T14:00:00Z'
    taxPayment2.amount = 1000

    await taxPaymentRepo.save(taxPayment2)
    console.log('Tax Payment Event 2 seeded')

    console.log('Seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error during seeding:', error)
    process.exit(1)
  })
