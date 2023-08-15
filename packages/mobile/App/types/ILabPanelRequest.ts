import { Encounter } from '~/models/Encounter';
import { LabPanel } from '~/models/LabPanel';
import { ID } from './ID';

export interface ILabPanelRequest {
  id: ID;

  encounter: Encounter;
  encounterId: string;

  labPanel: LabPanel;
  labPanelId: string;
}
