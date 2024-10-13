import express from 'express';
import { ingestTransaction } from '../controllers/transactionController';
import { queryTaxPosition } from '../controllers/taxPositionController';
import { amendSale } from '../controllers/amendSaleController';

const router = express.Router();

router.post('/transactions', ingestTransaction);

router.get('/tax-position', queryTaxPosition);

router.patch('/sale', amendSale);

export default router;
