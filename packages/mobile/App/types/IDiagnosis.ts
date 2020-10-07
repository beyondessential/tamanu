import { ReferenceData } from '~/models';
import { ID } from './ID';

export enum Certainty {
  Suspected = 'suspected',
  Confirmed = 'confirmed',
}

export interface IDiagnosis {
  id: ID;
  date: Date;
  certainty: Certainty;
  isPrimary: boolean;
  diagnosis: ReferenceData;
}
