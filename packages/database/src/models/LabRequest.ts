import { Model } from './Model';
import type { LabTest } from './LabTest';
import type { ReferenceData } from './ReferenceData';
import type { Encounter } from './Encounter';
import type { User } from './User';
import type { Note } from './Note';
import type { LabTestPanelRequest } from './LabTestPanelRequest';

export class LabRequest extends Model {
  sampleTime?: string;
  collectedById?: string;
  labSampleSiteId?: string;
  specimenTypeId?: string;
  displayId!: string;
  priority?: ReferenceData;
  tests!: LabTest[];
  encounter?: Encounter;
  requestedDate!: string;
  requestedBy?: User;
  specimenAttached!: boolean;
  notes!: Note[];
  labTestPanelRequest?: LabTestPanelRequest;
  status!: string;

  getLatestAttachment() {
    return this.sequelize.models.LabRequestAttachment.findOne({
      where: {
        labRequestId: this.id,
        replacedById: null,
      },
    });
  }
}
