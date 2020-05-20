import { RequestModel } from './request';
import { HttpResponse } from './http';

export interface HttpAdapter {
  handle(requestData: RequestModel): Promise<HttpResponse>;
}
