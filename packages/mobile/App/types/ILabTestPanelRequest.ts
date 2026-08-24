import { Encounter } from '~/models/Encounter';
import { LabTestPanel } from '~/models/LabTestPanel';
import { ID } from './ID';
import { ILabRequest } from './ILabRequest';

export interface ILabTestPanelRequest {
  id: ID;

  encounter: Encounter;
  encounterId: string;

  labTestPanel: LabTestPanel;
  labTestPanelId: string;

  labRequest: ILabRequest;
  labRequestId: string;
}
