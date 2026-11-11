import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { DataSource } from "typeorm";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Orders API (integration)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let productServer: Server;

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error(
        "Set TEST_DATABASE_URL to a disposable PostgreSQL database",
      );
    }

    productServer = createServer((req, res) => {
      if (req.url === "/products/550e8400-e29b-41d4-a716-446655440000") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Tea",
            price: "2.50",
            active: true,
          }),
        );
        return;
      }
      res.writeHead(404);
      res.end();
    });
    await new Promise<void>((resolve) =>
      productServer.listen(0, "127.0.0.1", resolve),
    );
    const { port } = productServer.address() as AddressInfo;
    process.env.PRODUCTS_SERVICE_URL = `http://127.0.0.1:${port}`;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    dataSource = moduleRef.get(DataSource);
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app?.close();
    if (productServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        productServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("exposes a health check endpoint", async () => {
    await request(app.getHttpServer())
      .get("/health")
      .expect(200)
      .expect({ status: "ok", service: "orders" });
  });

  it("validates a product and persists an order over HTTP", async () => {
    const created = await request(app.getHttpServer())
      .post("/orders")
      .send({
        productId: "550e8400-e29b-41d4-a716-446655440000",
        quantity: 3,
      })
      .expect(201);

    expect(created.body).toMatchObject({
      productName: "Tea",
      unitPrice: "2.50",
      quantity: 3,
      total: "7.50",
    });
    await request(app.getHttpServer())
      .get(`/orders/${created.body.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.id).toBe(created.body.id));
  });

  it("validates order input", async () => {
    await request(app.getHttpServer())
      .post("/orders")
      .send({ productId: "not-a-uuid", quantity: 0 })
      .expect(400);
  });
});
