import * as yup from 'yup';
import { Handler } from './Handler';
import { limsResultShallow } from '../schemas';


export class LimsResult extends Handler {
  static init(body) {
  }
  static HANDLER_NAME = 'lims handler';
  static schema = {
    ...super.schema,
    ...limsResultShallow,
  };

  static async isValid(body) {
    console.log(`checking is valid ${this.HANDLER_NAME}`);
    // console.log({ schema: this.schema });
    const isValid = await yup.object(this.schema).isValid(body, { stripUnknown: true });
    console.log({ isValid });
    return isValid;
  }
}

