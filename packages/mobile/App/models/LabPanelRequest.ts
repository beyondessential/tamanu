import { Entity, ManyToOne, RelationId } from 'typeorm/browser';

import { ILabPanelRequest } from '~/types';
import { BaseModel } from './BaseModel';
import { SYNC_DIRECTIONS } from './types';
import { Encounter } from './Encounter';
import { LabPanel } from './LabPanel';

@Entity('lab_panel_request')
export class LabPanelRequest extends BaseModel implements ILabPanelRequest {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @ManyToOne(() => Encounter)
  encounter: Encounter;
  @RelationId(({ encounter }) => encounter)
  encounterId: string;

  @ManyToOne(() => LabPanel)
  labPanel: LabPanel;
  @RelationId(({ labPanel }) => labPanel)
  labPanelId: string;
}
