import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { ProductsController } from './products.controller';
import { HealthController } from './health.controller';
import { ProxyService } from './proxy.service';

@Module({
  controllers: [ProductsController, OrdersController, HealthController],
  providers: [ProxyService],
})
export class AppModule {}
