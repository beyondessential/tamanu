import { IPatientFieldDefinitionCategory } from './IPatientFieldDefinitionCategory';
import { ID } from './ID';

export interface IPatientFieldDefinition {
  id: ID;
  category: IPatientFieldDefinitionCategory;
  name: string;
  fieldType: string;
  options: string;
  visibilityStatus: string;
}
