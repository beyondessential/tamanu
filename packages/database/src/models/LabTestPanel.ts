import { Model } from './Model';

export class LabTestPanel extends Model {
  code!: string;
  name!: string;
  externalCode?: string;
}
