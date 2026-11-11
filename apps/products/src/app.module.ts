import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { HealthController } from './health.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.NODE_ENV === 'test'
          ? process.env.TEST_DATABASE_URL
          : process.env.DATABASE_URL,
      entities: [Product],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([Product]),
  ],
  controllers: [ProductsController, HealthController],
  providers: [ProductsService],
})
export class AppModule {}
