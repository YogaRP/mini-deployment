import {
  BadGatewayException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ProxyService } from "./proxy.service";
import { afterEach, describe, expect, it, jest } from "@jest/globals";

describe("ProxyService", () => {
  const service = new ProxyService();
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("forwards a successful response as JSON", async () => {
    global.fetch = jest
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify([{ id: "p1" }]), { status: 200 }),
      ) as unknown as typeof fetch;

    await expect(
      service.request("http://products", "/products"),
    ).resolves.toEqual([{ id: "p1" }]);
  });

  it("reports an unconfigured downstream service", async () => {
    await expect(
      service.request(undefined, "/products"),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("reports downstream network failures as a bad gateway", async () => {
    global.fetch = jest
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("offline")) as unknown as typeof fetch;

    await expect(
      service.request("http://products", "/products"),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it("preserves downstream HTTP errors", async () => {
    global.fetch = jest
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: "Not found" }), { status: 404 }),
      ) as unknown as typeof fetch;

    await expect(
      service.request("http://products", "/products/missing"),
    ).rejects.toMatchObject({
      status: 404,
    });
  });
});
