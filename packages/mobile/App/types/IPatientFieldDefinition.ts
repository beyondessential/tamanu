import type { IPatientFieldDefinitionCategory } from './IPatientFieldDefinitionCategory';
import type { ID } from './ID';

export interface IPatientFieldDefinition {
  id: ID;
  category: IPatientFieldDefinitionCategory;
  name: string;
  fieldType: string;
  options: string;
  visibilityStatus: string;
}
