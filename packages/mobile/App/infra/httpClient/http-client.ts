import { HttpResponse } from './protocols/htto';
import { HttpClient } from './protocols/client';
import { RequestModel } from './protocols/request';
import { HttpAdapter } from './protocols/http-client-adapter';

export class Client implements HttpClient {
  private readonly httpClient: HttpAdapter;

  constructor(httpClient: HttpAdapter) {
    this.httpClient = httpClient;
  }

  handleResponse(response: HttpResponse): HttpResponse {
    if (response.statusCode === 400) throw response.body;
    if (response.statusCode === 401) throw response.body;
    if (response.statusCode === 500) throw response.body;
    return response;
  }

  async makeRequest(requestConfiguration: RequestModel): Promise<HttpResponse> {
    try {
      const response = await this.httpClient.handle(requestConfiguration);
      return this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }
}
