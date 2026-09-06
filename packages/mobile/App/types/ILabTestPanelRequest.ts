import type { Encounter } from '~/models/Encounter';
import type { LabTestPanel } from '~/models/LabTestPanel';
import type { ID } from './ID';

export interface ILabTestPanelRequest {
  id: ID;

  encounter: Encounter;
  encounterId: string;

  labTestPanel: LabTestPanel;
  labTestPanelId: string;
}
