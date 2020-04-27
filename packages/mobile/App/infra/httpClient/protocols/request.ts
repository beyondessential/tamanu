type RequestMethodType = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestModel {
  method: RequestMethodType;
  url: string;
  options?: {
    headers: any;
  };
  body?: any;
}
