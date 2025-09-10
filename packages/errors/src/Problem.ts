import { kebabCase } from 'lodash';
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

const LINK = '/problems/';
const IANA = 'https://iana.org/assignments/http-problem-types#';

/** Implementation of RFC 9457 Problem Details for HTTP APIs <https://datatracker.ietf.org/doc/html/rfc9457> */
export class Problem {
  public type: ErrorType | string;
  public title: string;
  public status: number;
  public detail?: string;
  public extra: Map<string, any> = new Map();

  constructor(
    type: string,
    title: string,
    status: number = 500,
    detail?: string,
    extra: Record<string, any> = {},
  ) {
    this.type = type;
    this.title = title;
    this.status = status;
    this.detail = detail;
    this.extra = new Map(Object.entries(extra));
  }

  public static fromError(error: Error): Problem {
    const problem = new Problem(ERROR_TYPE.UNKNOWN, error.name, 500, error.message, {
      stack: error.stack,
    });

    if (error instanceof YupValidationError || error instanceof $ZodError) {
      error = new ValidationError(error.message).withCause(error);
    }

    if (error instanceof BaseError) {
      problem.type = error.type;
      problem.title = error.title;
      problem.status = error.status;
      for (const [key, value] of Object.entries(error.extraData)) {
        problem.extra.set(kebabCase(key), value);
      }
    }

    return problem;
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

  excludeSensitiveFields(exclude: boolean): this {
    if (exclude) {
      this.extra.delete('stack');
    }
    return this;
  }

  toJSON(): Record<string, any> {
    return {
      ...this.extra.entries(),
      type: isKnownErrorType(this.type)
        ? IANA_TYPES.includes(this.type)
          ? `${IANA}${this.type}`
          : `${LINK}${this.type}`
        : this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
    };
  }

  static fromJSON(json: Record<string, any>): Problem | null {
    let type = json.type;

    if (!type) {
      return null;
    }

    if (json.type.startsWith('https://')) {
      const slug = json.type.split('#')[1];
      if (slug && isKnownErrorType(slug)) {
        type = slug;
      }
    }

    return new Problem(
      type,
      json.title,
      json.status,
      json.detail,
      Object.entries(json.extra).filter(([key]) => !WELL_KNOWN_PROBLEM_KEYS.includes(key)),
    );
  }
}
