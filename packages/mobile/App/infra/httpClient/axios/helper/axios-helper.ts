import axios from 'axios';
import { env } from '../../../../../env';
import { BadRequestError } from '../../errors/bad-request-error';
import { UnauthorizedRequestError } from '../../errors/unauthorized-request-error';
import { ServerRequestError } from '../../errors/server-request-error';
import { RequestFailedError } from '../errors/request-failed-error';
import { AxiosInternalError } from '../errors/internatl-error';
import {
  badRequest,
  unauthorizedRequest,
  serverError,
  notFoundError,
} from '../../helpers/http-helpers';
import { HttpResponse } from '../../protocols/http';
import { NotFoundError } from '../../errors/not-found-error';

export const API = axios.create({
  baseURL: env.API_BASE_URL,
});

export const AxiosHandleError = (axioRquestError: any): HttpResponse => {
  if (axioRquestError.response) {
    const { response } = axioRquestError;
    if (response.status === 400) return badRequest(new BadRequestError());
    if (response.status === 401)
      return unauthorizedRequest(new UnauthorizedRequestError());
    if (response.status === 500)
      return serverError(new ServerRequestError(response.body));
    if (response.status === 404)
      return notFoundError(new NotFoundError(response.body));
  } else if (axioRquestError.request) {
    throw new RequestFailedError();
  } else {
    throw new AxiosInternalError(axioRquestError.message);
  }
  return serverError(new ServerRequestError(axioRquestError.message));
};
