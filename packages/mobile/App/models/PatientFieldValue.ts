import { BeforeInsert, Column, Entity, ManyToOne, PrimaryColumn, RelationId } from 'typeorm';

import { IPatientFieldValue } from '~/types';
import { Patient } from './Patient';
import { PatientFieldDefinition } from './PatientFieldDefinition';
import { SYNC_DIRECTIONS } from './types';
import { BaseModel } from './BaseModel';

@Entity('patient_field_values')
export class PatientFieldValue extends BaseModel implements IPatientFieldValue {
  static syncDirection = SYNC_DIRECTIONS.BIDIRECTIONAL;

  @PrimaryColumn()
  id: string;

  @Column({ nullable: false })
  value: string;

  @ManyToOne(() => Patient)
  patient: Patient;

  @RelationId(({ patient }) => patient)
  patientId: string;

  @ManyToOne(() => PatientFieldDefinition)
  definition: PatientFieldDefinition;

  @RelationId(({ definition }) => definition)
  definitionId: string;

  @BeforeInsert()
  async assignIdAsPatientIdDefinitionId(): Promise<void> {
    // N.B. because ';' is used to join the two, we replace any actual occurrence of ';' with ':'
    // to avoid clashes on the joined id
    this.id = `${this.patientId.replace(/;/g, ':')};${this.definitionId.replace(/;/g, ':')}`;
  }

  static async getForPatientAndDefinition(
    patientId: string,
    definitionId: string,
  ): Promise<PatientFieldValue> {
    // use a query builder instead of find, as apparently there's some
    // misbehaviour around how typeorm traverses this relation
    return await (PatientFieldValue as any)
      .getRepository()
      .createQueryBuilder('patient_field_value')
      .where('patient_field_value.patientId = :patientId', { patientId })
      .andWhere('patient_field_value.definitionId = :definitionId', { definitionId })
      .getOne();
  }

  static async updateOrCreateForPatientAndDefinition(
    patientId: string,
    definitionId: string,
    value: string,
  ): Promise<PatientFieldValue> {
    const existing = await PatientFieldValue.getForPatientAndDefinition(patientId, definitionId);
    if (existing) {
      if (existing.value === value) return; // to avoid unnecessary updates
      existing.value = value ?? ''; // " ?? '' " since nullable is false
      return existing.save();
    }

    if (!value) {
      return; // to not create a null / empty string value entry
    }

    return PatientFieldValue.createAndSaveOne({
      patient: patientId,
      definition: definitionId,
      value,
    });
  }
}
