import { ID } from './ID';
import { IPatientFieldDefinitionCategory } from './IPatientFieldDefinitionCategory';

export interface IPatientFieldDefinition {
  id: ID;
  category: IPatientFieldDefinitionCategory;
  name: string;
  fieldType: string;
  options: string;
  visibilityStatus: string;
}
