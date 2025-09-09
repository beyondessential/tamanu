import { WELL_KNOWN_PROBLEM_KEYS } from './Problem';
import type { ErrorType } from './types';

export class BaseError extends Error {
  readonly name: string;
  public type: ErrorType;
  public title: string;
  public status: number;
  public detail?: string;
  public extraData: Record<string, any> = {};

  constructor(type: ErrorType, title: string, status: number, detail?: string) {
    super(detail ?? title);
    this.name = this.constructor.name;
    this.type = type;
    this.title = title;
    this.status = status;
    this.detail = detail;
  }

  withExtraData(extraData: Record<string, any>): this {
    if (Object.keys(extraData).some(key => [...WELL_KNOWN_PROBLEM_KEYS, 'stack'].includes(key))) {
      throw new Error('BUG: reserved extra data key');
    }

    Object.assign(this.extraData, extraData);
    return this;
  }
}
