import { escapeRegExp, kebabCase } from 'lodash';
import { ValidationError as YupValidationError } from 'yup';
import { $ZodError } from 'zod/v4/core';

import { BaseError } from './BaseError';
import { ValidationError } from './errors';
import {
  ERROR_TYPE,
  ErrorType,
  IANA_TYPES,
  isKnownErrorType,
  WELL_KNOWN_PROBLEM_KEYS,
} from './constants';
import { splitUpStack } from './splitUpStack';

const LINK = '/problems/';
const IANA = 'https://iana.org/assignments/http-problem-types#';

/** Implementation of RFC 9457 Problem Details for HTTP APIs <https://datatracker.ietf.org/doc/html/rfc9457> */
// we extend Error only so Problems can be used where errors are expected
export class Problem extends Error {
  public type: ErrorType | string;
  public title: string;
  public status: number;
  public detail?: string;
  public extra: Map<string, any> = new Map();

  /** When the Problem has been obtained from an API call, this will typically have its Response object. */
  public response?: Response;

  constructor(type: string, title: string, status: number = 500, detail?: string) {
    super(detail ?? title);
    this.type = type;
    this.title = title;
    this.status = status;
    this.detail = detail;
  }

  withResponse(response: Response): Problem {
    this.response = response;
    return this;
  }

  public static fromError(error: Error): Problem {
    if (error instanceof YupValidationError || error instanceof $ZodError) {
      error = new ValidationError(error.message).withCause(error);
    }

    if (error instanceof BaseError) {
      const problem = new Problem(error.type, error.title, error.status, error.detail);

      for (const [key, value] of Object.entries(error.extraData)) {
        problem.extra.set(kebabCase(key), value);
      }

      if (error.stack) {
        problem.extra.set('stack', splitUpStack(error.stack));
      }

      return problem;
    }

    return new Problem(ERROR_TYPE.UNKNOWN, error.name, 500, error.message);
  }

  get headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'content-type': 'application/problem+json',
    };

    if (this.extra.has('retry-after')) {
      headers['Retry-After'] = this.extra.get('retry-after').toString();
    }

    return headers;
  }

  /** Mostly for test mocks, converts a Problem into a fetch Response. */
  intoResponse(): Response {
    const body = JSON.stringify(this.toJSON());
    const headers = this.headers;

    return new Response(body, {
      status: this.status,
      headers,
    });
  }

  excludeSensitiveFields(exclude: boolean): this {
    if (exclude) {
      this.extra.delete('stack');
      this.extra.delete('request-url');
    }
    return this;
  }

  toJSON(): Record<string, any> {
    return {
      ...Object.fromEntries(this.extra.entries()),
      type: isKnownErrorType(this.type)
        ? IANA_TYPES.includes(this.type)
          ? `${IANA}${this.type}`
          : `${LINK}${this.type}`
        : this.type,
      title: this.title,
      status: this.status,
      detail: this.detail === this.title ? undefined : this.detail,
    };
  }

  static fromJSON(json: Record<string, any>): Problem | null {
    let type = json.type;

    if (!type) {
      return null;
    }

    if (json.type.startsWith(LINK)) {
      const slug = json.type.replace(new RegExp(`^${escapeRegExp(LINK)}`), '');
      if (slug && isKnownErrorType(slug)) {
        type = slug;
      }
    } else if (json.type.startsWith(IANA)) {
      const slug = json.type.replace(new RegExp(`^${escapeRegExp(IANA)}`), '');
      if (slug && isKnownErrorType(slug)) {
        type = slug;
      }
    }

    const problem = new Problem(type, json.title, json.status, json.detail);

    for (const [key, value] of Object.entries(json)) {
      if (WELL_KNOWN_PROBLEM_KEYS.includes(key)) continue;
      problem.extra.set(kebabCase(key), value);
    }

    return problem;
  }
}
