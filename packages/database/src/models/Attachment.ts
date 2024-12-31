import { Model } from './Model';

export class Attachment extends Model {
  static sanitizeForDatabase({ data, ...restOfValues }: Record<string, any>): Record<string, any> {
    return { ...restOfValues, data: Buffer.from(data, 'base64') };
  }
}
