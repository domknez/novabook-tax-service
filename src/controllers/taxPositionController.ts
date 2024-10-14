import { Request, Response } from 'express'
import { eventService } from '../services'

export const queryTaxPosition = async (req: Request, res: Response) => {
  try {
    const date = new Date(req.query.date as string)

    if (isNaN(date.getTime())) {
      return res.status(400).send('Invalid date query parameter')
    }

    const taxPosition = await eventService.getTaxPosition(date)
    return res.status(200).json(taxPosition)
  } catch (error) {
    console.error('Error computing tax position:', error)
    return res.status(500).json('Error computing tax position')
  }
}
