import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface ProductResponse {
  id: string;
  name: string;
  price: string;
  active: boolean;
}

@Injectable()
export class ProductsClient {
  async getProduct(id: string): Promise<ProductResponse> {
    const baseUrl = process.env.PRODUCTS_SERVICE_URL;
    if (!baseUrl) {
      throw new ServiceUnavailableException('Products service URL is not configured');
    }

    let response: Response;
    try {
      response = await fetch(
        `${baseUrl.replace(/\/$/, '')}/products/${encodeURIComponent(id)}`,
      );
    } catch {
      throw new BadGatewayException('Products service is unavailable');
    }

    if (response.status === 404) {
      throw new NotFoundException(`Product ${id} was not found`);
    }
    if (!response.ok) {
      throw new BadGatewayException(
        `Products service returned ${response.status}`,
      );
    }

    return (await response.json()) as ProductResponse;
  }
}
