import { Request, Response } from 'express';
import { eventService } from '../services';

export const queryTaxPosition = async (req: Request, res: Response) => {
  const date = req.query.date as string;

  if (!date) {
    return res.status(400).send('Date query parameter is required');
  }

  try {
    const taxPosition = await eventService.getTaxPosition(date);
    return res.status(200).json(taxPosition);
  } catch (error) {
    console.error('Error computing tax position:', error);
    return res.status(500).send('Error computing tax position');
  }
};
