import { Encounter } from '~/models/Encounter';
import { LabTestPanel } from '~/models/LabTestPanel';
import { ID } from './ID';

export interface ILabTestPanelRequest {
  id: ID;

  encounter: Encounter;
  encounterId: string;

  labTestPanel: LabTestPanel;
  labTestPanelId: string;
}
