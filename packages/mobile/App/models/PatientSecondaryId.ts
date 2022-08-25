import { Entity, Column, ManyToOne, RelationId, BeforeUpdate, BeforeInsert } from 'typeorm/browser';
import { BaseModel, FindMarkedForUploadOptions, IdRelation } from './BaseModel';
import { Patient } from './Patient';
import { ReferenceData, ReferenceDataRelation } from './ReferenceData';
import { IPatientSecondaryId } from '~/types';

@Entity('patient_secondary_id')
export class PatientSecondaryId extends BaseModel implements IPatientSecondaryId {
  @Column()
  value: string;

  @Column()
  visibilityStatus: string;

  @ReferenceDataRelation()
  type: ReferenceData;
  @IdRelation()
  typeId: string;

  @ManyToOne(() => Patient, patient => patient.secondaryIds)
  patient: Patient;
  @RelationId(({ patient }) => patient)
  patientId: string;

  static shouldExport = true;

  @BeforeInsert()
  @BeforeUpdate()
  async markPatient() {
    // adding a secondary ID to a patient should mark them for syncing in future
    // we don't need to upload the patient, so we only set markedForSync
    const parent = await this.findParent(Patient, 'patient');
    if (parent) {
      parent.markedForSync = true;
      await parent.save();
    }
  }

  static async findMarkedForUpload(
    opts: FindMarkedForUploadOptions,
  ): Promise<BaseModel[]> {
    const patientId = opts.channel.match(/^patient\/(.*)\/secondaryId$/)[1];
    if (!patientId) {
      throw new Error(`Could not extract patientId from ${opts.channel}`);
    }

    const records = await this.findMarkedForUploadQuery(opts)
      .andWhere('patientId = :patientId', { patientId })
      .getMany();

    return records as BaseModel[];
  }
}
