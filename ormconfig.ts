import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { SalesEvent } from './src/entities/SalesEvent';
import { SalesItem } from './src/entities/SalesItem';
import { TaxPaymentEvent } from './src/entities/TaxPaymentEvent';
import { Amendment } from './src/entities/Amendment';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'novabook_user',
  password: process.env.DB_PASSWORD || 'novabook_pass',
  database: process.env.DB_DATABASE || 'novabook_db',
  synchronize: true,
  logging: false,
  entities: [SalesEvent, SalesItem, TaxPaymentEvent, Amendment],
  migrations: [],
  subscribers: [],
});
