import { RequestModel } from './request';
import { HttpResponse } from './htto';

export interface HttpAdapter {
  handle(requestData: RequestModel): Promise<HttpResponse>;
}
