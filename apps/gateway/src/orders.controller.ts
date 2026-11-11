import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProxyService } from './proxy.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly proxy: ProxyService) {}

  @Get()
  list() {
    return this.proxy.request(process.env.ORDERS_SERVICE_URL, '/orders');
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.proxy.request(
      process.env.ORDERS_SERVICE_URL,
      `/orders/${encodeURIComponent(id)}`,
    );
  }

  @Post()
  create(@Body() body: unknown) {
    return this.proxy.request(process.env.ORDERS_SERVICE_URL, '/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}
