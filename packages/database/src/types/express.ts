import type { Request } from 'express';
import type { User } from '../models';
import type { ModelProperties } from './model';

export interface ExpressRequest extends Request {
  user?: ModelProperties<User>;
}
