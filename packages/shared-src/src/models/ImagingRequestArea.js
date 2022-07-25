import { Model } from './Model';

export class ImagingRequestArea extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      {
        ...options,
      },
    );
  }
}
