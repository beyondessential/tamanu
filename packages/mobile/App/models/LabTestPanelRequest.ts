import { Entity, ManyToOne, RelationId } from 'typeorm';

import { ILabTestPanelRequest } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { LabTestPanel } from './LabTestPanel';

@Entity('lab_test_panel_requests')
export class LabTestPanelRequest extends BaseModel implements ILabTestPanelRequest {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @ManyToOne(() => Encounter)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId: string;

  @ManyToOne(() => LabTestPanel)
  labTestPanel: LabTestPanel;
  @RelationId(({ labTestPanel }) => labTestPanel)
  labTestPanelId: string;
}
