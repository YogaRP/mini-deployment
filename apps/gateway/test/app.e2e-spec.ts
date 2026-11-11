import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { ProxyService } from "../src/proxy.service";
import { afterAll, beforeAll, describe, it, jest } from "@jest/globals";

describe("Gateway (e2e)", () => {
  let app: INestApplication;
  const proxy = {
    request: jest
      .fn<any>()
      .mockResolvedValue([{ id: "product-1", name: "Tea" }]),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ProxyService)
      .useValue(proxy)
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => app.close());

  it("routes product list requests through the gateway", async () => {
    await request(app.getHttpServer())
      .get("/api/products")
      .expect(200)
      .expect([{ id: "product-1", name: "Tea" }]);
  });

  it("exposes a health check endpoint", async () => {
    await request(app.getHttpServer())
      .get("/api/health")
      .expect(200)
      .expect({ status: "ok", service: "gateway" });
  });
});
