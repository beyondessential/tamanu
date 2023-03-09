import { Entity, RelationId } from 'typeorm/browser';

import { ILabTestPanelRequest } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { LabTestPanel } from './LabTestPanel';

@Entity('lab_test_panel_request')
export class LabTestPanelRequest extends BaseModel implements ILabTestPanelRequest {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId: string;

  labTestPanel: LabTestPanel
  @RelationId(({ labTestPanel }) => labTestPanel)
  labTestPanelId: string;
}
