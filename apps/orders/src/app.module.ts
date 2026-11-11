import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { HealthController } from './health.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ProductsClient } from './products.client';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.NODE_ENV === 'test'
          ? process.env.TEST_DATABASE_URL
          : process.env.DATABASE_URL,
      entities: [Order],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([Order]),
  ],
  controllers: [OrdersController, HealthController],
  providers: [OrdersService, ProductsClient],
})
export class AppModule {}
