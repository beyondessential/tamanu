import { Model } from './Model';

export class LabTestType extends Model {
  code!: string;
  name!: string;
  externalCode?: string;
}
