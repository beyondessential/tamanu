import { ReferenceData } from '~/models';
import { createDropdownOptionsFromObject } from '~/ui/helpers/fields';
import { ID } from './ID';

export enum Certainty {
  Suspected = 'suspected',
  Confirmed = 'confirmed',
}

export const CERTAINTY_OPTIONS = createDropdownOptionsFromObject(Certainty);

export interface IDiagnosis {
  id: ID;
  date: Date;
  certainty: Certainty;
  isPrimary: boolean;
  diagnosis: ReferenceData;
}
