import { Request, Response } from 'express';
import { eventService } from '../services';
import { Amendment } from '../entities/Amendment';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export const amendSale = async (req: Request, res: Response) => {
  const amendmentData = req.body;

  if (
    !amendmentData ||
    !amendmentData.date ||
    !amendmentData.invoiceId ||
    !amendmentData.itemId ||
    typeof amendmentData.cost !== 'number' ||
    typeof amendmentData.taxRate !== 'number'
  ) {
    return res.status(400).send('Invalid amendment data');
  }

  try {
    const amendment = plainToClass(Amendment, amendmentData);
    const errors = await validate(amendment);

    if (errors.length > 0) {
      console.error(errors);
      return res.status(400).send('Invalid amendment data');
    }

    await eventService.addAmendment(amendment);
    return res.status(202).send();
  } catch (error) {
    console.error('Error processing amendment:', error);
    return res.status(500).send('Internal Server Error');
  }
};
