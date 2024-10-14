import { Request, Response } from 'express'
import { eventService } from '../services'
import { Amendment } from '../entities/Amendment'
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'

export const amendSale = async (req: Request, res: Response) => {
  try {
    const amendmentData = req.body
    const amendment = plainToClass(Amendment, amendmentData)
    const errors = await validate(amendment)

    if (errors.length > 0) {
      console.error(errors)
      return res.status(400).json({ message: 'Invalid amendment data', errors })
    }

    await eventService.addAmendment(amendment)
    return res.status(202).send()
  } catch (error) {
    console.error('Error processing amendment:', error)
    return res.status(500).send('Internal Server Error')
  }
}
