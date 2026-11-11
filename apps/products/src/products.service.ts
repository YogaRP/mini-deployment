import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateProductDto } from "./create-product.dto";
import { Product } from "./product.entity";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  findAll() {
    return this.products.find({ order: { name: "ASC" } });
  }

  async findOne(id: string) {
    const product = await this.products.findOneBy({ id, active: true });
    if (!product) {
      throw new NotFoundException(`Product ${id} was not found`);
    }
    return product;
  }

  create(input: CreateProductDto) {
    return this.products.save(
      this.products.create({
        ...input,
        description: input.description ?? "",
        price: input.price.toFixed(2),
      }),
    );
  }
}
