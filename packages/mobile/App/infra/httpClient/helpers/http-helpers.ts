import { ServerRequestError } from '../errors/server-request-error';
import { HttpResponse } from '../protocols/http';

export const unauthorizedRequest = (error: Error): HttpResponse => ({
  statusCode: 401,
  body: error,
});

export const badRequest = (error: Error): HttpResponse => ({
  statusCode: 400,
  body: error,
});

export const serverError = (error: Error): HttpResponse => ({
  statusCode: 500,
  body: new ServerRequestError(error.stack),
});

export const notFoundError = (error: Error): HttpResponse => ({
  statusCode: 404,
  body: error,
});

export const requestFailedError = (error: Error): HttpResponse => ({
  statusCode: 500,
  body: error,
});

export const ok = (data: any): HttpResponse => ({
  statusCode: 200,
  body: data,
});
