import { Entity, Column, ManyToOne, RelationId, BeforeUpdate, BeforeInsert } from 'typeorm/browser';
import { BaseModel, FindMarkedForUploadOptions } from './BaseModel';
import { Patient } from './Patient';
import { IPatientIssue, PatientIssueType } from '~/types';
import { ISO9075_SQLITE_DEFAULT } from './columnDefaults';

@Entity('patient_issue')
export class PatientIssue extends BaseModel implements IPatientIssue {
  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: false, default: ISO9075_SQLITE_DEFAULT })
  recordedDate: string;

  @Column('text')
  type: PatientIssueType;

  @ManyToOne(
    () => Patient,
    patient => patient.issues,
  )
  patient: Patient;
  @RelationId(({ patient }) => patient)
  patientId: string;

  static shouldExport = true;

  // TODO: add everything below here to a mixin
  // https://www.typescriptlang.org/docs/handbook/mixins.html

  @BeforeInsert()
  @BeforeUpdate()
  async markPatient() {
    // adding an issue to a patient should mark them for syncing in future
    // we don't need to upload the patient, so we only set markedForSync
    const parent = await this.findParent(Patient, 'patient');
    if (parent) {
      parent.markedForSync = true;
      await parent.save();
    }
  }

  static async findMarkedForUpload(opts: FindMarkedForUploadOptions): Promise<BaseModel[]> {
    const patientId = opts.channel.match(/^patient\/(.*)\/issue$/)[1];
    if (!patientId) {
      throw new Error(`Could not extract patientId from ${opts.channel}`);
    }

    const records = await this.findMarkedForUploadQuery(opts)
      .andWhere('patientId = :patientId', { patientId })
      .getMany();

    return records as BaseModel[];
  }
}
