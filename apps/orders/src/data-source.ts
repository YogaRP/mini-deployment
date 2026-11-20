import 'dotenv/config';
import { DataSource } from 'typeorm';
import { CreateOrdersTable1763660000001 } from './migrations/1763660000001-CreateOrdersTable';
import { Order } from './order.entity';

export default new DataSource({
  type: 'postgres',
  url:
    process.env.NODE_ENV === 'test'
      ? process.env.TEST_DATABASE_URL
      : process.env.DATABASE_URL,
  entities: [Order],
  migrations: [CreateOrdersTable1763660000001],
  synchronize: false,
});
