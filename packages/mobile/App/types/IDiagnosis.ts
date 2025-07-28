import { ReferenceData } from '~/models/ReferenceData';
import { createDropdownOptionsFromObject } from '~/ui/helpers/fields';
import { ID } from './ID';

export const Certainty = {
  Suspected: 'suspected',
  Confirmed: 'confirmed',
} as const;

export type Certainty = (typeof Certainty)[keyof typeof Certainty];

export const CERTAINTY_OPTIONS = createDropdownOptionsFromObject(Certainty);

export interface IDiagnosis {
  id: ID;
  date: string;
  certainty?: Certainty;
  isPrimary?: boolean;
  diagnosis: ReferenceData;
}
