import { Model } from './Model';

export class ImagingRequestAreas extends Model {
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
