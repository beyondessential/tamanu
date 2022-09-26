import { ReferenceData } from '~/models/ReferenceData';
import { createDropdownOptionsFromObject } from '~/ui/helpers/fields';
import { ID } from './ID';

export enum Certainty {
  Suspected = 'suspected',
  Confirmed = 'confirmed',
}

export const CERTAINTY_OPTIONS = createDropdownOptionsFromObject(Certainty);

export interface IDiagnosis {
  id: ID;
  date: string;
  certainty?: Certainty;
  isPrimary?: boolean;
  diagnosis: ReferenceData;
}
