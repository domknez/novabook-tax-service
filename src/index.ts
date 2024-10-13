import 'reflect-metadata'
import express from 'express'
import routes from './routes'
import dotenv from 'dotenv'
import morgan from 'morgan'
import { AppDataSource } from '../ormconfig'
import { Request, Response, NextFunction } from 'express'
import { Error } from './common/types'

dotenv.config()

const app = express()

app.use(express.json())

// Add morgan middleware for logging
app.use(morgan('combined'))

app.use('/', routes)

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).send('Internal Server Error')
})

const PORT = process.env.PORT || 3000

AppDataSource.initialize()
  .then(() => {
    console.log('Database initialized')
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Database initialization failed:', error)
  })
