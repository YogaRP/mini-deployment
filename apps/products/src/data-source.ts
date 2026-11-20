import 'dotenv/config';
import { DataSource } from 'typeorm';
import { CreateProductsTable1763660000000 } from './migrations/1763660000000-CreateProductsTable';
import { Product } from './product.entity';

export default new DataSource({
  type: 'postgres',
  url:
    process.env.NODE_ENV === 'test'
      ? process.env.TEST_DATABASE_URL
      : process.env.DATABASE_URL,
  entities: [Product],
  migrations: [CreateProductsTable1763660000000],
  synchronize: false,
});
