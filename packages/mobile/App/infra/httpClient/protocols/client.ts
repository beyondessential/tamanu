import { RequestModel } from './request';
import { HttpResponse } from './htto';

export interface HttpClient {
  makeRequest(requestConfig: RequestModel): Promise<HttpResponse>;
}
