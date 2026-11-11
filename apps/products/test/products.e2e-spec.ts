import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { DataSource } from "typeorm";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

describe("Products API (integration)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error(
        "Set TEST_DATABASE_URL to a disposable PostgreSQL database",
      );
    }

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
  });

  it("exposes a health check endpoint", async () => {
    await request(app.getHttpServer())
      .get("/health")
      .expect(200)
      .expect({ status: "ok", service: "products" });
  });

  it("creates and reads a product over HTTP", async () => {
    const created = await request(app.getHttpServer())
      .post("/products")
      .send({ name: "Tea", description: "Green tea", price: 2.5 })
      .expect(201);

    expect(created.body).toMatchObject({
      name: "Tea",
      price: "2.50",
      active: true,
    });

    await request(app.getHttpServer())
      .get(`/products/${created.body.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.id).toBe(created.body.id));
  });

  it("validates product input", async () => {
    await request(app.getHttpServer())
      .post("/products")
      .send({ name: "", price: -1 })
      .expect(400);
  });
});
