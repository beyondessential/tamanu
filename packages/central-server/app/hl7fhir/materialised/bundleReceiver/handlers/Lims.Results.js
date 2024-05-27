import * as yup from 'yup';
import { Handler } from './Handler';
import { limsResult } from '../schemas';


export class LimsResult extends Handler {
  static init(body) {
  }
  static HANDLER_NAME = 'lims handler';
  static schema = {
    ...super.schema,
    ...limsResult,
  };

  static async isValid(body) {
    console.log(`checking is valid ${this.HANDLER_NAME}`);
    console.log({ schema: this.schema });
    return await yup.object(this.schema).isValid(body, { stripUnknown: true });
  }
}

