import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Product } from "./product.entity";
import { ProductsService } from "./products.service";

describe("ProductsService", () => {
  let service: ProductsService;
  let repository: jest.Mocked<Partial<Repository<Product>>>;

  beforeEach(() => {
    repository = {
      find: jest.fn<() => Promise<Product[]>>(),
      findOneBy: jest.fn<() => Promise<Product | null>>(),
      create: jest.fn(
        (input: unknown) => input as Product,
      ) as unknown as Repository<Product>["create"],
      save: jest.fn() as unknown as jest.Mocked<Repository<Product>>["save"],
    };
    service = new ProductsService(repository as Repository<Product>);
  });

  it("returns products sorted by name", async () => {
    jest.mocked(repository.find!).mockResolvedValue([]);

    await service.findAll();

    expect(repository.find).toHaveBeenCalledWith({ order: { name: "ASC" } });
  });

  it("rejects inactive or missing products", async () => {
    jest.mocked(repository.findOneBy!).mockResolvedValue(null);

    await expect(service.findOne("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("normalizes the price to two decimal places when creating a product", async () => {
    jest
      .mocked(repository.save!)
      .mockImplementation(async (product) => product as Product[]);

    await service.create({ name: "Tea", price: 2.5 });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Tea", price: "2.50", description: "" }),
    );
  });
});
