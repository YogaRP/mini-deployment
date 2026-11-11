import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProxyService } from './proxy.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly proxy: ProxyService) {}

  @Get()
  list() {
    return this.proxy.request(process.env.PRODUCTS_SERVICE_URL, '/products');
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.proxy.request(
      process.env.PRODUCTS_SERVICE_URL,
      `/products/${encodeURIComponent(id)}`,
    );
  }

  @Post()
  create(@Body() body: unknown) {
    return this.proxy.request(process.env.PRODUCTS_SERVICE_URL, '/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}
