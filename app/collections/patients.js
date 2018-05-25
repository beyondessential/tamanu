import { PatientModel } from '../models';
import BaseCollection from './base';

const Patients = BaseCollection.extend({
  model: PatientModel,
});

module.exports = Patients;
