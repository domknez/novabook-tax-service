import express from 'express'
import { amendSale } from '../controllers/amendSaleController'
import { queryTaxPosition } from '../controllers/taxPositionController'
import { ingestTransaction } from '../controllers/transactionController'

const router = express.Router()

router.post('/transactions', ingestTransaction)

router.get('/tax-position', queryTaxPosition)

router.patch('/sale', amendSale)

export default router
