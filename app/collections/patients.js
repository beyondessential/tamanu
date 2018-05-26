import { PatientModel } from '../models';
import BaseCollection from './base';

export default BaseCollection.extend({
  model: PatientModel,
});
