import { ProgramModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: ProgramModel,
  url: `${BaseCollection.prototype.url}/program`,
});
