import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { CreateOrderDto } from "./create-order.dto";
import { Order } from "./order.entity";
import { OrdersService } from "./orders.service";
import { ProductsClient } from "./products.client";
import { describe, beforeEach, it, jest, expect } from "@jest/globals";

describe("OrdersService", () => {
  let service: OrdersService;
  let repository: jest.Mocked<Partial<Repository<Order>>>;
  let productsClient: jest.Mocked<Pick<ProductsClient, "getProduct">>;

  beforeEach(() => {
    repository = {
      find: jest.fn<() => Promise<Order[]>>(),
      findOneBy: jest.fn<() => Promise<Order | null>>(),
      create: jest.fn(
        (input: unknown) => input as Order,
      ) as unknown as Repository<Order>["create"],
      save: jest.fn() as unknown as jest.Mocked<Repository<Order>>["save"],
    };
    productsClient = { getProduct: jest.fn() };
    service = new OrdersService(
      repository as Repository<Order>,
      productsClient as ProductsClient,
    );
  });

  it("creates an order using the current product price", async () => {
    productsClient.getProduct.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Tea",
      price: "2.50",
      active: true,
    });
    jest
      .mocked(repository.save!)
      .mockImplementation(async (order) => order as Order[]);
    const input: CreateOrderDto = {
      productId: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 3,
    };

    await service.create(input);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: "Tea",
        unitPrice: "2.50",
        quantity: 3,
        total: "7.50",
      }),
    );
  });

  it("does not save an order if product lookup fails", async () => {
    productsClient.getProduct.mockRejectedValue(new NotFoundException());

    await expect(
      service.create({
        productId: "550e8400-e29b-41d4-a716-446655440000",
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("returns an order-not-found error for unknown ids", async () => {
    jest.mocked(repository.findOneBy!).mockResolvedValue(null);

    await expect(service.findOne("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
