import { AxiosInstance } from 'axios';
import { AxiosHandleError } from '../helper/axios-helper';
import { HttpAdapter } from '../../protocols/http-client-adapter';
import { RequestModel } from '../../protocols/request';
import { HttpResponse } from '../../protocols/http';
import { ok } from '../../helpers/http-helpers';

export class AxiosAdapter implements HttpAdapter {
  private readonly axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  async handle(requestData: RequestModel): Promise<HttpResponse> {
    try {
      let response;
      switch (requestData.method) {
        case 'GET':
          response = await this.axiosInstance.get(
            requestData.url,
            requestData.options,
          );
          return ok(response.data);
        case 'POST':
          response = await this.axiosInstance.post(
            requestData.url,
            requestData.body,
            requestData.options,
          );
          return ok(response.data);
        case 'PUT':
          response = await this.axiosInstance.put(
            requestData.url,
            requestData.body,
            requestData.options,
          );
          return ok(response.data);
        case 'DELETE':
          response = await this.axiosInstance.delete(
            requestData.url,
            requestData.options,
          );
          return ok(response.data);
        default:
          return {
            statusCode: 400,
            body: null,
          };
      }
    } catch (error) {
      return AxiosHandleError(error);
    }
  }
}
