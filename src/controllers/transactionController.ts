import { Request, Response } from 'express'
import { eventService } from '../services'
import { SalesEvent } from '../entities/SalesEvent'
import { TaxPaymentEvent } from '../entities/TaxPaymentEvent'
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'

const handleSalesEvent = async (event: SalesEvent, res: Response) => {
  const salesEvent = plainToClass(SalesEvent, event)

  // Set the salesEvent reference in each SalesItem to reference its parent salesEvent
  if (salesEvent.items && salesEvent.items.length > 0) {
    for (const item of salesEvent.items) {
      item.salesEvent = salesEvent
    }
  }

  const salesErrors = await validate(salesEvent)

  if (salesErrors.length > 0) {
    console.error(salesErrors)
    return res.status(400).json({ message: 'Invalid sales event data', errors: salesErrors })
  }

  await eventService.addSalesEvent(salesEvent)
  return res.status(202).send()
}

const handleTaxPaymentEvent = async (event: TaxPaymentEvent, res: Response) => {
  const taxPaymentEvent = plainToClass(TaxPaymentEvent, event)
  const taxPaymentErrors = await validate(taxPaymentEvent)

  if (taxPaymentErrors.length > 0) {
    console.error(taxPaymentErrors)
    return res.status(400).json({ message: 'Invalid tax payment event data', errors: taxPaymentErrors })
  }

  await eventService.addTaxPaymentEvent(taxPaymentEvent)
  return res.status(202).send()
}

export const ingestTransaction = async (req: Request, res: Response) => {
  const event = req.body

  try {
    switch (event.eventType) {
      case 'SALES':
        return await handleSalesEvent(event, res)

      case 'TAX_PAYMENT':
        return await handleTaxPaymentEvent(event, res)

      default:
        return res.status(400).send('Invalid event type')
    }
  } catch (error) {
    console.error('Error ingesting transaction:', error)
    return res.status(500).send('Internal Server Error')
  }
}
