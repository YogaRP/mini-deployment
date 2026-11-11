import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './create-order.dto';
import { Order } from './order.entity';
import { ProductsClient } from './products.client';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly productsClient: ProductsClient,
  ) {}

  findAll() {
    return this.orders.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const order = await this.orders.findOneBy({ id });
    if (!order) {
      throw new NotFoundException(`Order ${id} was not found`);
    }
    return order;
  }

  async create(input: CreateOrderDto) {
    const product = await this.productsClient.getProduct(input.productId);
    const unitPrice = Number(product.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new BadGatewayException('Products service returned an invalid product price');
    }

    const unitPriceCents = Math.round(unitPrice * 100);
    const totalCents = unitPriceCents * input.quantity;
    if (!Number.isSafeInteger(totalCents) || totalCents > 999999999999) {
      throw new BadRequestException('Order total exceeds the supported range');
    }

    const total = (totalCents / 100).toFixed(2);
    return this.orders.save(
      this.orders.create({
        productId: product.id,
        productName: product.name,
        unitPrice: (unitPriceCents / 100).toFixed(2),
        quantity: input.quantity,
        total,
      }),
    );
  }
}
