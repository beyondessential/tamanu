import { RequestModel } from './request';
import { HttpResponse } from './http';

export interface HttpClient {
  makeRequest(requestConfig: RequestModel): Promise<HttpResponse>;
}
