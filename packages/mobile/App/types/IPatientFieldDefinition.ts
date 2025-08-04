import { IPatientFieldDefinitionCategory } from './IPatientFieldDefinitionCategory';
import { ID } from './ID';
import { VisibilityStatus } from '~/visibilityStatuses';

export interface IPatientFieldDefinition {
  id: ID;
  category: IPatientFieldDefinitionCategory;
  name: string;
  fieldType: string;
  options: string;
  visibilityStatus: VisibilityStatus;
}
