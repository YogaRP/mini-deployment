import {
  BadGatewayException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class ProxyService {
  async request<T>(
    serviceUrl: string | undefined,
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    if (!serviceUrl) {
      throw new ServiceUnavailableException('Downstream service is not configured');
    }

    let response: Response;
    try {
      response = await fetch(`${serviceUrl.replace(/\/$/, '')}${path}`, init);
    } catch {
      throw new BadGatewayException('Downstream service is unavailable');
    }

    const body = await response.text();
    if (!response.ok) {
      throw new HttpException(
        body || `Downstream service returned ${response.status}`,
        response.status,
      );
    }

    if (!body) {
      return undefined as T;
    }

    try {
      return JSON.parse(body) as T;
    } catch {
      throw new BadGatewayException('Downstream service returned invalid JSON');
    }
  }
}
